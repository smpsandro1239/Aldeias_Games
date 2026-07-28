"use client";

import { CheckCircle2 } from "lucide-react";
import type { Dimensoes } from "./poio-types";

interface Cell {
  id: number;
  x: number;
  y: number;
  label: string;
  display: string;
}

interface PoioFieldGridProps {
  cells: Cell[];
  dimensoes: Dimensoes;
  selectedSquares: number[];
  numerosOcupados: number[];
  onSquareClick: (id: number) => void;
}

export function PoioFieldGrid({ cells, dimensoes, selectedSquares, numerosOcupados, onSquareClick }: PoioFieldGridProps) {
  return (
    <section className="space-y-4 px-2">
      <div className="flex flex-col gap-1">
        <h3 className="font-headline text-xl">O Campo</h3>
        <p className="text-on-surface-variant text-sm">Escolha os seus quadrados. A vaca é solta no campo e o primeiro "coco" determina o vencedor!</p>
        <p className="text-xs text-on-surface-variant/60 mt-1">
          Coordenadas: X (esquerda→direita) × Y (baixo→cima)
        </p>
      </div>

      <div className="bg-surface-container-low rounded-2xl p-2 sm:p-3">
        <div className="flex justify-between px-2 sm:px-8 mb-1">
          <span className="text-[8px] sm:text-[10px] text-on-surface-variant">X →</span>
        </div>

        <div className="relative w-full aspect-square mb-2">
          <div
            className="absolute inset-0 grid gap-0.5"
            style={{
              gridTemplateColumns: `repeat(${dimensoes.x}, 1fr)`,
              gridTemplateRows: `repeat(${dimensoes.y}, 1fr)`
            }}
          >
            {cells.map((cell) => {
              const isSelected = selectedSquares.includes(cell.id);
              const isOccupied = numerosOcupados.includes(cell.id);
              return (
                <button
                  key={cell.id}
                  onClick={() => onSquareClick(cell.id)}
                  disabled={isOccupied}
                  className={`
                    relative flex items-center justify-center text-[10px] sm:text-xs font-medium transition-all duration-150 rounded-sm
                    ${isSelected
                      ? "bg-primary-container text-on-primary-container font-bold shadow-md z-10"
                      : isOccupied
                      ? "bg-red-900/30 text-red-400/50 cursor-not-allowed border border-red-900/30"
                      : "bg-surface-container-highest/60 text-on-surface-variant/50 hover:bg-surface-container-high hover:text-on-surface-variant"
                    }
                  `}
                  title={isOccupied ? `${cell.display} - Já escolhido` : cell.display}
                >
                  {isSelected ? <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" /> : isOccupied ? <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : cell.id}
                </button>
              );
            })}
          </div>
          <div className="absolute inset-0 pointer-events-none border border-outline-variant/20 rounded-lg"></div>
        </div>

        <div className="flex justify-between px-1">
          <span className="text-[8px] sm:text-[10px] text-on-surface-variant">↑ Y</span>
          <span className="text-[8px] sm:text-[10px] text-on-surface-variant">X →</span>
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-primary-container"></div>
            <span className="text-on-surface-variant">Selecionado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-900/30 border border-red-900/30"></div>
            <span className="text-on-surface-variant">Ocupado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-surface-container-highest/60"></div>
            <span className="text-on-surface-variant">Disponível</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-on-surface-variant">Total: {dimensoes.x * dimensoes.y}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
