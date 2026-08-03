"use client";
import { Send, ArrowUpFromLine, Scale, History } from "lucide-react";
import { QuickAction } from "./quick-action";

export function CofreQuickActions({
  onDepositar,
  onLevantar,
  onReconciliacao,
  onMovimentos,
}: {
  onDepositar: () => void;
  onLevantar: () => void;
  onReconciliacao: () => void;
  onMovimentos: () => void;
}) {
  return (
    <div>
      <h2 className="font-serif text-lg font-semibold text-accent mb-3">Ações Rápidas</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickAction
          icon={<Send className="w-5 h-5" />}
          label="Depositar no Cofre"
          onClick={onDepositar}
          color="emerald"
        />
        <QuickAction
          icon={<ArrowUpFromLine className="w-5 h-5" />}
          label="Solicitar Levantamento"
          onClick={onLevantar}
          color="violet"
        />
        <QuickAction
          icon={<Scale className="w-5 h-5" />}
          label="Reconciliação"
          onClick={onReconciliacao}
          color="blue"
        />
        <QuickAction
          icon={<History className="w-5 h-5" />}
          label="Movimentos"
          onClick={onMovimentos}
          color="orange"
        />
      </div>
    </div>
  );
}
