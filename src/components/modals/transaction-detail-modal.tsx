"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Transacao } from "@/features/admin/components/types";
import { X } from "lucide-react";

interface TransactionDetailModalProps {
  transacao: Transacao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailModal({ transacao, open, onOpenChange }: TransactionDetailModalProps) {
  if (!transacao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalhes da Transação</DialogTitle>
          <DialogDescription>
            Informações completas da transação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Valor</span>
              <span className="text-lg font-bold">{formatCurrency(transacao.valor)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Tipo</span>
              <span className="text-sm capitalize">{transacao.tipo}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Estado</span>
              <Badge variant="outline">{transacao.estado || "concluído"}</Badge>
            </div>

            {transacao.descricao && (
              <div className="grid gap-2">
                <span className="text-sm font-medium text-muted-foreground">Descrição</span>
                <p className="text-sm">{transacao.descricao}</p>
              </div>
            )}

            {transacao.metodoPagamento && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Método de Pagamento</span>
                <span className="text-sm capitalize">{transacao.metodoPagamento}</span>
              </div>
            )}

            {transacao.user && (
              <div className="grid gap-2">
                <span className="text-sm font-medium text-muted-foreground">Utilizador</span>
                <p className="text-sm">{transacao.user.nome}</p>
                <p className="text-sm text-muted-foreground">{transacao.user.email}</p>
              </div>
            )}

            <div className="grid gap-2">
              <span className="text-sm font-medium text-muted-foreground">Data/Hora</span>
              <p className="text-sm">{formatDate(transacao.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
