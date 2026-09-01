# 🗺️ AntEx — Roadmap de Atualizações Futuras

> Documento vivo de planejamento estratégico. Atualizado conforme o produto evolui.
> **Última revisão:** Setembro 2026

---

## 📊 Status das Fases

| Fase | Descrição | Status |
|------|-----------|--------|
| **v1.0** | Core: Agente + Webhook + Dashboard | ✅ Concluído |
| **v1.1** | Banco de dados versionado + Auth | 🔜 Próxima |
| **v1.2** | Meta Ads + CRM Avançado | 📋 Planejado |
| **v2.0** | Multi-tenant + Mobile + Analytics | 🔭 Futuro |

---

## 🔜 v1.1 — Fundação Sólida
> **Prioridade: ALTA** — Necessário antes de qualquer integração externa

### 🗄️ Alembic — Migrações de Banco de Dados
- [ ] Configurar Alembic no projeto `backend/`
- [ ] Criar migration inicial a partir dos modelos SQLModel existentes
- [ ] Script `alembic upgrade head` no startup do container
- [ ] Documentar processo de criação de novas migrations

### 🔐 Autenticação & Segurança
- [ ] JWT com refresh token para o Dashboard
- [ ] Tela de Login no frontend (`/login`)
- [ ] Middleware de autenticação nas rotas protegidas da API
- [ ] Rate limiting no endpoint do webhook WhatsApp (prevenção de spam)
- [ ] Variável `WEBHOOK_SECRET` para validar chamadas legítimas da Evolution API

### 📈 Job de Métricas Diárias
- [ ] Celery + Beat (ou APScheduler) para rodar às 23:59 todos os dias
- [ ] Gera snapshot `MetricaDiaria` automaticamente com base nos pedidos do dia
- [ ] Alerta por WhatsApp/e-mail se faturamento do dia < meta configurável

---

## 📋 v1.2 — Integração Meta Ads & CRM Avançado
> **Prioridade: ALTA** — Principal expansão de canal

### 🎯 Meta Ads Integration
> Conectar os dados de vendas do AntEx diretamente ao ecossistema Meta (Facebook + Instagram Ads)

#### 1. Meta Conversions API (CAPI)
- [ ] Enviar eventos de conversão do AntEx diretamente ao Meta Pixel via API server-side
- [ ] Eventos a rastrear:
  - `Lead` — quando o cliente inicia conversa no WhatsApp
  - `InitiateCheckout` — quando o agente apresenta o orçamento
  - `Purchase` — quando o pedido é confirmado (com valor real R$)
- [ ] Configurar `event_match_quality` com dados do cliente (telefone, e-mail se disponível)
- [ ] Implementar `event_deduplication` para evitar dupla contagem com pixel do navegador
- [ ] Dashboard mostrando eventos enviados e taxa de match

```python
# Exemplo de payload CAPI — backend/src/services/meta_capi.py
{
  "event_name": "Purchase",
  "event_time": timestamp,
  "user_data": {
    "ph": [hashed_phone],   # SHA256 do telefone
  },
  "custom_data": {
    "currency": "BRL",
    "value": 2000.00,       # valor do fardo
    "content_ids": ["CAFE-ARA-50KG"],
    "content_type": "product",
    "num_items": 1,
  },
  "action_source": "system_generated"
}
```

#### 2. Meta Lead Ads — WhatsApp Automático
- [ ] Webhook para receber leads de formulários de Lead Ads do Facebook/Instagram
- [ ] Ao capturar lead: agente AntEx inicia conversa proativa no WhatsApp do lead
- [ ] Rota: `POST /api/v1/webhook/meta-leads`
- [ ] Personalização da primeira mensagem com nome do lead (vem do formulário)
- [ ] Controle de `sent_leads` no Redis para evitar disparo duplicado

#### 3. Audiências Personalizadas (Custom Audiences)
- [ ] Job semanal: exportar lista de clientes B2B para Custom Audience do Meta
- [ ] Segmentação por:
  - Clientes que compraram nos últimos 90 dias (Retenção)
  - Clientes com pedido mínimo e sem compra há 60+ dias (Reativação)
  - Clientes com alto LTV (Lookalike Audience para prospecção)
- [ ] Upload via Meta Marketing API (`/act_{ad_account_id}/customaudiences`)

#### 4. Tela no Dashboard — "Meta Ads"
- [ ] Card: Eventos enviados hoje / taxa de match
- [ ] Card: Leads recebidos de Lead Ads na semana
- [ ] Card: Custo por pedido confirmado (importado da API do Meta)
- [ ] Botão: "Sincronizar Audiências Agora"
- [ ] Gráfico: ROI de campanhas (faturamento AntEx atribuído ao Meta)

### 📇 CRM Avançado
- [ ] Campo de **segmento** editável manualmente pelo operador
- [ ] **Tags** personalizadas por cliente (ex: "VIP", "Inadimplente", "Sazonalidade Natal")
- [ ] **Notas internas** por cliente (campo de texto livre para o time comercial)
- [ ] **Histórico completo** de pedidos por cliente com timeline visual
- [ ] **Score de risco de churn**: cliente sem compra há X dias — alerta no dashboard
- [ ] Exportação de clientes para CSV/Excel

---

## 📋 v1.3 — Documentos & Comunicação Automatizada

