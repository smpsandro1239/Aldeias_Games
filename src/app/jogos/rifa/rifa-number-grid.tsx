"use client";

import { LayoutGrid, Shuffle, X } from "lucide-react";
import type { RifaConfig } from "./rifa-types";

interface RifaNumberGridProps {
  config: RifaConfig;
  blocoSelecionado: number;
  setBlocoSelecionado: (b: number) => void;
  setNumerosSelecionados: (nums: number[]) => void;
  numerosSelecionados: number[];
  numerosDisponiveis: number[];
  numerosOcupados: number[];
  numerosJogados: number[];
  toggleNumero: (num: number) => void;
  selectRandomNumbers: (count: number) => void;
  randomOptions: number[];
}

export function RifaNumberGrid({
  config,
  blocoSelecionado,
  setBlocoSelecionado,
  setNumerosSelecionados,
  numerosSelecionados,
  numerosDisponiveis,
  numerosOcupados,
  numerosJogados,
  toggleNumero,
  selectRandomNumbers,
  randomOptions,
}: RifaNumberGridProps) {
  return (
    <>
      {config.numeroBlocos > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <LayoutGrid className="w-4 h-4 text-primary shrink-0" />
          {Array.from({ length: config.numeroBlocos }, (_, i) => i + 1).map((bloco) => (
            <button
              key={bloco}
              onClick={() => { setBlocoSelecionado(bloco); setNumerosSelecionados([]); }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                blocoSelecionado === bloco
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-container-high text-muted-foreground hover:bg-surface-container-highest"
              }`}
            >
              Bloco {bloco}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div className="bg-surface-container-high rounded-xl p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Legenda</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-surface-container-highest border border-outline-variant" /><span className="text-muted-foreground">Disponível</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-secondary" /><span className="text-muted-foreground">Selecionado</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-orange-500/70 border-2 border-orange-400" /><span className="text-muted-foreground">Seus números</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-900/40 border-2 border-red-800/60" /><span className="text-muted-foreground">Indisponível</span></div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">Selecionados: {numerosSelecionados.length}/20</p>
          <div className="flex gap-1">
            {numerosSelecionados.length > 0 && (
              <button onClick={() => setNumerosSelecionados([])} className="px-2 py-1 rounded-lg text-xs font-medium bg-destructive/20 text-red-400 hover:bg-destructive/30 flex items-center gap-1">
                <X className="w-3 h-3" /> Limpar
              </button>
            )}
            {randomOptions.map((count) => (
              <button key={count} onClick={() => selectRandomNumbers(count)} disabled={numerosSelecionados.length >= 20}
                className="px-2 py-1 rounded-lg text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50 flex items-center gap-1">
                <Shuffle className="w-3 h-3" /> {count}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 max-h-48 overflow-y-auto p-2 bg-surface-container-high rounded-xl">
          {numerosDisponiveis.map((num) => {
            const sel = numerosSelecionados.includes(num);
            const ocup = numerosOcupados.includes(num);
            const jog = numerosJogados.includes(num);
            return (
              <button key={num} onClick={() => toggleNumero(num)}
                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                  sel ? "bg-secondary text-primary-foreground"
                  : jog ? "bg-orange-500/70 text-foreground border-2 border-orange-400 cursor-pointer"
                  : ocup ? "bg-red-900/40 text-red-400 cursor-pointer border-2 border-red-800/60 hover:bg-red-900/60"
                  : "bg-surface-container-highest text-on-surface hover:bg-muted/30"
                }`}
                title={ocup ? "Clique para ver quem jogou este número" : undefined}>
                {num}
              </button>
            );
          })}
        </div>
      </div>

      {numerosSelecionados.length > 0 && (
        <div className="bg-secondary-container/10 border border-secondary-container/20 rounded-xl p-4">
          <p className="text-xs text-secondary mb-2">Números selecionados:</p>
          <div className="flex flex-wrap gap-2">
            {numerosSelecionados.map((num) => (
              <span key={num} className="bg-secondary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
                {num.toString().padStart(3, "0")}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
