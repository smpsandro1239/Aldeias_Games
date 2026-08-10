import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Nonce generation for CSP — per-request, cryptographically random
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

// CSP header — strict in production, permissive in dev (Next.js HMR needs unsafe-eval + inline)
function buildCspHeader(nonce: string): string {
  if (process.env.NODE_ENV !== "production") {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
      "object-src 'none'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://fonts.gstatic.com https://www.google.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://api.stripe.com https://worldtimeapi.org https://www.googleapis.com https://appleid.apple.com https://api.mbway.pt https://euromillions-api.vercel.app https://api.fugete.com https://vercel.live",
      "frame-src 'self' https://js.stripe.com https://vercel.live",
      "worker-src 'self' blob:",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ");
  }
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'sha256-zjP2BXYgSCCnXNMXI2IL1yRydoQdsGR/uCCr6kyKsD0=' https://js.stripe.com https://vercel.live`,
    "object-src 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://fonts.gstatic.com https://www.google.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://worldtimeapi.org https://www.googleapis.com https://appleid.apple.com https://api.mbway.pt https://euromillions-api.vercel.app https://api.fugete.com https://vercel.live",
    "frame-src 'self' https://js.stripe.com https://vercel.live",
    "worker-src 'self' blob:",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

// Rate limit config per route
const RATE_LIMIT_CONFIG: Record<string, { maxRequests: number; windowMs: number }> = {
  "/api/auth/login": { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts / 15min
  "/api/auth/register": { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  "/api/auth/forgot-password": { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  "/api/auth/reset-password/confirm": { maxRequests: 5, windowMs: 60 * 60 * 1000 },
  "/api/pagamentos/stripe": { maxRequests: 10, windowMs: 60 * 1000 },
  "/api/pagamentos/mbway": { maxRequests: 10, windowMs: 60 * 1000 },
  "/api/participacoes": { maxRequests: 20, windowMs: 60 * 1000 },
  "/api/apostas": { maxRequests: 20, windowMs: 60 * 1000 },
};

// === AUTHENTICATION & AUTHORIZATION CONFIG ===
// Rotas públicas que não precisam de autenticação
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/aldeias',
  '/api/eventos',
  '/api/jogos',
  '/api/apostas',
  '/api/health',
  '/api/stripe/webhook',
  '/api/mbway/webhook',
  '/api/participacoes',
  '/api/participacoes/verificar',
  '/api/rbac/roles',
  '/api/rbac/user',
];

// Rotas de página que são públicas (landing page, login, etc.)
const publicPages = [
  '/',
  '/login',
  '/register',
  '/privacidade',
  '/termos',
  '/favicon.ico',
];

// Rotas protegidas por role
const roleProtectedRoutes: Record<string, string[]> = {
  '/superadmindashboard': ['super_admin'],
  '/admindashboard': ['super_admin', 'aldeia_admin'],
  '/vendedordashboard': ['super_admin', 'aldeia_admin', 'vendedor'],
  '/clientedashboard': ['super_admin', 'aldeia_admin', 'vendedor', 'user'],
};

// Métodos seguros
const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

// CSRF protection: validate Origin/Referer on state-changing cookie-authenticated requests
function validateCsrfOrigin(request: NextRequest): boolean {
  const method = request.method;
  if (safeMethods.includes(method)) return true;

  // Only enforce CSRF for cookie-based auth (not Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return true;

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  if (!host) return true; // Can't validate without host

  // Allow requests with no Origin or Referer ONLY for safe methods
  // State-changing requests must have Origin or Referer for CSRF protection
  if (!origin && !referer) {
    if (safeMethods.includes(method)) return true;
    return false;
  }

  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return true;
    } catch { return false; }
  }

  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost === host) return true;
    } catch { return false; }
  }

  return false;
}

// JWT secret — lazy validation no request time (nunca throw em module scope:
// o build de páginas estáticas importa este ficheiro sem env var disponível)
function getJwtSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw) {
    throw new Error('JWT_SECRET is required. Set it in Vercel environment variables.');
  }
  return new TextEncoder().encode(raw);
}

// === CORS para API routes ===
function applyApiCors(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin");
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "https://aldeiasgames.pt",
    "https://www.aldeiasgames.pt",
  ];

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-csrf-token");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
}

export async function proxy(request: NextRequest) {
  const nonce = generateNonce();
  const response = await proxyInner(request);

  // Clone response to add CSP headers (proxy responses may be immutable)
  const finalResponse = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });

  finalResponse.headers.set("Content-Security-Policy", buildCspHeader(nonce));
  finalResponse.headers.set("x-nonce", nonce);
  finalResponse.headers.set("Cross-Origin-Opener-Policy", "same-origin");

  return finalResponse;
}

