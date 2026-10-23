/**
 * Utilitário para chamadas de API no lado do cliente com proteção CSRF
 */
export async function apiRequest(url: string, options: RequestInit = {}) {
  // Obter o token CSRF do cookie no navegador
  const getCsrfToken = () => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrf-token=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  const headers = new Headers(options.headers || {});

  // Adicionar CSRF token se for um método que altera estado
  const method = options.method?.toUpperCase() || 'GET';
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = getCsrfToken();
    if (token) {
      headers.set('x-csrf-token', token);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // R5 (A4 · Sprint 1): refresh automático em 401. O access token JWT expira
  // em 15 min; o cookie httpOnly de refresh renova a sessão de forma
  // transparente. Evita multi-refresh concorrentes com uma fila partilhada.
  if (response.status === 401 && !(options as RequestInit & { _retried?: boolean })._retried) {
    const retried = await refreshAndRetry(url, options, headers);
    if (retried) return retried;
  }

  return response;
}

let isRefreshing = false;
let waiters: Array<() => void> = [];

async function refreshAndRetry(
  url: string,
  options: RequestInit,
  headers: Headers
): Promise<Response | null> {
  // Se já há um refresh em curso, espera por ele e repete o pedido original.
  if (isRefreshing) {
    await new Promise<void>((resolve) => waiters.push(resolve));
    return fetch(url, {
      ...(options as RequestInit & { _retried?: boolean }),
      headers,
      credentials: 'include',
      _retried: true,
    } as RequestInit);
  }

  isRefreshing = true;
  try {
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    if (!refreshResponse.ok) {
      // Sessão irrecuperável → re-login.
      if (typeof window !== 'undefined') window.location.href = '/login';
      return null;
    }
    return await fetch(url, {
      ...(options as RequestInit & { _retried?: boolean }),
      headers,
      credentials: 'include',
      _retried: true,
    } as RequestInit);
  } catch {
    return null;
  } finally {
    isRefreshing = false;
    const pending = waiters;
    waiters = [];
    pending.forEach((w) => w());
  }
}
