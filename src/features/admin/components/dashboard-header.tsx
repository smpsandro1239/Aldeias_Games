"use client";

import { Button } from "@/components/ui/button";
import { Plus, Globe, RotateCcw } from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";

interface DashboardHeaderProps {
  userRole: string;
  aldeia?: { nome: string };
  onOpenEventoModal: () => void;
  onOpenAldeiaModal: () => void;
  onProcessRecurring: () => void;
  onOpenResultadosExternos: () => void;
}

export function DashboardHeader({
  userRole,
  aldeia,
  onOpenEventoModal,
  onOpenAldeiaModal,
  onProcessRecurring,
  onOpenResultadosExternos,
}: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">
          {userRole === "super_admin"
            ? "Painel Global"
            : userRole === "aldeia_admin"
            ? "O Meu Painel"
            : "Dashboard"}
        </h1>
        {userRole === "aldeia_admin" && aldeia && (
          <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full">
            {aldeia.nome}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full sm:w-auto">
          {userRole === "super_admin" && (
            <Button variant="outline" onClick={onOpenAldeiaModal}>
              <Plus className="h-4 w-4 mr-2" /> Nova Aldeia
            </Button>
          )}
          <Button onClick={onOpenEventoModal} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" /> Novo Evento
          </Button>
          <Button
            variant="outline"
            onClick={onProcessRecurring}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="h-4 w-4 mr-2" /> Processar Recorrentes
          </Button>
          <Button
            variant="outline"
            onClick={onOpenResultadosExternos}
            className="w-full sm:w-auto"
          >
            <Globe className="h-4 w-4 mr-2" /> Lotaria Externa
          </Button>
        </div>
      </div>
    </div>
  );
}
