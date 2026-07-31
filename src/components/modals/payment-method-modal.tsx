"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smartphone, Wallet, Phone, Receipt } from "lucide-react";

// Constants for payment methods
const PAYMENT_METHODS = {
  SALDO: 'saldo',
  MBWAY: 'mbway'
} as const;

type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

interface PaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  valor: number;
  descricao: string;
  saldoDisponivel: number;
  onMBWayPayment: (telefone: string) => Promise<void>;
  onSaldoPayment: () => Promise<void>;
}

export function PaymentMethodModal({
  open,
  onOpenChange,
  valor,
  descricao,
  saldoDisponivel,
  onMBWayPayment,
  onSaldoPayment,
}: PaymentMethodModalProps) {
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [metodo, setMetodo] = useState<PaymentMethod>(
    saldoDisponivel >= valor ? PAYMENT_METHODS.SALDO : PAYMENT_METHODS.MBWAY
  );

  const podeUsarSaldo = saldoDisponivel >= valor;

  const handleMBWaySubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onMBWayPayment(telefone);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [telefone, onMBWayPayment, onOpenChange]);

  const handleSaldoSubmit = useCallback(async () => {
    setLoading(true);
    try {
      await onSaldoPayment();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [onSaldoPayment, onOpenChange]);

  const handleMetodoChange = useCallback((value: string) => {
    setMetodo(value as PaymentMethod);
  }, []);

  const handleTelefoneChange = useCallback((value: string) => {
    setTelefone(value);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="payment-method-description">
        <DialogHeader className="bg-gradient-to-r from-slate-700/10 via-slate-800/10 to-slate-900/10 dark:from-slate-400/10 dark:via-slate-500/10 dark:to-slate-600/10 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-slate-500/20">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-slate-600/20 p-2 rounded-lg">
              <Wallet className="h-5 w-5 text-slate-600 dark:text-slate-300" aria-hidden="true" />
            </div>
            Escolher Método de Pagamento
          </DialogTitle>
          <DialogDescription id="payment-method-description">
            {descricao}
          </DialogDescription>
          <div className="inline-flex items-center gap-1.5 bg-slate-600/10 border border-slate-600/25 text-slate-700 dark:text-slate-300 text-sm font-bold px-3 py-1 rounded-full mt-2 w-fit">
            <Receipt className="h-4 w-4" aria-hidden="true" />
            Total: {valor.toFixed(2)}€
          </div>
        </DialogHeader>

        <Tabs value={metodo} onValueChange={handleMetodoChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            {podeUsarSaldo && (
              <TabsTrigger value={PAYMENT_METHODS.SALDO} aria-label="Pagar com saldo disponível">
                <Wallet className="h-4 w-4 mr-2" aria-hidden="true" />
                Saldo
              </TabsTrigger>
            )}
            <TabsTrigger value={PAYMENT_METHODS.MBWAY} aria-label="Pagar com MBWay">
              <Smartphone className="h-4 w-4 mr-2" aria-hidden="true" />
              MBWay
            </TabsTrigger>
          </TabsList>

          {podeUsarSaldo && (
            <TabsContent value={PAYMENT_METHODS.SALDO}>
              <div className="py-6 text-center space-y-4">
                <div className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="bg-primary/10 p-2 rounded-full mb-1">
                    <Wallet className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Saldo Disponível</span>
                  <span className={`text-3xl font-black ${podeUsarSaldo ? 'text-primary' : 'text-destructive'}`} aria-label={`Saldo disponível: ${saldoDisponivel.toFixed(2)} euros`}>
                    {saldoDisponivel.toFixed(2)}€
                  </span>
                </div>

                {podeUsarSaldo ? (
                  <p className="text-sm text-muted-foreground">
                    Ao confirmar, o valor será deduzido da sua carteira Aldeias.
                  </p>
                ) : (
                  <p className="text-sm text-destructive font-medium" role="alert">
                    Saldo insuficiente. Use MBWay.
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleSaldoSubmit}
                  disabled={loading || !podeUsarSaldo}
                  aria-label={`Pagar ${valor.toFixed(2)} euros com saldo`}
                >
                  {loading ? "A processar..." : "Pagar com Saldo"}
                </Button>
              </DialogFooter>
            </TabsContent>
          )}

          <TabsContent value={PAYMENT_METHODS.MBWAY}>
            <form onSubmit={handleMBWaySubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="telefone">Número de Telefone MBWay</Label>
                  <div className="relative">
                    <Input
                      id="telefone"
                      type="tel"
                      placeholder="+351 9XX XXX XXX"
                      value={telefone}
                      onChange={(e) => handleTelefoneChange(e.target.value)}
                      required
                      aria-describedby="telefone-description"
                      className="pl-10"
                    />
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                      <Phone className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>
                  <p id="telefone-description" className="text-xs text-muted-foreground">
                    Receberá uma notificação no telemóvel para aceitar o pagamento.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} aria-label={`Pagar ${valor.toFixed(2)} euros com MBWay`}>
                  {loading ? "A processar..." : "Pagar com MBWay"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}