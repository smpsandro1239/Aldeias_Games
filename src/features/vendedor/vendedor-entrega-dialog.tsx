"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface VendedorEntregaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saldoDisponivel: number;
  onSubmit: (valor: number) => void;
}

export function VendedorEntregaDialog({
  open,
  onOpenChange,
  saldoDisponivel,
  onSubmit,
}: VendedorEntregaDialogProps) {
  const [valorEntrega, setValorEntrega] = useState("");

  const handleSubmit = () => {
    const valor = parseFloat(valorEntrega);
    if (!valor || valor <= 0) {
      toast.error("Insira um valor válido");
      return;
    }
    if (valor > saldoDisponivel) {
      toast.error(`Valor máximo: €${saldoDisponivel.toFixed(2)}`);
      return;
    }
    onSubmit(valor);
    setValorEntrega("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Solicitar Entrega de Saldo</DialogTitle>
          <DialogDescription>
            O valor solicitado será transferido para o administrador da aldeia após confirmação.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Saldo Disponível para Entrega</p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(saldoDisponivel)}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="valorEntrega">Valor a Entregar (€)</Label>
            <Input
              id="valorEntrega"
              type="number"
              step="0.01"
              min="0.01"
              max={saldoDisponivel}
              value={valorEntrega}
              onChange={(e) => setValorEntrega(e.target.value)}
              placeholder="0.00"
            />
            {valorEntrega && parseFloat(valorEntrega) > saldoDisponivel && (
              <p className="text-xs text-destructive">
                Valor excede o saldo disponível
              </p>
            )}
          </div>
          <div className="text-xs text-muted-foreground bg-accent/10 p-3 rounded-lg border border-accent/20">
            <p className="font-medium text-accent mb-1">Importante:</p>
            <p>Ao solicitar a entrega, o administrador será notificado. Após a confirmação, o valor será transferido para o saldo do administrador e o seu saldo a entregar será zerado.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Solicitar Entrega
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}