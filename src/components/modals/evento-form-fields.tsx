import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EVENTO_GAME_TYPES } from "./evento-game-types";
import { EventoRecurrenceFields } from "./evento-recurrence-fields";
import type { useRecurrenceConfig } from "@/features/admin/hooks/use-recurrence-config";

export const EVENT_STATES = {
  RASCUNHO: 'rascunho',
  ATIVO: 'ativo',
  PAUSADO: 'pausado',
  FINALIZADO: 'finalizado',
  CANCELADO: 'cancelado'
} as const;

export type EventState = typeof EVENT_STATES[keyof typeof EVENT_STATES];

export interface EventoFormData {
  nome: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  objectivoAngariacao: string;
  publico: boolean;
  aldeiaId: string;
  estado: EventState;
}

export interface AldeiaOption {
  id: string;
  nome: string;
}

interface EventoFormFieldsProps {
  formData: EventoFormData;
  errors: Record<string, string>;
  aldeias?: AldeiaOption[];
  aldeiaId?: string;
  initialData?: unknown;
  jogosSelecionados: string[];
  recurrence: ReturnType<typeof useRecurrenceConfig>;
  onChange: (field: string, value: string | boolean) => void;
  onErrorClear: (field: string) => void;
  onEstadoChange: (value: EventState) => void;
  onAldeiaChange: (value: string) => void;
  onToggleJogo: (jogoId: string) => void;
}

export function EventoFormFields({
  formData,
  errors,
  aldeias,
  aldeiaId,
  initialData,
  jogosSelecionados,
  recurrence,
  onChange,
  onErrorClear,
  onEstadoChange,
  onAldeiaChange,
  onToggleJogo,
}: EventoFormFieldsProps) {
  return (
    <div className="grid gap-4 py-4 pr-2">
      {aldeias && aldeias.length > 0 && !initialData && (
        <div className="grid gap-2">
          <Label htmlFor="aldeia">Aldeia/Organização *</Label>
          <Select
            value={formData.aldeiaId}
            onValueChange={onAldeiaChange}
            required
            disabled={!!aldeiaId && !initialData}
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
          {!!aldeiaId && !initialData && (
            <p className="text-xs text-muted-foreground">O evento será criado nesta organização.</p>
          )}
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
            onChange("nome", e.target.value);
            onErrorClear("nome");
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
          onChange={(e) => onChange("descricao", e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="dataInicio">Data de Início *</Label>
          <Input
            id="dataInicio"
            type="datetime-local"
            value={formData.dataInicio}
            onChange={(e) => {
              onChange("dataInicio", e.target.value);
              onErrorClear("dataInicio");
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
              onChange("dataFim", e.target.value);
              onErrorClear("dataFim");
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
          onChange={(e) => onChange("objectivoAngariacao", e.target.value)}
        />
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          Meta a alcançar com as vendas deste evento. O progresso será mostrado no dashboard do admin.
          <span className="text-muted-foreground/60">(opcional)</span>
        </p>
      </div>

      <div className="grid gap-2">
        <Label>Criar Jogos para este Evento</Label>
        <p className="text-xs text-muted-foreground mb-2">Selecione os tipos de jogos — cada um será configurado depois de criar o evento</p>
        <div className="grid grid-cols-2 gap-2">
          {EVENTO_GAME_TYPES.map((jogo) => {
            const Icon = jogo.icon;
            const selecionado = jogosSelecionados.includes(jogo.id);
            return (
              <button
                key={jogo.id}
                type="button"
                onClick={() => onToggleJogo(jogo.id)}
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
          <p className="text-xs text-primary mt-2" aria-live="polite">
            {jogosSelecionados.length} jogo(s) será(ão) configurado(s) depois de criar o evento
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="estado">Estado do Evento</Label>
        <Select
          value={formData.estado}
          onValueChange={onEstadoChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
             <SelectItem value={EVENT_STATES.RASCUNHO}>Rascunho</SelectItem>
             <SelectItem value={EVENT_STATES.ATIVO}>Ativo</SelectItem>
             <SelectItem value={EVENT_STATES.PAUSADO}>Pausado</SelectItem>
             <SelectItem value={EVENT_STATES.FINALIZADO}>Finalizado</SelectItem>
             <SelectItem value={EVENT_STATES.CANCELADO}>Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Evento ativo fica visível para participantes</p>
      </div>

      <EventoRecurrenceFields recurrence={recurrence} dataFim={formData.dataFim} />

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
          onCheckedChange={(checked) => onChange("publico", checked)}
          aria-describedby="publico-description"
        />
        <p id="publico-description" className="sr-only">Ativar ou desativar visibilidade pública do evento</p>
      </div>
    </div>
  );
}