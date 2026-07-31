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
import { Smartphone, Wallet, Leaf, Phone, Receipt } from "lucide-react";

// Constants for payment methods to avoid magic strings
const PAYMENT_METHODS = {
  SALDO: 'saldo',
  MBWAY: 'mbway'
} as const;

type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

interface SelectPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  valor: number;
  descricao: string;
  saldoDisponivel: number;
  onMBWayPayment: (telefone: string) => Promise<void>;
  onSaldoPayment: () => Promise<void>;
}

export function SelectPaymentModal({
  open,
  onOpenChange,
  valor,
  descricao,
  saldoDisponivel,
  onMBWayPayment,
  onSaldoPayment,
}: SelectPaymentModalProps) {
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [metodo, setMetodo] = useState<PaymentMethod>(
    saldoDisponivel >= valor ? PAYMENT_METHODS.SALDO : PAYMENT_METHODS.MBWAY
  );

  const podeUsarSaldo = saldoDisponivel >= valor;

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      if (metodo === PAYMENT_METHODS.MBWAY) {
        await onMBWayPayment(telefone);
      } else {
        await onSaldoPayment();
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }, [metodo, telefone, onMBWayPayment, onSaldoPayment, onOpenChange]);

  const handleMetodoChange = useCallback((value: string) => {
    setMetodo(value as PaymentMethod);
  }, []);

  const handleTelefoneChange = useCallback((value: string) => {
    setTelefone(value);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="select-payment-description">
        <DialogHeader className="bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-green-600/10 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-emerald-500/20">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-emerald-600/20 p-2 rounded-lg">
              <Leaf className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            </div>
            Confirmar e Pagar
          </DialogTitle>
          <DialogDescription id="select-payment-description">
            {descricao}
          </DialogDescription>
          <div className="inline-flex items-center gap-1.5 bg-emerald-600/10 border border-emerald-600/25 text-emerald-700 dark:text-emerald-400 text-sm font-bold px-3 py-1 rounded-full mt-2 w-fit">
            <Receipt className="h-4 w-4" aria-hidden="true" />
            Total: {valor.toFixed(2)}€
          </div>
        </DialogHeader>

        <Tabs value={metodo} onValueChange={handleMetodoChange} className="w-full">
          <TabsList className={`grid w-full ${podeUsarSaldo ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {podeUsarSaldo && (
              <TabsTrigger value={PAYMENT_METHODS.SALDO} className="flex items-center gap-2" aria-label="Pagar com saldo disponível">
                <Wallet className="h-4 w-4" aria-hidden="true" />
                Saldo ({saldoDisponivel.toFixed(2)}€)
              </TabsTrigger>
            )}
            <TabsTrigger value={PAYMENT_METHODS.MBWAY} className="flex items-center gap-2" aria-label="Pagar com MBWay">
              <Smartphone className="h-4 w-4" aria-hidden="true" />
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
                  <span className="text-3xl font-black text-primary" aria-label={`Saldo disponível: ${saldoDisponivel.toFixed(2)} euros`}>
                    {saldoDisponivel.toFixed(2)}€
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ao confirmar, o valor será deduzido automaticamente da sua carteira Aldeias.
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} aria-label="Cancelar pagamento">
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={loading}
                  className="bg-primary text-primary-foreground"
                  aria-label={`Pagar ${valor.toFixed(2)} euros com saldo`}
                >
                  {loading ? "A processar..." : `Pagar ${valor.toFixed(2)}€ com Saldo`}
                </Button>
              </DialogFooter>
            </TabsContent>
          )}

          <TabsContent value={PAYMENT_METHODS.MBWAY}>
            <form onSubmit={handleSubmit}>
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
                    Receberá uma notificação no telemóvel para aceitar o pagamento. Sem custos adicionais.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} aria-label="Cancelar pagamento">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} aria-label={`Pagar ${valor.toFixed(2)} euros com MBWay`}>
                  {loading ? "A processar..." : `Pagar ${valor.toFixed(2)}€ com MBWay`}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}