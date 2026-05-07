/**
 * API Helpers - Requisições seguras com validação e abort controller
 */

export async function secureFetch<T>(
  url: string,
  options: RequestInit & { timeout?: number },
  token?: string | null
): Promise<T> {
  // Validar token
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const controller = new AbortController();
  const timeoutId = options.timeout ? setTimeout(() => controller.abort(), options.timeout) : undefined;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro na requisição' }));
      throw new Error(error.error || `Erro ${response.status}`);
    }

    return await response.json();
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function validateToken(token: string | null): boolean {
  if (!token) {
    // Não usar toast aqui para evitar dependência circular, apenas retornar false
    return false;
  }
  return true;
}