async function proxyInner(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // === AUTHENTICATION, CSRF & RATE LIMITING FOR API ROUTES ===
  // Ordem crítica: autenticação e CSRF são validados ANTES do rate-limit,
  // para que rotas protegidas nunca fiquem sem estas verificações.
  if (pathname.startsWith('/api/')) {
    // Prova de jogo é acessível a convidados — a route valida permissões internamente (isPublic)
    const isProvaRoute =
      pathname.startsWith('/api/participacoes/') && pathname.endsWith('/prova');
    const isPublicRoute = publicRoutes.some(route =>
      pathname === route || pathname.startsWith(`${route}/`)
    ) || isProvaRoute;

    // Preflight CORS: processado antes de auth (nunca transporta credenciais)
    if (request.method === 'OPTIONS') {
      return applyApiCors(request, new NextResponse(null, { status: 204 }));
    }

    let requestHeaders: Headers | null = null;
    const authHeader = request.headers.get('authorization');
    const hasAuthCookie = Boolean(request.cookies.get('auth-token')?.value);
    const usesBearer = Boolean(authHeader?.startsWith('Bearer '));

    // Rotas não públicas exigem autenticação (JWT) antes de prosseguir
    if (!isPublicRoute && !pathname.startsWith('/api/auth/')) {
      let token = null;

      if (usesBearer) {
        token = authHeader!.substring(7);
      } else {
        token = request.cookies.get('auth-token')?.value || null;
      }

      if (!token) {
        return NextResponse.json(
          { error: 'Token de autenticação não fornecido' },
          { status: 401 }
        );
      }

      try {
        const { payload } = await jwtVerify(token, getJwtSecret());

        if (!payload.userId || !payload.role) {
          return NextResponse.json(
            { error: 'Token inválido' },
            { status: 401 }
          );
        }

        requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', String(payload.userId));
        requestHeaders.set('x-user-role', String(payload.role));
        if (payload.aldeiaId) {
          requestHeaders.set('x-user-aldeia-id', String(payload.aldeiaId));
        }
      } catch {
        return NextResponse.json(
          { error: 'Token inválido ou expirado' },
          { status: 401 }
        );
      }
    }

    // CSRF validation para pedidos state-changing autenticados por cookie.
    // Aplica-se também a rotas públicas (ex.: /api/participacoes) quando o
    // pedido vai autenticado por cookie — impede CSRF na sessão do utilizador.
    if (!safeMethods.includes(request.method) && !usesBearer && hasAuthCookie) {
      if (!validateCsrfOrigin(request)) {
        return NextResponse.json(
          { error: 'Pedido CSRF inválido — origem não correspondente' },
          { status: 403 }
        );
      }
    }

    // === RATE LIMITING PARA API ROUTES ===
    const config = RATE_LIMIT_CONFIG[pathname];
    if (config) {
      const ip =
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'anonymous';

      // Identificador único por path e IP (evita rate limiting cruzado)
      const identifier = `${pathname}:${ip}`;

      const { allowed, remaining, resetTime } = await checkRateLimit(
        identifier,
        config
      );

      const response = applyApiCors(
        request,
        NextResponse.next({
          request: { headers: requestHeaders ?? request.headers },
        })
      );
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());

      if (resetTime) {
        response.headers.set(
          'X-RateLimit-Reset',
          Math.ceil(resetTime / 1000).toString()
        );
      }

      if (!allowed) {
        return applyApiCors(
          request,
          NextResponse.json(
            { error: 'Demasiadas tentativas. Tente novamente mais tarde.' },
            { status: 429, headers: response.headers }
          )
        );
      }

      return response;
    }

    // Sem rate-limit configurado: passa com headers de auth adicionados (se aplicável)
    const apiResponse = NextResponse.next({
      request: { headers: requestHeaders ?? request.headers },
    });
    return applyApiCors(request, apiResponse);
  }

  // Page routes: protect by role
  let matchedRoute: string | null = null;
  let requiredRoles: string[] = [];

  for (const [route, roles] of Object.entries(roleProtectedRoutes)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      matchedRoute = route;
      requiredRoles = roles;
      break;
    }
  }

  if (matchedRoute) {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      const loginUrl = new URL('/', request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      const userRole = String(payload.role);

      if (!requiredRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on role
        if (userRole === 'super_admin') {
          return NextResponse.redirect(
            new URL('/superadmindashboard', request.url)
          );
        } else if (userRole === 'aldeia_admin') {
          return NextResponse.redirect(
            new URL('/admindashboard', request.url)
          );
        } else if (userRole === 'vendedor') {
          return NextResponse.redirect(
            new URL('/vendedordashboard', request.url)
          );
        } else {
          return NextResponse.redirect(
            new URL('/clientedashboard', request.url)
          );
        }
      }
    } catch {
      const loginUrl = new URL('/', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // === SECURITY HEADERS ===
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - files with .extension
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
