"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Banknote, Check, X, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";

interface EsvaziarSacoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aldeiaId?: string;
  aldeiaNome?: string;
}

export function EsvaziarSacoModal({ open, onOpenChange, aldeiaId, aldeiaNome }: EsvaziarSacoModalProps) {
  const [loading, setLoading] = useState(false);
  const [saldo, setSaldo] = useState(0);
  const [valor, setValor] = useState("");
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSaldo();
    }
  }, [open]);

  const fetchSaldo = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/users/perfil", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.data?.saldo) {
        setSaldo(data.data.saldo);
      }
    } catch (error) {
      console.error("Error fetching saldo:", error);
    }
  };

  const handleEntregar = async () => {
    if (!valor || parseFloat(valor) <= 0) {
      toast.error("Valor inválido");
      return;
    }

    const valorNum = parseFloat(valor);
    if (valorNum > saldo) {
      toast.error("Valor superior ao saldo disponível");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/wallet/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          valor: -valorNum,
          tipo: "entrega_admin",
          descricao: `Entrega de dinheiro ao ${aldeiaNome}`,
          aldeiaId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao entregar");
      }

      setConfirmado(true);
      toast.success(`${valorNum}€ entregue com sucesso!`);
      
      setTimeout(() => {
        onOpenChange(false);
        setConfirmado(false);
        setValor("");
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao entregar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-surface-container border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Banknote className="w-5 h-5 text-primary" />
            Entregar Dinheiro
          </DialogTitle>
        </DialogHeader>

        {confirmado ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xl text-green-400 font-bold">Dinheiro Entregue!</p>
            <p className="text-muted-foreground mt-2">{valor}€ entregue ao administrador</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Saldo Info */}
            <div className="bg-surface-container-low rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Saldo em Caixa</p>
                  <p className="text-2xl font-black text-primary">{saldo.toFixed(2)}€</p>
                </div>
                <Wallet className="w-8 h-8 text-primary/50" />
              </div>
            </div>

            {/* Valor Input */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Valor a Entregar
              </Label>
              <Input
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0.00"
                max={saldo}
                className="text-center text-2xl"
              />
              <div className="flex gap-2 mt-2">
                {[10, 20, 50, 100].map(v => (
                  <Button
                    key={v}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setValor(String(v))}
                    disabled={v > saldo}
                    className="flex-1"
                  >
                    {v}€
                  </Button>
                ))}
              </div>
            </div>

            {/* Admin Info */}
            <div className="bg-surface-container-low rounded-xl p-4 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground uppercase">Recebedor</p>
                <p className="font-bold text-foreground">{aldeiaNome || "Administrador"}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleEntregar}
                disabled={loading || !valor || parseFloat(valor) > saldo}
                className="flex-1 bg-primary text-primary-foreground"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Banknote className="w-4 h-4 mr-2" />
                )}
                Entregar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}