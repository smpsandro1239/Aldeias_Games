import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';
import { checkRateLimit, rateLimitConfigs, createRateLimitResponse, getClientIdentifier } from './lib/rate-limit';

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
];

// Métodos que são considerados "seguros" (não modificam estado)
const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting geral para API
  if (pathname.startsWith('/api/')) {
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, rateLimitConfigs.api);

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.resetTime);
    }
  }

  // CSRF Protection: verificar Origin/Referer para rotas de escrita
  if (pathname.startsWith('/api/') && !safeMethods.includes(request.method)) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Webhooks do Stripe e MBWay são excluídos (vêm de serviços externos)
    if (!pathname.startsWith('/api/stripe/webhook') && !pathname.startsWith('/api/mbway/webhook')) {
      // Verificar se Origin ou Referer corresponde à aplicação
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

  // Adicionar headers de segurança à resposta
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}
