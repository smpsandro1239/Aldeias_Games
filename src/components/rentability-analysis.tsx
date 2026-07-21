"use client";

import { TrendingUp } from "lucide-react";

interface RentabilityAnalysisProps {
  stockInicial: number;
  stockAtual: number;
  totalAngariado: number;
  custoPremios: number;
  labels?: {
    total?: string;
    vendidos?: string;
    premios?: string;
    angariado?: string;
    lucro?: string;
  };
}

export function RentabilityAnalysis({
  stockInicial,
  stockAtual,
  totalAngariado,
  custoPremios,
  labels,
}: RentabilityAnalysisProps) {
  const vendidos = stockInicial - stockAtual;
  const lucro = totalAngariado - custoPremios;

  return (
    <div className="bg-surface-container rounded-2xl p-6 border border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-headline font-bold text-accent">Análise de Rentabilidade</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-container-high rounded-xl p-4">
          <p className="text-[10px] text-on-surface/50 uppercase mb-1">{labels?.total || "Total"}</p>
          <p className="text-xl font-bold">{stockInicial}</p>
        </div>
        <div className="bg-surface-container-high rounded-xl p-4">
          <p className="text-[10px] text-on-surface/50 uppercase mb-1">{labels?.vendidos || "Vendidos"}</p>
          <p className="text-xl font-bold">{vendidos}</p>
        </div>
        <div className="bg-surface-container-high rounded-xl p-4">
          <p className="text-[10px] text-on-surface/50 uppercase mb-1">{labels?.premios || "Custo Prémios"}</p>
          <p className="text-xl font-bold text-red-400">{custoPremios.toFixed(2)}€</p>
        </div>
        <div className="bg-surface-container-high rounded-xl p-4">
          <p className="text-[10px] text-on-surface/50 uppercase mb-1">{labels?.angariado || "Total Angariado"}</p>
          <p className="text-xl font-bold text-green-400">{totalAngariado.toFixed(2)}€</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-surface-container-high rounded-xl">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{labels?.lucro || "Lucro Projetado"}:</span>
          <span className={`text-lg font-bold ${lucro >= 0 ? "text-green-400" : "text-red-400"}`}>
            {lucro.toFixed(2)}€
          </span>
        </div>
      </div>
    </div>
  );
}
