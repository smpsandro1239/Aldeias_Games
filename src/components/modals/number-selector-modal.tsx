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
import { cn } from "@/lib/utils";

interface NumberSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  numeroInicial: number;
  numeroFinal: number;
  numerosOcupados: number[];
  numerosSelecionados: number[];
  onSelect: (numeros: number[]) => void;
  onConfirm: () => void;
  preco: number;
}

export function NumberSelectorModal({
  open,
  onOpenChange,
  numeroInicial,
  numeroFinal,
  numerosOcupados,
  numerosSelecionados,
  onSelect,
  onConfirm,
  preco,
}: NumberSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const todosNumeros = Array.from(
    { length: numeroFinal - numeroInicial + 1 },
    (_, i) => numeroInicial + i
  );

  const numerosFiltrados = searchTerm
    ? todosNumeros.filter((n) => n.toString().includes(searchTerm))
    : todosNumeros;

  const toggleNumero = (numero: number) => {
    if (numerosOcupados.includes(numero)) return;

    if (numerosSelecionados.includes(numero)) {
      onSelect(numerosSelecionados.filter((n) => n !== numero));
    } else {
      onSelect([...numerosSelecionados, numero]);
    }
  };

  const valorTotal = numerosSelecionados.length * preco;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Selecionar Números</DialogTitle>
          <DialogDescription>
            Escolha os números para a sua participação.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Barra de pesquisa */}
          <div className="mb-4">
            <Input
              placeholder="Pesquisar número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Grid de números */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-10 gap-1">
              {numerosFiltrados.map((numero) => {
                const ocupado = numerosOcupados.includes(numero);
                const selecionado = numerosSelecionados.includes(numero);

                return (
                  <button
                    key={numero}
                    onClick={() => toggleNumero(numero)}
                    disabled={ocupado}
                    className={cn(
                      "h-10 rounded-md text-sm font-medium transition-all",
                      ocupado && "bg-muted text-muted-foreground cursor-not-allowed",
                      !ocupado && !selecionado && "bg-primary/10 hover:bg-primary/20 text-primary",
                      selecionado && "bg-primary text-primary-foreground"
                    )}
                  >
                    {numero}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resumo */}
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">
                {numerosSelecionados.length} número(s) selecionado(s)
              </span>
              <span className="text-lg font-bold">{valorTotal.toFixed(2)}€</span>
            </div>

            <div className="flex gap-2 mb-2">
              <div className="flex items-center gap-1 text-xs">
                <div className="w-4 h-4 bg-primary/10 rounded" />
                <span>Disponível</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-4 h-4 bg-muted rounded" />
                <span>Ocupado</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-4 h-4 bg-primary rounded" />
                <span>Selecionado</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={numerosSelecionados.length === 0}
          >
            Confirmar ({valorTotal.toFixed(2)}€)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
