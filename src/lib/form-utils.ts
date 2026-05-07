/**
 * Utilitários para parsing seguro de valores
 * Evita NaN e erros em conversões de tipos
 */

export const safeParseInt = (val: string | number | null | undefined, fallback: number = 0): number => {
  if (val === null || val === undefined) return fallback;
  const parsed = typeof val === 'number' ? val : parseInt(val, 10);
  return isNaN(parsed) ? fallback : parsed;
};

export const safeParseFloat = (val: string | number | null | undefined, fallback: number = 0): number => {
  if (val === null || val === undefined) return fallback;
  const parsed = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
};

export const safeToString = (val: unknown, fallback: string = ''): string => {
  return val?.toString() ?? fallback;
};

export const safeToNumber = (val: unknown, fallback: number = 0): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};
