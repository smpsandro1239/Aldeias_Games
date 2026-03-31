"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Calendar, 
  Gamepad2, 
  Users, 
  DollarSign,
  Ticket,
  Settings,
  Building2,
  BarChart3,
  Edit,
  Trash2,
  Eye,
  Play,
  Trophy,
  UserPlus,
  QrCode
} from "lucide-react";
import { toast } from "sonner";

interface QuickActionsProps {
  role?: string;
  onOpenModal?: (modal: string, data?: any) => void;
}

const actionConfigs = {
  super_admin: [
    { key: "criar_aldeia", label: "Criar Aldeia", icon: Building2, color: "bg-primary/20 text-primary", action: "criarAldeia" },
    { key: "ver_aldeias", label: "Ver Aldeias", icon: Building2, color: "bg-secondary/20 text-secondary", action: "verAldeias" },
    { key: "analytics", label: "Analytics", icon: BarChart3, color: "bg-tertiary/20 text-tertiary", action: "verAnalytics" },
    { key: "config", label: "Configurações", icon: Settings, color: "bg-surface-container-highest text-on-surface", action: "config" },
  ],
  aldeia_admin: [
    { key: "criar_evento", label: "Criar Evento", icon: Calendar, color: "bg-primary/20 text-primary", action: "criarEvento" },
    { key: "criar_jogo", label: "Criar Jogo", icon: Gamepad2, color: "bg-secondary/20 text-secondary", action: "criarJogo" },
    { key: "ver_vendedores", label: "Vendedores", icon: Users, color: "bg-tertiary/20 text-tertiary", action: "verVendedores" },
    { key: "ver_vencedores", label: "Vencedores", icon: Trophy, color: "bg-primary/20 text-primary", action: "verVencedores" },
  ],
  vendedor: [
    { key: "nova_venda", label: "Nova Venda", icon: DollarSign, color: "bg-primary/20 text-primary", action: "novaVenda" },
    { key: "historico", label: "Histórico", icon: Ticket, color: "bg-secondary/20 text-secondary", action: "historico" },
    { key: "metas", label: "Metas", icon: Trophy, color: "bg-tertiary/20 text-tertiary", action: "metas" },
  ],
  user: [
    { key: "ver_jogos", label: "Ver Jogos", icon: Gamepad2, color: "bg-primary/20 text-primary", action: "verJogos" },
    { key: "participacoes", label: "Participações", icon: Ticket, color: "bg-secondary/20 text-secondary", action: "participacoes" },
    { key: "adicionar_saldo", label: "Adicionar Saldo", icon: DollarSign, color: "bg-tertiary/20 text-tertiary", action: "adicionarSaldo" },
    { key: "perfil", label: "Perfil", icon: Settings, color: "bg-surface-container-highest text-on-surface", action: "perfil" },
  ],
};

export function QuickActions({ role, onOpenModal }: QuickActionsProps) {
  const actions = actionConfigs[role as keyof typeof actionConfigs] || actionConfigs.user;

  const handleAction = (action: string) => {
    if (onOpenModal) {
      onOpenModal(action);
    } else {
      toast.info(`Ação: ${action}`);
    }
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        
        return (
          <Button
            key={action.key}
            variant="ghost"
            onClick={() => handleAction(action.action)}
            className={`
              flex flex-col items-center justify-center gap-1 p-3 h-auto
              bg-surface-container-high/50 hover:bg-surface-container-high
              border border-outline-variant/10 rounded-2xl
              transition-all hover:scale-[1.02] active:scale-95
            `}
          >
            <div className={`p-2 rounded-xl ${action.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">
              {action.label}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
