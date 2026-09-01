"use client";
import { useQuery } from "@tanstack/react-query";
import { getClientes } from "@/lib/api";
import { formatCurrency, formatKg, formatDate, SEGMENTO_LABELS } from "@/lib/utils";
import { Users, Loader2, Coffee, TrendingUp, Search } from "lucide-react";
import { useState } from "react";

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: getClientes,
  });

  const filtered = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.whatsapp.includes(search) ||
      (c.cnpj || "").includes(search)
  );

  const totalFaturamento = clientes.reduce((s, c) => s + c.total_faturado, 0);
  const totalKg = clientes.reduce((s, c) => s + c.total_kg_comprado, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-white text-3xl">Clientes</h1>
          <p className="text-white/40 mt-1">
            {clientes.length} cliente(s) cadastrado(s)
          </p>
        </div>
        <div className="flex gap-3">
          <div className="card-glass px-4 py-2 text-center min-w-[140px]">
            <p className="text-white/40 text-xs">Volume Total</p>
            <p className="text-brand-300 font-bold text-lg">{formatKg(totalKg)}</p>
          </div>
          <div className="card-glass px-4 py-2 text-center min-w-[140px]">
            <p className="text-white/40 text-xs">Faturamento Total</p>
            <p className="text-green-300 font-bold text-lg">{formatCurrency(totalFaturamento)}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          className="input-field pl-10"
          placeholder="Buscar por nome, WhatsApp ou CNPJ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-glass flex flex-col items-center justify-center py-20 gap-4 text-white/30">
          <Coffee className="w-14 h-14" />
          <p className="font-medium text-lg">Nenhum cliente encontrado</p>
          <p className="text-sm">Os clientes aparecem conforme os pedidos chegam pelo WhatsApp</p>
        </div>
      ) : (
        <div className="card-glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {["Cliente", "Segmento", "WhatsApp", "Pedidos", "Volume", "Faturamento", "Ticket Médio", "Último Pedido"].map((h) => (
                    <th key={h} className="text-left text-white/40 text-xs font-semibold uppercase tracking-wide px-5 py-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-white font-medium text-sm">{c.nome}</p>
                        {c.cnpj && <p className="text-white/30 text-xs mt-0.5">CNPJ: {c.cnpj}</p>}
                        {c.cidade && (
                          <p className="text-white/30 text-xs">{c.cidade}/{c.estado}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-white/60">
                        {SEGMENTO_LABELS[c.segmento] || c.segmento}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-white/60 text-sm">{c.whatsapp}</td>
                    <td className="px-5 py-4">
                      <span className="text-white font-semibold">{c.total_pedidos}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-brand-300 font-semibold">{formatKg(c.total_kg_comprado)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-green-300 font-semibold">{formatCurrency(c.total_faturado)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-brand-400" />
                        <span className="text-white font-medium text-sm">
                          {formatCurrency(c.total_pedidos > 0 ? c.total_faturado / c.total_pedidos : 0)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-white/40 text-sm">
                      {c.ultimo_pedido_em ? formatDate(c.ultimo_pedido_em) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
