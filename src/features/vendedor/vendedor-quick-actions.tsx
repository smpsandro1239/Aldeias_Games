"use client";
import { TrendingUp, ShoppingCart, Send, BarChart3, Wallet, Hash, Banknote } from "lucide-react";
import { QuickAction } from "@/components/dashboard/quick-action";

interface VendedorQuickActionsProps {
  pedidosPendentesCount: number;
  onGeral: () => void;
  onJogos: () => void;
  onPedidos: () => void;
  onAngariacao: () => void;
  onCaixa: () => void;
  onHistorico: () => void;
  onVerificar: () => void;
  onDepositar: () => void;
  onPedirSaldo: () => void;
}

export function VendedorQuickActions({
  pedidosPendentesCount,
  onGeral,
  onJogos,
  onPedidos,
  onAngariacao,
  onCaixa,
  onHistorico,
  onVerificar,
  onDepositar,
  onPedirSaldo,
}: VendedorQuickActionsProps) {
  return (
    <div>
      <h2 className="font-serif text-lg font-semibold text-accent mb-3">Ações Rápidas</h2>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
        <QuickAction
          icon={<TrendingUp className="h-5 w-5" />}
          label="Geral"
          onClick={onGeral}
          color="emerald"
        />
        <QuickAction
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Jogos"
          onClick={onJogos}
          color="blue"
        />
        <QuickAction
          icon={<Send className="h-5 w-5" />}
          label="Pedidos"
          onClick={onPedidos}
          color="orange"
          badge={pedidosPendentesCount > 0 ? pedidosPendentesCount : undefined}
        />
        <QuickAction
          icon={<BarChart3 className="h-5 w-5" />}
          label="Angariação"
          onClick={onAngariacao}
          color="violet"
        />
        <QuickAction
          icon={<Wallet className="h-5 w-5" />}
          label="Caixa"
          onClick={onCaixa}
          color="amber"
        />
        <QuickAction
          icon={<TrendingUp className="h-5 w-5" />}
          label="Histórico"
          onClick={onHistorico}
          color="green"
        />
        <QuickAction
          icon={<Hash className="h-5 w-5" />}
          label="Verificar"
          onClick={onVerificar}
          color="pink"
        />
        <QuickAction
          icon={<Banknote className="h-5 w-5" />}
          label="Depositar"
          onClick={onDepositar}
          color="cyan"
        />
        <QuickAction
          icon={<Send className="h-5 w-5" />}
          label="Pedir Saldo"
          onClick={onPedirSaldo}
          color="orange"
        />
      </div>
    </div>
  );
}