import { escapeHtml } from './utils';

/**
 * Sanitiza recursivamente objetos JSON para prevenir XSS
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return escapeHtml(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject) as unknown as T;
  }

  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = sanitizeObject((obj as any)[key]);
      }
    }
    return newObj as T;
  }

  return obj;
}
