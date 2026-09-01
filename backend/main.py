"""
AntEx — FastAPI Main
Webhook WhatsApp + CRUD Pedidos + APIs Dashboard + Marketing IA
"""
from __future__ import annotations

import json
import uuid
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta
from typing import AsyncGenerator, Optional

import redis.asyncio as aioredis
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlmodel import Session, select, func

from src.database import create_db_and_tables, get_session, redis_sync, settings
from src.models.clients import ClienteB2B, SegmentoCliente
from src.models.metrics import MetricaDiaria
from src.models.orders import ItemPedido, Pedido, StatusPedido
from src.models.products import Produto, TipoFardo
from src.models.settings import ConfiguracaoEntrega
from src.agents.sales_agent import process_message
from src.services.content_generator import gerar_conteudo_marketing


# ── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    create_db_and_tables()
    _seed_initial_data()
    yield


def _seed_initial_data() -> None:
    """Cria produtos e configuração padrão se o banco estiver vazio."""
    from sqlmodel import Session
    with Session(__import__("src.database", fromlist=["engine"]).engine) as session:
        # Produtos padrão
        if not session.exec(select(Produto)).first():
            session.add_all([
                Produto(
                    sku="CAFE-ARA-30KG",
                    nome="Fardo Café Arábico Premium Torrado e Moído — 30kg",
                    tipo=TipoFardo.FARDO_30KG,
                    peso_kg=30.0,
                    preco_por_kg=settings.PRECO_KG_FARDO_30,
                    preco_total=settings.PRECO_KG_FARDO_30 * 30,
                    descricao="Blend arábico premium, torra média, moagem fina-média",
                    estoque_fardos=100,
                ),
                Produto(
                    sku="CAFE-ARA-50KG",
                    nome="Fardo Café Arábico Premium Torrado e Moído — 50kg",
                    tipo=TipoFardo.FARDO_50KG,
                    peso_kg=50.0,
                    preco_por_kg=settings.PRECO_KG_FARDO_50,
                    preco_total=settings.PRECO_KG_FARDO_50 * 50,
                    descricao="Melhor custo-benefício para alto volume",
                    estoque_fardos=60,
                ),
            ])
        # Configuração padrão
        if not session.exec(select(ConfiguracaoEntrega)).first():
            session.add(ConfiguracaoEntrega())
        session.commit()


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AntEx — Agente Vendedor de Café Arábico B2B",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API = settings.API_PREFIX


# ══════════════════════════════════════════════════════════════════════════════
# WEBHOOK WHATSAPP
# ══════════════════════════════════════════════════════════════════════════════

class WebhookPayload(BaseModel):
    """Payload genérico — compatível com Evolution API e Z-API."""
    instance: Optional[str] = None
    data: Optional[dict] = None
    # Z-API
    phone: Optional[str] = None
    text: Optional[dict] = None
    isGroupMsg: Optional[bool] = False


@app.post(f"{API}/webhook/whatsapp", tags=["Webhook"])
async def webhook_whatsapp(payload: WebhookPayload):
    """
    Recebe mensagens do WhatsApp via Evolution API ou Z-API.
    Processa com o LangGraph Sales Agent e responde automaticamente.
    """
    # Normaliza payload para Evolution API
    if payload.data:
        raw = payload.data
        whatsapp = raw.get("key", {}).get("remoteJid", "").replace("@s.whatsapp.net", "")
        text = raw.get("message", {}).get("conversation", "")
        is_group = raw.get("key", {}).get("remoteJid", "").endswith("@g.us")
    # Z-API
    elif payload.phone:
        whatsapp = payload.phone
        text = (payload.text or {}).get("message", "")
        is_group = payload.isGroupMsg or False
    else:
        return {"status": "ignored"}

    if is_group or not text or not whatsapp:
        return {"status": "ignored"}

    # Busca histórico no Redis
    session_key = f"session:{whatsapp}"
    raw_history = redis_sync.get(session_key)
    history = json.loads(raw_history) if raw_history else []

    # Processa mensagem
    result = await process_message(
        session_id=session_key,
        whatsapp=whatsapp,
        message=text,
        history=history,
    )

    # Salva histórico atualizado
    history.append({"role": "user", "content": text})
    history.append({"role": "assistant", "content": result["response"]})
    redis_sync.setex(session_key, 3600 * 24, json.dumps(history))  # 24h TTL

    # Registra handoff no Redis para notificação no dashboard
    if result["handoff"]:
        redis_sync.sadd("handoffs_pendentes", whatsapp)

    # Registra pedido automaticamente se o agente confirmou
    if result.get("order_data"):
        _auto_register_order(whatsapp, result["order_data"])

    return {"status": "ok", "response": result["response"]}


