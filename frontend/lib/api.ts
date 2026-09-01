import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type StatusPedido =
  | "orcamento" | "confirmado" | "em_separacao"
  | "saiu_entrega" | "entregue" | "cancelado";

export interface Pedido {
  id: number;
  numero: string;
  cliente_id: number | null;
  status: StatusPedido;
  canal: string;
  subtotal: number;
  valor_frete: number;
  desconto: number;
  total: number;
  total_kg: number;
  distancia_km: number | null;
  endereco_entrega: string | null;
  observacoes: string | null;
  assumido_por_humano: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface ClienteB2B {
  id: number;
  nome: string;
  razao_social: string | null;
  cnpj: string | null;
  whatsapp: string;
  email: string | null;
  segmento: string;
  cidade: string | null;
  estado: string | null;
  total_pedidos: number;
  total_kg_comprado: number;
  total_faturado: number;
  ticket_medio: number;
  ultimo_pedido_em: string | null;
}

export interface KPIs {
  faturamento_mes: number;
  kg_vendidos_mes: number;
  pedidos_mes: number;
  ticket_medio_mes: number;
  pedidos_ativos: number;
  handoffs_pendentes: number;
}

export interface GraficoItem {
  data: string;
  faturamento: number;
  kg_vendidos: number;
  pedidos: number;
}

export interface ConfiguracaoEntrega {
  id: number;
  raio_maximo_km: number;
  pedido_minimo_kg: number;
  taxa_frete_por_km: number;
  frete_gratis_acima: number;
  km_frete_gratis: number;
  preco_kg_fardo_30: number;
  preco_kg_fardo_50: number;
  desconto_acima_100kg: number;
  desconto_acima_200kg: number;
  desconto_acima_500kg: number;
  cidade_empresa: string;
  estado_empresa: string;
}

export interface ConteudoMarketing {
  post_instagram: string;
  campanha_whatsapp: string;
  proposta_email: string;
  insight_principal: string;
}

export interface Produto {
  id: number;
  sku: string;
  nome: string;
  tipo: "fardo_30kg" | "fardo_50kg";
  peso_kg: number;
  preco_por_kg: number;
  preco_total: number;
  estoque_fardos: number;
  ativo: boolean;
}

// ── API Functions ─────────────────────────────────────────────────────────────

// Pedidos
export const getPedidos = (status?: StatusPedido) =>
  api.get<Pedido[]>("/pedidos", { params: status ? { status } : {} }).then(r => r.data);

export const atualizarStatus = (id: number, status: StatusPedido) =>
  api.patch<Pedido>(`/pedidos/${id}/status`, { status }).then(r => r.data);

export const assumirConversa = (id: number) =>
  api.patch(`/pedidos/${id}/handoff`).then(r => r.data);

// Clientes
export const getClientes = () =>
  api.get<ClienteB2B[]>("/clientes").then(r => r.data);

// Dashboard
export const getKPIs = () =>
  api.get<KPIs>("/dashboard/kpis").then(r => r.data);

export const getGrafico = (dias = 30) =>
  api.get<GraficoItem[]>("/dashboard/grafico", { params: { dias } }).then(r => r.data);

// Configurações
export const getConfiguracoes = () =>
  api.get<ConfiguracaoEntrega>("/configuracoes").then(r => r.data);

export const salvarConfiguracoes = (data: Partial<ConfiguracaoEntrega>) =>
  api.put<ConfiguracaoEntrega>("/configuracoes", data).then(r => r.data);

// Marketing
export const gerarMarketing = (data_inicio: string, data_fim: string) =>
  api.post<ConteudoMarketing>("/marketing/gerar", { data_inicio, data_fim }).then(r => r.data);

// Produtos
export const getProdutos = () =>
  api.get<Produto[]>("/produtos").then(r => r.data);
