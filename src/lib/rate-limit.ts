/**
 * Sistema de Rate Limiting
 * 
 * NOTA: Em produção com múltiplas instâncias, migrar para Redis/Upstash:
 * 
 * import { Redis } from '@upstash/redis';
 * import { Ratelimit } from '@upstash/ratelimit';
 * 
 * const redis = Redis.fromEnv();
 * const ratelimit = new Ratelimit({
 *   redis,
 *   limiter: Ratelimit.slidingWindow(10, '1 m'),
 * });
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Configurações pré-definidas para diferentes endpoints
export const rateLimitConfigs = {
  // Login: 20 tentativas por minuto
  login: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minuto
  },
  // Register: 3 tentativas por minuto
  register: {
    maxRequests: 3,
    windowMs: 60 * 1000,
  },
  // API geral: 100 requests por minuto
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },
  // Participações: 20 por minuto
  participacoes: {
    maxRequests: 20,
    windowMs: 60 * 1000,
  },
  // Pagamentos: 10 por minuto
  pagamentos: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
};

// Store em memória (substituir por Redis em produção)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpar entradas expiradas a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Obter identificador do cliente (IP ou fallback)
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  // Se não houver IP, usar User-Agent + path como fallback
  if (ip === 'unknown') {
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const url = new URL(request.url);
    return `ua:${userAgent.slice(0, 50)}:${url.pathname}`;
  }
  
  return ip;
}

/**
 * Verificar rate limit
 */
export function checkRateLimit(
  identifier: string,
  config: typeof rateLimitConfigs.api
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const key = `${identifier}:${config.maxRequests}:${config.windowMs}`;
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // Nova janela
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    // Limite excedido
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Incrementar contador
  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Criar resposta de erro de rate limit
 */
export function createRateLimitResponse(resetTime: number): Response {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({
      error: 'Muitas requisições. Tente novamente mais tarde.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Retry-After': String(retryAfter),
      },
    }
  );
}

/**
 * Adicionar headers de rate limit à resposta
 */
export function addRateLimitHeaders(
  response: Response,
  remaining: number,
  resetTime: number
): Response {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('X-RateLimit-Remaining', String(remaining));
  newResponse.headers.set('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));
  return newResponse;
}
