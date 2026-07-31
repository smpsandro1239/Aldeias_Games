"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Transacao } from "@/features/admin/components/types";
import { X, Receipt } from "lucide-react";

interface TransactionDetailModalProps {
  transacao: Transacao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailModal({ transacao, open, onOpenChange }: TransactionDetailModalProps) {
  if (!transacao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" aria-describedby="transaction-detail-description">
        <DialogHeader className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-blue-500/20">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-blue-600/20 p-2 rounded-lg">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            Detalhes da Transação
          </DialogTitle>
          <DialogDescription id="transaction-detail-description">
            Informações completas da transação #{transacao.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Valor</span>
              <span className="text-lg font-bold" aria-label={`Valor da transação: ${formatCurrency(transacao.valor)}`}>
                {formatCurrency(transacao.valor)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Tipo</span>
              <span className="text-sm capitalize" aria-label={`Tipo de transação: ${transacao.tipo}`}>
                {transacao.tipo}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Estado</span>
              <Badge variant="outline" aria-label={`Estado da transação: ${transacao.estado || "concluído"}`}>
                {transacao.estado || "concluído"}
              </Badge>
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
                <span className="text-sm capitalize" aria-label={`Método de pagamento: ${transacao.metodoPagamento}`}>
                  {transacao.metodoPagamento}
                </span>
              </div>
            )}

            {transacao.user && (
              <div className="grid gap-2">
                <span className="text-sm font-medium text-muted-foreground">Utilizador</span>
                <p className="text-sm" aria-label={`Nome do utilizador: ${transacao.user.nome}`}>
                  {transacao.user.nome}
                </p>
                <p className="text-sm text-muted-foreground" aria-label={`Email do utilizador: ${transacao.user.email}`}>
                  {transacao.user.email}
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <span className="text-sm font-medium text-muted-foreground">Data/Hora</span>
              <p className="text-sm" aria-label={`Data e hora da transação: ${formatDate(transacao.createdAt)}`}>
                {formatDate(transacao.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} aria-label="Fechar modal de detalhes da transação">
            <X className="h-4 w-4 mr-2" aria-hidden="true" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}