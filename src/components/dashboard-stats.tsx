"use client";

import { Card, CardContent } from "@/components/ui/card";
import { 
  DollarSign, 
  Users, 
  Calendar, 
  Gamepad2, 
  TrendingUp, 
  Trophy,
  Target,
  Building2,
  Wallet,
  Award,
  CreditCard,
  BarChart3
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DashboardStatsProps {
  role?: string;
  stats?: {
    totalAngariado?: number;
    totalParticipacoes?: number;
    eventosAtivos?: number;
    jogosAtivos?: number;
    vendasHoje?: number;
    valorHoje?: number;
    vendasTotal?: number;
    valorTotal?: number;
    comissaoTotal?: number;
    saldo?: number;
    vitorias?: number;
    totalGasto?: number;
    metaVendas?: number;
    vendasMeta?: number;
  };
}

// Icons aliases
const ShoppingCart = TrendingUp;
const Ticket = Award;

const statConfigs = {
  super_admin: [
    { key: "totalAngariado", label: "Total Angariado", icon: DollarSign, color: "text-primary", format: "currency" },
    { key: "totalParticipacoes", label: "Jogadores", icon: Users, color: "text-secondary" },
    { key: "eventosAtivos", label: "Eventos Ativos", icon: Calendar, color: "text-tertiary" },
    { key: "jogosAtivos", label: "Jogos Ativos", icon: Gamepad2, color: "text-primary" },
  ],
  aldeia_admin: [
    { key: "totalAngariado", label: "Angariado", icon: DollarSign, color: "text-primary", format: "currency" },
    { key: "totalParticipacoes", label: "Participantes", icon: Users, color: "text-secondary" },
    { key: "valorHoje", label: "Vendas Hoje", icon: TrendingUp, color: "text-tertiary", format: "currency" },
    { key: "eventosAtivos", label: "Eventos Ativos", icon: Calendar, color: "text-primary" },
  ],
  vendedor: [
    { key: "vendasHoje", label: "Vendas Hoje", icon: ShoppingCart, color: "text-secondary" },
    { key: "valorHoje", label: "Valor Hoje", icon: DollarSign, color: "text-primary", format: "currency" },
    { key: "comissaoTotal", label: "Comissão", icon: Target, color: "text-tertiary", format: "currency" },
    { key: "vendasTotal", label: "Total Vendas", icon: TrendingUp, color: "text-primary" },
  ],
  user: [
    { key: "saldo", label: "Saldo", icon: Wallet, color: "text-secondary", format: "currency" },
    { key: "totalParticipacoes", label: "Participações", icon: Ticket, color: "text-primary" },
    { key: "vitorias", label: "Vitórias", icon: Trophy, color: "text-tertiary" },
    { key: "totalGasto", label: "Total Gasto", icon: CreditCard, color: "text-primary", format: "currency" },
  ],
};

export function DashboardStats({ role, stats = {} }: DashboardStatsProps) {
  const config = statConfigs[role as keyof typeof statConfigs] || statConfigs.user;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {config.map((stat, index) => {
        const Icon = stat.icon;
        const value = stats[stat.key as keyof typeof stats];
        const displayValue = stat.format === "currency" && typeof value === "number" 
          ? formatCurrency(value)
          : value || 0;

        return (
          <Card 
            key={stat.key} 
            className={`
              bg-surface-container-high border-none overflow-hidden
              ${index === 0 ? 'ring-1 ring-primary/30' : 'ring-1 ring-outline-variant/10'}
            `}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                  {stat.label}
                </span>
                <div className={`p-1.5 rounded-lg bg-surface-container-highest ${stat.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <p className={`text-xl md:text-2xl font-bold font-headline ${stat.color}`}>
                {displayValue}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
