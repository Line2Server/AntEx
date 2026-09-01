import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { QueryProvider } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: "AntEx — Painel de Vendas | Café Arábico Premium",
  description:
    "Painel de gestão do Agente Vendedor de Café Arábico. Monitore pedidos, clientes, métricas e gere campanhas de marketing com IA.",
  keywords: ["café atacado", "café arábico", "agente de vendas", "whatsapp bot"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <QueryProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-gradient-to-br from-coffee-dark via-coffee-dark to-coffee-medium/20">
              <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
                {children}
              </div>
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
