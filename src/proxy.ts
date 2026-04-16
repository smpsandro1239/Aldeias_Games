import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Rotas públicas que não precisam de autenticação
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/2fa',
  '/api/aldeias',
  '/api/eventos',
  '/api/jogos',
  '/api/apostas',
  '/api/health',
  '/api/stripe/webhook',
  '/api/mbway/webhook',
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

// JWT secret
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-key-local-only-32chars!'
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public pages
  if (publicPages.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/static')) {
    return NextResponse.next();
  }

  // Rate limiting e segurança para API
  if (pathname.startsWith('/api/')) {
    const response = await handleApiRequest(request);
    if (response) return response;
  }

  // Proteção de páginas por role
  const pageResponse = await handlePageProtection(request);
  if (pageResponse) return pageResponse;

  // Adicionar headers de segurança
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://api.stripe.com https://api.mbway.pt; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
  );

  return response;
}

async function handleApiRequest(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  // CSRF Protection para rotas de escrita
  if (!safeMethods.includes(request.method)) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Webhooks excluídos
    if (!pathname.startsWith('/api/stripe/webhook') && !pathname.startsWith('/api/mbway/webhook')) {
      const isValidOrigin = origin && (origin === appUrl || origin.startsWith('http://localhost:'));
      const isValidReferer = referer && (referer.startsWith(appUrl) || referer.startsWith('http://localhost:'));

      if (!isValidOrigin && !isValidReferer) {
        return NextResponse.json(
          { error: 'Origem não permitida' },
          { status: 403 }
        );
      }
    }
  }

  // Verificar autenticação para rotas protegidas
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isPublicRoute && !pathname.startsWith('/api/auth/')) {
    // Tentar obter token do header Authorization primeiro
    let token = null;
    const authHeader = request.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Fallback: tentar obter do cookie httpOnly
      token = request.cookies.get('auth-token')?.value || null;
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      if (!payload.userId || !payload.role) {
        return NextResponse.json(
          { error: 'Token inválido' },
          { status: 401 }
        );
      }

      // Adicionar informações do utilizador aos headers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', String(payload.userId));
      requestHeaders.set('x-user-role', String(payload.role));
      if (payload.aldeiaId) {
        requestHeaders.set('x-user-aldeia-id', String(payload.aldeiaId));
      }

      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    } catch {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }
  }

  return null;
}

async function handlePageProtection(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  // Verificar se é uma rota protegida por role
  let matchedRoute: string | null = null;
  let requiredRoles: string[] = [];

  for (const [route, roles] of Object.entries(roleProtectedRoutes)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      matchedRoute = route;
      requiredRoles = roles;
      break;
    }
  }

  if (!matchedRoute) return null;

  // Obter token do cookie
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    const loginUrl = new URL('/', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = String(payload.role);

    if (!requiredRoles.includes(userRole)) {
      // Redirecionar para dashboard adequado
      if (userRole === 'super_admin') {
        return NextResponse.redirect(new URL('/superadmindashboard', request.url));
      } else if (userRole === 'aldeia_admin') {
        return NextResponse.redirect(new URL('/admindashboard', request.url));
      } else if (userRole === 'vendedor') {
        return NextResponse.redirect(new URL('/vendedordashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/clientedashboard', request.url));
      }
    }
  } catch {
    const loginUrl = new URL('/', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return null;
}
