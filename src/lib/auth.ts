import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import prisma from './db';

// Constants
const AUTH_COOKIE_NAME = 'auth-token';
const REFRESH_COOKIE_NAME = 'refresh-token';
const COOKIE_MAX_AGE = 24 * 60 * 60; // 24 horas em segundos
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 dias em segundos
const JWT_EXPIRATION = '24h';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET é obrigatório. Define a variável de ambiente JWT_SECRET.');
}

const secret = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  aldeiaId?: string | null;
  iat?: number;
  exp?: number;
}

/**
 * Definir cookie httpOnly com o token
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

/**
 * Remover cookie de autenticação (logout)
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

/**
 * Obter token do cookie httpOnly
 */
export function getAuthTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get(AUTH_COOKIE_NAME)?.value || null;
}

/**
 * Hash de password com bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verificar password
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Gerar token JWT
 */
export async function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
   const token = await new SignJWT(payload)
     .setProtectedHeader({ alg: 'HS256' })
     .setIssuedAt()
     .setExpirationTime(JWT_EXPIRATION)
     .sign(secret);

   return token;
}

/**
 * Verificar token JWT
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Obter utilizador a partir do request (cookie httpOnly ou Bearer token)
 */
export async function getUserFromRequest(request: NextRequest): Promise<{
  userId: string;
  email: string;
  role: string;
  aldeiaId?: string | null;
} | null> {
  let token: string | null = null;

  // Prioridade 1: Cookie httpOnly
  token = request.cookies.get(AUTH_COOKIE_NAME)?.value || null;

  // Prioridade 2: Bearer token (fallback para API clients)
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    aldeiaId: payload.aldeiaId,
  };
}

/**
 * Obter utilizador completo a partir do request
 */
export async function getFullUserFromRequest(request: NextRequest) {
  const tokenData = await getUserFromRequest(request);
  
  if (!tokenData) {
    return null;
  }

   const user = await prisma.user.findUnique({
     where: { id: tokenData.userId },
     select: {
       id: true,
       nome: true,
       email: true,
       telefone: true,
       role: true,
       aldeiaId: true,
       saldo: true,
       comissaoPercentual: true,
       comissaoTotal: true,
       emailVerificado: true,
       notificacoesEmail: true,
       createdAt: true,
       updatedAt: true,
       aldeia: true,
       userAldeiaRoles: {
         select: { aldeiaId: true },
         take: 1,
       },
     },
   });

  // If user not found in DB (e.g. demo user without matching DB record),
  // construct minimal user from token data
  if (!user) {
    return {
      id: tokenData.userId,
      nome: tokenData.email.split('@')[0],
      email: tokenData.email,
      role: tokenData.role as any,
      aldeiaId: tokenData.aldeiaId ?? null,
      saldo: 0,
      comissaoPercentual: 0,
      comissaoTotal: 0,
      emailVerificado: true,
      notificacoesEmail: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      telefone: null,
      aldeia: null,
    };
  }

  // If user has no direct aldeiaId, fallback to first userAldeiaRole
  if (!user.aldeiaId && user.userAldeiaRoles?.length > 0) {
    (user as any).aldeiaId = user.userAldeiaRoles[0].aldeiaId;
  }
  delete (user as any).userAldeiaRoles;

  return user;
}

/**
 * Verificar se o utilizador tem permissão (roles)
 */
export function hasRole(
  userRole: string,
  allowedRoles: string[]
): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Atualizar último login do utilizador
 */
export async function updateLastLogin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { ultimoLogin: new Date() },
  });
}

/**
 * Registar log de acesso
 */
export async function logAccess(
  email: string,
  sucesso: boolean,
  ip: string,
  userAgent: string,
  userId?: string,
  motivo?: string
): Promise<void> {
  await prisma.logAcesso.create({
    data: {
      email,
      sucesso,
      ip,
      userAgent,
      userId,
      motivo,
    },
  });
}

// ============================================
// REFRESH TOKEN FUNCTIONS
// ============================================

/**
 * Gerar refresh token na BD e retornar o token string
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  const crypto = await import('crypto');
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
}

/**
 * Definir cookie httpOnly para refresh token
 */
export function setRefreshTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: '/api/auth',
  });
}

/**
 * Remover cookie de refresh token (logout)
 */
export function clearRefreshTokenCookie(response: NextResponse): void {
  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/api/auth',
  });
}

/**
 * Validar refresh token na BD
 */
export async function validateRefreshToken(token: string): Promise<{ userId: string } | null> {
  const record = await prisma.refreshToken.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true, revoked: true },
  });

  if (!record) return null;
  if (record.revoked) return null;
  if (new Date() > record.expiresAt) return null;

  return { userId: record.userId };
}

/**
 * Rotacionar refresh token: revogar o antigo e criar um novo
 */
export async function rotateRefreshToken(oldToken: string): Promise<string | null> {
  const validation = await validateRefreshToken(oldToken);
  if (!validation) return null;

  // Revoke the old token
  await prisma.refreshToken.update({
    where: { token: oldToken },
    data: { revoked: true },
  });

  // Issue a new one
  return generateRefreshToken(validation.userId);
}

/**
 * Revogar todos os refresh tokens de um utilizador (logout de todas as sessões)
 */
export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
}

/**
 * Obter refresh token do cookie
 */
export function getRefreshTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get(REFRESH_COOKIE_NAME)?.value || null;
}