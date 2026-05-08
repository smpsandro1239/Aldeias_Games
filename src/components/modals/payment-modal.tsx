"use client";

import { useState, useEffect, useCallback, useReducer } from "react";
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
import { toast } from "sonner";

// Constants for payment methods to avoid magic strings
const PAYMENT_METHODS = {
  SALDO: 'saldo',
  MBWAY: 'mbway',
  STRIPE: 'stripe'
} as const;

type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

// Constants for user roles
const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ALDEIA_ADMIN: 'aldeia_admin',
  USER: 'user'
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

// Reducer actions
type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TELEFONE'; payload: string }
  | { type: 'SET_METODO'; payload: PaymentMethod };

// Initial state
const getInitialState = (saldoDisponivel: number, valor: number, telefoneInicial?: string): {
  telefone: string;
  metodo: PaymentMethod;
} => ({
  telefone: telefoneInicial || "",
  metodo: saldoDisponivel >= valor ? PAYMENT_METHODS.SALDO : PAYMENT_METHODS.MBWAY,
});

// Reducer
function paymentReducer(state: ReturnType<typeof getInitialState>, action: Action): ReturnType<typeof getInitialState> {
  switch (action.type) {
    case 'SET_LOADING':
      return state; // Loading is separate
    case 'SET_TELEFONE':
      return { ...state, telefone: action.payload };
    case 'SET_METODO':
      return { ...state, metodo: action.payload };
    default:
      return state;
  }
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
  const [loading, setLoading] = useState(false);
  const [state, dispatch] = useReducer(paymentReducer, getInitialState(saldoDisponivel, valor, telefoneInicial));

  // Preencher telefone quando o modal abrir ou telefoneInicial mudar
  useEffect(() => {
    if (open && telefoneInicial) {
      dispatch({ type: 'SET_TELEFONE', payload: telefoneInicial });
    }
  }, [open, telefoneInicial]);

  // Validation functions
  const validateTelefone = useCallback((telefone: string): boolean => {
    return telefone.length >= 9 && /^\d+$/.test(telefone.replace(/\s+/g, ''));
  }, []);

  const canUseSaldo = useCallback((): boolean => {
    return saldoDisponivel >= valor;
  }, [saldoDisponivel, valor]);

  // Payment handlers
  const handleMBWayPayment = useCallback(async () => {
    if (!validateTelefone(state.telefone)) {
      toast.error("Por favor, insira um número de telefone válido");
      return;
    }

    setLoading(true);
    try {
      await onMBWayPayment(state.telefone);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro no pagamento MBWay:", error);
      toast.error("Erro no pagamento MBWay");
    } finally {
      setLoading(false);
    }
  }, [state.telefone, validateTelefone, onMBWayPayment, onOpenChange]);

  const handleSaldoPayment = useCallback(async () => {
    if (!canUseSaldo()) {
      toast.error("Saldo insuficiente");
      return;
    }

    setLoading(true);
    try {
      if (onSaldoPayment) {
        await onSaldoPayment();
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Erro no pagamento com saldo:", error);
      toast.error("Erro no pagamento com saldo");
    } finally {
      setLoading(false);
    }
  }, [canUseSaldo, onSaldoPayment, onOpenChange]);

  const handleStripePayment = useCallback(async () => {
    setLoading(true);
    try {
      if (onStripePayment) {
        await onStripePayment();
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Erro no pagamento Stripe:", error);
      toast.error("Erro no pagamento Stripe");
    } finally {
      setLoading(false);
    }
  }, [onStripePayment, onOpenChange]);

  // Form handlers
  const handleTelefoneChange = useCallback((value: string) => {
    dispatch({ type: 'SET_TELEFONE', payload: value });
  }, []);

  const handleMetodoChange = useCallback((value: string) => {
    const metodo = value as PaymentMethod;
    dispatch({ type: 'SET_METODO', payload: metodo });
  }, []);

  const handleStripeSubmit = async () => {
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
  };

  const handleSaldoSubmit = async () => {
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pagamento</DialogTitle>
          <DialogDescription>
            {descricao} - Total: <strong>{valor.toFixed(2)}€</strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={state.metodo} onValueChange={handleMetodoChange} className="w-full" aria-describedby="payment-description">
          <TabsList className={`grid w-full ${onSaldoPayment && userRole !== USER_ROLES.SUPER_ADMIN ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {onSaldoPayment && userRole !== USER_ROLES.SUPER_ADMIN && (
              <TabsTrigger
                value={PAYMENT_METHODS.SALDO}
                aria-label={`Pagar com saldo disponível (${saldoDisponivel.toFixed(2)}€)`}
              >
                <Wallet className="h-4 w-4 mr-2" aria-hidden="true" />
                Saldo
              </TabsTrigger>
            )}
            {userRole !== USER_ROLES.SUPER_ADMIN && (
              <TabsTrigger
                value={PAYMENT_METHODS.MBWAY}
                aria-label="Pagar com MBWay"
              >
                <Smartphone className="h-4 w-4 mr-2" aria-hidden="true" />
                MBWay
              </TabsTrigger>
            )}
            {onStripePayment && userRole !== USER_ROLES.SUPER_ADMIN && (
              <TabsTrigger
                value={PAYMENT_METHODS.STRIPE}
                aria-label="Pagar com cartão de crédito"
              >
                <CreditCard className="h-4 w-4 mr-2" aria-hidden="true" />
                Cartão
              </TabsTrigger>
            )}
          </TabsList>

          {onSaldoPayment && userRole !== USER_ROLES.SUPER_ADMIN && (
            <TabsContent value={PAYMENT_METHODS.SALDO}>
              <div className="py-6 text-center space-y-4">
                <div className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Saldo Disponível</span>
                  <span className={`text-3xl font-black ${saldoDisponivel >= valor ? 'text-primary' : 'text-destructive'}`}>
                    {saldoDisponivel.toFixed(2)}€
                  </span>
                </div>
                
                {saldoDisponivel < valor ? (
                  <p className="text-sm text-destructive font-medium">
                    Saldo insuficiente para esta compra.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Ao confirmar, o valor será deduzido da sua carteira Aldeias.
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  aria-label="Cancelar pagamento e fechar modal"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaldoPayment}
                  disabled={loading || !canUseSaldo()}
                  aria-label={`Pagar ${valor.toFixed(2)}€ com saldo disponível (${saldoDisponivel.toFixed(2)}€)`}
                >
                  {loading ? "A processar..." : "Pagar com Saldo"}
                </Button>
              </DialogFooter>
            </TabsContent>
          )}

          <TabsContent value={PAYMENT_METHODS.MBWAY}>
            <form onSubmit={(e) => { e.preventDefault(); handleMBWayPayment(); }}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="telefone">Número de Telefone *</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="+351 9XX XXX XXX"
                    value={state.telefone}
                    onChange={(e) => handleTelefoneChange(e.target.value)}
                    required
                    aria-describedby="telefone-help"
                  />
                  <p id="telefone-help" className="text-xs text-muted-foreground">
                    Receberá uma notificação no seu telemóvel para aceitar o pagamento.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  aria-label="Cancelar pagamento e fechar modal"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !validateTelefone(state.telefone)}
                  aria-label={`Pagar ${valor.toFixed(2)}€ com MBWay`}
                >
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
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                aria-label="Cancelar pagamento e fechar modal"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleStripePayment}
                disabled={loading}
                aria-label={`Pagar ${valor.toFixed(2)}€ com cartão de crédito via Stripe`}
              >
                {loading ? "A redirecionar..." : "Pagar com Cartão"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
