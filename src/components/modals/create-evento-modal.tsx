"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gift, Star, Award, Gamepad2 } from "lucide-react";

// Constants for game types to avoid magic strings
const GAME_TYPES = [
  { id: "raspadinha", nome: "Raspadinha", descricao: "Jogo de raspar instantâneo", icon: Gift },
  { id: "rifa", nome: "Rifa", descricao: "Sorteio de números", icon: Star },
  { id: "tombola", nome: "Tombola", descricao: "Lotaria tradicional", icon: Award },
  { id: "poio_vaca", nome: "Poio da Vaca", descricao: "Jogo rápido", icon: Gamepad2 },
] as const;

// Constants for event states
const EVENT_STATES = {
  RASCUNHO: 'rascunho',
  ATIVO: 'ativo',
  FECHADO: 'fechado',
  FINALIZADO: 'finalizado'
} as const;

type EventState = typeof EVENT_STATES[keyof typeof EVENT_STATES];

// Safe parsing helpers
const safeParseFloat = (val: string, fallback: number = 0): number => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
};

interface Aldeia {
  id: string;
  nome: string;
}

interface EventoData {
  id?: string;
  nome: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  objectivoAngariacao?: number;
  publico: boolean;
  aldeiaId: string;
  estado: EventState;
  jogosSelecionados?: string[];
}

interface CreateEventoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EventoData) => Promise<void>;
  aldeiaId?: string;
  initialData?: EventoData;
  aldeias?: Aldeia[];
}

