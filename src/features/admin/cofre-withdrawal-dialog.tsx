"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ArrowUpFromLine, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api-client";

interface CofreWithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaultSaldo: number;
  aldeiaId?: string;
  onSuccess: () => void;
}

export function CofreWithdrawalDialog({
  open,
  onOpenChange,
  vaultSaldo,
  aldeiaId,
  onSuccess,
}: CofreWithdrawalDialogProps) {
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [destino, setDestino] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const valorNum = parseFloat(valor);
    if (!valorNum || valorNum <= 0) {
      toast.error("Insira um valor válido");
      return;
    }
    if (!descricao.trim() || descricao.trim().length < 5) {
      toast.error("Descrição deve ter pelo menos 5 caracteres");
      return;
    }
    if (!destino.trim()) {
      toast.error("Destino/finalidade é obrigatório");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest("/api/cofre/levantamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor: valorNum,
          descricao: descricao.trim(),
          destino: destino.trim(),
          observacoes: observacoes.trim() || undefined,
          aldeiaId: aldeiaId || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Levantamento solicitado com sucesso!");
        onOpenChange(false);
        setValor("");
        setDescricao("");
        setDestino("");
        setObservacoes("");
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao solicitar levantamento");
      }
    } catch {
      toast.error("Erro ao solicitar levantamento");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpFromLine className="w-5 h-5 text-purple-600" />
            Solicitar Levantamento do Cofre
          </DialogTitle>
          <DialogDescription>
            Regista a retirada de dinheiro do cofre. O levantamento ficará pendente até aprovação por outro administrador.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Saldo disponível no cofre</span>
            <span className="text-2xl font-bold text-green-600">{formatCurrency(vaultSaldo)}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="levValor">Valor (€) *</Label>
            <Input
              id="levValor"
              type="number"
              step="0.01"
              min="0.01"
              max={vaultSaldo}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0.00"
            />
            {valor && parseFloat(valor) > vaultSaldo && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Valor excede o saldo disponível no cofre
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="levDestino">Destino / Finalidade *</Label>
            <Input
              id="levDestino"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              placeholder="Ex: Pagamento de materiais, Despesas de evento..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="levDescricao">Descrição detalhada *</Label>
            <Textarea
              id="levDescricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva detalhadamente para que serve este levantamento..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="levObservacoes">Observações adicionais</Label>
            <Textarea
              id="levObservacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Notas internas (opcional)..."
              rows={2}
            />
          </div>

          <div className="text-xs text-muted-foreground bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
            <p className="font-medium text-purple-700 mb-1">Regras de transparência:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>O destino e descrição são obrigatórios</li>
              <li>Apenas outro administrador pode aprovar</li>
              <li>O solicitante não pode aprovar o próprio pedido</li>
              <li>Toda a movimentação fica registada para auditoria</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !valor || !descricao.trim() || !destino.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <ArrowUpFromLine className="w-4 h-4 mr-2" />
            {submitting ? "A enviar..." : "Solicitar Levantamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
