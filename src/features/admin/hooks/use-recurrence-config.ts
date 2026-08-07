import { useState, useCallback, useMemo } from "react";
import type { RecurrenceFrequency } from "@/lib/recurrence";

export interface RecurrenceConfigInitial {
  isRecurring?: boolean;
  frequency?: RecurrenceFrequency;
  dayOfWeek?: number;
  time?: string;
  maxOccurrences?: number;
}

export const DEFAULT_RECURRENCE_TIME = '08:00';

export function useRecurrenceConfig(initial?: RecurrenceConfigInitial) {
  const [isRecurring, setIsRecurring] = useState(initial?.isRecurring || false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(initial?.frequency || 'semanal');
  const [dayOfWeek, setDayOfWeek] = useState<number>(initial?.dayOfWeek ?? 1);
  const [time, setTime] = useState<string>(initial?.time || DEFAULT_RECURRENCE_TIME);
  const [maxOccurrences, setMaxOccurrences] = useState<number | undefined>(initial?.maxOccurrences);

  const reset = useCallback((init?: RecurrenceConfigInitial) => {
    setIsRecurring(init?.isRecurring || false);
    setFrequency(init?.frequency || 'semanal');
    setDayOfWeek(init?.dayOfWeek ?? 1);
    setTime(init?.time || DEFAULT_RECURRENCE_TIME);
    setMaxOccurrences(init?.maxOccurrences);
  }, []);

  const freqLabel = useMemo(
    () => (frequency === 'semanal' ? 'semana' : frequency === 'quinzenal' ? 'quinzena' : 'mês'),
    [frequency]
  );

  return {
    isRecurring,
    setIsRecurring,
    frequency,
    setFrequency,
    dayOfWeek,
    setDayOfWeek,
    time,
    setTime,
    maxOccurrences,
    setMaxOccurrences,
    freqLabel,
    reset,
  };
}