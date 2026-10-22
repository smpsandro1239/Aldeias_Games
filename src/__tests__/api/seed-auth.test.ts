/**
 * C1 · RONDA SEGURANÇA 1 — Testes de regressão de /api/seed
 *
 * Garante que a rota de seed (que cria utilizadores com credenciais
 * conhecidas, incluindo super_admin) NÃO é acessível anonimamente:
 *  - sem autenticação → 401
 *  - user comum (role 'user') → 403
 *  - produção (mesmo super_admin) → 403 sem executar seed
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock da camada de auth: controlamos quem está "autenticado" por teste.
const mockGetFullUserFromRequest = vi.fn();
vi.mock('@/lib/auth', () => ({
  getFullUserFromRequest: (...args: unknown[]) => mockGetFullUserFromRequest(...args),
}));

// Mock do db-init: nunca executar seed real nos testes; apenas observar chamadas.
const mockEnsureSeeded = vi.fn().mockResolvedValue({ seeded: true });
const mockGetSeedStatus = vi.fn().mockResolvedValue({ seeded: true, counts: {} });
vi.mock('@/lib/db-init', () => ({
  ensureSeeded: (...args: unknown[]) => mockEnsureSeeded(...args),
  getSeedStatus: (...args: unknown[]) => mockGetSeedStatus(...args),
}));

import { POST, GET } from '@/app/api/seed/route';

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/seed', { method: 'POST' });
}

describe('POST /api/seed — auth required (C1)', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    mockGetFullUserFromRequest.mockReset();
    mockEnsureSeeded.mockClear();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('deve retornar 401 sem autenticação', async () => {
    mockGetFullUserFromRequest.mockResolvedValue(null);
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
    expect(mockEnsureSeeded).not.toHaveBeenCalled();
  });

  it('deve retornar 403 para user com role "user"', async () => {
    mockGetFullUserFromRequest.mockResolvedValue({ id: 'u1', role: 'user' });
    const res = await POST(makeRequest());
    expect(res.status).toBe(403);
    expect(mockEnsureSeeded).not.toHaveBeenCalled();
  });

  it('deve retornar 403 para aldeia_admin (não é super_admin)', async () => {
    mockGetFullUserFromRequest.mockResolvedValue({ id: 'u2', role: 'aldeia_admin' });
    const res = await POST(makeRequest());
    expect(res.status).toBe(403);
    expect(mockEnsureSeeded).not.toHaveBeenCalled();
  });

  it('deve retornar 403 em NODE_ENV=production MESMO com super_admin e não executar seed', async () => {
    process.env.NODE_ENV = 'production';
    mockGetFullUserFromRequest.mockResolvedValue({ id: 'u3', role: 'super_admin' });
    const res = await POST(makeRequest());
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('produção');
    expect(mockEnsureSeeded).not.toHaveBeenCalled();
  });

  it('deve permitir super_admin fora de produção (200 + seed executado)', async () => {
    process.env.NODE_ENV = 'development';
    mockGetFullUserFromRequest.mockResolvedValue({ id: 'u4', role: 'super_admin' });
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockEnsureSeeded).toHaveBeenCalledTimes(1);
  });
});

describe('GET /api/seed — estado protegido (C1)', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    mockGetFullUserFromRequest.mockReset();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('deve retornar 401 sem autenticação (fora de produção)', async () => {
    process.env.NODE_ENV = 'development';
    mockGetFullUserFromRequest.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/seed', { method: 'GET' });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 em produção mesmo para super_admin', async () => {
    process.env.NODE_ENV = 'production';
    mockGetFullUserFromRequest.mockResolvedValue({ id: 'u5', role: 'super_admin' });
    const req = new NextRequest('http://localhost:3000/api/seed', { method: 'GET' });
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});
