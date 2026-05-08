import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Constants
const DEFAULT_CODE_LENGTH = 6;
const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const PHONE_REGEX_PT = /(\d{3})(\d{3})(\d{3})/;
const PHONE_REGEX_INTL = /(\+351)(\d{3})(\d{3})(\d{3})/;
const SLUG_REGEX = /[\u0300-\u036f]/g;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NIF_REGEX = /^\d{9}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{12,}$/;

/**
 * Merge de classes Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safe parse float with validation
 */
export function safeParseFloat(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Safe parse int with validation
 */
export function safeParseInt(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return Math.floor(value);
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Escapa caracteres HTML especiais para prevenir XSS
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/\'/g, '&#039;');
}

/**
 * Formatar valor monetario (EUR)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value).replace(/\\u00A0/g, ' ');
}

/**
 * Formatar data com validação
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date provided to formatDate');
  }
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }).format(d);
}

/**
 * Formatar data e hora com validação
 */
export function formatDateTime(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date provided to formatDateTime');
  }
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(d);
}

/**
 * Formatar numero de telefone
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  if (phone.startsWith('+351')) {
    return phone.replace(PHONE_REGEX_INTL, '$1 $2 $3 $4');
  }
  return phone.replace(PHONE_REGEX_PT, '$1 $2 $3');
}
  return phone.replace(/(\\d{3})(\\d{3})(\\d{3})/, '$1 $2 $3');
}

/**
 * Gerar slug a partir de string
 */
export function generateSlug(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(SLUG_REGEX, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-+/g, '-');
}

/**
 * Gerar codigo aleatorio usando crypto seguro
 */
export function generateCode(length: number = DEFAULT_CODE_LENGTH): string {
  const chars = CODE_CHARS;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Truncar texto
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Capitalizar primeira letra
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Obter iniciais de nome
 */
export function getInitials(name: string): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .split(' ')
    .filter(word => word.length > 0)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 3); // Limit to 3 initials
}

/**
 * Delay/timeout
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Verificar se e dispositivo movel
 */
export function isMobile(userAgent: string): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

/**
 * Copiar para clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Download de arquivo
 */
export function downloadFile(content: string | Blob, filename: string, type?: string): void {
  const blob = content instanceof Blob 
    ? content 
    : new Blob([content], { type: type || 'text/plain' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Calcular percentagem com parsing seguro
 */
export function calculatePercentage(value: unknown, total: unknown): number {
  const safeValue = safeParseFloat(value, 0);
  const safeTotal = safeParseFloat(total, 0);
  if (safeTotal === 0) return 0;
  return Math.round((safeValue / safeTotal) * 100);
}

/**
 * Formatar numero com separadores
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-PT').format(num);
}

/**
 * Verificar se email e valido
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email);
}

/**
 * Verificar se NIF portugues e valido
 */
export function isValidNIF(nif: string): boolean {
  if (!nif || typeof nif !== 'string') return false;
  if (!NIF_REGEX.test(nif)) return false;

  const digits = nif.split('').map(Number);
  const checkDigit = digits.pop()!;

  const sum = digits.reduce((acc, digit, index) => {
    return acc + digit * (9 - index);
  }, 0);

  const check = 11 - (sum % 11);
  return check === checkDigit || (check === 10 && checkDigit === 0);
}
