// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

describe('Proxy — JWT_SECRET lazy (sem throw em module scope)', () => {
  it('importar proxy sem JWT_SECRET não lança erro em module scope', async () => {
    const secretAntigo = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    vi.resetModules();
    vi.doMock('jose', () => ({ jwtVerify: vi.fn() }));
    vi.doMock('@/lib/rate-limit', () => ({
      checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 10, resetTime: null }),
    }));

    const { proxy } = await import('@/proxy');
    expect(typeof proxy).toBe('function');

    if (secretAntigo) process.env.JWT_SECRET = secretAntigo;
  });
});
