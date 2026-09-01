"""
Content Generator — AntEx
Analisa métricas de vendas e gera conteúdo de marketing B2B via GPT-4o.
"""
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel
from datetime import date, timedelta
from sqlmodel import Session, select, func
from src.database import engine, settings
from src.models.metrics import MetricaDiaria
from src.models.orders import Pedido, ItemPedido, StatusPedido
from src.models.products import Produto


class MetricasInput(BaseModel):
    data_inicio: date
    data_fim: date


class ConteudoGerado(BaseModel):
    post_instagram: str
    campanha_whatsapp: str
    proposta_email: str
    insight_principal: str


MARKETING_PROMPT = ChatPromptTemplate.from_template("""
Você é um especialista em Marketing B2B e Copywriting para distribuidoras de café premium.

## Métricas do Período ({data_inicio} a {data_fim})

- 🏆 Produto mais vendido: {top_produto}
- 📦 Produto com menor saída: {low_produto}
- ⚖️  Total de kg vendidos: {total_kg}kg
- 💵 Faturamento do período: R$ {faturamento}
- 🎟️  Ticket médio: R$ {ticket_medio}
- 👥 Clientes atendidos: {total_clientes}
- 🆕 Novos clientes: {novos_clientes}
- 📊 Segmento principal: {top_segmento}

## Instruções

Com base nessas métricas, crie 3 peças de conteúdo em Português do Brasil:

### 1. POST INSTAGRAM
- Foco no produto mais vendido ({top_produto})
- Tom aspiracional e premium
- Máximo 150 palavras
- Inclua chamada para ação (CTA) para WhatsApp
- Sugestão de hashtags relevantes (#café #arabico #atacado #qualidade)

### 2. CAMPANHA WHATSAPP
- Foco em alavancar o produto com menor saída ({low_produto}) com oferta especial
- Tom direto e comercial (como mensagem de consultor)
- Máximo 120 palavras
- Inclua desconto ou condição especial de volume

### 3. PROPOSTA POR E-MAIL
- Tom formal e consultivo
- Apresente os dois produtos e o portfólio completo
- Destaque o ticket médio e benefícios para o segmento {top_segmento}
- Máximo 200 palavras

### 4. INSIGHT PRINCIPAL
- 1 parágrafo (máximo 80 palavras)
- Análise estratégica do período para o gestor

Responda EXATAMENTE neste formato JSON (sem markdown, sem explicações):
{{
  "post_instagram": "...",
  "campanha_whatsapp": "...",
  "proposta_email": "...",
  "insight_principal": "..."
}}
""")


def _coletar_metricas(data_inicio: date, data_fim: date) -> dict:
    """Busca métricas do banco para o período solicitado."""
    with Session(engine) as session:
        metricas = session.exec(
            select(MetricaDiaria).where(
                MetricaDiaria.data >= data_inicio,
                MetricaDiaria.data <= data_fim,
            )
        ).all()

        if metricas:
            total_kg = sum(m.kg_vendidos for m in metricas)
            faturamento = sum(m.faturamento_bruto for m in metricas)
            pedidos_total = sum(m.pedidos_confirmados for m in metricas)
            novos = sum(m.novos_clientes for m in metricas)
            fardos_30 = sum(m.fardos_30kg_vendidos for m in metricas)
            fardos_50 = sum(m.fardos_50kg_vendidos for m in metricas)
            ticket_medio = faturamento / pedidos_total if pedidos_total > 0 else 0
            top_produto = "Fardo 30kg" if fardos_30 >= fardos_50 else "Fardo 50kg"
            low_produto = "Fardo 50kg" if fardos_30 >= fardos_50 else "Fardo 30kg"
            clientes = pedidos_total
        else:
            # Fallback: busca direto nos pedidos
            pedidos = session.exec(
                select(Pedido).where(
                    Pedido.criado_em >= data_inicio,
                    Pedido.status == StatusPedido.ENTREGUE,
                )
            ).all()
            total_kg = sum(p.total_kg for p in pedidos)
            faturamento = sum(p.total for p in pedidos)
            clientes = len(set(p.cliente_id for p in pedidos))
            novos = 0
            ticket_medio = faturamento / len(pedidos) if pedidos else 0
            top_produto = "Fardo 30kg"
            low_produto = "Fardo 50kg"

    return {
        "total_kg": round(total_kg, 1),
        "faturamento": round(faturamento, 2),
        "ticket_medio": round(ticket_medio, 2),
        "total_clientes": clientes,
        "novos_clientes": novos,
        "top_produto": top_produto,
        "low_produto": low_produto,
        "top_segmento": "restaurantes e hotéis",
    }


async def gerar_conteudo_marketing(data_inicio: date, data_fim: date) -> ConteudoGerado:
    """
    Analisa métricas do período e gera conteúdo de marketing B2B via GPT-4o.

    Args:
        data_inicio: Data de início do período de análise.
        data_fim: Data de fim do período de análise.

    Returns:
        ConteudoGerado com post Instagram, campanha WhatsApp, proposta e insight.
    """
    llm = ChatOpenAI(
        model="gpt-4o",
        temperature=0.7,
        api_key=settings.OPENAI_API_KEY,
    )

    metricas = _coletar_metricas(data_inicio, data_fim)
    chain = MARKETING_PROMPT | llm

    resultado = await chain.ainvoke({
        "data_inicio": data_inicio.strftime("%d/%m/%Y"),
        "data_fim": data_fim.strftime("%d/%m/%Y"),
        **metricas,
    })

    import json
    try:
        data = json.loads(resultado.content)
        return ConteudoGerado(**data)
    except (json.JSONDecodeError, Exception):
        return ConteudoGerado(
            post_instagram=resultado.content,
            campanha_whatsapp="",
            proposta_email="",
            insight_principal="",
        )
