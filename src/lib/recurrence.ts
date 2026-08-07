export type RecurrenceFrequency = 'semanal' | 'quinzenal' | 'mensal';

export interface RecurrenceInput {
  frequency: RecurrenceFrequency;
  dayOfWeek: number;
  time: string;
  maxOccurrences?: number;
}

export interface RecurrencePreview {
  hasFim: boolean;
  countAteFim: number;
  effective: number;
  lastDate: Date | null;
  limitCompleto: boolean;
}

export function computeFirstRecurrenceDate(
  frequency: RecurrenceFrequency,
  dayOfWeek: number,
  time: string,
  from: Date = new Date()
): Date | null {
  if (!time) return null;
  const [hours, minutes] = time.split(':').map(Number);
  const next = new Date(from);
  next.setHours(hours, minutes, 0, 0);
  const currentDay = next.getDay();
  const targetDay = dayOfWeek;
  let daysToAdd = targetDay - currentDay;

  if (daysToAdd <= 0) {
    if (frequency === 'semanal') {
      daysToAdd += 7;
    } else if (frequency === 'quinzenal') {
      daysToAdd += 14;
    } else if (frequency === 'mensal') {
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      while (next.getDay() !== targetDay) next.setDate(next.getDate() + 1);
    }
  } else {
    if (frequency === 'quinzenal') {
      daysToAdd += 7;
    } else if (frequency === 'mensal') {
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      while (next.getDay() !== targetDay) next.setDate(next.getDate() + 1);
    }
  }

  if (frequency !== 'mensal') next.setDate(next.getDate() + daysToAdd);
  return next;
}

export function addRecurrence(prev: Date, frequency: RecurrenceFrequency, dayOfWeek: number): Date {
  const next = new Date(prev);
  if (frequency === 'semanal') {
    next.setDate(next.getDate() + 7);
  } else if (frequency === 'quinzenal') {
    next.setDate(next.getDate() + 14);
  } else if (frequency === 'mensal') {
    next.setMonth(next.getMonth() + 1);
    while (next.getDay() !== dayOfWeek) {
      next.setDate(next.getDate() + (dayOfWeek > next.getDay() ? 1 : -6));
    }
  }
  return next;
}

export const formatRecDate = (d: Date) => d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });

export function computeRecurrencePreview(
  input: RecurrenceInput,
  dataFim?: string
): RecurrencePreview {
  if (!dataFim) {
    return { hasFim: false, countAteFim: 0, effective: 0, lastDate: null, limitCompleto: false };
  }

  if (!input.time) {
    return { hasFim: true, countAteFim: 0, effective: 0, lastDate: null, limitCompleto: false };
  }

  const dateFim = dataFim ? new Date(dataFim) : null;
  if (!dateFim || isNaN(dateFim.getTime())) {
    return { hasFim: true, countAteFim: 0, effective: 0, lastDate: null, limitCompleto: false };
  }

  const first = computeFirstRecurrenceDate(input.frequency, input.dayOfWeek, input.time);
  if (!first) {
    return { hasFim: true, countAteFim: 0, effective: 0, lastDate: null, limitCompleto: false };
  }

  const max = input.maxOccurrences && input.maxOccurrences >= 1 ? input.maxOccurrences : null;
  const dates: Date[] = [];
  let cursor = first;
  let safety = 0;
  while (safety++ < 5000) {
    if (cursor > dateFim) break;
    dates.push(new Date(cursor));
    cursor = addRecurrence(cursor, input.frequency, input.dayOfWeek);
  }
  const countAteFim = dates.length;
  const effective = max ? Math.min(max, countAteFim) : countAteFim;
  const lastDate = effective > 0 ? dates[effective - 1] : null;
  const limitCompleto = !!max && countAteFim >= max;
  return { hasFim: true, countAteFim, effective, lastDate, limitCompleto };
}