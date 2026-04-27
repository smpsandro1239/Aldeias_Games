import prisma from "./db";

/**
 * Check rate limit using database
 * Format key: "rl:{endpoint}:{ip}"
 * Returns: { allowed: boolean; remaining: number; reset?: number }
 */
export async function checkRateLimit(
  identifier: string, // endpoint path
  ip: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 1000 // 1 minute
): Promise<{ allowed: boolean; remaining: number; reset?: number }> {
  const key = `rl:${identifier}:${ip}`;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  // Find or create rate limit record
  const existing = await prisma.rateLimit.findUnique({
    where: { key },
  });

  if (!existing) {
    // First request - create record
    await prisma.rateLimit.create({
      data: {
        key,
        count: 1,
        expiresAt: new Date(now.getTime() + windowMs),
      },
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  // Check if expired
  if (existing.expiresAt < now) {
    // Reset counter
    await prisma.rateLimit.update({
      where: { key },
      data: { count: 1, expiresAt: new Date(now.getTime() + windowMs) },
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  // Not expired - check count
  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      reset: Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000),
    };
  }

  // Increment counter
  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });

  return {
    allowed: true,
    remaining: maxRequests - existing.count - 1,
  };
}

/**
 * Helper to clean up expired rate limit records (cron job suggestion)
 */
export async function cleanupRateLimits(): Promise<number> {
  const deleted = await prisma.rateLimit.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  return deleted.count;
}


/**
 * Helper to check rate limit and return 429 response if exceeded
 */
export async function checkRateLimit(
  request: NextRequest,
  identifier: string,
  maxRequests: number = 10, // Override default
  windowMs: number = 60 * 1000 // 1 minute
): Promise<{ allowed: boolean; remaining: number; reset?: number }> {
  const ip = request.headers.get("x-forwarded-for") || request.ip || "anonymous";
  const key = `rl:${identifier}:${ip}`;

  // Use specific limiter for this endpoint
  const specificLimiter = ratelimit({
    redis: Redis.fromEnv(),
    limiter: ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
    analytics: false,
  });

  const { success, reset, remaining } = await specificLimiter.limit(key);

  return {
    allowed: success,
    remaining: remaining,
    reset: reset ? Math.ceil((reset - Date.now()) / 1000) : undefined,
  };
}
