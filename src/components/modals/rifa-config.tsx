"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Trophy, Euro, Info, Star } from "lucide-react";
import { GAME_TYPES, safeParseFloat, type Premio, type JogoFormData } from "./create-jogo-types";

interface RifaConfigProps {
  formData: JogoFormData;
  rifaPremios: Premio[];
  updateFormData: (updates: Partial<JogoFormData>) => void;
  handlePremioRifaChange: (id: string, field: keyof Premio, value: string | number) => void;
  adicionarPremioRifa: () => void;
  removerPremioRifa: (id: string) => void;
}

export function RifaConfig({
  formData,
  rifaPremios,
  updateFormData,
  handlePremioRifaChange,
  adicionarPremioRifa,
  removerPremioRifa,
}: RifaConfigProps) {
  const isEuromilhoesRecorrente = formData.tipo === GAME_TYPES.EUROMILHOES && formData.recorrenteEuromilhoes;

  return (
    <>
      {formData.tipo === GAME_TYPES.EUROMILHOES && (
        <div className="border-t pt-4 mt-2 space-y-4">
          <Alert className="bg-purple-500/10 border-purple-500/30">
            <Info className="h-4 w-4 text-purple-500" />
            <AlertTitle className="text-purple-600">Sorteio oficial do Euromilhões</AlertTitle>
            <AlertDescription>
              O número vencedor será o <strong>primeiro número</strong> do sorteio oficial do Euromilhões de sexta-feira
              (21:30, RTP1). O sorteio decorre automaticamente após a publicação do resultado oficial.
            </AlertDescription>
          </Alert>

          <div className="bg-surface-container-low rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="relative inline-flex items-center cursor-pointer">
                <Switch
                  checked={formData.recorrenteEuromilhoes}
                  onCheckedChange={(checked) => updateFormData({ recorrenteEuromilhoes: checked })}
                />
              </div>
              <div className="flex-1">
                <Label className="text-sm font-medium cursor-pointer">Jogo recorrente (todas as sextas-feiras)</Label>
                <p className="text-xs text-muted-foreground">
                  Cria automaticamente uma nova grelha de sorteio a cada sexta-feira, alinhada com o sorteio oficial.
                </p>
              </div>
            </div>

            {formData.recorrenteEuromilhoes && (
              <div className="mt-4 pt-3 border-t border-outline-variant/10 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Star className="h-3.5 w-3.5 text-purple-500" />
                  O sorteio será realizado automaticamente todas as sextas-feiras às 21:30, usando o primeiro número do
                  sorteio oficial do Euromilhões.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="recorrentePremioDescricao" className="text-xs">Descrição do Prémio</Label>
                    <Input
                      id="recorrentePremioDescricao"
                      placeholder="Ex: Prémio semanal"
                      value={formData.recorrentePremioDescricao}
                      onChange={(e) => updateFormData({ recorrentePremioDescricao: e.target.value })}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="recorrentePremioValor" className="text-xs">Valor do Prémio (€)</Label>
                    <div className="relative">
                      <Euro className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        id="recorrentePremioValor"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.recorrentePremioValor || ""}
                        onChange={(e) => updateFormData({ recorrentePremioValor: e.target.value })}
                        className="h-9 text-sm pl-7"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="border-t pt-4 mt-2 space-y-4">
        <h3 className="text-sm font-semibold">Detalhes do Sorteio</h3>
        {isEuromilhoesRecorrente ? (
          <div className="grid grid-cols-1 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="localSorteio" className="text-xs">Local *</Label>
              <Input
                id="localSorteio"
                type="text"
                placeholder="Ex: Salão da Junta"
                value={formData.localSorteio}
                onChange={(e) => updateFormData({ localSorteio: e.target.value })}
                className="h-9 text-sm"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Data e hora automáticas: todas as sextas-feiras às 21:30.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="dataSorteio" className="text-xs">Data *</Label>
              <Input
                id="dataSorteio"
                type="date"
                value={formData.dataSorteio}
                onChange={(e) => updateFormData({ dataSorteio: e.target.value })}
                className="h-9 text-sm"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="horaSorteio" className="text-xs">Hora *</Label>
              <Input
                id="horaSorteio"
                type="time"
                value={formData.horaSorteio}
                onChange={(e) => updateFormData({ horaSorteio: e.target.value })}
                className="h-9 text-sm"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="localSorteio" className="text-xs">Local *</Label>
              <Input
                id="localSorteio"
                type="text"
                placeholder="Ex: Salão da Junta"
                value={formData.localSorteio}
                onChange={(e) => updateFormData({ localSorteio: e.target.value })}
                className="h-9 text-sm"
                required
              />
            </div>
          </div>
        )}
      </div>

      <div className="border-t pt-4 mt-2 space-y-4">
        <h3 className="text-sm font-semibold">Prémios</h3>

        <div className="space-y-3">
          {rifaPremios.map((premio) => (
            <div key={premio.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end p-3 bg-[#2e2928] rounded-lg">
              <div className="hidden sm:flex col-span-1 items-center justify-center">
                <Trophy className="h-4 w-4 text-[#ff734b]" />
              </div>
              <div className="col-span-1 sm:col-span-6">
                <Input
                  placeholder="Nome do Prémio"
                  value={premio.nome}
                  onChange={(e) => handlePremioRifaChange(premio.id, "nome", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="col-span-1 sm:col-span-4">
                <div className="relative">
                  <Euro className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Valor"
                    value={premio.valorDinheiroAlternative || ""}
                    onChange={(e) => handlePremioRifaChange(premio.id, "valorDinheiroAlternative", safeParseFloat(e.target.value, 0))}
                    className="h-8 text-sm pl-7"
                  />
                </div>
              </div>
              <div className="col-span-1 flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500"
                  onClick={() => removerPremioRifa(premio.id)}
                >
                  🗑️
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" size="sm" onClick={adicionarPremioRifa}>
          + Adicionar Prémio
        </Button>
      </div>
    </>
  );
}
