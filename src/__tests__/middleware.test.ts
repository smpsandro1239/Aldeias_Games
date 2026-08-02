// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// JWT_SECRET is set in setup.ts before all tests

// Mock jose before importing proxy
vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
}));

// Mock rate-limit
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 10, resetTime: null }),
}));

import { proxy } from '@/proxy';
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

function createRequest(pathname: string, options: {
  method?: string;
  cookieToken?: string;
  bearerToken?: string;
  origin?: string;
  referer?: string;
  host?: string;
} = {}): NextRequest {
  const url = `http://localhost:3000${pathname}`;
  const headers = new Headers();

  if (options.cookieToken) {
    headers.set('cookie', `auth-token=${options.cookieToken}`);
  }
  if (options.bearerToken) {
    headers.set('authorization', `Bearer ${options.bearerToken}`);
  }
  if (options.origin) {
    headers.set('origin', options.origin);
  }
  if (options.referer) {
    headers.set('referer', options.referer);
  }
  if (options.host) {
    headers.set('host', options.host);
  } else {
    headers.set('host', 'localhost:3000');
  }

  return new NextRequest(url, {
    method: options.method || 'GET',
    headers,
  });
}

describe('Proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Public pages', () => {
    it('deve permitir acesso a páginas públicas', async () => {
      const req = createRequest('/');
      const res = await proxy(req);
      expect(res.status).not.toBe(401);
    });

    it('deve permitir acesso a /login', async () => {
      const req = createRequest('/login');
      const res = await proxy(req);
      expect(res.status).not.toBe(401);
    });

    it('deve permitir acesso a /register', async () => {
      const req = createRequest('/register');
      const res = await proxy(req);
      expect(res.status).not.toBe(401);
    });
  });

  describe('API authentication', () => {
    it('deve bloquear API protegida sem token', async () => {
      const req = createRequest('/api/users/perfil');
      const res = await proxy(req);
      expect(res.status).toBe(401);
    });

    it('deve permitir API pública sem token', async () => {
      const req = createRequest('/api/auth/login');
      const res = await proxy(req);
      // Public routes pass through — should not be 401
      expect(res.status).not.toBe(401);
    });

    it('deve permitir GET da prova de jogo sem token', async () => {
      const req = createRequest('/api/participacoes/abc123/prova');
      const res = await proxy(req);
      expect(res.status).not.toBe(401);
    });

    it('deve permitir API com Bearer token válido', async () => {
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: { userId: 'user-1', role: 'user', aldeiaId: 'aldeia-1' },
      } as any);

      const req = createRequest('/api/users/perfil', { bearerToken: 'valid-token' });
      const res = await proxy(req);
      expect(res.status).not.toBe(401);
    });

    it('deve bloquear API com token inválido', async () => {
      vi.mocked(jwtVerify).mockRejectedValue(new Error('Invalid token'));

      const req = createRequest('/api/users/perfil', { bearerToken: 'invalid-token' });
      const res = await proxy(req);
      expect(res.status).toBe(401);
    });

    it('deve permitir API com cookie token válido', async () => {
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: { userId: 'user-1', role: 'user' },
      } as any);

      const req = createRequest('/api/users/perfil', { cookieToken: 'valid-token' });
      const res = await proxy(req);
      expect(res.status).not.toBe(401);
    });
  });

  describe('CSRF protection', () => {
    it('deve permitir GET sem CSRF check', async () => {
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: { userId: 'user-1', role: 'user' },
      } as any);

      const req = createRequest('/api/users/perfil', {
        method: 'GET',
        cookieToken: 'valid-token',
      });
      const res = await proxy(req);
      expect(res.status).not.toBe(403);
    });

    it('deve bloquear POST com cookie e origin diferente', async () => {
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: { userId: 'user-1', role: 'user' },
      } as any);

      const req = createRequest('/api/users/perfil', {
        method: 'POST',
        cookieToken: 'valid-token',
        origin: 'https://evil.com',
        host: 'localhost:3000',
      });
      const res = await proxy(req);
      expect(res.status).toBe(403);
    });

    it('deve permitir POST com cookie e origin correto', async () => {
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: { userId: 'user-1', role: 'user' },
      } as any);

      const req = createRequest('/api/users/perfil', {
        method: 'POST',
        cookieToken: 'valid-token',
        origin: 'http://localhost:3000',
        host: 'localhost:3000',
      });
      const res = await proxy(req);
      expect(res.status).not.toBe(403);
    });

    it('deve permitir POST com Bearer token (sem CSRF)', async () => {
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: { userId: 'user-1', role: 'user' },
      } as any);

      const req = createRequest('/api/users/perfil', {
        method: 'POST',
        bearerToken: 'valid-token',
        origin: 'https://evil.com',
        host: 'localhost:3000',
      });
      const res = await proxy(req);
      expect(res.status).not.toBe(403);
    });
  });

  describe('Page role protection', () => {
    it('deve redirecionar user sem token para /', async () => {
      const req = createRequest('/clientedashboard');
      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/');
    });

    it('deve redirecionar user para dashboard correto', async () => {
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: { userId: 'user-1', role: 'user' },
      } as any);

      const req = createRequest('/superadmindashboard', { cookieToken: 'token' });
      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/clientedashboard');
    });

    it('deve permitir super_admin em /superadmindashboard', async () => {
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: { userId: 'user-1', role: 'super_admin' },
      } as any);

      const req = createRequest('/superadmindashboard', { cookieToken: 'token' });
      const res = await proxy(req);
      expect(res.status).not.toBe(307);
    });

    it('deve bloquear aldeia_admin em /superadmindashboard', async () => {
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: { userId: 'user-1', role: 'aldeia_admin' },
      } as any);

      const req = createRequest('/superadmindashboard', { cookieToken: 'token' });
      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/admindashboard');
    });
  });
});
