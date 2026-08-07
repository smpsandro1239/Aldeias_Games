import { QuickAction } from "@/components/dashboard/quick-action";
import {
  Building2, Calendar, Wallet, Globe, RotateCcw,
  Users, Gamepad2, Shield, BarChart3, Ticket, ClipboardList,
} from "lucide-react";

interface SuperQuickActionsProps {
  pendingCount: number;
  onNovaAldeia: () => void;
  onNovoEvento: () => void;
  onNovoJogo: () => void;
  onCofreGlobal: () => void;
  onNumeros: () => void;
  onFinanceiro: () => void;
  onLotariaExterna: () => void;
  onRecorrentes: () => void;
  onUtilizadores: () => void;
  onPedidosPendentes: () => void;
  onAuditoria: () => void;
}

export function SuperQuickActions({
  pendingCount,
  onNovaAldeia,
  onNovoEvento,
  onNovoJogo,
  onCofreGlobal,
  onNumeros,
  onFinanceiro,
  onLotariaExterna,
  onRecorrentes,
  onUtilizadores,
  onPedidosPendentes,
  onAuditoria,
}: SuperQuickActionsProps) {
  return (
    <div>
      <h2 className="font-serif text-lg font-semibold text-accent mb-3">Ações Rápidas</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction
          icon={<Building2 className="h-5 w-5" />}
          label="Nova Aldeia"
          onClick={onNovaAldeia}
          color="violet"
        />
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
          icon={<Wallet className="h-5 w-5" />}
          label="Cofre Global"
          onClick={onCofreGlobal}
          color="emerald"
        />
        <QuickAction
          icon={<Ticket className="h-5 w-5" />}
          label="Números"
          onClick={onNumeros}
          color="pink"
        />
        <QuickAction
          icon={<BarChart3 className="h-5 w-5" />}
          label="Financeiro"
          onClick={onFinanceiro}
          color="amber"
        />
        <QuickAction
          icon={<Globe className="h-5 w-5" />}
          label="Lotaria Externa"
          onClick={onLotariaExterna}
          color="pink"
        />
        <QuickAction
          icon={<RotateCcw className="h-5 w-5" />}
          label="Recorrentes"
          onClick={onRecorrentes}
          color="orange"
        />
        <QuickAction
          icon={<Users className="h-5 w-5" />}
          label="Utilizadores"
          onClick={onUtilizadores}
          color="blue"
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
      </div>
    </div>
  );
}
