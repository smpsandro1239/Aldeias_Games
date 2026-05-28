import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import type { NextRequest } from "next/server";

// Rate limit config per route
const RATE_LIMIT_CONFIG: Record<string, { maxRequests: number; windowMs: number }> = {
  "/api/auth/login": { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts / 15min
  "/api/auth/register": { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  "/api/auth/forgot-password": { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  "/api/auth/reset-password": { maxRequests: 5, windowMs: 60 * 60 * 1000 },
  "/api/auth/reset-password/confirm": { maxRequests: 5, windowMs: 60 * 60 * 1000 },
  "/api/pagamentos/stripe": { maxRequests: 10, windowMs: 60 * 1000 },
  "/api/pagamentos/mbway": { maxRequests: 10, windowMs: 60 * 1000 },
  "/api/participacoes": { maxRequests: 20, windowMs: 60 * 1000 },
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect API routes
  if (pathname.startsWith("/api/")) {
    const config = RATE_LIMIT_CONFIG[pathname];
    if (config) {
      const ip =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "anonymous";

      const { allowed, remaining, reset } = await checkRateLimit(
        pathname,
        ip,
        config.maxRequests,
        config.windowMs
      );

      const response = NextResponse.next();
      response.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
      response.headers.set("X-RateLimit-Remaining", remaining.toString());

      if (reset) {
        response.headers.set("X-RateLimit-Reset", reset.toString());
      }

      if (!allowed) {
        return NextResponse.json(
          { error: "Demasiadas tentativas. Tente novamente mais tarde." },
          { status: 429, headers: response.headers }
        );
      }

      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\\\..*$).*)"],
};