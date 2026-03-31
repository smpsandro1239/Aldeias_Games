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
import { Smartphone, Wallet, Leaf } from "lucide-react";

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
  const [metodo, setMetodo] = useState<"saldo" | "mbway">(saldoDisponivel >= valor ? "saldo" : "mbway");

  const podeUsarSaldo = saldoDisponivel >= valor;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      if (metodo === "mbway") {
        await onMBWayPayment(telefone);
      } else {
        await onSaldoPayment();
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            Confirmar e Pagar
          </DialogTitle>
          <DialogDescription>
            {descricao} - Total: <strong>{valor.toFixed(2)}€</strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={metodo} onValueChange={(v) => setMetodo(v as "saldo" | "mbway")} className="w-full">
          <TabsList className={`grid w-full ${podeUsarSaldo ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {podeUsarSaldo && (
              <TabsTrigger value="saldo" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Saldo ({saldoDisponivel.toFixed(2)}€)
              </TabsTrigger>
            )}
            <TabsTrigger value="mbway" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              MBWay
            </TabsTrigger>
          </TabsList>

          {podeUsarSaldo && (
            <TabsContent value="saldo">
              <div className="py-6 text-center space-y-4">
                <div className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Saldo Disponível</span>
                  <span className="text-3xl font-black text-primary">
                    {saldoDisponivel.toFixed(2)}€
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ao confirmar, o valor será deduzido automaticamente da sua carteira Aldeias.
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => handleSubmit()} 
                  disabled={loading}
                  className="bg-primary text-primary-foreground"
                >
                  {loading ? "A processar..." : `Pagar ${valor.toFixed(2)}€ com Saldo`}
                </Button>
              </DialogFooter>
            </TabsContent>
          )}

          <TabsContent value="mbway">
            <form onSubmit={handleSubmit}>
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
                    Receberá uma notificação no telemóvel para aceitar o pagamento. Sem custos adicionais.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
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
