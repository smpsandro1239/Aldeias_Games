"use client";

import { Hash, X, Shuffle } from "lucide-react";
import { MAX_NUMEROS, TOTAL_NUMEROS, RANDOM_OPTIONS } from "./euromilhoes-types";

interface EuromilhoesNumberGridProps {
  numerosSelecionados: number[];
  setNumerosSelecionados: (nums: number[]) => void;
  numerosOcupados: number[];
  toggleNumero: (num: number) => void;
  selectRandomNumbers: (count: number) => void;
}

export function EuromilhoesNumberGrid({
  numerosSelecionados,
  setNumerosSelecionados,
  numerosOcupados,
  toggleNumero,
  selectRandomNumbers,
}: EuromilhoesNumberGridProps) {
  return (
    <div className="bg-surface-container rounded-3xl p-6 space-y-4">
      <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-4">
        <Hash className="w-5 h-5 text-secondary" />
        <h4 className="text-xl font-headline font-bold">Escolha os seus números</h4>
      </div>

      <div className="bg-surface-container-high rounded-xl p-3">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-surface-container-highest border border-outline-variant" /><span className="text-muted-foreground">Disponível</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-secondary" /><span className="text-muted-foreground">Selecionado</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-900/40 border-2 border-red-800/60" /><span className="text-muted-foreground">Indisponível</span></div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-muted-foreground">{numerosSelecionados.length}/{MAX_NUMEROS} selecionados</p>
          <div className="flex items-center gap-1">
            {numerosSelecionados.length > 0 && (
              <button onClick={() => setNumerosSelecionados([])} className="px-3 py-1 rounded-lg text-xs font-medium bg-destructive/20 text-red-400 hover:bg-destructive/30 flex items-center gap-1">
                <X className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Aleatório:</span>
          {RANDOM_OPTIONS.map((count) => (
            <button key={count} onClick={() => selectRandomNumbers(count)} disabled={numerosSelecionados.length >= MAX_NUMEROS}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50 flex items-center gap-1">
              <Shuffle className="w-3 h-3" /> {count}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-10 gap-2">
        {Array.from({ length: TOTAL_NUMEROS }, (_, i) => i + 1).map((num) => {
          const sel = numerosSelecionados.includes(num);
          const ocup = numerosOcupados.includes(num);
          return (
            <button key={num} onClick={() => toggleNumero(num)} disabled={ocup}
              className={`aspect-square rounded-xl text-sm font-bold transition-all ${
                sel ? "bg-secondary text-primary-foreground scale-110 shadow-lg shadow-secondary/30 ring-2 ring-secondary ring-offset-2 ring-offset-background"
                : ocup ? "bg-red-900/30 text-red-400/60 cursor-not-allowed border border-red-800/40"
                : "bg-surface-container-highest text-on-surface hover:bg-muted/50 hover:scale-105 active:scale-95"
              }`}>
              {num}
            </button>
          );
        })}
      </div>

      {numerosSelecionados.length > 0 && (
        <div className="bg-secondary-container/10 border border-secondary-container/20 rounded-xl p-4">
          <p className="text-xs text-secondary mb-3 font-medium">Números selecionados:</p>
          <div className="flex flex-wrap gap-2">
            {numerosSelecionados.map((num) => (
              <span key={num} onClick={() => toggleNumero(num)}
                className="bg-secondary text-primary-foreground w-10 h-10 rounded-xl text-sm font-bold flex items-center justify-center cursor-pointer hover:opacity-80">
                {num}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
