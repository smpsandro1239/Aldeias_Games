/**
 * Rate Limiting — Prisma-backed (production) + in-memory fallback (development)
 *
 * Production: uses Prisma `rateLimit` table (persists across serverless invocations)
 * Development: in-memory Map with 10x relaxed limits
 */

import { prisma } from '@/lib/db';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Configurations per endpoint
export const rateLimitConfigs = {
  login:        { maxRequests: 5,  windowMs: 15 * 60 * 1000 },
  register:     { maxRequests: 3,  windowMs: 60 * 60 * 1000 },
  forgotPassword: { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  resetPassword:  { maxRequests: 5, windowMs: 60 * 60 * 1000 },
  api:          { maxRequests: 100, windowMs: 60 * 1000 },
  participacoes: { maxRequests: 20, windowMs: 60 * 1000 },
  claimPremio:  { maxRequests: 10, windowMs: 60 * 1000 },
  sorteios:     { maxRequests: 5,  windowMs: 60 * 1000 },
  pagamentos:   { maxRequests: 10, windowMs: 60 * 1000 },
  twoFactor:    { maxRequests: 5,  windowMs: 5 * 60 * 1000 },
};

// === IN-MEMORY STORE (development only) ===
const rateLimitStore = new Map<string, RateLimitEntry>();

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((entry, key) => {
      if (entry.resetTime < now) rateLimitStore.delete(key);
    });
  }, 5 * 60 * 1000);
}

/**
 * Get client identifier (IP or UA+path fallback)
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown';

  if (ip === 'unknown') {
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const url = new URL(request.url);
    return `ua:${userAgent.slice(0, 50)}:${url.pathname}`;
  }

  return ip;
}

/**
 * Check rate limit — Prisma in production, in-memory in development
 */
export async function checkRateLimit(
  identifier: string,
  config: typeof rateLimitConfigs.api
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  // Development: relaxed limits (10x) + in-memory
  if (process.env.NODE_ENV === 'development') {
    return checkRateLimitMemory(identifier, { ...config, maxRequests: config.maxRequests * 10 });
  }

  return checkRateLimitPrisma(identifier, config);
}

/**
 * Prisma-backed rate limiting (production)
 * Uses upsert + atomic increment to handle concurrent requests safely
 */
async function checkRateLimitPrisma(
  identifier: string,
  config: typeof rateLimitConfigs.api
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = `rl:${identifier}:${config.windowMs}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.windowMs);

  try {
    // Try to find existing entry
    const existing = await prisma.rateLimit.findUnique({ where: { key } });

    if (existing && existing.expiresAt > now) {
      // Window still active — check count
      if (existing.count >= config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: existing.expiresAt.getTime(),
        };
      }

      // Increment count atomically
      const updated = await prisma.rateLimit.update({
        where: { key },
        data: { count: { increment: 1 } },
      });

      return {
        allowed: true,
        remaining: Math.max(0, config.maxRequests - updated.count),
        resetTime: updated.expiresAt.getTime(),
      };
    }

    // No entry or expired — create new window
    const created = await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, expiresAt },
      update: { count: 1, expiresAt },
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: created.expiresAt.getTime(),
    };
  } catch (error) {
    // If Prisma fails (DB down), fail open — allow request but log
    console.error('Rate limit DB error, failing open:', error);
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
    };
  }
}

/**
 * In-memory rate limiting (development only)
 */
function checkRateLimitMemory(
  identifier: string,
  config: typeof rateLimitConfigs.api
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `${identifier}:${config.maxRequests}:${config.windowMs}`;
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetTime: entry.resetTime };
}

/**
 * Cleanup expired rate limit entries (call from cron or admin endpoint)
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  try {
    const result = await prisma.rateLimit.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  } catch {
    return 0;
  }
}

/**
 * Create 429 response
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
 * Add rate limit headers to response
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