export function CreateEventoModal({
  open,
  onOpenChange,
  onSubmit,
  aldeiaId,
  initialData,
  aldeias
}: CreateEventoModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    dataInicio: "",
    dataFim: "",
    objectivoAngariacao: "",
    publico: false,
    aldeiaId: aldeiaId || "",
    estado: EVENT_STATES.RASCUNHO as EventState,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [jogosSelecionados, setJogosSelecionados] = useState<string[]>([]);

  useEffect(() => {
    if (initialData && open) {
      setFormData({
        nome: initialData.nome || "",
        descricao: initialData.descricao || "",
        dataInicio: initialData.dataInicio ? new Date(initialData.dataInicio).toISOString().slice(0, 16) : "",
        dataFim: initialData.dataFim ? new Date(initialData.dataFim).toISOString().slice(0, 16) : "",
        objectivoAngariacao: initialData.objectivoAngariacao ? String(initialData.objectivoAngariacao) : "",
        publico: initialData.publico || false,
        aldeiaId: initialData.aldeiaId || aldeiaId || "",
        estado: initialData.estado || EVENT_STATES.RASCUNHO,
      });
      setJogosSelecionados(initialData.jogosSelecionados || []);
    } else if (!open) {
      setFormData({
        nome: "",
        descricao: "",
        dataInicio: "",
        dataFim: "",
        objectivoAngariacao: "",
        publico: false,
        aldeiaId: aldeiaId || "",
        estado: EVENT_STATES.RASCUNHO,
      });
      setJogosSelecionados([]);
    }
  }, [initialData, open, aldeiaId]);

  const handleChange = useCallback((field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleEstadoChange = useCallback((value: EventState) => {
    setFormData(prev => ({ ...prev, estado: value }));
  }, []);

  const handleAldeiaChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, aldeiaId: value }));
  }, []);

  const toggleJogoSelecionado = useCallback((jogoId: string) => {
    setJogosSelecionados(prev =>
      prev.includes(jogoId)
        ? prev.filter(id => id !== jogoId)
        : [...prev, jogoId]
    );
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome || formData.nome.length < 2) {
      newErrors.nome = "Nome deve ter pelo menos 2 caracteres";
    }
    if (!formData.dataInicio) {
      newErrors.dataInicio = "Data de início é obrigatória";
    }
    if (!formData.dataFim) {
      newErrors.dataFim = "Data de fim é obrigatória";
    }
    if (formData.dataInicio && formData.dataFim && new Date(formData.dataFim) < new Date(formData.dataInicio)) {
      newErrors.dataFim = "Data de fim deve ser posterior à data de início";
    }
    if (!formData.aldeiaId) {
      newErrors.aldeiaId = "Selecione uma organização";
    }

    return newErrors;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('CreateEventoModal handleSubmit called');

    const newErrors = validateForm();
    console.log('Validation errors:', newErrors);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        id: initialData?.id,
        nome: formData.nome,
        descricao: formData.descricao || undefined,
        dataInicio: formData.dataInicio,
        dataFim: formData.dataFim,
        objectivoAngariacao: formData.objectivoAngariacao
          ? safeParseFloat(formData.objectivoAngariacao)
          : undefined,
        publico: formData.publico,
        aldeiaId: formData.aldeiaId,
        estado: formData.estado,
        jogosSelecionados: jogosSelecionados,
      };
      console.log('Submitting data:', submitData);

      await onSubmit(submitData);

      if (!initialData) {
        setFormData({
          nome: "",
          descricao: "",
          dataInicio: "",
          dataFim: "",
          objectivoAngariacao: "",
          publico: false,
          aldeiaId: aldeiaId || "",
          estado: EVENT_STATES.RASCUNHO,
        });
        setJogosSelecionados([]);
      }
      onOpenChange(false);
      setErrors({});
    } finally {
      setLoading(false);
    }
  }, [formData, jogosSelecionados, initialData, aldeiaId, onSubmit, onOpenChange, validateForm]);

  const handleErrorClear = useCallback((field: string) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  }, [errors]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="create-evento-description">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Evento" : "Novo Evento"}</DialogTitle>
          <DialogDescription id="create-evento-description">
            {initialData ? "Edite as informações do evento." : "Crie um novo evento de angariação de fundos."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[60vh]">
          <div className="grid gap-4 py-4 pr-2">
            {aldeias && aldeias.length > 0 && !initialData && (
              <div className="grid gap-2">
                <Label htmlFor="aldeia">Aldeia/Organização *</Label>
                <Select
                  value={formData.aldeiaId}
                  onValueChange={handleAldeiaChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma aldeia" />
                  </SelectTrigger>
                  <SelectContent>
                    {aldeias.map((al) => (
                      <SelectItem key={al.id} value={al.id}>
                        {al.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.aldeiaId && <p className="text-sm text-destructive" role="alert">{errors.aldeiaId}</p>}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Evento *</Label>
              <Input
                id="nome"
                placeholder="Ex: Festa de Verão 2024"
                value={formData.nome}
                onChange={(e) => {
                  handleChange("nome", e.target.value);
                  handleErrorClear("nome");
                }}
                required
                aria-describedby={errors.nome ? "nome-error" : "nome-description"}
              />
              <p id="nome-description" className="text-xs text-muted-foreground">Nome que aparecerá nos cartões e materiais</p>
              {errors.nome && <p id="nome-error" className="text-sm text-destructive" role="alert">{errors.nome}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o evento..."
                value={formData.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dataInicio">Data de Início *</Label>
                <Input
                  id="dataInicio"
                  type="datetime-local"
                  value={formData.dataInicio}
                  onChange={(e) => {
                    handleChange("dataInicio", e.target.value);
                    handleErrorClear("dataInicio");
                  }}
                  required
                  aria-describedby={errors.dataInicio ? "dataInicio-error" : "dataInicio-description"}
                />
                <p id="dataInicio-description" className="text-xs text-muted-foreground">Data de inicio do evento</p>
                {errors.dataInicio && <p id="dataInicio-error" className="text-sm text-destructive" role="alert">{errors.dataInicio}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dataFim">Data de Fim *</Label>
                <Input
                  id="dataFim"
                  type="datetime-local"
                  value={formData.dataFim}
                  onChange={(e) => {
                    handleChange("dataFim", e.target.value);
                    handleErrorClear("dataFim");
                  }}
                  required
                  aria-describedby={errors.dataFim ? "dataFim-error" : "dataFim-description"}
                />
                <p id="dataFim-description" className="text-xs text-muted-foreground">Data de fim do evento</p>
                {errors.dataFim && <p id="dataFim-error" className="text-sm text-destructive" role="alert">{errors.dataFim}</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="objectivo">Objetivo de Angariação (€)</Label>
              <Input
                id="objectivo"
                type="number"
                min="0"
                step="0.01"
                placeholder="5000"
                value={formData.objectivoAngariacao}
                onChange={(e) => handleChange("objectivoAngariacao", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Valor objetivo a angariar (opcional)</p>
            </div>

            {/* Seleção de Jogos */}
            <div className="grid gap-2">
              <Label>Criar Jogos para este Evento</Label>
              <p className="text-xs text-muted-foreground mb-2">Selecione os tipos de jogos que deseja criar automaticamente</p>
              <div className="grid grid-cols-2 gap-2">
                {GAME_TYPES.map((jogo) => {
                  const Icon = jogo.icon;
                  const selecionado = jogosSelecionados.includes(jogo.id);
                  return (
                    <button
                      key={jogo.id}
                      type="button"
                      onClick={() => toggleJogoSelecionado(jogo.id)}
                      className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${
                        selecionado
                          ? "border-primary bg-primary/10"
                          : "border-outline-variant/20 bg-surface-container hover:border-primary/30"
                      }`}
                      aria-label={`${selecionado ? 'Remover' : 'Adicionar'} jogo ${jogo.nome}`}
                      aria-pressed={selecionado}
                    >
                      <Icon className={`w-5 h-5 ${selecionado ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                      <span className={`text-sm font-medium ${selecionado ? "text-primary" : "text-muted-foreground"}`}>
                        {jogo.nome}
                      </span>
                    </button>
                  );
                })}
              </div>
              {jogosSelecionados.length > 0 && (
                <p className="text-xs text-primary" aria-live="polite">
                  {jogosSelecionados.length} jogo(s) será(ão) criado(s) automaticamente
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="estado">Estado do Evento</Label>
              <Select
                value={formData.estado}
                onValueChange={handleEstadoChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EVENT_STATES.RASCUNHO}>Rascunho</SelectItem>
                  <SelectItem value={EVENT_STATES.ATIVO}>Ativo</SelectItem>
                  <SelectItem value={EVENT_STATES.FECHADO}>Fechado</SelectItem>
                  <SelectItem value={EVENT_STATES.FINALIZADO}>Finalizado</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Evento ativo fica visível para participantes</p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="publico">Evento Público</Label>
                <p className="text-sm text-muted-foreground">
                  Visível para todos os utilizadores
                </p>
              </div>
              <Switch
                id="publico"
                checked={formData.publico}
                onCheckedChange={(checked) => handleChange("publico", checked)}
                aria-describedby="publico-description"
              />
              <p id="publico-description" className="sr-only">Ativar ou desativar visibilidade pública do evento</p>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-background pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "A guardar..." : (initialData ? "Guardar Alterações" : "Criar Evento")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}