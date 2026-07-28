"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { JogoFormData } from "./create-jogo-types";

interface PoioConfigProps {
  formData: JogoFormData;
  updateFormData: (updates: Partial<JogoFormData>) => void;
}

export function PoioConfig({ formData, updateFormData }: PoioConfigProps) {
  return (
    <div className="border-t pt-4 mt-2 space-y-4">
      <h3 className="text-sm font-semibold">Configuração do Campo</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="dimensoesX">Largura (X)</Label>
          <Input
            id="dimensoesX"
            type="number"
            min="2"
            max="20"
            value={formData.dimensoesX}
            onChange={(e) => updateFormData({ dimensoesX: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dimensoesY">Altura (Y)</Label>
          <Input
            id="dimensoesY"
            type="number"
            min="2"
            max="20"
            value={formData.dimensoesY}
            onChange={(e) => updateFormData({ dimensoesY: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="custoQuadrado">Custo por Quadrado (€)</Label>
          <Input
            id="custoQuadrado"
            type="number"
            min="1"
            step="0.5"
            value={formData.custoQuadrado}
            onChange={(e) => updateFormData({ custoQuadrado: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="valorCompraVaca">Valor da Vaca (€)</Label>
          <Input
            id="valorCompraVaca"
            type="number"
            min="0"
            value={formData.valorCompraVaca}
            onChange={(e) => updateFormData({ valorCompraVaca: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
