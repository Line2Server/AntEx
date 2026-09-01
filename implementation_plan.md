# AntEx — Agente Vendedor de Café Arábico (Atacado B2B)

> Vendas de **fardos de 30kg e 50kg** de café torrado e moído, arábico de alta qualidade, via WhatsApp com IA, painel de gestão e gerador de marketing para revendedores e estabelecimentos.

---

## Contexto de Negócio

| Item | Detalhe |
|---|---|
| **Produto** | Fardos de café arábico torrado e moído — 30kg e 50kg |
| **Público-alvo** | Restaurantes, hotéis, padarias, escritórios, distribuidores, revendedores |
| **Canal de venda** | WhatsApp via Evolution API / Z-API |
| **Ticket médio esperado** | R$ 800 – R$ 4.000+ por pedido |
| **Pedido mínimo** | Configurável (ex: 1 fardo de 30kg) |
| **Raio de entrega** | Configurável por KM (frete próprio ou transportadora) |

---

## Arquitetura Geral

```
Cliente B2B (WhatsApp)
        │
        ▼
FastAPI Gateway  ──────────────────────────────────────────────────────────┐
        │                                                                   │
        ▼                                                                   │
LangGraph Sales Agent                                            Dashboard (Next.js 14)
  ├── Node: Identificação do cliente (novo/recorrente)            ├── /dashboard     (KPIs de vendas)
  ├── Node: Apresentação do portfólio (30kg / 50kg)               ├── /pedidos        (kanban B2B)
  ├── Node: Qualificação (volume, frequência de compra)           ├── /clientes       (CRM básico)
  ├── Node: Validação de entrega (km + pedido mínimo)             ├── /configuracoes  (raio, mínimo, frete)
  ├── Node: Emissão de proposta / orçamento                       └── /marketing      (gerador IA B2B)
  ├── Node: Fechamento e registro do pedido
  └── Node: Handoff Humano (negociação de grande volume)
        │
        ▼
PostgreSQL + Redis (sessões de conversa)
```

---

## Produtos no Sistema

```python
PORTFOLIO = {
    "fardo_30kg": {
        "nome": "Fardo Café Arábico Torrado e Moído — 30kg",
        "preco_kg": 42.00,   # editável no painel
        "preco_total": 1260.00,
        "descricao": "Blend arábico premium, torra média, moagem fina-média ideal para coador e espresso",
        "rendimento": "~600 xícaras por fardo",
        "origem": "Cerrado Mineiro / Sul de Minas",
    },
    "fardo_50kg": {
        "nome": "Fardo Café Arábico Torrado e Moído — 50kg",
        "preco_kg": 40.00,   # escala de desconto
        "preco_total": 2000.00,
        "descricao": "Melhor custo-benefício para alto volume. Mesmo blend premium.",
        "rendimento": "~1000 xícaras por fardo",
        "origem": "Cerrado Mineiro / Sul de Minas",
    }
}
```

---

## Regras de Negócio B2B

```python
# Configuráveis via painel — valores padrão
PEDIDO_MINIMO_KG   = 30        # mínimo 1 fardo de 30kg
RAIO_MAXIMO_KM     = 300       # frete próprio até 300km
TAXA_FRETE_KM      = 3.50      # R$/km para distâncias > 50km
FRETE_GRATIS_ACIMA = 3000.00   # frete grátis acima de R$ 3.000

# Validação Haversine estrita
def verificar_viabilidade(lat, lon, valor_pedido, kg_total):
    distancia = haversine(lat, lon)
    if distancia > RAIO_MAXIMO_KM: return "FORA_DE_AREA"
    if kg_total < PEDIDO_MINIMO_KG: return "ABAIXO_MINIMO"
    taxa = 0 if valor_pedido >= FRETE_GRATIS_ACIMA else distancia * TAXA_FRETE_KM
    return {"status": "APROVADO", "frete": taxa, "distancia": distancia}
```

---

## Estrutura de Pastas

