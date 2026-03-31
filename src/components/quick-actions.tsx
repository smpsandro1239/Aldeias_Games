"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Gamepad2, 
  DollarSign,
  Ticket,
  Settings,
  Building2,
  Trophy,
  LayoutDashboard
} from "lucide-react";

interface QuickActionsProps {
  role?: string;
}

const actionConfigs = {
  super_admin: [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "bg-primary/20 text-primary", path: "/admindashboard" },
    { key: "criar_aldeia", label: "Criar Aldeia", icon: Building2, color: "bg-secondary/20 text-secondary", path: "/admindashboard" },
    { key: "ver_aldeias", label: "Ver Aldeias", icon: Building2, color: "bg-tertiary/20 text-tertiary", path: "/admindashboard" },
    { key: "config", label: "Configurações", icon: Settings, color: "bg-surface-container-highest text-on-surface", path: "/configuracoes" },
  ],
  aldeia_admin: [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "bg-primary/20 text-primary", path: "/admindashboard" },
    { key: "criar_evento", label: "Criar Evento", icon: Calendar, color: "bg-secondary/20 text-secondary", path: "/admindashboard" },
    { key: "criar_jogo", label: "Criar Jogo", icon: Gamepad2, color: "bg-tertiary/20 text-tertiary", path: "/admindashboard" },
    { key: "ver_vencedores", label: "Vencedores", icon: Trophy, color: "bg-primary/20 text-primary", path: "/admindashboard" },
  ],
  vendedor: [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "bg-primary/20 text-primary", path: "/vendedordashboard" },
    { key: "nova_venda", label: "Nova Venda", icon: DollarSign, color: "bg-secondary/20 text-secondary", path: "/vendedordashboard" },
    { key: "historico", label: "Histórico", icon: Ticket, color: "bg-tertiary/20 text-tertiary", path: "/vendedordashboard" },
    { key: "metas", label: "Metas", icon: Trophy, color: "bg-primary/20 text-primary", path: "/vendedordashboard" },
  ],
  user: [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "bg-primary/20 text-primary", path: "/clientedashboard" },
    { key: "ver_jogos", label: "Ver Jogos", icon: Gamepad2, color: "bg-secondary/20 text-secondary", path: "/jogos" },
    { key: "participacoes", label: "Participações", icon: Ticket, color: "bg-tertiary/20 text-tertiary", path: "/clientedashboard" },
    { key: "perfil", label: "Perfil", icon: Settings, color: "bg-surface-container-highest text-on-surface", path: "/perfil" },
  ],
};

export function QuickActions({ role }: QuickActionsProps) {
  const router = useRouter();
  const actions = actionConfigs[role as keyof typeof actionConfigs] || actionConfigs.user;

  const handleAction = (path: string) => {
    if (path) {
      router.push(path);
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
            onClick={() => handleAction(action.path)}
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
