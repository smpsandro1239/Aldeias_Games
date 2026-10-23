/**
 * R3 (A3 · Sprint 1) — Testes: OAuth state com CSPRNG + validação timingSafeEqual.
 * Mock-based, sem rede externa.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { NextRequest } from 'next/server';
import { GET as googleInit } from '@/app/api/auth/google/route';

describe('A3 — OAuth state crypto.randomBytes + timingSafeEqual', () => {
  const originalEnv = { ...process.env };

  function withGoogleEnv() {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
  }

  it('GET /api/auth/google define cookie de state com >=32 chars aleatórios', async () => {
    withGoogleEnv();
    const req = new NextRequest('http://localhost:3000/api/auth/google');
    const res = await googleInit(req);
    const cookie = res.cookies.get('google_oauth_state');
    expect(cookie).toBeDefined();
    expect(cookie!.value.length).toBeGreaterThanOrEqual(32);
    // base64url (gerado por randomBytes(32)) → caracteres url-safe
    expect(cookie!.value).toMatch(/^[A-Za-z0-9_-]+$/);
    process.env = { ...originalEnv };
  });

  it('dois states gerados são diferentes (entropia CSPRNG)', async () => {
    withGoogleEnv();
    const r1 = await googleInit(new NextRequest('http://localhost:3000/api/auth/google'));
    const r2 = await googleInit(new NextRequest('http://localhost:3000/api/auth/google'));
    const s1 = r1.cookies.get('google_oauth_state')!.value;
    const s2 = r2.cookies.get('google_oauth_state')!.value;
    expect(s1).not.toBe(s2);
    process.env = { ...originalEnv };
  });

  it('callback rejeita state em falta (sem cookie) com redirect de erro', async () => {
    const { handleOAuthCallback } = await import('@/lib/oauth-handler');
    const req = new NextRequest(
      'http://localhost:3000/api/auth/google/callback?code=fake&state=abc123',
    );
    const res = await handleOAuthCallback(req, 'google', {
      providerName: 'Google',
      getUserData: async () => ({ email: 'x@y.pt', providerId: 'pid' }),
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
      clientId: 'id',
      clientSecret: 'secret',
      redirectUri: 'http://localhost:3000/api/auth/google/callback',
      scopes: ['openid'],
    } as any);
    // State ausente → não deve prosseguir para troca de code (erro/redirect)
    expect([400, 307, 302]).toContain(res.status);
  });

  it('callback rejeita state mismatch (CSRF) sem tocar no token endpoint', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 200 })
    );
    const { handleOAuthCallback } = await import('@/lib/oauth-handler');
    const req = new NextRequest(
      'http://localhost:3000/api/auth/google/callback?code=fake&state=STATESAOFORJADOS',
    );
    req.cookies.set('google_oauth_state', 'OUTROSTATECOMPRIMENTOIDENTICOXX');
    const res = await handleOAuthCallback(req, 'google', {
      providerName: 'Google',
      getUserData: async () => ({ email: 'x@y.pt', providerId: 'pid' }),
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
      clientId: 'id',
      clientSecret: 'secret',
      redirectUri: 'http://localhost:3000/api/auth/google/callback',
      scopes: ['openid'],
    } as any);
    expect([400, 307, 302]).toContain(res.status);
    // O estado inválido tem de ser rejeitado ANTES de qualquer chamada ao provider
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
