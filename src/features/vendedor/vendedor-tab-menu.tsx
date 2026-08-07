"use client";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ShoppingCart, Send, BarChart3, Wallet, History, Hash, Banknote } from "lucide-react";

interface VendedorTabMenuProps {
  pedidosPendentesCount: number;
  onJogos: () => void;
  onVerificar: () => void;
  onDepositar: () => void;
  onPedirSaldo: () => void;
}

export function VendedorTabMenu({
  pedidosPendentesCount,
  onJogos,
  onVerificar,
  onDepositar,
  onPedirSaldo,
}: VendedorTabMenuProps) {
  return (
    <div className="pt-2">
      <TabsList className="flex overflow-x-auto gap-1 bg-surface-container-low p-1 rounded-xl">
        <TabsTrigger value="overview" className="flex items-center gap-1.5 text-sm px-3 py-2">
          <TrendingUp className="h-4 w-4" /> Geral
        </TabsTrigger>
        <button onClick={onJogos} className="flex items-center gap-1.5 text-sm px-3 py-2 hover:bg-surface-container-high rounded-md transition-colors">
          <ShoppingCart className="h-4 w-4" /> Jogos
        </button>
        <TabsTrigger value="pedidos" className="relative flex items-center gap-1.5 text-sm px-3 py-2">
          <Send className="h-4 w-4" /> Pedidos
          {pedidosPendentesCount > 0 && (
            <Badge className="ml-1 h-5 min-w-5 p-0 flex items-center justify-center bg-destructive text-white text-xs">
              {pedidosPendentesCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="angariacao" className="flex items-center gap-1.5 text-sm px-3 py-2">
          <BarChart3 className="h-4 w-4" /> Angariação
        </TabsTrigger>
        <TabsTrigger value="cofre" className="flex items-center gap-1.5 text-sm px-3 py-2">
          <Wallet className="h-4 w-4" /> Caixa
        </TabsTrigger>
        <TabsTrigger value="historico" className="flex items-center gap-1.5 text-sm px-3 py-2">
          <History className="h-4 w-4" /> Histórico
        </TabsTrigger>
        <button onClick={onVerificar} className="flex items-center gap-1.5 text-sm px-3 py-2 hover:bg-surface-container-high rounded-md transition-colors">
          <Hash className="h-4 w-4" /> Verificar
        </button>
        <button onClick={onDepositar} className="flex items-center gap-1.5 text-sm px-3 py-2 hover:bg-surface-container-high rounded-md transition-colors">
          <Banknote className="h-4 w-4" /> Depositar
        </button>
        <button onClick={onPedirSaldo} className="flex items-center gap-1.5 text-sm px-3 py-2 hover:bg-surface-container-high rounded-md transition-colors">
          <Send className="h-4 w-4" /> Pedir Saldo
        </button>
      </TabsList>
    </div>
  );
}