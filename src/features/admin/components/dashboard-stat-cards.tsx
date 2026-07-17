"use client";

import { StatCard } from "@/components/ui/StatCard";
import { DollarSign, Users, Calendar, Gamepad2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Stats } from "./types";

interface DashboardStatCardsProps {
  stats: Stats | null;
}

export function DashboardStatCards({ stats }: DashboardStatCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Angariado"
        value={stats?.totalAngariado ? formatCurrency(stats.totalAngariado) : "0,00 €"}
        variant="emerald"
        icon={DollarSign}
      />
      <StatCard
        title="Participações"
        value={stats?.totalParticipacoes?.toLocaleString("pt-PT") || "0"}
        variant="blue"
        icon={Users}
      />
      <StatCard
        title="Eventos Ativos"
        value={stats?.eventosAtivos?.toString() || "0"}
        variant="violet"
        icon={Calendar}
      />
      <StatCard
        title="Jogos Ativos"
        value={stats?.jogosAtivos?.toString() || "0"}
        variant="amber"
        icon={Gamepad2}
      />
    </div>
  );
}
