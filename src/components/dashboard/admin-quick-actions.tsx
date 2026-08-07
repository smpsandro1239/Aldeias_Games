import { QuickAction } from "@/components/dashboard/quick-action";
import {
  Calendar, Wallet, Users, Shield, BarChart3, Ticket, HandCoins,
  Gamepad2, ClipboardList, Settings,
} from "lucide-react";

interface AdminQuickActionsProps {
  pendingCount: number;
  onNovoEvento: () => void;
  onNovoJogo: () => void;
  onNumeros: () => void;
  onCofre: () => void;
  onFinanceiro: () => void;
  onUtilizadores: () => void;
  onPedidos: () => void;
  onPedidosPendentes: () => void;
  onAuditoria: () => void;
  onConfiguracoes: () => void;
}

export function AdminQuickActions({
  pendingCount,
  onNovoEvento,
  onNovoJogo,
  onNumeros,
  onCofre,
  onFinanceiro,
  onUtilizadores,
  onPedidos,
  onPedidosPendentes,
  onAuditoria,
  onConfiguracoes,
}: AdminQuickActionsProps) {
  return (
    <div>
      <h2 className="font-serif text-lg font-semibold text-accent mb-3">Ações Rápidas</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction
          icon={<Calendar className="h-5 w-5" />}
          label="Novo Evento"
          onClick={onNovoEvento}
          color="blue"
        />
        <QuickAction
          icon={<Gamepad2 className="h-5 w-5" />}
          label="Novo Jogo"
          onClick={onNovoJogo}
          color="green"
        />
        <QuickAction
          icon={<Ticket className="h-5 w-5" />}
          label="Números"
          onClick={onNumeros}
          color="violet"
        />
        <QuickAction
          icon={<Wallet className="h-5 w-5" />}
          label="Cofre"
          onClick={onCofre}
          color="emerald"
        />
        <QuickAction
          icon={<BarChart3 className="h-5 w-5" />}
          label="Financeiro"
          onClick={onFinanceiro}
          color="amber"
        />
        <QuickAction
          icon={<Users className="h-5 w-5" />}
          label="Utilizadores"
          onClick={onUtilizadores}
          color="blue"
        />
        <QuickAction
          icon={<HandCoins className="h-5 w-5" />}
          label="Pedidos"
          onClick={onPedidos}
          color="orange"
        />
        <QuickAction
          icon={<ClipboardList className="h-5 w-5" />}
          label="Pedidos Pendentes"
          onClick={onPedidosPendentes}
          color="amber"
          badge={pendingCount}
        />
        <QuickAction
          icon={<Shield className="h-5 w-5" />}
          label="Auditoria"
          onClick={onAuditoria}
          color="violet"
        />
        <QuickAction
          icon={<Settings className="h-5 w-5" />}
          label="Configurações"
          onClick={onConfiguracoes}
          color="violet"
        />
      </div>
    </div>
  );
}