def _auto_register_order(whatsapp: str, order_data: dict) -> None:
    """Registra pedido no banco quando o agente confirma o fechamento."""
    with Session(__import__("src.database", fromlist=["engine"]).engine) as session:
        cliente = session.exec(
            select(ClienteB2B).where(ClienteB2B.whatsapp == whatsapp)
        ).first()
        if not cliente:
            cliente = ClienteB2B(
                nome=order_data.get("cliente", "Cliente WhatsApp"),
                whatsapp=whatsapp,
            )
            session.add(cliente)
            session.flush()

        numero = f"PED-{datetime.utcnow().strftime('%Y')}-{str(uuid.uuid4())[:6].upper()}"
        pedido = Pedido(
            numero=numero,
            cliente_id=cliente.id,
            status=StatusPedido.CONFIRMADO,
            canal="whatsapp",
            observacoes=order_data.get("observacoes"),
            sessao_ia=f"session:{whatsapp}",
        )
        session.add(pedido)
        session.commit()


# ══════════════════════════════════════════════════════════════════════════════
# PEDIDOS
# ══════════════════════════════════════════════════════════════════════════════

@app.get(f"{API}/pedidos", tags=["Pedidos"])
def listar_pedidos(
    status: Optional[StatusPedido] = None,
    session: Session = Depends(get_session),
):
    query = select(Pedido)
    if status:
        query = query.where(Pedido.status == status)
    return session.exec(query.order_by(Pedido.criado_em.desc())).all()


@app.get(f"{API}/pedidos/{{pedido_id}}", tags=["Pedidos"])
def buscar_pedido(pedido_id: int, session: Session = Depends(get_session)):
    pedido = session.get(Pedido, pedido_id)
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return pedido


class AtualizarStatusBody(BaseModel):
    status: StatusPedido
    motivo_cancelamento: Optional[str] = None


@app.patch(f"{API}/pedidos/{{pedido_id}}/status", tags=["Pedidos"])
def atualizar_status_pedido(
    pedido_id: int,
    body: AtualizarStatusBody,
    session: Session = Depends(get_session),
):
    pedido = session.get(Pedido, pedido_id)
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    pedido.status = body.status
    pedido.motivo_cancelamento = body.motivo_cancelamento
    pedido.atualizado_em = datetime.utcnow()
    session.add(pedido)
    session.commit()
    session.refresh(pedido)
    # Publica evento SSE no Redis
    redis_sync.publish("pedidos_updates", json.dumps({"id": pedido_id, "status": body.status}))
    return pedido


@app.patch(f"{API}/pedidos/{{pedido_id}}/handoff", tags=["Pedidos"])
def assumir_conversa(pedido_id: int, session: Session = Depends(get_session)):
    """Operador assume a conversa do WhatsApp (desativa o agente para esse número)."""
    pedido = session.get(Pedido, pedido_id)
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    pedido.assumido_por_humano = True
    pedido.atualizado_em = datetime.utcnow()
    session.add(pedido)
    session.commit()
    return {"status": "handoff_ativo", "pedido_id": pedido_id}


# ── SSE: atualizações em tempo real ─────────────────────────────────────────
@app.get(f"{API}/pedidos/stream", tags=["Pedidos"])
async def pedidos_stream():
    """Server-Sent Events para atualização do kanban em tempo real."""
    async def event_generator():
        r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        pubsub = r.pubsub()
        await pubsub.subscribe("pedidos_updates")
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    yield f"data: {message['data']}\n\n"
        finally:
            await pubsub.unsubscribe("pedidos_updates")
            await r.aclose()

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ══════════════════════════════════════════════════════════════════════════════
# CLIENTES
# ══════════════════════════════════════════════════════════════════════════════

@app.get(f"{API}/clientes", tags=["Clientes"])
def listar_clientes(session: Session = Depends(get_session)):
    return session.exec(select(ClienteB2B).order_by(ClienteB2B.total_faturado.desc())).all()


