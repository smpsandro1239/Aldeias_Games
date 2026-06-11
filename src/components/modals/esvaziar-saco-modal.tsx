"use client";
import { apiRequest } from '@/lib/api-client';

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Banknote, Check, X, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";

// Safe parsing helper
const safeParseFloat = (val: string, fallback: number = 0): number => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
};

interface UserProfile {
  saldo?: number;
}

interface EsvaziarSacoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aldeiaId?: string;
  aldeiaNome?: string;
}

// Hook customizado para buscar saldo
function useSaldo(open: boolean) {
  const [saldo, setSaldo] = useState(0);

  useEffect(() => {
    if (!open) return;

    const fetchSaldo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Sessão expirada");
          return;
        }

        const res = await fetch("/api/users/perfil", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error("Erro ao buscar saldo");
        }

        const data = await res.json();
        if (data.data?.saldo !== undefined) {
          setSaldo(data.data.saldo);
        }
      } catch (error) {
        console.error("Erro ao buscar saldo:", error);
        toast.error("Erro ao carregar saldo");
      }
    };

    fetchSaldo();
  }, [open]);

  return { saldo, setSaldo };
}

export function EsvaziarSacoModal({ open, onOpenChange, aldeiaId, aldeiaNome }: EsvaziarSacoModalProps) {
  const [loading, setLoading] = useState(false);
  const [valor, setValor] = useState("");
  const [confirmado, setConfirmado] = useState(false);

  const { saldo, setSaldo } = useSaldo(open);

  const handleEntregar = useCallback(async () => {
    const valorNum = safeParseFloat(valor);
    if (valorNum <= 0) {
      toast.error("Valor inválido");
      return;
    }

    if (valorNum > saldo) {
      toast.error("Valor superior ao saldo disponível");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Sessão expirada");
        return;
      }

      const res = await apiRequest("/api/wallet/adjust", {
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
      setSaldo(prev => prev - valorNum);
      toast.success(`${valorNum}€ entregue com sucesso!`);

      setTimeout(() => {
        onOpenChange(false);
        setConfirmado(false);
        setValor("");
      }, 2000);
    } catch (error) {
      console.error("Erro ao entregar:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao entregar");
    } finally {
      setLoading(false);
    }
  }, [valor, saldo, aldeiaNome, aldeiaId, setSaldo, onOpenChange]);

  const handleValorChange = useCallback((newValor: string) => {
    setValor(newValor);
  }, []);

  const handlePresetClick = useCallback((preset: number) => {
    if (preset > saldo) return;
    setValor(String(preset));
  }, [saldo]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setConfirmado(false);
    setValor("");
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-surface-container border-primary/20" aria-describedby="esvaziar-saco-description">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Banknote className="w-5 h-5 text-primary" aria-hidden="true" />
            Entregar Dinheiro
          </DialogTitle>
          <p id="esvaziar-saco-description" className="sr-only">Modal para entregar dinheiro ao administrador da aldeia</p>
        </DialogHeader>

        {confirmado ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-primary" aria-hidden="true" />
            </div>
            <p className="text-xl text-green-400 font-bold">Dinheiro Entregue!</p>
            <p className="text-muted-foreground mt-2" aria-live="polite">
              {valor}€ entregue ao administrador
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Saldo Info */}
            <div className="bg-surface-container-low rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Saldo em Caixa</p>
                  <p className="text-2xl font-black text-primary" aria-label={`Saldo disponível: ${saldo.toFixed(2)} euros`}>
                    {saldo.toFixed(2)}€
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-primary/50" aria-hidden="true" />
              </div>
            </div>

            {/* Valor Input */}
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider" htmlFor="valor-entrega">
                Valor a Entregar
              </Label>
              <Input
                id="valor-entrega"
                type="number"
                value={valor}
                onChange={(e) => handleValorChange(e.target.value)}
                placeholder="0.00"
                max={saldo}
                className="text-center text-2xl"
                aria-describedby="valor-description"
              />
              <p id="valor-description" className="sr-only">Digite o valor em euros a ser entregue</p>
              <div className="flex gap-2 mt-2">
                {[10, 20, 50, 100].map(v => (
                  <Button
                    key={v}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetClick(v)}
                    disabled={v > saldo}
                    className="flex-1"
                    aria-label={`Definir valor para ${v} euros`}
                  >
                    {v}€
                  </Button>
                ))}
              </div>
            </div>

            {/* Admin Info */}
            <div className="bg-surface-container-low rounded-xl p-4 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" aria-hidden="true" />
              <div>
                <p className="text-xs text-muted-foreground uppercase">Recebedor</p>
                <p className="font-bold text-foreground" aria-label={`Administrador recebedor: ${aldeiaNome || "Administrador"}`}>
                  {aldeiaNome || "Administrador"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" aria-hidden="true" />
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleEntregar}
                disabled={loading || !valor || safeParseFloat(valor) > saldo}
                className="flex-1 bg-primary text-primary-foreground"
                aria-label={`Entregar ${valor || "0"} euros ao administrador`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                ) : (
                  <Banknote className="w-4 h-4 mr-2" aria-hidden="true" />
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