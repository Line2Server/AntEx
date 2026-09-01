# ☕ AntEx — Agente Vendedor de Café Arábico B2B

> **Agent Expert em Vendas** de fardos de 30kg e 50kg de café arábico torrado e moído de alta qualidade — vendas via WhatsApp com IA + Painel Admin completo.

![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-teal)
![LangGraph](https://img.shields.io/badge/LangGraph-0.1-purple)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![GPT-4o](https://img.shields.io/badge/LLM-GPT--4o-orange)

---

## 🗺️ Visão Geral

O **AntEx** é um sistema completo de vendas B2B para distribuidoras de café especial:

```
Cliente B2B (WhatsApp)
        │
        ▼
FastAPI Gateway ──────────────────────────────────────────────────┐
        │                                                         │
        ▼                                                         │
LangGraph Sales Agent                                  Dashboard (Next.js 14)
  ├── Identificação do cliente                          ├── /dashboard     KPIs + Gráficos
  ├── Apresentação do portfólio (30kg / 50kg)           ├── /pedidos        Kanban em tempo real
  ├── Qualificação (volume, frequência)                 ├── /clientes       CRM B2B
  ├── Validação de entrega (Haversine + km + mínimo)    ├── /configuracoes  Regras editáveis
  ├── Orçamento e proposta                              └── /marketing      Gerador IA
  └── Fechamento e handoff humano
        │
        ▼
PostgreSQL + Redis
```

---

## 🚀 Início Rápido (Docker)

```bash
# 1. Clone o repositório
git clone https://github.com/Line2Server/AntEx.git
cd AntEx

# 2. Configure as variáveis de ambiente
cp backend/.env.example backend/.env
# Edite backend/.env e adicione sua OPENAI_API_KEY

# 3. Suba tudo com Docker
docker-compose up -d

# 4. Acesse
# Dashboard: http://localhost:3000
# API Docs:  http://localhost:8000/docs
```

---

## 🛠️ Setup Manual (Desenvolvimento)

### Backend

```bash
cd backend

# Crie o ambiente virtual
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Linux/Mac

# Instale as dependências
pip install -r requirements.txt

# Configure o .env
cp .env.example .env
# Preencha OPENAI_API_KEY, DATABASE_URL, REDIS_URL

# Inicie o servidor
uvicorn main:app --reload --port 8000
```

Acesse a documentação interativa em: **http://localhost:8000/docs**

### Frontend

```bash
cd frontend

# Instale as dependências
npm install

# Configure a URL da API (opcional — padrão: localhost:8000)
# NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse o painel em: **http://localhost:3000**

---

## 📦 Produtos

| Produto | Peso | Preço/kg | Total/fardo | Rendimento |
|---|---|---|---|---|
| Fardo Arábico Premium | 30kg | R$ 42,00 | R$ 1.260,00 | ~600 xícaras |
| Fardo Arábico Premium | 50kg | R$ 40,00 | R$ 2.000,00 | ~1.000 xícaras |

> Origem: Cerrado Mineiro / Sul de Minas · Torra Média · Moagem Fina-Média

---

## 📐 Regras de Negócio

| Regra | Padrão | Editável |
|---|---|---|
| Raio máximo de entrega | 300km | ✅ Painel |
| Pedido mínimo | 30kg (1 fardo) | ✅ Painel |
| Taxa de frete por km | R$ 3,50/km | ✅ Painel |
| Frete grátis (distância) | Até 50km | ✅ Painel |
| Frete grátis (valor) | Acima de R$ 3.000 | ✅ Painel |
| Desconto 100kg+ | 3% | ✅ Painel |
| Desconto 200kg+ | 5% | ✅ Painel |
| Desconto 500kg+ | 8% | ✅ Painel |

---

## 🤖 Integração WhatsApp

### Evolution API
```bash
# Configure no .env:
EVOLUTION_API_URL=https://sua-instancia.evolution-api.com
EVOLUTION_API_KEY=sua-chave
EVOLUTION_INSTANCE=seu-instancia

# URL do webhook (configure na sua instância Evolution):
POST http://seu-servidor:8000/api/v1/webhook/whatsapp
```

### Z-API
```bash
# Configure no .env:
ZAPI_INSTANCE_ID=sua-instancia-id
ZAPI_TOKEN=seu-token

# Mesma URL de webhook acima — o sistema detecta o formato automaticamente
```

---

## 📊 Telas do Dashboard

| Tela | Descrição |
|---|---|
| **Dashboard** | Faturamento do mês, kg vendidos, ticket médio, pedidos ativos, gráfico 30 dias |
| **Pedidos** | Kanban (Orçamento → Confirmado → Em Separação → Saiu → Entregue) com SSE |
| **Clientes** | CRM: CNPJ, segmento, volume, faturamento, LTV, último pedido |
| **Configurações** | Edição em tempo real de raio, mínimo, frete, preços e descontos |
| **Marketing IA** | GPT-4o gera post Instagram, campanha WhatsApp e proposta e-mail por período |

---

## 🗂️ Estrutura do Projeto

```
AntEx/
├── backend/
│   ├── src/
│   │   ├── agents/          # LangGraph: funil de vendas B2B
│   │   ├── tools/           # Haversine, portfólio, orçamento
│   │   ├── services/        # Gerador de marketing (GPT-4o)
│   │   └── models/          # SQLModel: Produtos, Pedidos, Clientes, Métricas, Config
│   ├── main.py              # FastAPI: webhook + APIs
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── dashboard/       # KPIs + Recharts
│   │   ├── pedidos/         # Kanban + SSE
│   │   ├── clientes/        # CRM table
│   │   ├── configuracoes/   # Settings form
│   │   └── marketing/       # AI content generator
│   ├── components/
│   ├── lib/                 # api.ts + utils.ts
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🔌 Endpoints Principais

```
POST /api/v1/webhook/whatsapp      # Recebe mensagens do WhatsApp
GET  /api/v1/pedidos               # Lista pedidos (com filtro por status)
GET  /api/v1/pedidos/stream        # SSE: atualizações em tempo real
PATCH /api/v1/pedidos/{id}/status  # Avança status do kanban
PATCH /api/v1/pedidos/{id}/handoff # Operador assume a conversa
GET  /api/v1/clientes              # Lista clientes B2B
GET  /api/v1/dashboard/kpis        # KPIs do mês atual
GET  /api/v1/dashboard/grafico     # Dados para o gráfico (N dias)
GET  /api/v1/configuracoes         # Lê configurações
PUT  /api/v1/configuracoes         # Salva configurações
POST /api/v1/marketing/gerar       # Gera conteúdo de marketing via GPT-4o
POST /api/v1/tools/verificar-entrega # Testa validação de entrega
```

---

## 🗺️ Próximos Passos

- [ ] **Alembic migrations** — controle de versão do banco de dados
- [ ] **Autenticação** — JWT para proteção do dashboard
- [ ] **Geração de PDF** — proposta comercial em PDF automático
- [ ] **Integração Google Maps** — validação de endereço por texto (geocoding)
- [ ] **Relatório de métricas** — job agendado para snapshot diário automático
- [ ] **Multi-tenant** — suporte a múltiplas empresas / instâncias
- [ ] **App mobile** — React Native para gestão de pedidos em campo
- [ ] **Notificações push** — alertas de novos pedidos e handoffs

---

## 📄 Licença

MIT — veja [LICENSE](LICENSE) para detalhes.

---

<div align="center">
  <p>Desenvolvido com ☕ e IA — <a href="https://github.com/Line2Server">Line2Server</a></p>
</div>
