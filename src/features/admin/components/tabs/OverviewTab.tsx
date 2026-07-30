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
  Eye,
  Activity,
  Target,
  Award,
  TrendingUp,
  ArrowRight,
  Clock,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Evento, Jogo, Stats } from "../types";

interface OverviewTabProps {
  stats: Stats | null;
  eventos: Evento[];
  setSelectedEvento: (evento: Evento | null) => void;
  setEventoModalOpen: (open: boolean) => void;
  setJogoModalOpen: (open: boolean) => void;
  setSelectedEventoIdParaJogo?: (id: string) => void;
  getEstadoBadge: (estado: string) => React.ReactNode;
  userRole?: string;
}

export function OverviewTab({
  stats,
  eventos,
  setSelectedEvento,
  setEventoModalOpen,
  setJogoModalOpen,
  setSelectedEventoIdParaJogo,
  getEstadoBadge,
  userRole = "aldeia_admin",
}: OverviewTabProps) {
  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Button onClick={() => setEventoModalOpen(true)} className="bg-primary hover:bg-primary/90 w-full shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
          <Plus className="h-4 w-4 mr-2" /> Novo Evento
        </Button>
        <Button onClick={() => {
          if (!eventos.length) {
            toast.error("Crie um evento primeiro");
            return;
          }
          setSelectedEventoIdParaJogo?.(eventos[0].id);
          setJogoModalOpen(true);
        }} variant="outline" className="border-primary/30 hover:bg-primary/10 w-full transition-all active:scale-[0.98]">
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
      <Card className="border-outline-variant/10 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-outline-variant/5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Eventos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {eventos.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Nenhum evento criado ainda.</p>
              </div>
            ) : (
              eventos.slice(0, 3).map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all cursor-pointer group"
                  onClick={() => {
                    setSelectedEvento(ev);
                    setEventoModalOpen(true);
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-accent truncate">{ev.nome}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {formatDate(ev.dataInicio)} — {formatDate(ev.dataFim)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-3 shrink-0 flex flex-col items-end gap-1">
                    {getEstadoBadge(ev.estado)}
                    <p className="text-sm font-bold text-emerald-500">{formatCurrency(ev.totalAngariado || 0)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
