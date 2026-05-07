"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/StatCard";
import {
  LayoutDashboard,
  Calendar,
  Gamepad2,
  Users,
  DollarSign,
  Plus,
  Eye
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Evento, Jogo, Stats } from "../types";

interface OverviewTabProps {
  stats: Stats | null;
  eventos: Evento[];
  setSelectedEvento: (evento: Evento | null) => void;
  setEventoModalOpen: (open: boolean) => void;
  setJogoModalOpen: (open: boolean) => void;
  getEstadoBadge: (estado: string) => React.ReactNode;
  userRole?: string;
}

export function OverviewTab({
  stats,
  eventos,
  setSelectedEvento,
  setEventoModalOpen,
  setJogoModalOpen,
  getEstadoBadge,
  userRole = "aldeia_admin",
}: OverviewTabProps) {
  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Button onClick={() => setEventoModalOpen(true)} className="bg-primary hover:bg-primary/90 w-full">
          <Plus className="h-4 w-4 mr-2" /> Novo Evento
        </Button>
        <Button onClick={() => setJogoModalOpen(true)} variant="outline" className="border-primary/30 w-full">
          <Gamepad2 className="h-4 w-4 mr-2" /> Novo Jogo
        </Button>
        <Button variant="outline" className="border-primary/30 w-full" disabled>
          <Eye className="h-4 w-4 mr-2" /> Visualizar
        </Button>
        <Button variant="outline" className="border-primary/30 w-full" disabled>
          <Users className="h-4 w-4 mr-2" /> Vendedores
        </Button>
      </div>

      {/* Eventos Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {eventos.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum evento criado ainda.
              </p>
            ) : (
              eventos.slice(0, 3).map((ev) => (
                <div
                  key={ev.id}
                  className="flex justify-between items-center cursor-pointer hover:bg-accent/5 p-2 rounded -mx-2"
                  onClick={() => {
                    setSelectedEvento(ev);
                    setEventoModalOpen(true);
                  }}
                >
                  <div>
                    <p className="font-medium">{ev.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(ev.dataInicio)} - {formatDate(ev.dataFim)}
                    </p>
                  </div>
                  <div className="text-right">
                    {getEstadoBadge(ev.estado)}
                    <p className="text-sm font-semibold">{formatCurrency(ev.totalAngariado || 0)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Angariado"
          value={formatCurrency(stats?.totalAngariado || 0)}
          variant="emerald"
          icon={DollarSign}
        />
        <StatCard
          title="Participações"
          value={stats?.totalParticipacoes?.toLocaleString() || "0"}
          variant="blue"
          icon={Users}
        />
        <StatCard
          title="Eventos Ativos"
          value={stats?.eventosAtivos || 0}
          variant="violet"
          icon={Calendar}
        />
        <StatCard
          title="Jogos Ativos"
          value={stats?.jogosAtivos || 0}
          variant="amber"
          icon={Gamepad2}
        />
      </div>
    </div>
  );
}
