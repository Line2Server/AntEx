"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getConfiguracoes, salvarConfiguracoes, type ConfiguracaoEntrega } from "@/lib/api";
import { Save, Loader2, Settings, MapPin, Package, Truck, Percent, CheckCircle } from "lucide-react";

function Section({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="card-glass p-6 space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="p-2 rounded-xl bg-brand-500/20">
          <Icon className="w-5 h-5 text-brand-400" />
        </div>
        <h2 className="font-display font-semibold text-white text-lg">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-white/70 text-sm font-medium block">{label}</label>
      {children}
      {hint && <p className="text-white/30 text-xs">{hint}</p>}
    </div>
  );
}

export default function ConfiguracoesPage() {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data: cfg, isLoading } = useQuery({
    queryKey: ["configuracoes"],
    queryFn: getConfiguracoes,
  });

  const [form, setForm] = useState<Partial<ConfiguracaoEntrega>>({});

  const mutation = useMutation({
    mutationFn: (data: Partial<ConfiguracaoEntrega>) => salvarConfiguracoes(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const val = (key: keyof ConfiguracaoEntrega) =>
    (form[key] ?? cfg?.[key] ?? "") as string | number;

  const set = (key: keyof ConfiguracaoEntrega, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ ...(cfg || {}), ...form });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-white text-3xl">Configurações</h1>
        <p className="text-white/40 mt-1">
          Ajuste as regras de entrega, preços e descontos do agente em tempo real
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Localização */}
        <Section title="Localização da Empresa" icon={MapPin}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Latitude" hint="Coordenada da sua empresa">
              <input className="input-field" type="number" step="any"
                value={val("lat_empresa")} onChange={(e) => set("lat_empresa", parseFloat(e.target.value))} />
            </Field>
            <Field label="Longitude">
              <input className="input-field" type="number" step="any"
                value={val("lon_empresa")} onChange={(e) => set("lon_empresa", parseFloat(e.target.value))} />
            </Field>
            <Field label="Cidade">
              <input className="input-field" type="text"
                value={val("cidade_empresa")} onChange={(e) => set("cidade_empresa", e.target.value)} />
            </Field>
            <Field label="Estado (UF)">
              <input className="input-field" type="text" maxLength={2}
                value={val("estado_empresa")} onChange={(e) => set("estado_empresa", e.target.value.toUpperCase())} />
            </Field>
          </div>
        </Section>

        {/* Regras de Entrega */}
        <Section title="Regras de Entrega" icon={Truck}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Raio Máximo (km)" hint="Limite de distância para entrega própria">
              <input className="input-field" type="number" step="1"
                value={val("raio_maximo_km")} onChange={(e) => set("raio_maximo_km", parseFloat(e.target.value))} />
            </Field>
            <Field label="Pedido Mínimo (kg)" hint="Mínimo aceito — 1 fardo = 30kg">
              <input className="input-field" type="number" step="1"
                value={val("pedido_minimo_kg")} onChange={(e) => set("pedido_minimo_kg", parseFloat(e.target.value))} />
            </Field>
            <Field label="Taxa Frete / km (R$)" hint="Cobrado por km acima do frete grátis">
              <input className="input-field" type="number" step="0.01"
                value={val("taxa_frete_por_km")} onChange={(e) => set("taxa_frete_por_km", parseFloat(e.target.value))} />
            </Field>
            <Field label="KM com Frete Grátis" hint="Distância isenta de cobrança">
              <input className="input-field" type="number" step="1"
                value={val("km_frete_gratis")} onChange={(e) => set("km_frete_gratis", parseFloat(e.target.value))} />
            </Field>
            <Field label="Frete Grátis Acima de (R$)" hint="Valor do pedido que isenta o frete">
              <input className="input-field" type="number" step="0.01"
                value={val("frete_gratis_acima")} onChange={(e) => set("frete_gratis_acima", parseFloat(e.target.value))} />
            </Field>
          </div>
        </Section>

        {/* Preços por kg */}
        <Section title="Preços por Kg" icon={Package}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Preço/kg — Fardo 30kg (R$)" hint="Total: R$ {preço × 30}">
              <input className="input-field" type="number" step="0.01"
                value={val("preco_kg_fardo_30")} onChange={(e) => set("preco_kg_fardo_30", parseFloat(e.target.value))} />
              <p className="text-brand-300 text-xs mt-1 font-medium">
                Total do fardo: R$ {(Number(val("preco_kg_fardo_30")) * 30).toFixed(2)}
              </p>
            </Field>
            <Field label="Preço/kg — Fardo 50kg (R$)">
              <input className="input-field" type="number" step="0.01"
                value={val("preco_kg_fardo_50")} onChange={(e) => set("preco_kg_fardo_50", parseFloat(e.target.value))} />
              <p className="text-brand-300 text-xs mt-1 font-medium">
                Total do fardo: R$ {(Number(val("preco_kg_fardo_50")) * 50).toFixed(2)}
              </p>
            </Field>
          </div>
        </Section>

        {/* Descontos por Volume */}
        <Section title="Descontos por Volume" icon={Percent}>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Desconto acima de 100kg (%)" hint="Aplicado sobre o subtotal">
              <input className="input-field" type="number" step="0.1" min="0" max="50"
                value={val("desconto_acima_100kg")} onChange={(e) => set("desconto_acima_100kg", parseFloat(e.target.value))} />
            </Field>
            <Field label="Desconto acima de 200kg (%)">
              <input className="input-field" type="number" step="0.1" min="0" max="50"
                value={val("desconto_acima_200kg")} onChange={(e) => set("desconto_acima_200kg", parseFloat(e.target.value))} />
            </Field>
            <Field label="Desconto acima de 500kg (%)">
              <input className="input-field" type="number" step="0.1" min="0" max="50"
                value={val("desconto_acima_500kg")} onChange={(e) => set("desconto_acima_500kg", parseFloat(e.target.value))} />
            </Field>
          </div>
        </Section>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <div className="flex items-center gap-2 text-green-300 text-sm animate-fade-in">
              <CheckCircle className="w-4 h-4" /> Configurações salvas!
            </div>
          )}
          <button type="submit" className="btn-brand flex items-center gap-2" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar Configurações
          </button>
        </div>
      </form>
    </div>
  );
}
