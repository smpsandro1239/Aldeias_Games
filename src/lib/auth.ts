import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import prisma from './db';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET é obrigatório em produção');
}

const secret = new TextEncoder().encode(
  JWT_SECRET || 'dev-secret-key-insecure-only-for-local-development'
);

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  aldeiaId?: string | null;
  iat?: number;
  exp?: number;
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
    .setExpirationTime('7d')
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
 * Obter utilizador a partir do token no header Authorization
 */
export async function getUserFromRequest(request: NextRequest): Promise<{
  userId: string;
  email: string;
  role: string;
  aldeiaId?: string | null;
} | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
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
    include: {
      aldeia: true,
    },
  });

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
