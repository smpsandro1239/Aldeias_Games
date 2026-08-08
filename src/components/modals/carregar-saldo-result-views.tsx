"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Check, AlertTriangle, User } from "lucide-react";
import { CarregamentoResult, PedidoResult } from "./carregar-saldo-types";

interface PedidoEnviadoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: PedidoResult;
  onFechar: () => void;
}

export function PedidoEnviadoView({ open, onOpenChange, result, onFechar }: PedidoEnviadoProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-surface-container border border-outline-variant/10 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 text-center">
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-orange-500" aria-hidden="true" />
          </div>
          <DialogTitle className="font-headline text-xl text-orange-500">
            Pedido Enviado!
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="bg-surface-container-high rounded-xl p-4 text-center">
            <p className="text-xs text-on-surface-variant">Valor Pedido</p>
            <p className="font-headline text-4xl text-primary">{result.valor}€</p>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
            <p className="text-xs text-orange-500 font-medium flex items-center gap-2">
              <User className="w-4 h-4" aria-hidden="true" />
              Vendedor: {result.vendedor.nome}
            </p>
            <p className="text-xs text-orange-500/80 mt-1">
              O vendedor foi notificado e vai receber o seu pedido. Quando ele confirmar a receção do dinheiro, o saldo será adicionado à sua conta.
            </p>
          </div>

          <Button
            onClick={onFechar}
            className="w-full"
            aria-label="Fechar modal"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CarregamentoRegistadoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: CarregamentoResult;
  saldo: number;
  onFechar: () => void;
}

export function CarregamentoRegistadoView({ open, onOpenChange, result, saldo, onFechar }: CarregamentoRegistadoProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-surface-container border border-outline-variant/10 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <DialogTitle className="font-headline text-xl text-primary">
            Carregamento Registado!
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          <div className="bg-surface-container-high rounded-xl p-4 text-center">
            <p className="text-xs text-on-surface-variant">Novo Saldo</p>
            <p className="font-headline text-4xl text-primary">{result.saldoAtual?.toFixed(2) || saldo.toFixed(2)}€</p>
          </div>

          <div className="bg-accent/10 border border-accent/20 rounded-xl p-3">
            <p className="text-xs text-accent font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              Importante
            </p>
            <p className="text-xs text-accent/80 mt-1">
              Todos os administradores foram notificados. O registro detalhado foi guardado no sistema.
            </p>
          </div>

          <div className="text-xs text-on-surface-variant space-y-1">
            <p><strong>Vendedor:</strong> {result.vendedor?.nome}</p>
            <p><strong>Data:</strong> {new Date(result.dataHora).toLocaleString("pt-PT")}</p>
            <p><strong>Método:</strong> {result.metodoPagamento}</p>
          </div>

          <Button
            onClick={onFechar}
            className="w-full"
            aria-label="Fechar modal"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}