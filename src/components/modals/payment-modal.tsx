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
import { CreditCard, Smartphone } from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  valor: number;
  descricao: string;
  onMBWayPayment: (telefone: string) => Promise<void>;
  onStripePayment: () => Promise<void>;
}

export function PaymentModal({
  open,
  onOpenChange,
  valor,
  descricao,
  onMBWayPayment,
  onStripePayment,
}: PaymentModalProps) {
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);
  const [metodo, setMetodo] = useState("mbway");

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

  const handleStripeSubmit = async () => {
    setLoading(true);
    try {
      await onStripePayment();
      onOpenChange(false);
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mbway">
              <Smartphone className="h-4 w-4 mr-2" />
              MBWay
            </TabsTrigger>
            <TabsTrigger value="stripe">
              <CreditCard className="h-4 w-4 mr-2" />
              Cartão
            </TabsTrigger>
          </TabsList>

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
