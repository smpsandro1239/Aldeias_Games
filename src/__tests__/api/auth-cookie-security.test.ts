/**
 * R3 (A4 · Sprint 1) — Testes: cookie __Host- + sameSite/Secure + JWT 15min + refresh.
 * Mock-based, sem BD real.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const refreshToken = {
    findUnique: vi.fn(), update: vi.fn(), create: vi.fn(), delete: vi.fn(),
    deleteMany: vi.fn(), findFirst: vi.fn(),
  };
  const user = { findUnique: vi.fn(), update: vi.fn() };
  return { refreshToken, user, dbDefault: { refreshToken, user } };
});
vi.mock('@/lib/db', () => ({ default: mocks.dbDefault, prisma: mocks.dbDefault }));

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { setAuthCookie, generateToken, AUTH_COOKIE_NAME } from '@/lib/auth';

const JWT_TEST_KEY = 'chave-hs256-de-teste-0123456789abcdefghij-KLmnop';

describe('A4 — __Host- cookie + JWT 15min + refresh', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.JWT_SECRET = JWT_TEST_KEY;
  });

  it('AUTH_COOKIE_NAME usa prefixo __Host- em produção', async () => {
    // re-import com NODE_ENV=production para avaliar a constante
    vi.stubEnv('NODE_ENV', 'production');
    const mod = await import('@/lib/auth');
    expect(mod.AUTH_COOKIE_NAME).toBe('__Host-auth-token');
    vi.unstubAllEnvs();
  });

  it('setAuthCookie define httpOnly + path=/ + maxAge=900s', () => {
    const res = NextResponse.json({ ok: true });
    setAuthCookie(res, 'fake-token');
    const cookie = res.cookies.get(AUTH_COOKIE_NAME);
    expect(cookie).toBeDefined();
    expect(cookie!.httpOnly).toBe(true);
    expect(cookie!.path).toBe('/');
    expect(cookie!.maxAge).toBe(15 * 60); // 900s
  });

  it('setAuthCookie define Secure=true e SameSite=Strict em produção', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const mod = await import('@/lib/auth');
    const res = NextResponse.json({ ok: true });
    mod.setAuthCookie(res, 'fake-token');
    const cookie = res.cookies.get('__Host-auth-token');
    expect(cookie!.secure).toBe(true);
    expect(cookie!.sameSite).toBe('strict');
    vi.unstubAllEnvs();
  });

  it('generateToken gera JWT com exp-iat = 900s (15 min)', async () => {
    const token = await generateToken({ userId: 'u1', email: 'a@b.pt', role: 'user' });
    const secret = new TextEncoder().encode(JWT_TEST_KEY);
    const { payload } = await jwtVerify(token, secret);
    expect((payload.exp as number) - (payload.iat as number)).toBe(900);
  });

  it('POST /api/auth/refresh sem cookie de refresh retorna 401', async () => {
    const { POST } = await import('@/app/api/auth/refresh/route');
    const req = new NextRequest('http://localhost:3000/api/auth/refresh', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/refresh com rotação inválida retorna 401', async () => {
    // rotateRefreshToken → token não existe na BD (findUnique null) → 401
    mocks.refreshToken.findUnique.mockResolvedValue(null);
    const { POST } = await import('@/app/api/auth/refresh/route');
    const req = new NextRequest('http://localhost:3000/api/auth/refresh', { method: 'POST' });
    req.cookies.set(process.env.NODE_ENV === 'production' ? '__Host-refresh-token' : 'refresh-token', 'token-invalido-xyz');
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
