import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET;

if (!CSRF_SECRET) {
  throw new Error('CSRF_SECRET ou JWT_SECRET é obrigatório. Define a variável de ambiente CSRF_SECRET.');
}

const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_NAME = 'csrf-token';
const secret = new TextEncoder().encode(CSRF_SECRET);

/**
 * Gera um novo CSRF token assinado
 */
export async function generateCsrfToken(): Promise<string> {
  const token = await new SignJWT({ jti: crypto.randomUUID() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
  return token;
}

/**
 * Valida o CSRF token do request contra o cookie
 */
export async function validateCsrf(request: NextRequest): Promise<boolean> {
  // Ignorar métodos seguros
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true;
  }

  const tokenFromHeader = request.headers.get(CSRF_HEADER_NAME);
  const tokenFromCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (!tokenFromHeader || !tokenFromCookie) {
    return false;
  }

  if (tokenFromHeader !== tokenFromCookie) {
    return false;
  }

  try {
    await jwtVerify(tokenFromHeader, secret);
    return true;
  } catch (error) {
    console.error('CSRF validation failed:', error);
    return false;
  }
}

/**
 * Adiciona o CSRF token aos cookies da resposta
 */
export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: token,
    httpOnly: false, // Precisa ser acessível pelo cliente para enviar no header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}
