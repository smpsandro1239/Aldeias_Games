"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SuccessScreenProps {
  total: number;
  quantidade: number;
  jogoNome: string;
  onViewReceipt: () => void;
  onNewSale: () => void;
}

export function SuccessScreen({ total, quantidade, jogoNome, onViewReceipt, onNewSale }: SuccessScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto"
    >
      <div className="bg-gradient-to-b from-surface-container to-surface-container-low rounded-3xl p-8 text-center border border-green-500/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10 }}
          className="relative"
        >
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-primary" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2 font-serif italic">
            Venda Concluída!
          </h2>
          <p className="text-muted-foreground mb-6">
            {formatCurrency(total)} • {quantidade}x {jogoNome}
          </p>

          <div className="flex flex-col gap-3">
            <Button
              onClick={onViewReceipt}
              className="w-full bg-primary hover:bg-primary text-foreground font-bold"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Ver Recibo
            </Button>
            <Button
              onClick={onNewSale}
              variant="outline"
              className="w-full border-primary/30 text-primary hover:bg-primary/10"
            >
              Nova Venda
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
