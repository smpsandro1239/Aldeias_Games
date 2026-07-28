"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface ReceiptViewProps {
  lastSale: {
    jogoId: string;
    quantidade: number;
    metodoPagamento: string;
    dadosCliente?: { nome: string; telefone?: string; email?: string };
    total: number;
    timestamp: string;
  };
  jogoNome: string;
  onNewSale: () => void;
}

export function ReceiptView({ lastSale, jogoNome, onNewSale }: ReceiptViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onNewSale}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-foreground rounded-2xl p-6 max-w-sm w-full text-primary-foreground shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6 pb-4 border-b border-gray-200">
          <h3 className="font-bold text-lg">Aldeias Games</h3>
          <p className="text-xs text-gray-500">Comprovativo de Venda</p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Produto:</span>
            <span className="font-medium">{jogoNome}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Quantidade:</span>
            <span className="font-medium">{lastSale.quantidade}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cliente:</span>
            <span className="font-medium">{lastSale.dadosCliente?.nome || "Não identificado"}</span>
          </div>
          {lastSale.dadosCliente?.telefone && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Telefone:</span>
              <span className="font-medium">{lastSale.dadosCliente.telefone}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Pagamento:</span>
            <span className="font-medium capitalize">{lastSale.metodoPagamento}</span>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="font-bold text-lg">Total:</span>
            <span className="font-bold text-lg text-primary">{formatCurrency(lastSale.total)}</span>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground mb-4">
          {formatDateTime(lastSale.timestamp)}
        </div>

        <Button
          onClick={onNewSale}
          className="w-full bg-primary hover:bg-primary/90 text-foreground font-bold"
        >
          Nova Venda
        </Button>
      </motion.div>
    </motion.div>
  );
}
