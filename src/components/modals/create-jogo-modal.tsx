"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useCallback, useState } from "react";
import { toast } from "sonner";
import { TransparencyModal } from "./transparency-modal";
import { apiRequest } from "@/lib/api-client";
import {
  GAME_TYPES,
  type CreateJogoModalProps,
  type JogoFormData,
} from "./create-jogo-types";
import { getTransparencyData } from "./create-jogo-types";
import { useJogoForm } from "./use-jogo-form";
import { RaspadinhaConfig } from "./raspadinha-config";
import { RifaConfig } from "./rifa-config";
import { PoioConfig } from "./poio-config";
import { LucratividadeCard } from "./lucratividade-card";

export function CreateJogoModal({
  open,
  onOpenChange,
  onSubmit,
  eventoId: propEventoId,
  initialData,
  userRole,
}: CreateJogoModalProps) {
  const [aldeiasList, setAldeiasList] = useState<Array<{ id: string; nome: string }>>([]);
  const [eventosList, setEventosList] = useState<Array<{ id: string; nome: string }>>([]);
  const [selectedAldeiaId, setSelectedAldeiaId] = useState("");
  const [selectedEventoIdLocal, setSelectedEventoIdLocal] = useState("");
  const [loadingAldeias, setLoadingAldeias] = useState(false);
  const [loadingEventos, setLoadingEventos] = useState(false);

  const needsAldeiaSelection = userRole === "super_admin" && !propEventoId && !initialData;
  const effectiveEventoId = propEventoId || selectedEventoIdLocal;

  const {
    formData,
    raspadinhaPremios,
    rifaPremios,
    loading,
    showTransparency,
    submittedData,
    updateFormData,
    setLoading,
    setShowTransparency,
    setSubmittedData,
    resetForm,
    expectedCountMap,
    metricsRaspadinha,
    metricsRifa,
    metricsPoioDaVaca,
    getMetrics,
    isLucrativo,
    handlePremioRaspadinhaChange,
    handlePremioRifaChange,
    adicionarPremioRaspadinha,
    adicionarPremioRifa,
    removerPremioRaspadinha,
    removerPremioRifa,
    handleSubmit,
  } = useJogoForm(initialData, propEventoId, effectiveEventoId, needsAldeiaSelection);

  useEffect(() => {
    if (!open || !needsAldeiaSelection) return;
    setLoadingAldeias(true);
    apiRequest("/api/aldeias")
      .then((res) => res.json())
      .then((data) => {
        const aldeias = (data.data || data || []).map((a: { id: string; nome: string }) => ({ id: a.id, nome: a.nome }));
        setAldeiasList(aldeias);
      })
      .catch(() => toast.error("Erro ao carregar aldeias"))
      .finally(() => setLoadingAldeias(false));
  }, [open, needsAldeiaSelection]);

  useEffect(() => {
    if (!selectedAldeiaId || !needsAldeiaSelection) {
      setEventosList([]);
      setSelectedEventoIdLocal("");
      return;
    }
    setLoadingEventos(true);
    apiRequest(`/api/eventos?aldeiaId=${selectedAldeiaId}&limit=100`)
      .then((res) => res.json())
      .then((data) => {
        const eventos = (data.data || data || []).map((e: { id: string; nome: string }) => ({ id: e.id, nome: e.nome }));
        setEventosList(eventos);
        setSelectedEventoIdLocal("");
      })
      .catch(() => toast.error("Erro ao carregar eventos"))
      .finally(() => setLoadingEventos(false));
  }, [selectedAldeiaId, needsAldeiaSelection]);

  const handleConfirmCreate = useCallback(async () => {
    if (!submittedData) return;
    setLoading(true);
    try {
      await onSubmit(submittedData);
      setShowTransparency(false);
      onOpenChange(false);
      resetForm();
    } catch {
      toast.error("Erro ao criar jogo");
    } finally {
      setLoading(false);
    }
  }, [submittedData, onSubmit, setLoading, setShowTransparency, onOpenChange, resetForm]);

  useEffect(() => {
    if (!open) {
      resetForm();
      setSelectedAldeiaId("");
      setSelectedEventoIdLocal("");
      setAldeiasList([]);
      setEventosList([]);
    }
  }, [open, resetForm]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto" aria-describedby="create-jogo-description">
          <DialogHeader>
            <DialogTitle>{initialData ? "Editar Jogo" : "Novo Jogo"}</DialogTitle>
            <DialogDescription id="create-jogo-description">
              {initialData ? "Edite as informações do jogo." : "Crie um novo jogo para este evento."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo de Jogo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: JogoFormData["tipo"]) =>
                    updateFormData({ tipo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GAME_TYPES.RASPADINHA}>Raspadinha</SelectItem>
                    <SelectItem value={GAME_TYPES.RIFA}>Rifa</SelectItem>
                    <SelectItem value={GAME_TYPES.EUROMILHOES}>Euromilhões</SelectItem>
                    <SelectItem value={GAME_TYPES.POIO_DA_VACA}>Poio da Vaca</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {needsAldeiaSelection && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Aldeia *</Label>
                    <Select
                      value={selectedAldeiaId}
                      onValueChange={(value) => {
                        setSelectedAldeiaId(value);
                        setSelectedEventoIdLocal("");
                      }}
                      disabled={loadingAldeias}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingAldeias ? "A carregar..." : "Selecionar aldeia"} />
                      </SelectTrigger>
                      <SelectContent>
                        {aldeiasList.map((a) => (
                          <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>Evento *</Label>
                    <Select
                      value={selectedEventoIdLocal}
                      onValueChange={setSelectedEventoIdLocal}
                      disabled={!selectedAldeiaId || loadingEventos}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingEventos ? "A carregar..." : selectedAldeiaId ? "Selecionar evento" : "Primeiro selecione a aldeia"} />
                      </SelectTrigger>
                      <SelectContent>
                        {eventosList.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="nome">Nome do Jogo *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Rifa da Festa"
                  value={formData.nome}
                  onChange={(e) => updateFormData({ nome: e.target.value })}
                  required
                />
              </div>

              {(formData.tipo === GAME_TYPES.RIFA || formData.tipo === GAME_TYPES.RASPADINHA) && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="preco">Preço (€) *</Label>
                      <Input
                        id="preco"
                        type="number"
                        min="0.5"
                        step="0.01"
                        value={formData.preco}
                        onChange={(e) => updateFormData({ preco: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stockInicial">Stock Total *</Label>
                      <Input
                        id="stockInicial"
                        type="number"
                        min="1"
                        value={formData.stockInicial}
                        onChange={(e) => updateFormData({ stockInicial: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.limitePorUsuario !== "0"}
                        onChange={(e) => updateFormData({ limitePorUsuario: e.target.checked ? "10" : "0" })}
                      />
                      <div className="w-9 h-5 bg-gray-300 peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                    <Label className="text-sm">Limitar participações por utilizador</Label>
                  </div>
                  {formData.limitePorUsuario !== "0" && (
                    <div className="grid gap-2 mt-2">
                      <Label htmlFor="limitePorUsuario">Máximo de participações por utilizador</Label>
                      <Input
                        id="limitePorUsuario"
                        type="number"
                        min="1"
                        max="1000"
                        value={formData.limitePorUsuario}
                        onChange={(e) => updateFormData({ limitePorUsuario: e.target.value })}
                      />
                    </div>
                  )}
                </>
              )}

              {formData.tipo === GAME_TYPES.RASPADINHA && (
                <RaspadinhaConfig
                  formData={formData}
                  raspadinhaPremios={raspadinhaPremios}
                  isLucrativo={isLucrativo}
                  metricsRaspadinha={metricsRaspadinha}
                  expectedCountMap={expectedCountMap}
                  updateFormData={updateFormData}
                  handlePremioRaspadinhaChange={handlePremioRaspadinhaChange}
                  adicionarPremioRaspadinha={adicionarPremioRaspadinha}
                  removerPremioRaspadinha={removerPremioRaspadinha}
                />
              )}

              {(formData.tipo === GAME_TYPES.RIFA) && (
                <RifaConfig
                  formData={formData}
                  rifaPremios={rifaPremios}
                  updateFormData={updateFormData}
                  handlePremioRifaChange={handlePremioRifaChange}
                  adicionarPremioRifa={adicionarPremioRifa}
                  removerPremioRifa={removerPremioRifa}
                />
              )}

              {formData.tipo === GAME_TYPES.POIO_DA_VACA && (
                <PoioConfig
                  formData={formData}
                  updateFormData={updateFormData}
                />
              )}

              <div className="border-t pt-4 mt-2">
                <LucratividadeCard
                  formData={formData}
                  getMetrics={getMetrics}
                  metricsRaspadinha={metricsRaspadinha}
                  metricsRifa={metricsRifa}
                  metricsPoioDaVaca={metricsPoioDaVaca}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !isLucrativo || !formData.nome.trim()}
                className={isLucrativo ? "bg-green-500 hover:bg-green-600" : ""}
              >
                {loading ? "A guardar..." : (initialData ? "Guardar Alterações" : "Criar Jogo")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TransparencyModal
        open={showTransparency}
        onOpenChange={setShowTransparency}
        onConfirm={handleConfirmCreate}
        data={getTransparencyData(formData, raspadinhaPremios, rifaPremios)}
        loading={loading}
      />
    </>
  );
}
