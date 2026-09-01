"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Settings,
  Megaphone,
  Coffee,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/pedidos", icon: ShoppingCart, label: "Pedidos" },
  { href: "/clientes", icon: Users, label: "Clientes" },
  { href: "/marketing", icon: Megaphone, label: "Marketing IA" },
  { href: "/configuracoes", icon: Settings, label: "Configurações" },
];

export function Sidebar() {
  const path = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-coffee-dark/80 backdrop-blur-xl border-r border-white/10 h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-glow">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-lg leading-none">AntEx</div>
            <div className="text-white/40 text-xs mt-0.5">Café Arábico B2B</div>
          </div>
        </div>
      </div>

      {/* Agent Status */}
      <div className="mx-4 mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </span>
        <span className="text-green-300 text-xs font-medium">Agente ativo</span>
        <Zap className="w-3.5 h-3.5 text-green-400 ml-auto" />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 mt-2">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn("sidebar-link", path.startsWith(href) && "active")}
          >
            <Icon className="w-4.5 h-4.5" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <p className="text-white/25 text-xs text-center">
          AntEx v1.0 · GPT-4o
        </p>
      </div>
    </aside>
  );
}