@app.get(f"{API}/clientes/{{cliente_id}}", tags=["Clientes"])
def buscar_cliente(cliente_id: int, session: Session = Depends(get_session)):
    cliente = session.get(ClienteB2B, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente


# ══════════════════════════════════════════════════════════════════════════════
# DASHBOARD — KPIs
# ══════════════════════════════════════════════════════════════════════════════

@app.get(f"{API}/dashboard/kpis", tags=["Dashboard"])
def dashboard_kpis(session: Session = Depends(get_session)):
    """Retorna KPIs principais para o dashboard."""
    hoje = date.today()
    inicio_mes = hoje.replace(day=1)

    metricas_mes = session.exec(
        select(MetricaDiaria).where(
            MetricaDiaria.data >= inicio_mes,
            MetricaDiaria.data <= hoje,
        )
    ).all()

    pedidos_ativos = session.exec(
        select(func.count(Pedido.id)).where(
            Pedido.status.in_([StatusPedido.CONFIRMADO, StatusPedido.EM_SEPARACAO, StatusPedido.SAIU_ENTREGA])
        )
    ).one()

    return {
        "faturamento_mes": sum(m.faturamento_bruto for m in metricas_mes),
        "kg_vendidos_mes": sum(m.kg_vendidos for m in metricas_mes),
        "pedidos_mes": sum(m.pedidos_confirmados for m in metricas_mes),
        "ticket_medio_mes": (
            sum(m.faturamento_bruto for m in metricas_mes) /
            max(sum(m.pedidos_confirmados for m in metricas_mes), 1)
        ),
        "pedidos_ativos": pedidos_ativos,
        "handoffs_pendentes": redis_sync.scard("handoffs_pendentes"),
    }


@app.get(f"{API}/dashboard/grafico", tags=["Dashboard"])
def dashboard_grafico(
    dias: int = 30,
    session: Session = Depends(get_session),
):
    """Retorna dados de faturamento e kg para o gráfico dos últimos N dias."""
    inicio = date.today() - timedelta(days=dias)
    metricas = session.exec(
        select(MetricaDiaria).where(MetricaDiaria.data >= inicio)
        .order_by(MetricaDiaria.data)
    ).all()
    return [
        {
            "data": m.data.isoformat(),
            "faturamento": m.faturamento_bruto,
            "kg_vendidos": m.kg_vendidos,
            "pedidos": m.pedidos_confirmados,
        }
        for m in metricas
    ]


# ══════════════════════════════════════════════════════════════════════════════
# CONFIGURAÇÕES
# ══════════════════════════════════════════════════════════════════════════════

@app.get(f"{API}/configuracoes", tags=["Configurações"])
def buscar_configuracoes(session: Session = Depends(get_session)):
    cfg = session.exec(select(ConfiguracaoEntrega).where(ConfiguracaoEntrega.ativo == True)).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")
    return cfg


@app.put(f"{API}/configuracoes", tags=["Configurações"])
def atualizar_configuracoes(
    body: ConfiguracaoEntrega,
    session: Session = Depends(get_session),
):
    cfg = session.exec(select(ConfiguracaoEntrega).where(ConfiguracaoEntrega.ativo == True)).first()
    if not cfg:
        cfg = ConfiguracaoEntrega()
        session.add(cfg)
    for field, value in body.dict(exclude_unset=True, exclude={"id", "criado_em"}).items():
        setattr(cfg, field, value)
    cfg.atualizado_em = datetime.utcnow()
    session.add(cfg)
    session.commit()
    session.refresh(cfg)
    return cfg


# ══════════════════════════════════════════════════════════════════════════════
# MARKETING IA
# ══════════════════════════════════════════════════════════════════════════════

class MarketingRequest(BaseModel):
    data_inicio: date
    data_fim: date


@app.post(f"{API}/marketing/gerar", tags=["Marketing"])
async def gerar_marketing(body: MarketingRequest):
    """Gera conteúdo de marketing B2B via GPT-4o com base nas métricas do período."""
    if body.data_fim < body.data_inicio:
        raise HTTPException(status_code=400, detail="data_fim deve ser >= data_inicio")
    resultado = await gerar_conteudo_marketing(body.data_inicio, body.data_fim)
    return resultado


# ══════════════════════════════════════════════════════════════════════════════
# PRODUTOS
# ══════════════════════════════════════════════════════════════════════════════

@app.get(f"{API}/produtos", tags=["Produtos"])
def listar_produtos(session: Session = Depends(get_session)):
    return session.exec(select(Produto).where(Produto.ativo == True)).all()


@app.patch(f"{API}/produtos/{{produto_id}}/estoque", tags=["Produtos"])
def atualizar_estoque(
    produto_id: int,
    estoque: int,
    session: Session = Depends(get_session),
):
    produto = session.get(Produto, produto_id)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    produto.estoque_fardos = estoque
    produto.atualizado_em = datetime.utcnow()
    session.add(produto)
    session.commit()
    return produto


# ══════════════════════════════════════════════════════════════════════════════
# TOOLS — Teste direto via Swagger
# ══════════════════════════════════════════════════════════════════════════════

class VerificarEntregaRequest(BaseModel):
    lat_cliente: float
    lon_cliente: float
    total_kg: float
    valor_pedido: float


@app.post(f"{API}/tools/verificar-entrega", tags=["Tools"])
def tool_verificar_entrega(body: VerificarEntregaRequest):
    """Endpoint para testar a validação de entrega diretamente."""
    from src.tools.delivery_tools import verificar_viabilidade_entrega
    result = verificar_viabilidade_entrega.invoke({
        "lat_cliente": body.lat_cliente,
        "lon_cliente": body.lon_cliente,
        "total_kg": body.total_kg,
        "valor_pedido": body.valor_pedido,
    })
    return {"resultado": result}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
