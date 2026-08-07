"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarDays } from "lucide-react";
import { EventoFormFields, EVENT_STATES } from "./evento-form-fields";
import type { EventoFormData, EventState } from "./evento-form-fields";
import { EventoGamesStep } from "./evento-games-step";
import { useRecurrenceConfig } from "@/features/admin/hooks/use-recurrence-config";

const safeParseFloat = (val: string, fallback: number = 0): number => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
};

interface Aldeia {
  id: string;
  nome: string;
}

export interface EventoData {
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
  isRecurring?: boolean;
  recurrenceFrequency?: 'semanal' | 'quinzenal' | 'mensal';
  recurrenceDayOfWeek?: number;
  recurrenceTime?: string;
  maxOccurrences?: number;
}

interface CreateEventoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EventoData) => Promise<{ eventoId?: string; jogosSelecionados?: string[] } | void>;
  aldeiaId?: string;
  initialData?: EventoData;
  aldeias?: Aldeia[];
  onSubmitJogo?: (data: any) => Promise<void>;
}

export function CreateEventoModal({
  open,
  onOpenChange,
  onSubmit,
  aldeiaId,
  initialData,
  aldeias,
  onSubmitJogo,
}: CreateEventoModalProps) {
  const [formData, setFormData] = useState<EventoFormData>(() => buildInitialFormData(aldeiaId));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [jogosSelecionados, setJogosSelecionados] = useState<string[]>([]);
  const recurrence = useRecurrenceConfig();

  const [step, setStep] = useState<'event' | 'games'>('event');
  const [createdEventoId, setCreatedEventoId] = useState<string | null>(null);
  const [configuredGames, setConfiguredGames] = useState<Set<string>>(new Set());

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
      recurrence.reset({
        isRecurring: initialData.isRecurring || false,
        frequency: initialData.recurrenceFrequency,
        dayOfWeek: initialData.recurrenceDayOfWeek,
        time: initialData.recurrenceTime,
        maxOccurrences: initialData.maxOccurrences,
      });
    } else if (!open) {
      resetAll();
    } else if (aldeiaId && !initialData) {
      setFormData(prev => ({ ...prev, aldeiaId }));
      resetAll();
    }
  }, [initialData, open, aldeiaId]);

  const resetAll = () => {
    setFormData(buildInitialFormData(aldeiaId));
    setErrors({});
    setSubmitError(null);
    setJogosSelecionados([]);
    recurrence.reset();
    setStep('event');
    setCreatedEventoId(null);
    setConfiguredGames(new Set());
  };

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
    if (recurrence.isRecurring) {
      if (!recurrence.time) {
        newErrors.recurrenceTime = "Horário é obrigatório para eventos recorrentes";
      }
      if (recurrence.maxOccurrences && recurrence.maxOccurrences < 1) {
        newErrors.maxOccurrences = "Número máximo deve ser maior que 0";
      }
    }

    return newErrors;
  }, [formData, recurrence.isRecurring, recurrence.time, recurrence.maxOccurrences]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const submitData: EventoData = {
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
        isRecurring: recurrence.isRecurring,
        recurrenceFrequency: recurrence.isRecurring ? recurrence.frequency : undefined,
        recurrenceDayOfWeek: recurrence.isRecurring ? recurrence.dayOfWeek : undefined,
        recurrenceTime: recurrence.isRecurring ? recurrence.time : undefined,
        maxOccurrences: recurrence.isRecurring ? recurrence.maxOccurrences : undefined,
      };

      if (!onSubmit) {
        throw new Error('onSubmit não está definido');
      }

      const result = await onSubmit(submitData);

      if (!initialData && result && 'eventoId' in result && result.eventoId && jogosSelecionados.length > 0 && onSubmitJogo) {
        setCreatedEventoId(result.eventoId);
        setStep('games');
      } else {
        onOpenChange(false);
      }
      setErrors({});
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      setSubmitError(error instanceof Error ? error.message : 'Erro ao guardar o evento');
    } finally {
      setLoading(false);
    }
  }, [formData, jogosSelecionados, initialData, aldeiaId, onSubmit, onOpenChange, validateForm, onSubmitJogo, recurrence]);

  const handleErrorClear = useCallback((field: string) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  }, [errors]);

  const handleConfiguredGame = useCallback((tipoId: string) => {
    setConfiguredGames(prev => new Set([...prev, tipoId]));
  }, []);

  if (step === 'games' && createdEventoId && onSubmitJogo) {
    return (
      <EventoGamesStep
        open={open}
        onClose={() => onOpenChange(false)}
        eventoNome={formData.nome}
        tipoIds={jogosSelecionados}
        configured={configuredGames}
        onConfigured={handleConfiguredGame}
        onSubmitJogo={onSubmitJogo}
        eventoId={createdEventoId}
        aldeiaId={formData.aldeiaId}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="create-evento-description">
        <DialogHeader className="bg-gradient-to-r from-indigo-600/10 via-violet-600/10 to-purple-600/10 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-indigo-500/20">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-indigo-600/20 p-2 rounded-lg">
              <CalendarDays className="h-5 w-5 text-indigo-600" />
            </div>
            {initialData ? "Editar Evento" : "Novo Evento"}
          </DialogTitle>
          <DialogDescription>
            {initialData ? "Edite as informações do evento." : "Crie um novo evento de angariação de fundos."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} id="event-form">
          <EventoFormFields
            formData={formData}
            errors={errors}
            aldeias={aldeias}
            aldeiaId={aldeiaId}
            initialData={initialData}
            jogosSelecionados={jogosSelecionados}
            recurrence={recurrence}
            onChange={handleChange}
            onErrorClear={handleErrorClear}
            onEstadoChange={handleEstadoChange}
            onAldeiaChange={handleAldeiaChange}
            onToggleJogo={toggleJogoSelecionado}
          />

          <DialogFooter className="sticky bottom-0 bg-background pt-2 border-t" style={{ zIndex: 1000 }}>
            {submitError && (
              <p className="text-sm text-destructive w-full text-right" role="alert">{submitError}</p>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              style={{ position: 'relative', zIndex: 1001 }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              style={{
                position: 'relative',
                zIndex: 1001,
                backgroundColor: loading ? undefined : '#2563eb',
                border: loading ? undefined : '1px solid #2563eb'
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  A guardar...
                </>
              ) : (initialData ? "Guardar Alterações" : "Criar Evento")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function buildInitialFormData(aldeiaId?: string): EventoFormData {
  return {
    nome: "",
    descricao: "",
    dataInicio: "",
    dataFim: "",
    objectivoAngariacao: "",
    publico: false,
    aldeiaId: aldeiaId || "",
    estado: EVENT_STATES.RASCUNHO,
  };
}