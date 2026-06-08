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

  return fetch(url, {
    ...options,
    headers,
  });
}
