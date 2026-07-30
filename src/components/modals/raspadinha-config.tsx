"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trophy, Euro, Percent } from "lucide-react";
import { safeParseFloat, type Premio, type JogoFormData } from "./create-jogo-types";

interface RaspadinhaConfigProps {
  formData: JogoFormData;
  raspadinhaPremios: Premio[];
  isLucrativo: boolean;
  metricsRaspadinha: {
    margemLucro?: number;
  };
  expectedCountMap: Map<string, number>;
  updateFormData: (updates: Partial<JogoFormData>) => void;
  handlePremioRaspadinhaChange: (id: string, field: keyof Premio, value: string | number) => void;
  adicionarPremioRaspadinha: () => void;
  removerPremioRaspadinha: (id: string) => void;
}

export function RaspadinhaConfig({
  formData,
  raspadinhaPremios,
  isLucrativo,
  metricsRaspadinha,
  expectedCountMap,
  updateFormData,
  handlePremioRaspadinhaChange,
  adicionarPremioRaspadinha,
  removerPremioRaspadinha,
}: RaspadinhaConfigProps) {
  return (
    <div className="border-t pt-4 mt-2 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Configuração da Raspadinha</h3>
        <Badge variant={isLucrativo ? "default" : "destructive"} className={isLucrativo ? "bg-green-500" : ""}>
          {isLucrativo ? `${metricsRaspadinha.margemLucro}% lucro` : "Lucro baixo!"}
        </Badge>
      </div>

      <div className="grid gap-3">
        <div className="grid gap-2">
          <Label htmlFor="raspadinhaTitulo">Título</Label>
          <Input
            id="raspadinhaTitulo"
            placeholder="Ex: RASPADINHA DA FESTA"
            value={formData.raspadinhaTitulo}
            onChange={(e) => updateFormData({ raspadinhaTitulo: e.target.value })}
          />
        </div>
        </div>

      <div className="bg-[#1f1b19] rounded-xl p-4 space-y-4 border border-[#ff734b]/20">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-[#ff734b]">Prémios e Percentagens</h4>
          <Button type="button" variant="outline" size="sm" onClick={adicionarPremioRaspadinha}>
            + Prémio
          </Button>
        </div>

        <div className="space-y-3">
          {raspadinhaPremios.map((premio) => (
            <div key={premio.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end p-3 bg-[#2e2928] rounded-lg">
              <div className="hidden sm:flex col-span-1 items-center justify-center">
                <Trophy className="h-4 w-4 text-[#ff734b]" />
              </div>
              <div className="col-span-1 sm:col-span-4">
                <Input
                  placeholder="Nome"
                  value={premio.nome}
                  onChange={(e) => handlePremioRaspadinhaChange(premio.id, "nome", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="col-span-1 sm:col-span-3">
                <div className="relative">
                  <Euro className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Valor"
                    value={premio.valorDinheiroAlternative || ""}
                    onChange={(e) => handlePremioRaspadinhaChange(premio.id, "valorDinheiroAlternative", safeParseFloat(e.target.value, 0))}
                    className="h-8 text-sm pl-7"
                  />
                </div>
              </div>
              <div className="col-span-1 sm:col-span-3">
                <div className="relative">
                  <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="%"
                    min="0"
                    max="50"
                    value={premio.percentagem || ""}
                    onChange={(e) => handlePremioRaspadinhaChange(premio.id, "percentagem", safeParseFloat(e.target.value, 0))}
                    className="h-8 text-sm pl-7"
                  />
                </div>
                {premio.percentagem > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ~{expectedCountMap.get(premio.id) || 0} prémios esperados
                  </p>
                )}
              </div>
              <div className="col-span-1 flex justify-center">
                {raspadinhaPremios.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500"
                    onClick={() => removerPremioRaspadinha(premio.id)}
                  >
                    🗑️
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4 mt-2 space-y-3">
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formData.raspadinhaMaxGanhadores !== "0"}
              onChange={(e) => updateFormData({ raspadinhaMaxGanhadores: e.target.checked ? "10" : "0" })}
            />
            <div className="w-9 h-5 bg-gray-300 peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
          </label>
          <Label className="text-sm">Limitar número total de ganhadores</Label>
        </div>
        {formData.raspadinhaMaxGanhadores !== "0" && (
          <div className="grid gap-2">
            <Label htmlFor="raspadinhaMaxGanhadores">Máximo de ganhadores neste jogo</Label>
            <Input
              id="raspadinhaMaxGanhadores"
              type="number"
              min="1"
              max="100000"
              value={formData.raspadinhaMaxGanhadores}
              onChange={(e) => updateFormData({ raspadinhaMaxGanhadores: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Quando este limite for atingido, as participações seguintes serão sem prémio.
            </p>
          </div>
        )}
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formData.raspadinhaMaxPremioTotal !== "0"}
              onChange={(e) => updateFormData({ raspadinhaMaxPremioTotal: e.target.checked ? "100" : "0" })}
            />
            <div className="w-9 h-5 bg-gray-300 peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
          </label>
          <Label className="text-sm">Limitar valor total de prémios (pool)</Label>
        </div>
        {formData.raspadinhaMaxPremioTotal !== "0" && (
          <div className="grid gap-2">
            <Label htmlFor="raspadinhaMaxPremioTotal">Valor máximo do pool de prémios (€)</Label>
            <Input
              id="raspadinhaMaxPremioTotal"
              type="number"
              min="1"
              max="1000000"
              value={formData.raspadinhaMaxPremioTotal}
              onChange={(e) => updateFormData({ raspadinhaMaxPremioTotal: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Quando o total de prémios distribuídos atingir este valor, as participações seguintes serão sem prémio.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
