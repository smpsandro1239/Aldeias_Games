"use client";

import { StatCard } from "@/components/ui/StatCard";
import { DollarSign, Users, Calendar, Gamepad2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Stats } from "./types";

interface DashboardStatCardsProps {
  stats: Stats | null;
  onNavigate?: (tab: string) => void;
}

export function DashboardStatCards({ stats, onNavigate }: DashboardStatCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Angariado"
        value={stats?.totalAngariado ? formatCurrency(stats.totalAngariado) : "0,00 €"}
        variant="emerald"
        icon={DollarSign}
        onClick={onNavigate ? () => onNavigate("financeiro") : undefined}
      />
      <StatCard
        title="Participações"
        value={stats?.totalParticipacoes?.toLocaleString("pt-PT") || "0"}
        variant="blue"
        icon={Users}
        onClick={onNavigate ? () => onNavigate("numeros") : undefined}
      />
      <StatCard
        title="Eventos Ativos"
        value={stats?.eventosAtivos?.toString() || "0"}
        variant="violet"
        icon={Calendar}
        onClick={onNavigate ? () => onNavigate("eventos") : undefined}
      />
      <StatCard
        title="Jogos Ativos"
        value={stats?.jogosAtivos?.toString() || "0"}
        variant="amber"
        icon={Gamepad2}
        onClick={onNavigate ? () => onNavigate("jogos") : undefined}
      />
    </div>
  );
}
