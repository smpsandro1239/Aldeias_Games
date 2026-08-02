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
import { Card, CardContent } from "@/components/ui/card";
import {
  Gamepad2,
  Tag,
  Euro,
  Package,
  Users,
  Sparkles,
  Ticket,
  Star,
} from "lucide-react";
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
        const items = data.aldeias || data.data || [];
        const aldeias = (Array.isArray(items) ? items : []).map((a: { id: string; nome: string }) => ({ id: a.id, nome: a.nome }));
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
        const items = data.eventos || data.data || [];
        const eventos = (Array.isArray(items) ? items : []).map((e: { id: string; nome: string }) => ({ id: e.id, nome: e.nome }));
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
      const config = (submittedData.configuracao || {}) as Record<string, unknown>;
      const isRecorrenteEuromilhoes = submittedData.tipo === GAME_TYPES.EUROMILHOES && config.recorrente === true;

      if (isRecorrenteEuromilhoes) {
        const res = await apiRequest("/api/euromilhoes/recorrentes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventoId: submittedData.eventoId,
            nome: submittedData.nome,
            preco: submittedData.preco,
            stockInicial: submittedData.stockInicial,
            limitePorUsuario: submittedData.limitePorUsuario,
            descricao: submittedData.descricao,
            localSorteio: config.localSorteio || "",
            premioDescricao: config.recorrentePremioDescricao || "",
            premioValor: config.recorrentePremioValor || undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Erro ao criar jogo recorrente");
        }
      } else {
        await onSubmit(submittedData);
      }

      setShowTransparency(false);
      onOpenChange(false);
      resetForm();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      toast.error(err.message || "Erro ao criar jogo");
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

  const tipoIcons: Record<string, React.ReactNode> = {
    [GAME_TYPES.RASPADINHA]: <Sparkles className="h-4 w-4" />,
    [GAME_TYPES.RIFA]: <Ticket className="h-4 w-4" />,
    [GAME_TYPES.EUROMILHOES]: <Star className="h-4 w-4" />,
    [GAME_TYPES.POIO_DA_VACA]: <Gamepad2 className="h-4 w-4" />,
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto" aria-describedby="create-jogo-description">
          <DialogHeader className="bg-gradient-to-r from-primary/10 via-violet-600/10 to-transparent -mx-6 -mt-6 px-6 pt-6 pb-4 mb-2 border-b border-outline-variant/10 rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/20">
                {formData.tipo ? tipoIcons[formData.tipo] || <Gamepad2 className="h-5 w-5 text-primary" /> : <Gamepad2 className="h-5 w-5 text-primary" />}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-accent">{initialData ? "Editar Jogo" : "Novo Jogo"}</DialogTitle>
                <DialogDescription id="create-jogo-description" className="text-xs">
                  {initialData ? "Edite as informações do jogo." : "Crie um novo jogo para este evento."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-5 py-2">

              {/* === TIPO E LOCALIZAÇÃO === */}
              <Card className="border-outline-variant/10 overflow-hidden">
                <div className="bg-gradient-to-r from-primary/5 to-transparent px-4 py-2.5 border-b border-outline-variant/5">
                  <h3 className="text-sm font-semibold text-accent flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4 text-primary" />
                    Tipo e Localização
                  </h3>
                </div>
                <CardContent className="p-4 space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tipo" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo de Jogo *</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value: JogoFormData["tipo"]) =>
                        updateFormData({ tipo: value })
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={GAME_TYPES.RASPADINHA}><span className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Raspadinha</span></SelectItem>
                        <SelectItem value={GAME_TYPES.RIFA}><span className="flex items-center gap-2"><Ticket className="h-4 w-4" /> Rifa</span></SelectItem>
                        <SelectItem value={GAME_TYPES.EUROMILHOES}><span className="flex items-center gap-2"><Star className="h-4 w-4" /> Euromilhões</span></SelectItem>
                        <SelectItem value={GAME_TYPES.POIO_DA_VACA}><span className="flex items-center gap-2"><Gamepad2 className="h-4 w-4" /> Poio da Vaca</span></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {needsAldeiaSelection && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aldeia *</Label>
                        <Select
                          value={selectedAldeiaId}
                          onValueChange={(value) => {
                            setSelectedAldeiaId(value);
                            setSelectedEventoIdLocal("");
                          }}
                          disabled={loadingAldeias}
                        >
                          <SelectTrigger className="h-10">
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
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Evento *</Label>
                        <Select
                          value={selectedEventoIdLocal}
                          onValueChange={setSelectedEventoIdLocal}
                          disabled={!selectedAldeiaId || loadingEventos}
                        >
                          <SelectTrigger className="h-10">
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
                    <Label htmlFor="nome" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome do Jogo *</Label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="nome"
                        placeholder="Ex: Rifa da Festa"
                        value={formData.nome}
                        onChange={(e) => updateFormData({ nome: e.target.value })}
                        required
                        className="pl-9 h-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* === PREÇO E STOCK === */}
              {(formData.tipo === GAME_TYPES.RIFA || formData.tipo === GAME_TYPES.EUROMILHOES || formData.tipo === GAME_TYPES.RASPADINHA) && (
                <Card className="border-outline-variant/10 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500/5 to-transparent px-4 py-2.5 border-b border-outline-variant/5">
                    <h3 className="text-sm font-semibold text-accent flex items-center gap-2">
                      <Euro className="h-4 w-4 text-emerald-500" />
                      Preço e Stock
                    </h3>
                  </div>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="preco" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preço (€) *</Label>
                        <div className="relative">
                          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="preco"
                            type="number"
                            min="0.5"
                            step="0.01"
                            value={formData.preco}
                            onChange={(e) => updateFormData({ preco: e.target.value })}
                            required
                            className="pl-9 h-10"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="stockInicial" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock Total *</Label>
                        <div className="relative">
                          <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="stockInicial"
                            type="number"
                            min="1"
                            value={formData.stockInicial}
                            onChange={(e) => updateFormData({ stockInicial: e.target.value })}
                            required
                            className="pl-9 h-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface-container-low rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={formData.limitePorUsuario !== "0"}
                            onChange={(e) => updateFormData({ limitePorUsuario: e.target.checked ? "10" : "0" })}
                          />
                          <div className="w-10 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </div>
                        <div className="flex-1">
                          <Label className="text-sm font-medium cursor-pointer">Limitar participações por utilizador</Label>
                          <p className="text-xs text-muted-foreground">Restringe o número máximo de bilhetes que cada pessoa pode comprar</p>
                        </div>
                      </div>
                      {formData.limitePorUsuario !== "0" && (
                        <div className="mt-3 pt-3 border-t border-outline-variant/10">
                          <Label htmlFor="limitePorUsuario" className="text-xs font-medium text-muted-foreground">Máximo por utilizador</Label>
                          <div className="relative mt-1">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="limitePorUsuario"
                              type="number"
                              min="1"
                              max="1000"
                              value={formData.limitePorUsuario}
                              onChange={(e) => updateFormData({ limitePorUsuario: e.target.value })}
                              className="pl-9 h-10"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
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

              {(formData.tipo === GAME_TYPES.RIFA || formData.tipo === GAME_TYPES.EUROMILHOES) && (
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

              {/* === LUCRATIVIDADE === */}
              <LucratividadeCard
                formData={formData}
                getMetrics={getMetrics}
                metricsRaspadinha={metricsRaspadinha}
                metricsRifa={metricsRifa}
                metricsPoioDaVaca={metricsPoioDaVaca}
              />
            </div>

            <DialogFooter className="mt-6 pt-4 border-t border-outline-variant/10">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-outline-variant/20">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !isLucrativo || !formData.nome.trim()}
                className={isLucrativo ? "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all active:scale-[0.98]" : ""}
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
