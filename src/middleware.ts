import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';
import { checkRateLimit, rateLimitConfigs, createRateLimitResponse, getClientIdentifier } from './lib/rate-limit';

// Rotas públicas que não precisam de autenticação
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/aldeias',
  '/api/eventos',
  '/api/jogos',
];

// Rotas que precisam de rate limiting
const rateLimitedRoutes: { path: string; config: typeof rateLimitConfigs.api }[] = [];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting geral para API
  if (pathname.startsWith('/api/')) {
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, rateLimitConfigs.api);

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.resetTime);
    }
  }

  // Verificar autenticação para rotas protegidas
  if (pathname.startsWith('/api/')) {
    const isPublicRoute = publicRoutes.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    );

    if (!isPublicRoute && !pathname.startsWith('/api/auth/')) {
      const authHeader = request.headers.get('authorization');
      
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Token de autenticação não fornecido' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);
      const payload = await verifyToken(token);

      if (!payload) {
        return NextResponse.json(
          { error: 'Token inválido ou expirado' },
          { status: 401 }
        );
      }

      // Adicionar informações do utilizador ao header para uso nas rotas
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId);
      requestHeaders.set('x-user-role', payload.role);
      if (payload.aldeiaId) {
        requestHeaders.set('x-user-aldeia-id', payload.aldeiaId);
      }

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
