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
import { cn } from "@/lib/utils";

interface PoioDaVacaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  letras: string[];
  numerosPorLetra: number;
  numerosOcupados: { letra: string; numero: number }[];
  precoIndividual: number;
  precoCartao: number;
  onSelect: (selecao: { letra: string; numero: number }[]) => void;
  onConfirm: () => void;
}

export function PoioDaVacaModal({
  open,
  onOpenChange,
  letras,
  numerosPorLetra,
  numerosOcupados,
  precoIndividual,
  precoCartao,
  onSelect,
  onConfirm,
}: PoioDaVacaModalProps) {
  const [selecao, setSelecao] = useState<{ letra: string; numero: number }[]>([]);
  const [modo, setModo] = useState<"individual" | "cartao">("individual");
  const [letraAtiva, setLetraAtiva] = useState(letras[0]);

  const isOcupado = (letra: string, numero: number) => {
    return numerosOcupados.some((o) => o.letra === letra && o.numero === numero);
  };

  const isSelecionado = (letra: string, numero: number) => {
    return selecao.some((s) => s.letra === letra && s.numero === numero);
  };

  const toggleNumero = (letra: string, numero: number) => {
    if (isOcupado(letra, numero)) return;

    if (modo === "cartao") {
      // No modo cartão, seleciona todos os números da letra
      const numerosDaLetra = Array.from({ length: numerosPorLetra }, (_, i) => i + 1);
      const cartaoCompleto = numerosDaLetra.map((n) => ({ letra, numero: n }));

      // Verifica se o cartão está completo
      const cartaoSelecionado = selecao.filter((s) => s.letra === letra);
      if (cartaoSelecionado.length === numerosPorLetra) {
        // Remove o cartão
        setSelecao(selecao.filter((s) => s.letra !== letra));
      } else {
        // Adiciona o cartão (remove seleções individuais da mesma letra)
        setSelecao([...selecao.filter((s) => s.letra !== letra), ...cartaoCompleto]);
      }
    } else {
      // Modo individual
      if (isSelecionado(letra, numero)) {
        setSelecao(selecao.filter((s) => !(s.letra === letra && s.numero === numero)));
      } else {
        setSelecao([...selecao, { letra, numero }]);
      }
    }
  };

  const getValorTotal = () => {
    if (modo === "cartao") {
      const cartoesCompletos = letras.filter((l) => {
        const nums = selecao.filter((s) => s.letra === l);
        return nums.length === numerosPorLetra;
      }).length;
      return cartoesCompletos * precoCartao;
    }
    return selecao.length * precoIndividual;
  };

  const handleConfirm = () => {
    onSelect(selecao);
    onConfirm();
    setSelecao([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Poio da Vaca</DialogTitle>
          <DialogDescription>
            Selecione as coordenadas para a sua participação.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Modo de seleção */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={modo === "individual" ? "default" : "outline"}
              onClick={() => setModo("individual")}
              size="sm"
            >
              Individual ({precoIndividual.toFixed(2)}€)
            </Button>
            <Button
              variant={modo === "cartao" ? "default" : "outline"}
              onClick={() => setModo("cartao")}
              size="sm"
            >
              Cartão Completo ({precoCartao.toFixed(2)}€)
            </Button>
          </div>

          {/* Tabs de letras */}
          <div className="flex gap-1 mb-4 overflow-x-auto">
            {letras.map((letra) => (
              <Button
                key={letra}
                variant={letraAtiva === letra ? "default" : "outline"}
                onClick={() => setLetraAtiva(letra)}
                className="min-w-[40px]"
                size="sm"
              >
                {letra}
              </Button>
            ))}
          </div>

          {/* Grid de números */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: numerosPorLetra }, (_, i) => i + 1).map((numero) => {
                const ocupado = isOcupado(letraAtiva, numero);
                const selecionado = isSelecionado(letraAtiva, numero);

                return (
                  <button
                    key={numero}
                    onClick={() => toggleNumero(letraAtiva, numero)}
                    disabled={ocupado}
                    className={cn(
                      "h-10 rounded-md text-sm font-medium transition-all",
                      ocupado && "bg-muted text-muted-foreground cursor-not-allowed",
                      !ocupado && !selecionado && "bg-primary/10 hover:bg-primary/20 text-primary",
                      selecionado && "bg-primary text-primary-foreground"
                    )}
                  >
                    {letraAtiva}{numero}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resumo */}
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                {selecao.length} seleção(ões)
              </span>
              <span className="text-lg font-bold">{getValorTotal().toFixed(2)}€</span>
            </div>

            {selecao.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selecao.map((s, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                  >
                    {s.letra}{s.numero}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={selecao.length === 0}>
            Confirmar ({getValorTotal().toFixed(2)}€)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
