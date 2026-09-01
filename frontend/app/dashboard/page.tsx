"use client";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, Package, Users, DollarSign, AlertCircle, Loader2
} from "lucide-react";
import { getKPIs, getGrafico } from "@/lib/api";
import { formatCurrency, formatKg } from "@/lib/utils";

function MetricCard({
  label, value, sub, icon: Icon, trend, color = "brand",
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; trend?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    brand: "from-brand-500/20 to-brand-600/10 border-brand-500/30",
    green: "from-green-500/20 to-green-600/10 border-green-500/30",
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    red: "from-red-500/20 to-red-600/10 border-red-500/30",
  };
  const iconColors: Record<string, string> = {
    brand: "text-brand-400",
    green: "text-green-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
    red: "text-red-400",
  };

  return (
    <div className={`metric-card bg-gradient-to-br border ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/50 text-sm font-medium">{label}</p>
          <p className="font-display font-bold text-white text-2xl mt-1">{value}</p>
          {sub && <p className="text-white/40 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl bg-white/5 ${iconColors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <p className="text-green-400 text-xs flex items-center gap-1 mt-1">
          <TrendingUp className="w-3 h-3" /> {trend}
        </p>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="card-glass p-3 text-sm">
        <p className="text-white/60 mb-1">{label}</p>
        <p className="text-brand-300 font-semibold">{formatCurrency(payload[0]?.value || 0)}</p>
        <p className="text-white/50">{formatKg(payload[1]?.value || 0)}</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ["kpis"],
    queryFn: getKPIs,
  });

  const { data: grafico, isLoading: chartLoading } = useQuery({
    queryKey: ["grafico"],
    queryFn: () => getGrafico(30),
  });

  if (kpiLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-white text-3xl">Dashboard</h1>
        <p className="text-white/40 mt-1">Visão geral das vendas de café arábico</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricCard
          label="Faturamento do Mês"
          value={formatCurrency(kpis?.faturamento_mes || 0)}
          icon={DollarSign}
          color="brand"
          trend="Este mês"
        />
        <MetricCard
          label="KG Vendidos"
          value={formatKg(kpis?.kg_vendidos_mes || 0)}
          sub="no mês atual"
          icon={Package}
          color="green"
        />
        <MetricCard
          label="Pedidos Confirmados"
          value={String(kpis?.pedidos_mes || 0)}
          sub="no mês atual"
          icon={TrendingUp}
          color="blue"
        />
        <MetricCard
          label="Ticket Médio"
          value={formatCurrency(kpis?.ticket_medio_mes || 0)}
          icon={DollarSign}
          color="purple"
        />
        <MetricCard
          label="Pedidos Ativos"
          value={String(kpis?.pedidos_ativos || 0)}
          sub={kpis?.handoffs_pendentes ? `${kpis.handoffs_pendentes} handoff(s) pendente(s)` : "em aberto"}
          icon={kpis?.handoffs_pendentes ? AlertCircle : Users}
          color={kpis?.handoffs_pendentes ? "red" : "brand"}
        />
      </div>

      {/* Chart */}
      <div className="card-glass p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-semibold text-white text-xl">
            Faturamento & Volume — Últimos 30 dias
          </h2>
        </div>

        {chartLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 text-brand-400 animate-spin" />
          </div>
        ) : !grafico?.length ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/30 gap-3">
            <Package className="w-12 h-12" />
            <p className="font-medium">Nenhum dado no período</p>
            <p className="text-sm">Os dados aparecerão conforme os pedidos forem registrados</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={grafico}>
              <defs>
                <linearGradient id="gradFat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4832b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d4832b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradKg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="data" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} tickFormatter={(v) => `${v}kg`} />
              <Tooltip content={<CustomTooltip />} />
              <Area yAxisId="left" type="monotone" dataKey="faturamento" stroke="#d4832b" strokeWidth={2} fill="url(#gradFat)" name="Faturamento" />
              <Area yAxisId="right" type="monotone" dataKey="kg_vendidos" stroke="#60a5fa" strokeWidth={2} fill="url(#gradKg)" name="KG" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
