import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { computeRecurrencePreview, formatRecDate } from "@/lib/recurrence";
import type { useRecurrenceConfig } from "@/features/admin/hooks/use-recurrence-config";

type RecurrenceConfig = ReturnType<typeof useRecurrenceConfig>;

interface EventoRecurrenceFieldsProps {
  recurrence: RecurrenceConfig;
  dataFim?: string;
}

export function EventoRecurrenceFields({ recurrence, dataFim }: EventoRecurrenceFieldsProps) {
  const preview = useMemo(
    () => computeRecurrencePreview(
      {
        frequency: recurrence.frequency,
        dayOfWeek: recurrence.dayOfWeek,
        time: recurrence.time,
        maxOccurrences: recurrence.maxOccurrences,
      },
      dataFim
    ),
    [recurrence.frequency, recurrence.dayOfWeek, recurrence.time, recurrence.maxOccurrences, dataFim]
  );

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="recurring">Evento Recorrente</Label>
          <p className="text-sm text-muted-foreground">
            Criar automaticamente novos eventos neste horário
          </p>
        </div>
        <Switch
          id="recurring"
          checked={recurrence.isRecurring}
          onCheckedChange={recurrence.setIsRecurring}
        />
      </div>

      {recurrence.isRecurring && (
        <div className="bg-surface-container-low/50 rounded-2xl p-4 border border-outline-variant/20 space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            Configuração da Recorrência
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="frequency">Frequência</Label>
              <Select
                value={recurrence.frequency}
                onValueChange={(value: 'semanal' | 'quinzenal' | 'mensal') => recurrence.setFrequency(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="quinzenal">Quinzenal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dayOfWeek">Dia da Semana</Label>
              <Select
                value={String(recurrence.dayOfWeek)}
                onValueChange={(value) => recurrence.setDayOfWeek(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Domingo</SelectItem>
                  <SelectItem value="1">Segunda-feira</SelectItem>
                  <SelectItem value="2">Terça-feira</SelectItem>
                  <SelectItem value="3">Quarta-feira</SelectItem>
                  <SelectItem value="4">Quinta-feira</SelectItem>
                  <SelectItem value="5">Sexta-feira</SelectItem>
                  <SelectItem value="6">Sábado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="time">Horário</Label>
              <Input
                id="time"
                type="time"
                value={recurrence.time}
                onChange={(e) => recurrence.setTime(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxOccurrences">Máx. Ocorrências (opcional)</Label>
              <Input
                id="maxOccurrences"
                type="number"
                min="1"
                placeholder="Ilimitado"
                value={recurrence.maxOccurrences || ""}
                onChange={(e) => recurrence.setMaxOccurrences(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 space-y-1.5">
            <p className="text-xs text-accent font-medium">
              As ocorrências serão criadas automaticamente às {recurrence.time} de cada {recurrence.freqLabel}.
              {recurrence.maxOccurrences && recurrence.maxOccurrences >= 1 ? ` Máximo de ${recurrence.maxOccurrences} ocorrências.` : " Sem limite de ocorrências."}
            </p>

            {preview.hasFim ? (
              preview.countAteFim === 0 ? (
                <p className="text-xs text-amber-600 font-medium">
                  Nenhuma ocorrência cabe antes da data de fim ({formatRecDate(new Date(dataFim!))}). Aumenta a data de fim ou reduz a frequência.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {preview.effective} ocorrência{preview.effective === 1 ? "" : "s"} até {formatRecDate(new Date(dataFim!))}
                  {preview.lastDate ? ` — última a ${formatRecDate(preview.lastDate)}.` : "."}
                  {preview.limitCompleto
                    ? " O limite definido cabe no período."
                    : " O período da festa limita o nº de ocorrências."}
                </p>
              )
            ) : (
              <p className="text-xs text-muted-foreground">
                Define a data de fim para ver o calendário de ocorrências.
              </p>
            )}

            {preview.hasFim && preview.countAteFim > 0 && !preview.limitCompleto && recurrence.maxOccurrences && recurrence.maxOccurrences >= 1 && (
              <p className="text-xs text-amber-600 font-medium">
                Aviso: o limite de {recurrence.maxOccurrences} ocorrências ultrapassa a data de fim — só cabem {preview.countAteFim} até {formatRecDate(new Date(dataFim!))}. Reduz o nº ou aumenta a data de fim.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}