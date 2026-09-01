import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatKg(value: number): string {
  return `${value.toLocaleString("pt-BR")}kg`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const STATUS_LABELS: Record<string, string> = {
  orcamento: "Orçamento",
  confirmado: "Confirmado",
  em_separacao: "Em Separação",
  saiu_entrega: "Saiu p/ Entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const STATUS_BADGE_CLASS: Record<string, string> = {
  orcamento: "badge-orcamento",
  confirmado: "badge-confirmado",
  em_separacao: "badge-separacao",
  saiu_entrega: "badge-saiu",
  entregue: "badge-entregue",
  cancelado: "badge-cancelado",
};

export const SEGMENTO_LABELS: Record<string, string> = {
  restaurante: "🍽️ Restaurante",
  hotel: "🏨 Hotel",
  padaria: "🥐 Padaria",
  escritorio: "🏢 Escritório",
  distribuidor: "📦 Distribuidor",
  revendedor: "🏪 Revendedor",
  outro: "📋 Outro",
};
