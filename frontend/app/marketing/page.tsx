"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { gerarMarketing, type ConteudoMarketing } from "@/lib/api";
import {
  Megaphone, Instagram, MessageSquare, Mail, Sparkles,
  Loader2, Copy, CheckCheck, TrendingUp, Calendar,
} from "lucide-react";

function ContentBlock({
  title, icon: Icon, content, color,
}: {
  title: string; icon: React.ElementType; content: string; color: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const colorMap: Record<string, string> = {
    pink: "border-pink-500/30 bg-pink-500/5",
    green: "border-green-500/30 bg-green-500/5",
    blue: "border-blue-500/30 bg-blue-500/5",
    brand: "border-brand-500/30 bg-brand-500/5",
  };
  const iconMap: Record<string, string> = {
    pink: "text-pink-400 bg-pink-500/20",
    green: "text-green-400 bg-green-500/20",
    blue: "text-blue-400 bg-blue-500/20",
    brand: "text-brand-400 bg-brand-500/20",
  };

  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${colorMap[color]} animate-slide-up`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${iconMap[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="font-display font-semibold text-white">{title}</h3>
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs transition-all"
        >
          {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
      <div className="bg-black/20 rounded-xl p-4">
        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

export default function MarketingPage() {
  const today = new Date().toISOString().split("T")[0];
  const thirtyAgo = new Date(Date.now() - 30 * 864e5).toISOString().split("T")[0];

  const [dataInicio, setDataInicio] = useState(thirtyAgo);
  const [dataFim, setDataFim] = useState(today);
  const [resultado, setResultado] = useState<ConteudoMarketing | null>(null);

  const mutation = useMutation({
    mutationFn: () => gerarMarketing(dataInicio, dataFim),
    onSuccess: (data) => setResultado(data),
  });

  const PRESETS = [
    { label: "Últimos 7 dias", days: 7 },
    { label: "Últimos 30 dias", days: 30 },
    { label: "Últimos 90 dias", days: 90 },
  ];

  const applyPreset = (days: number) => {
    setDataFim(today);
    setDataInicio(new Date(Date.now() - days * 864e5).toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-white text-3xl">Marketing IA</h1>
        <p className="text-white/40 mt-1">
          GPT-4o analisa suas métricas e gera conteúdo estratégico B2B em segundos
        </p>
      </div>

      {/* Gerador */}
      <div className="card-glass p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="p-2 rounded-xl bg-brand-500/20">
            <Sparkles className="w-5 h-5 text-brand-400" />
          </div>
          <h2 className="font-display font-semibold text-white text-lg">Configurar Análise</h2>
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <p className="text-white/50 text-sm font-medium">Atalhos de período</p>
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map(({ label, days }) => (
              <button
                key={days}
                onClick={() => applyPreset(days)}
                className="btn-ghost text-sm"
              >
                <Calendar className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-white/60 text-sm font-medium">Data de Início</label>
            <input
              type="date"
              className="input-field"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              max={dataFim}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-white/60 text-sm font-medium">Data de Fim</label>
            <input
              type="date"
              className="input-field"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              min={dataInicio}
              max={today}
            />
          </div>
        </div>

        {/* O que será gerado */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Instagram, label: "Post Instagram", color: "text-pink-400" },
            { icon: MessageSquare, label: "Campanha WhatsApp", color: "text-green-400" },
            { icon: Mail, label: "Proposta E-mail", color: "text-blue-400" },
            { icon: TrendingUp, label: "Insight Estratégico", color: "text-brand-400" },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-white/60 text-xs">{label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="btn-brand w-full flex items-center justify-center gap-2 py-3 text-base"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Gerando conteúdo com IA...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Gerar Conteúdo de Marketing
            </>
          )}
        </button>

        {mutation.isError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            Erro ao gerar conteúdo. Verifique a chave OpenAI e tente novamente.
          </div>
        )}
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            <h2 className="font-display font-semibold text-white text-xl">Conteúdo Gerado</h2>
            <span className="badge bg-brand-500/20 text-brand-300 border border-brand-500/30 ml-auto">
              {dataInicio} → {dataFim}
            </span>
          </div>

          {resultado.insight_principal && (
            <ContentBlock
              title="💡 Insight Estratégico"
              icon={TrendingUp}
              content={resultado.insight_principal}
              color="brand"
            />
          )}
          {resultado.post_instagram && (
            <ContentBlock
              title="📸 Post Instagram"
              icon={Instagram}
              content={resultado.post_instagram}
              color="pink"
            />
          )}
          {resultado.campanha_whatsapp && (
            <ContentBlock
              title="💬 Campanha WhatsApp"
              icon={MessageSquare}
              content={resultado.campanha_whatsapp}
              color="green"
            />
          )}
          {resultado.proposta_email && (
            <ContentBlock
              title="📧 Proposta por E-mail"
              icon={Mail}
              content={resultado.proposta_email}
              color="blue"
            />
          )}
        </div>
      )}
    </div>
  );
}
