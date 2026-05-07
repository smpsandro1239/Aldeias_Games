"use client";

import { useState, useEffect, useCallback } from "react";
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
import { CreditCard, Smartphone, Wallet } from "lucide-react";
import { playSound } from "@/lib/audio-utils";

// Constants for payment methods to avoid magic strings
const PAYMENT_METHODS = {
  SALDO: 'saldo',
  MBWAY: 'mbway',
  STRIPE: 'stripe'
} as const;

type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

// Constants for user roles
const USER_ROLES = {
  USER: 'user',
  STRIPE_BLOCKED: 'stripe_blocked'
} as const;

type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  valor: number;
  descricao: string;
  saldoDisponivel?: number;
  userRole?: UserRole;
  telefoneInicial?: string; // Para preenchimento automático
  onMBWayPayment: (telefone: string) => Promise<void>;
  onStripePayment?: () => Promise<void>;
  onSaldoPayment?: () => Promise<void>;
}

export function PaymentModal({
  open,
  onOpenChange,
  valor,
  descricao,
  saldoDisponivel = 0,
  userRole = USER_ROLES.USER,
  telefoneInicial,
  onMBWayPayment,
  onStripePayment,
  onSaldoPayment,
}: PaymentModalProps) {
  const [telefone, setTelefone] = useState(telefoneInicial || "");
  const [loading, setLoading] = useState(false);
  const [metodo, setMetodo] = useState<PaymentMethod>(
    saldoDisponivel >= valor && onSaldoPayment ? PAYMENT_METHODS.SALDO : PAYMENT_METHODS.MBWAY
  );

  // Preencher telefone quando o modal abrir ou telefoneInicial mudar
  useEffect(() => {
    if (open && telefoneInicial) {
      setTelefone(telefoneInicial);
    }
  }, [open, telefoneInicial]);

  // Ajustar método padrão baseado na disponibilidade
  useEffect(() => {
    if (saldoDisponivel >= valor && onSaldoPayment && userRole !== USER_ROLES.STRIPE_BLOCKED) {
      setMetodo(PAYMENT_METHODS.SALDO);
    } else if (userRole !== USER_ROLES.STRIPE_BLOCKED) {
      setMetodo(PAYMENT_METHODS.MBWAY);
    }
  }, [saldoDisponivel, valor, onSaldoPayment, userRole]);

  const handleMBWaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onMBWayPayment(telefone);
      playSound('success');
      onOpenChange(false);
    } catch (error) {
      playSound('error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleStripeSubmit = useCallback(async () => {
    if (!onStripePayment) return;
    setLoading(true);
    try {
      await onStripePayment();
      playSound('success');
      onOpenChange(false);
    } catch (error) {
      playSound('error');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [onStripePayment, onOpenChange]);

  const handleSaldoSubmit = useCallback(async () => {
    if (!onSaldoPayment) return;
    setLoading(true);
    try {
      await onSaldoPayment();
      playSound('success');
      onOpenChange(false);
    } catch (error) {
      playSound('error');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [onSaldoPayment, onOpenChange]);

  const handleMetodoChange = useCallback((value: PaymentMethod) => {
    setMetodo(value);
  }, []);

  const handleTelefoneChange = useCallback((value: string) => {
    setTelefone(value);
  }, []);

  // Calcular quantas colunas para TabsList
  const availableMethods = [
    onSaldoPayment && userRole !== USER_ROLES.STRIPE_BLOCKED && PAYMENT_METHODS.SALDO,
    userRole !== USER_ROLES.STRIPE_BLOCKED && PAYMENT_METHODS.MBWAY,
    onStripePayment && userRole !== USER_ROLES.STRIPE_BLOCKED && PAYMENT_METHODS.STRIPE
  ].filter(Boolean);

  const gridColsClass = availableMethods.length === 1 ? 'grid-cols-1' :
                        availableMethods.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="payment-modal-description">
        <DialogHeader>
          <DialogTitle>Pagamento</DialogTitle>
          <DialogDescription id="payment-modal-description">
            {descricao} - Total: <strong>{valor.toFixed(2)}€</strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={metodo} onValueChange={handleMetodoChange} className="w-full">
          <TabsList className={`grid w-full ${gridColsClass}`}>
            {onSaldoPayment && userRole !== USER_ROLES.STRIPE_BLOCKED && (
              <TabsTrigger value={PAYMENT_METHODS.SALDO}>
                <Wallet className="h-4 w-4 mr-2" />
                Saldo
              </TabsTrigger>
            )}
            {userRole !== USER_ROLES.STRIPE_BLOCKED && (
              <TabsTrigger value={PAYMENT_METHODS.MBWAY}>
                <Smartphone className="h-4 w-4 mr-2" />
                MBWay
              </TabsTrigger>
            )}
            {onStripePayment && userRole !== USER_ROLES.STRIPE_BLOCKED && (
              <TabsTrigger value={PAYMENT_METHODS.STRIPE}>
                <CreditCard className="h-4 w-4 mr-2" />
                Cartão
              </TabsTrigger>
            )}
          </TabsList>

          {onSaldoPayment && userRole !== USER_ROLES.STRIPE_BLOCKED && (
            <TabsContent value={PAYMENT_METHODS.SALDO}>
              <div className="py-6 text-center space-y-4">
                <div className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Saldo Disponível</span>
                  <span className={`text-3xl font-black ${saldoDisponivel >= valor ? 'text-primary' : 'text-destructive'}`}>
                    {saldoDisponivel.toFixed(2)}€
                  </span>
                </div>

                {saldoDisponivel < valor ? (
                  <p className="text-sm text-destructive font-medium" role="alert">
                    Saldo insuficiente para esta compra.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Ao confirmar, o valor será deduzido da sua carteira Aldeias.
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaldoSubmit}
                  disabled={loading || saldoDisponivel < valor}
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
                  <Label htmlFor="telefone">Número de Telefone</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="+351 9XX XXX XXX"
                    value={telefone}
                    onChange={(e) => handleTelefoneChange(e.target.value)}
                    required
                    aria-describedby="telefone-description"
                  />
                  <p id="telefone-description" className="text-xs text-muted-foreground">
                    Receberá uma notificação no seu telemóvel para aceitar o pagamento.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "A processar..." : "Pagar com MBWay"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value={PAYMENT_METHODS.STRIPE}>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Será redirecionado para o checkout seguro do Stripe para completar o pagamento.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleStripeSubmit} disabled={loading}>
                {loading ? "A redirecionar..." : "Pagar com Cartão"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}