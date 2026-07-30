"use client";

import { Calculator } from "lucide-react";
import { GAME_TYPES, type JogoFormData, type JogoMetrics } from "./create-jogo-types";

interface LucratividadeCardProps {
  formData: JogoFormData;
  getMetrics: () => JogoMetrics;
  metricsRaspadinha: {
    totalPercentagem?: number;
    custoMedioPorBilhete?: number;
    receitaTotal?: number;
    lucroEstimado?: number;
    margemLucro?: number;
  };
  metricsRifa: {
    totalPremios?: number;
    receitaTotal?: number;
    lucroEstimado?: number;
    margemLucro?: number;
  };
  metricsPoioDaVaca: {
    totalQuadrados?: number;
    receitaTotal?: number;
    valorCompraVaca?: number;
    lucroEstimado?: number;
    margemLucro?: number;
  };
}

export function LucratividadeCard({
  formData,
  getMetrics,
  metricsRaspadinha,
  metricsRifa,
  metricsPoioDaVaca,
}: LucratividadeCardProps) {
  const m = getMetrics();

  return (
    <div className={`p-4 rounded-xl border-2 ${m.isLucrativo ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Calculator className={`w-5 h-5 ${m.isLucrativo ? 'text-green-500' : 'text-red-500'}`} />
        <h4 className={`font-bold ${m.isLucrativo ? 'text-green-500' : 'text-red-500'}`}>
          {m.isLucrativo ? '✅ Lucrativo' : '? Não Lucrativo'}
        </h4>
      </div>

      {formData.tipo === GAME_TYPES.RASPADINHA && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">% Total Prémios:</span>
            <span className={metricsRaspadinha.totalPercentagem! > 50 ? "text-red-500" : ""}>
              {metricsRaspadinha.totalPercentagem}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Custo Médio/Bilhete:</span>
            <span className="font-bold text-[#ff734b]">{metricsRaspadinha.custoMedioPorBilhete!.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Receita ({formData.stockInicial} bilhetes):</span>
            <span className="font-bold">{metricsRaspadinha.receitaTotal!.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Lucro Estimado:</span>
            <span className={metricsRaspadinha.lucroEstimado! >= 0 ? "text-green-500" : "text-red-500"}>
              {metricsRaspadinha.lucroEstimado!.toFixed(2)}€
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Margem:</span>
            <span className={metricsRaspadinha.margemLucro! >= 50 ? "text-green-500" : "text-red-500"}>
              {metricsRaspadinha.margemLucro!.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {(formData.tipo === GAME_TYPES.RIFA) && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Prémios:</span>
            <span className="font-bold text-[#ff734b]">{metricsRifa.totalPremios!.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Receita Total:</span>
            <span className="font-bold">{metricsRifa.receitaTotal!.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Lucro:</span>
            <span className={metricsRifa.lucroEstimado! >= 0 ? "text-green-500" : "text-red-500"}>
              {metricsRifa.lucroEstimado!.toFixed(2)}€
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Margem:</span>
            <span className={metricsRifa.margemLucro! >= 50 ? "text-green-500" : "text-red-500"}>
              {metricsRifa.margemLucro!.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {formData.tipo === GAME_TYPES.POIO_DA_VACA && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Quadrados:</span>
            <span className="font-bold">{metricsPoioDaVaca.totalQuadrados}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Receita Total:</span>
            <span className="font-bold">{metricsPoioDaVaca.receitaTotal!.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Custo Vaca:</span>
            <span className="font-bold text-[#ff734b]">{metricsPoioDaVaca.valorCompraVaca!.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Lucro:</span>
            <span className={metricsPoioDaVaca.lucroEstimado! >= 0 ? "text-green-500" : "text-red-500"}>
              {metricsPoioDaVaca.lucroEstimado!.toFixed(2)}€
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Margem:</span>
            <span className={metricsPoioDaVaca.margemLucro! >= 50 ? "text-green-500" : "text-red-500"}>
              {metricsPoioDaVaca.margemLucro!.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
