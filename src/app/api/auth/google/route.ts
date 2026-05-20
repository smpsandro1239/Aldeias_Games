import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Estado temporário para prevenir CSRF (em produção, use armazenamento seguro)
const STATE_COOKIE_NAME = 'google_oauth_state';
const STATE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 10, // 10 minutos
};

// Gerar state aleatório para prevenir CSRF
function generateState(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

export async function GET(request: NextRequest) {
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      logger.error('Google OAuth not configured', { module: 'auth' });
      return NextResponse.redirect(
        new URL('/?error=oauth_not_configured', request.url)
      );
    }

    const state = generateState();

    // Construir URL de autorização do Google
    const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
    authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
    authUrl.searchParams.set('redirect_uri', process.env.GOOGLE_REDIRECT_URI!);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    // Criar resposta de redirecionamento
    const response = NextResponse.redirect(authUrl.toString());

    // Definir cookie de state
    response.cookies.set(STATE_COOKIE_NAME, state, STATE_COOKIE_OPTIONS);

    logger.info('Initiating Google OAuth flow', { module: 'auth' });

    return response;
  } catch (error) {
    logger.error('Error initiating Google OAuth', { module: 'auth', error });
    return NextResponse.redirect(
      new URL('/?error=oauth_init_failed', request.url)
    );
  }
}
