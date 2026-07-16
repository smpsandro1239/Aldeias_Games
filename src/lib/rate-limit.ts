/**
 * Sistema de Rate Limiting com suporte a Redis (Upstash) em produção
 * 
 * Em desenvolvimento: in-memory Map
 * Em produção: Upstash Redis (se configurado) ou fallback in-memory
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Configurações pré-definidas para diferentes endpoints
export const rateLimitConfigs = {
  // Login: 5 tentativas por 15 minutos
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
  },
  // Register: 3 tentativas por hora
  register: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
  },
  // Forgot password: 3 tentativas por hora
  forgotPassword: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hora
  },
  // Reset password: 5 tentativas por hora
  resetPassword: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hora
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
  // Claim prémio: 10 por minuto
  claimPremio: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
  // Sorteios: 5 por minuto
  sorteios: {
    maxRequests: 5,
    windowMs: 60 * 1000,
  },
  // Pagamentos: 10 por minuto
  pagamentos: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
  // 2FA verify: 5 tentativas por 5 minutos (brute-force protection)
  twoFactor: {
    maxRequests: 5,
    windowMs: 5 * 60 * 1000,
  },
};

// === IN-MEMORY STORE (development fallback) ===
const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpar entradas expiradas a cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((entry, key) => {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

// === REDIS SUPPORT (production) ===
let redisClient: any = null;

async function getRedisClient() {
  if (redisClient) return redisClient;
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) return null;
  
  try {
    const { Redis } = await import('@upstash/redis');
    redisClient = new Redis({ url, token });
    return redisClient;
  } catch {
    return null;
  }
}

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
 * Verificar rate limit (Redis se disponível, senão in-memory)
 */
export async function checkRateLimit(
  identifier: string,
  config: typeof rateLimitConfigs.api
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
}> {
  // Em desenvolvimento, usar limites mais permissivos (10x maiores)
  if (process.env.NODE_ENV === 'development') {
    const devConfig = { ...config, maxRequests: config.maxRequests * 10 };
    return checkRateLimitMemory(identifier, devConfig);
  }
  
  const redis = await getRedisClient();
  
  if (redis) {
    return checkRateLimitRedis(redis, identifier, config);
  }
  
  return checkRateLimitMemory(identifier, config);
}

/**
 * Rate limiting com Redis (produção)
 */
async function checkRateLimitRedis(
  redis: any,
  identifier: string,
  config: typeof rateLimitConfigs.api
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
}> {
  const key = `ratelimit:${identifier}:${config.maxRequests}:${config.windowMs}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  try {
    // Usar pipeline para atomicidade
    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    pipeline.zcard(key);
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));
    
    const results = await pipeline.exec();
    const count = results[2] as number;
    
    const resetTime = now + config.windowMs;
    const remaining = Math.max(0, config.maxRequests - count);
    
    return {
      allowed: count <= config.maxRequests,
      remaining,
      resetTime,
    };
  } catch (error) {
    // Fallback para in-memory se Redis falhar
    console.error('Redis rate limit error, falling back to memory:', error);
    return checkRateLimitMemory(identifier, config);
  }
}

/**
 * Rate limiting em memória (desenvolvimento)
 */
function checkRateLimitMemory(
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
