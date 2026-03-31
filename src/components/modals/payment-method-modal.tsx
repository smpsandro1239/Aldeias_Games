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
import { Smartphone, Wallet } from "lucide-react";

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
  const [metodo, setMetodo] = useState(saldoDisponivel >= valor ? "saldo" : "mbway");

  const handleMBWaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onMBWayPayment(telefone);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSaldoSubmit = async () => {
    setLoading(true);
    try {
      await onSaldoPayment();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const podeUsarSaldo = saldoDisponivel >= valor;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Escolher Método de Pagamento</DialogTitle>
          <DialogDescription>
            {descricao} - Total: <strong>{valor.toFixed(2)}€</strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={metodo} onValueChange={setMetodo} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            {podeUsarSaldo && (
              <TabsTrigger value="saldo">
                <Wallet className="h-4 w-4 mr-2" />
                Saldo
              </TabsTrigger>
            )}
            <TabsTrigger value="mbway">
              <Smartphone className="h-4 w-4 mr-2" />
              MBWay
            </TabsTrigger>
          </TabsList>

          {podeUsarSaldo && (
            <TabsContent value="saldo">
              <div className="py-6 text-center space-y-4">
                <div className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Saldo Disponível</span>
                  <span className={`text-3xl font-black ${podeUsarSaldo ? 'text-primary' : 'text-destructive'}`}>
                    {saldoDisponivel.toFixed(2)}€
                  </span>
                </div>
                
                {podeUsarSaldo ? (
                  <p className="text-sm text-muted-foreground">
                    Ao confirmar, o valor será deduzido da sua carteira Aldeias.
                  </p>
                ) : (
                  <p className="text-sm text-destructive font-medium">
                    Saldo insuficiente. Use MBWay.
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaldoSubmit} 
                  disabled={loading || !podeUsarSaldo}
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
                  <Label htmlFor="telefone">Número de Telefone MBWay</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="+351 9XX XXX XXX"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Receberá uma notificação no telemóvel para aceitar o pagamento.
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