```
e:\Agent\
├── backend/
│   ├── src/
│   │   ├── agents/
│   │   │   ├── sales_agent.py     # LangGraph B2B: qualificação → proposta → fechamento
│   │   │   └── prompts.py         # Persona: consultor comercial de café especialidade
│   │   ├── tools/
│   │   │   ├── delivery_tools.py  # Haversine + regras de frete B2B
│   │   │   └── portfolio_tools.py # Portfólio de fardos, preços, rendimento
│   │   ├── services/
│   │   │   └── content_generator.py  # GPT-4o: copy B2B (e-mail, post, proposta PDF)
│   │   ├── models/
│   │   │   ├── products.py        # Produto (fardo 30kg/50kg), variações
│   │   │   ├── orders.py          # Pedido, ItemPedido, StatusPedido
│   │   │   ├── clients.py         # Cliente B2B (CNPJ, segmento, histórico)
│   │   │   ├── metrics.py         # Snapshot de vendas por período
│   │   │   └── settings.py        # ConfiguracaoEntrega (raio, frete, mínimo)
│   │   └── database.py
│   ├── main.py                    # FastAPI: webhook + CRUD + APIs dashboard
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               # → redirect /dashboard
│   │   ├── dashboard/page.tsx     # KPIs: faturamento, kg vendidos, pedidos, ticket médio
│   │   ├── pedidos/page.tsx       # Kanban B2B com volumes e valores
│   │   ├── clientes/page.tsx      # CRM: histórico, segmento, frequência
│   │   ├── configuracoes/page.tsx # Raio, pedido mínimo, taxa frete/km, preço/kg
│   │   └── marketing/page.tsx     # Gerador: post Instagram, proposta PDF, campanha WhatsApp
│   ├── components/
│   │   ├── layout/sidebar.tsx
│   │   ├── kanban/kanban-board.tsx
│   │   ├── metrics/metric-card.tsx
│   │   └── clients/client-table.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   ├── package.json
│   └── tailwind.config.ts
├── docker-compose.yml
└── README.md
```

---

## Proposed Changes

### Backend

#### [NEW] `backend/requirements.txt`
#### [NEW] `backend/.env.example`
#### [NEW] `backend/src/database.py`
#### [NEW] `backend/src/models/products.py` — Produto, Fardo (30kg / 50kg), preço/kg
#### [NEW] `backend/src/models/orders.py` — Pedido, ItemPedido, StatusPedido
#### [NEW] `backend/src/models/clients.py` — ClienteB2B (nome, CNPJ, segmento, localização)
#### [NEW] `backend/src/models/metrics.py` — KgVendidos, Faturamento, TicketMédio
#### [NEW] `backend/src/models/settings.py` — Raio, pedido mínimo, frete/km, preço/kg
#### [NEW] `backend/src/tools/delivery_tools.py` — Haversine + frete grátis acima de X
#### [NEW] `backend/src/tools/portfolio_tools.py` — Fardos, rendimento, preço, estoque
#### [NEW] `backend/src/agents/prompts.py` — Persona: consultor comercial especialista em café
#### [NEW] `backend/src/agents/sales_agent.py` — LangGraph B2B completo
#### [NEW] `backend/src/services/content_generator.py` — Marketing B2B com GPT-4o
#### [NEW] `backend/main.py`
#### [NEW] `backend/Dockerfile`

---

### Frontend

#### [NEW] `frontend/package.json`
#### [NEW] `frontend/tailwind.config.ts`
#### [NEW] `frontend/app/layout.tsx`
#### [NEW] `frontend/app/page.tsx`
#### [NEW] `frontend/app/dashboard/page.tsx` — KPIs: kg vendidos, faturamento, pedidos ativos
#### [NEW] `frontend/app/pedidos/page.tsx` — Kanban com volumes (30kg/50kg) e status
#### [NEW] `frontend/app/clientes/page.tsx` — Tabela de clientes B2B com histórico
#### [NEW] `frontend/app/configuracoes/page.tsx` — Raio, mínimo, frete, preço por kg
#### [NEW] `frontend/app/marketing/page.tsx` — Gerador IA: post, proposta, campanha
#### [NEW] `frontend/components/layout/sidebar.tsx`
#### [NEW] `frontend/components/kanban/kanban-board.tsx`
#### [NEW] `frontend/components/metrics/metric-card.tsx`
#### [NEW] `frontend/components/clients/client-table.tsx`
#### [NEW] `frontend/lib/api.ts`

---

### Infra

#### [NEW] `docker-compose.yml`
#### [NEW] `README.md`

---

## Funcionalidades por Tela

| Tela | O que faz |
|---|---|
| **Dashboard** | Faturamento do dia/semana/mês, kg vendidos, pedidos ativos, gráfico de vendas por período |
| **Pedidos** | Kanban: Orçamento → Confirmado → Em Separação → Saiu → Entregue → Cancelado |
| **Clientes** | CRM simples: CNPJ, segmento (hotel, restaurante, revenda), frequência, LTV |
| **Configurações** | Raio máximo de entrega, pedido mínimo em kg, preço por kg por produto, frete grátis acima de R$ |
| **Marketing IA** | Seleciona período → GPT-4o analisa top produtos, volume, clientes → gera post, proposta, campanha |

---

## Verification Plan

### Automated
- `uvicorn main:app --reload` → Swagger `/docs` para testar webhook e APIs
- `npm run dev` → navegar entre as 5 telas

### Manual
- POST `/webhook/whatsapp` com payload simulado → agente responde
- GET `/api/v1/pedidos` → retorna pedidos no kanban
- POST `/api/v1/marketing/gerar` → retorna conteúdo gerado por IA

---

> [!IMPORTANT]
> Requer PostgreSQL, Redis e chave OpenAI. Copie `backend/.env.example` para `.env` antes de iniciar. O `docker-compose up` sobe tudo automaticamente.
