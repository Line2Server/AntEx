"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPedidos, atualizarStatus, assumirConversa, type Pedido, type StatusPedido } from "@/lib/api";
import { formatCurrency, formatKg, formatDate, STATUS_LABELS, STATUS_BADGE_CLASS } from "@/lib/utils";
import { Package, User, MapPin, Phone, Loader2, UserCheck, ChevronRight, Coffee } from "lucide-react";

const COLUNAS: { status: StatusPedido; label: string; cor: string }[] = [
  { status: "orcamento",    label: "Orçamento",       cor: "border-yellow-500/40" },
  { status: "confirmado",   label: "Confirmado",      cor: "border-blue-500/40" },
  { status: "em_separacao", label: "Em Separação",    cor: "border-purple-500/40" },
  { status: "saiu_entrega", label: "Saiu p/ Entrega", cor: "border-orange-500/40" },
  { status: "entregue",     label: "Entregue",        cor: "border-green-500/40" },
];

const PROXIMO_STATUS: Partial<Record<StatusPedido, StatusPedido>> = {
  orcamento:    "confirmado",
  confirmado:   "em_separacao",
  em_separacao: "saiu_entrega",
  saiu_entrega: "entregue",
};

function PedidoCard({ pedido, onAvancar, onHandoff }: {
  pedido: Pedido;
  onAvancar: () => void;
  onHandoff: () => void;
}) {
  const proximo = PROXIMO_STATUS[pedido.status];
  return (
    <div className="kanban-card group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white font-semibold text-sm">{pedido.numero}</p>
          <p className="text-white/40 text-xs mt-0.5">{formatDate(pedido.criado_em)}</p>
        </div>
        <span className={STATUS_BADGE_CLASS[pedido.status]}>
          {STATUS_LABELS[pedido.status]}
        </span>
      </div>

      {/* Infos */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-white/60 text-xs">
          <Package className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
          <span>{formatKg(pedido.total_kg)}</span>
        </div>
        {pedido.endereco_entrega && (
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <MapPin className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
            <span className="truncate">{pedido.endereco_entrega}</span>
          </div>
        )}
        {pedido.distancia_km && (
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <span className="w-3.5 h-3.5 flex items-center justify-center text-brand-400 flex-shrink-0 text-[10px]">km</span>
            <span>{pedido.distancia_km}km</span>
          </div>
        )}
      </div>

      {/* Financeiro */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div>
          <p className="text-white/40 text-[10px]">Total</p>
          <p className="text-brand-300 font-bold text-sm">{formatCurrency(pedido.total)}</p>
        </div>
        <div className="flex gap-1.5">
          {!pedido.assumido_por_humano && pedido.canal === "whatsapp" && (
            <button
              onClick={onHandoff}
              title="Assumir conversa"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 text-white/40 hover:text-blue-300 transition-all"
            >
              <UserCheck className="w-3.5 h-3.5" />
            </button>
          )}
          {proximo && (
            <button
              onClick={onAvancar}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-500/20 hover:bg-brand-500/40 text-brand-300 text-xs font-medium transition-all"
            >
              {STATUS_LABELS[proximo]} <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {pedido.assumido_por_humano && (
        <div className="mt-2 flex items-center gap-1.5 text-blue-300 text-xs">
          <UserCheck className="w-3 h-3" /> Atendimento humano ativo
        </div>
      )}
    </div>
  );
}

export default function PedidosPage() {
  const queryClient = useQueryClient();
  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["pedidos"],
    queryFn: () => getPedidos(),
    refetchInterval: 15_000,
  });

  const avancarMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: StatusPedido }) =>
      atualizarStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pedidos"] }),
  });

  const handoffMutation = useMutation({
    mutationFn: (id: number) => assumirConversa(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pedidos"] }),
  });

  // SSE para atualizações em tempo real
  useEffect(() => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/pedidos/stream`;
    const es = new EventSource(url);
    es.onmessage = () => queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    return () => es.close();
  }, [queryClient]);

  const pedidosPorStatus = (status: StatusPedido) =>
    pedidos.filter((p) => p.status === status);

  const totalAtivos = pedidos.filter(
    (p) => !["entregue", "cancelado"].includes(p.status)
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-white text-3xl">Pedidos</h1>
          <p className="text-white/40 mt-1">
            {totalAtivos} pedido(s) ativo(s) · atualização automática a cada 15s
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-green-300 text-sm font-medium">Live</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : (
        /* Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto">
          {COLUNAS.map(({ status, label, cor }) => {
            const cards = pedidosPorStatus(status);
            return (
              <div key={status} className="min-w-[240px]">
                {/* Coluna Header */}
                <div className={`flex items-center justify-between mb-3 pb-3 border-b-2 ${cor}`}>
                  <h3 className="font-semibold text-white text-sm">{label}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs font-medium">
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="kanban-column">
                  {cards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-white/20 gap-2">
                      <Coffee className="w-8 h-8" />
                      <p className="text-xs">Nenhum pedido</p>
                    </div>
                  ) : (
                    cards.map((p) => (
                      <PedidoCard
                        key={p.id}
                        pedido={p}
                        onAvancar={() => {
                          const prox = PROXIMO_STATUS[p.status];
                          if (prox) avancarMutation.mutate({ id: p.id, status: prox });
                        }}
                        onHandoff={() => handoffMutation.mutate(p.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
