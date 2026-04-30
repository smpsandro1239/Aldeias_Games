"use client";

import { useState } from "react";
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

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  valor: number;
  descricao: string;
  saldoDisponivel?: number;
  userRole?: string;
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
  userRole = "user",
  telefoneInicial,
  onMBWayPayment,
  onStripePayment,
  onSaldoPayment,
}: PaymentModalProps) {
  const [telefone, setTelefone] = useState(telefoneInicial || "");
  const [loading, setLoading] = useState(false);
  const [metodo, setMetodo] = useState(saldoDisponivel >= valor ? "saldo" : "mbway");

  // Preencher telefone quando o modal abrir ou telefoneInicial mudar
  useEffect(() => {
    if (open && telefoneInicial) {
      setTelefone(telefoneInicial);
    }
  }, [open, telefoneInicial]);

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

        <Tabs value={metodo} onValueChange={setMetodo} className="w-full">
          <TabsList className={`grid w-full ${onSaldoPayment && userRole !== 'stripe_blocked' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {onSaldoPayment && userRole !== 'stripe_blocked' && (
              <TabsTrigger value="saldo">
                <Wallet className="h-4 w-4 mr-2" />
                Saldo
              </TabsTrigger>
            )}
            {userRole !== 'stripe_blocked' && (
              <TabsTrigger value="mbway">
                <Smartphone className="h-4 w-4 mr-2" />
                MBWay
              </TabsTrigger>
            )}
            {onStripePayment && userRole !== 'stripe_blocked' && (
              <TabsTrigger value="stripe">
                <CreditCard className="h-4 w-4 mr-2" />
                Cartão
              </TabsTrigger>
            )}
          </TabsList>

          {onSaldoPayment && userRole !== 'stripe_blocked' && (
            <TabsContent value="saldo">
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

          <TabsContent value="mbway">
            <form onSubmit={handleMBWaySubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="telefone">Número de Telefone</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="+351 9XX XXX XXX"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
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

          <TabsContent value="stripe">
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
