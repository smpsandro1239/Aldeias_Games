"use client";
import { ShoppingCart, TrendingUp, DollarSign, Banknote } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency } from "@/lib/utils";
import type { VendedorStats } from "./vendedor-types";

interface VendedorStatGridProps {
  stats?: VendedorStats | null;
  onNavigate: (tab: string) => void;
}

export function VendedorStatGrid({ stats, onNavigate }: VendedorStatGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <StatCard
        title="Vendas Hoje"
        value={`${stats?.vendasHoje || 0}`}
        subtitle={formatCurrency(stats?.valorHoje || 0)}
        icon={<ShoppingCart className="h-5 w-5" />}
        color="blue"
        onClick={() => onNavigate("vendas")}
      />
      <StatCard
        title="Vendas Totais"
        value={`${stats?.vendasTotal || 0}`}
        subtitle={formatCurrency(stats?.valorTotal || 0)}
        icon={<TrendingUp className="h-5 w-5" />}
        color="emerald"
        onClick={() => onNavigate("historico")}
      />
      <StatCard
        title="Comissão Total"
        value={formatCurrency(stats?.comissaoTotal || 0)}
        subtitle="Ganho acumulado"
        icon={<DollarSign className="h-5 w-5" />}
        color="violet"
        onClick={() => onNavigate("historico")}
      />
      <StatCard
        title="Saldo a Entregar"
        value={formatCurrency(stats?.aEntregar || 0)}
        subtitle="Dinheiro vivo retido"
        icon={<Banknote className="h-5 w-5" />}
        color="amber"
        onClick={() => onNavigate("cofre")}
      />
    </div>
  );
}