"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api-client";

interface CofreDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aldeiaId?: string;
  onSuccess: () => void;
}

export function CofreDepositDialog({
  open,
  onOpenChange,
  aldeiaId,
  onSuccess,
}: CofreDepositDialogProps) {
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const valorNum = parseFloat(valor);
    if (!valorNum || valorNum <= 0) {
      toast.error("Insira um valor válido");
      return;
    }
    if (!descricao.trim() || descricao.trim().length < 3) {
      toast.error("Descrição deve ter pelo menos 3 caracteres");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest("/api/cofre/pedido-deposito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor: valorNum,
          descricao: descricao.trim(),
          aldeiaId: aldeiaId || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Depósito registado com sucesso!");
        onOpenChange(false);
        setValor("");
        setDescricao("");
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao criar depósito");
      }
    } catch {
      toast.error("Erro ao criar depósito");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-green-600" />
            Depositar no Cofre da Aldeia
          </DialogTitle>
          <DialogDescription>
            Regista a entrada de dinheiro físico no cofre. O depósito ficará registado no histórico de movimentos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="valorDeposito">Valor a Depositar (€) *</Label>
            <Input
              id="valorDeposito"
              type="number"
              step="0.01"
              min="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricaoDeposito">Descrição *</Label>
            <Textarea
              id="descricaoDeposito"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Depósito de vendas do evento, Receitas da festa..."
              rows={3}
            />
          </div>
          <div className="text-xs text-muted-foreground bg-green-500/10 p-3 rounded-lg border border-green-500/20">
            <p className="font-medium text-green-700 mb-1">Nota:</p>
            <p>O valor será creditado diretamente no cofre da aldeia.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !valor || !descricao.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? "A registar..." : "Registar Depósito"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