### 📄 Geração de Proposta em PDF
- [ ] Biblioteca `reportlab` ou `weasyprint` para geração de PDF server-side
- [ ] Template profissional com logo, dados da empresa, portfólio e tabela de preços
- [ ] Endpoint: `POST /api/v1/pedidos/{id}/proposta-pdf`
- [ ] Agente envia PDF automaticamente pelo WhatsApp após gerar orçamento
- [ ] Painel: botão "Baixar Proposta" em cada card do kanban

### 📧 E-mail Transacional
- [ ] Integração com SendGrid ou Resend
- [ ] E-mail automático ao confirmar pedido (para o cliente, se tiver e-mail)
- [ ] E-mail semanal de relatório para o gestor (métricas da semana)
- [ ] Template HTML com identidade visual do AntEx

### 🔔 Notificações Internas
- [ ] Push notification no dashboard quando novo pedido chegar
- [ ] Alerta de handoff pendente com nome e número do cliente
- [ ] Integração opcional com Slack/Discord via webhook

---

## 📋 v1.4 — Logística & Entrega

### 🗺️ Geocoding por Texto
- [ ] Integração com Google Maps Geocoding API
- [ ] Cliente informa endereço em texto — agente converte para lat/lon automaticamente
- [ ] Sem necessidade de o cliente enviar localização GPS
- [ ] Cache de endereços geocodificados no Redis (evita custo repetido)

### 🚚 Integração com Transportadoras
- [ ] Consulta de frete via API (Correios / Jadlog / Total Express)
- [ ] Cotação automática quando pedido estiver fora do raio de frete próprio
- [ ] Agente apresenta opção de frete terceirizado com prazo e valor

### 📦 Gestão de Estoque Avançada
- [ ] Baixa automática de estoque ao confirmar pedido
- [ ] Alerta quando estoque de algum fardo atingir nível mínimo configurável
- [ ] Histórico de movimentação (entrada/saída)
- [ ] Tela `/estoque` no dashboard

---

## 🔭 v2.0 — Escala & Multi-tenant

### 🏢 Multi-tenant
- [ ] Suporte a múltiplas empresas/instâncias no mesmo sistema
- [ ] Isolamento por `tenant_id` em todas as tabelas
- [ ] Planos (Free / Pro / Enterprise) com limites de mensagens e pedidos

### 📱 Aplicativo Mobile
- [ ] React Native para iOS e Android
- [ ] Gestão de pedidos em campo (motorista atualiza status de entrega)
- [ ] Notificações push para novo pedido e handoff
- [ ] Modo offline com sincronização

### 🤖 IA Avançada
- [ ] **Memória de longo prazo**: cliente recorrente — agente lembra preferências
- [ ] **Análise de sentimento**: detecta insatisfação e aciona handoff automaticamente
- [ ] **Precificação dinâmica**: agente sugere desconto personalizado com base no histórico
- [ ] **Prospecção ativa**: agente inicia conversa com leads frios após X dias sem compra

### 📊 Analytics Avançado
- [ ] Funil de conversão: mensagens — orçamento — pedido
- [ ] Heatmap de horários de pico de atendimento
- [ ] Análise de causas de cancelamento
- [ ] Comparativo mês a mês com variação percentual
- [ ] Exportação para Google Looker Studio / Power BI

---

## 🔌 Integrações Planejadas

| Integração | Finalidade | Prioridade | Fase |
|-----------|-----------|-----------|------|
| **Meta Conversions API** | Rastrear vendas no Meta Ads server-side | 🔴 Alta | v1.2 |
| **Meta Lead Ads** | Capturar leads e ativar agente proativamente | 🔴 Alta | v1.2 |
| **Google Maps Geocoding** | Converter endereço texto — lat/lon | 🟡 Média | v1.4 |
| **SendGrid / Resend** | E-mails transacionais e relatórios | 🟡 Média | v1.3 |
| **Stripe / Pagar.me** | Cobrança online (link de pagamento) | 🟡 Média | v2.0 |
| **Jadlog / Correios** | Cotação de frete terceirizado | 🟡 Média | v1.4 |
| **Google Analytics 4** | Analytics do dashboard web | 🟢 Baixa | v1.3 |
| **Slack / Discord** | Alertas internos para o time | 🟢 Baixa | v1.3 |
| **Notion / Trello** | Sincronizar pedidos como cards | 🟢 Baixa | v2.0 |
| **Google Looker Studio** | Relatórios avançados de BI | 🟢 Baixa | v2.0 |

---

## 💡 Ideias em Avaliação

> Ainda não priorizadas — aguardam validação com usuários

- **Catálogo interativo no WhatsApp**: usar recursos de Lista e Botões da API para apresentar o portfólio de forma visual
- **Assinatura recorrente**: cliente define frequência de entrega (mensal, quinzenal) e pedido é gerado automaticamente
- **Programa de fidelidade**: pontos por kg comprado, resgatáveis em desconto
- **Marketplace B2B**: conectar múltiplos fornecedores de café ao mesmo agente
- **Integração ERP**: exportar pedidos confirmados para TOTVS / SAP / Omie / Bling

---

## 📝 Como Contribuir com o Roadmap

1. Abra uma **Issue** no GitHub com o label `roadmap`
2. Descreva a funcionalidade, o problema que resolve e o impacto esperado
3. Features com mais votos (👍) sobem na fila de priorização

---

> _"O melhor café chega para quem se prepara." — AntEx Team_ ☕
