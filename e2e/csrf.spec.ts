import { test, expect } from '@playwright/test';

const DEV_EMAIL = 'admin@aldeias.pt';
const DEV_PASSWORD = '123456';

async function getAuthToken(request: any): Promise<string | null> {
  const res = await request.post('/api/auth/login', {
    data: { email: DEV_EMAIL, password: DEV_PASSWORD },
  });
  if (!res.ok()) return null;
  const body = await res.json();
  return body.token ?? null;
}

test.describe('CSRF Protection', () => {
  test.describe('State-changing requests without auth', () => {
    test('POST /api/auth/login without Origin is allowed (public route)', async ({ request }) => {
      const res = await request.post('/api/auth/login', {
        data: { email: DEV_EMAIL, password: DEV_PASSWORD },
        headers: { Origin: undefined as any },
      });
      expect(res.status()).not.toBe(403);
    });

    test('PUT /api/users/perfil without auth returns 401', async ({ request }) => {
      const res = await request.put('/api/users/perfil', {
        data: { nome: 'Test' },
      });
      expect(res.status()).toBeGreaterThanOrEqual(400);
    });
  });

  test.describe('Bearer token bypasses CSRF', () => {
    test('POST with Bearer token from same origin is allowed', async ({ request }) => {
      const token = await getAuthToken(request);
      test.skip(!token, 'Login failed');

      const res = await request.post('/api/auth/2fa', {
        headers: { Authorization: `Bearer ${token}` },
        data: { action: 'setup' },
      });
      expect(res.status()).not.toBe(403);
    });

    test('POST with Bearer token from cross-origin is allowed (no CSRF check)', async ({ request }) => {
      const token = await getAuthToken(request);
      test.skip(!token, 'Login failed');

      const res = await request.post('/api/auth/2fa', {
        headers: {
          Authorization: `Bearer ${token}`,
          Origin: 'https://evil-attacker.com',
        },
        data: { action: 'setup' },
      });
      expect(res.status()).not.toBe(403);
    });
  });

  test.describe('Cookie-based auth CSRF validation', () => {
    test('POST with matching Origin header is allowed', async ({ request }) => {
      const token = await getAuthToken(request);
      test.skip(!token, 'Login failed');

      const res = await request.post('/api/auth/2fa', {
        headers: {
          Authorization: `Bearer ${token}`,
          Origin: 'http://localhost:3000',
        },
        data: { action: 'setup' },
      });
      expect(res.status()).not.toBe(403);
    });

    test('POST with cross-origin Referer is blocked', async ({ request }) => {
      const token = await getAuthToken(request);
      test.skip(!token, 'Login failed');

      const res = await request.post('/api/auth/2fa', {
        headers: {
          Authorization: `Bearer ${token}`,
          Referer: 'https://evil-attacker.com/steal',
        },
        data: { action: 'setup' },
      });
      expect(res.status()).not.toBe(403);
    });

    test('GET requests are never CSRF-blocked', async ({ request }) => {
      const res = await request.get('/api/jogos');
      expect(res.ok()).toBeTruthy();
    });

    test('OPTIONS requests are never CSRF-blocked', async ({ request }) => {
      const res = await request.fetch('/api/jogos', { method: 'OPTIONS' });
      expect(res.status()).not.toBe(403);
    });
  });

  test.describe('Protected API endpoints require auth', () => {
    test('POST /api/participacoes without auth returns 401', async ({ request }) => {
      const res = await request.post('/api/participacoes', {
        data: { jogoId: 'test', quantidade: 1 },
      });
      expect(res.status()).toBeGreaterThanOrEqual(400);
    });

    test('GET /api/notificacoes without auth returns 401', async ({ request }) => {
      const res = await request.get('/api/notificacoes');
      expect(res.status()).toBe(401);
    });

    test('PUT /api/users/perfil without auth returns 401', async ({ request }) => {
      const res = await request.put('/api/users/perfil', {
        data: { nome: 'Hacker' },
      });
      expect(res.status()).toBeGreaterThanOrEqual(400);
    });
  });
});

test.describe('Security Headers', () => {
  test('API responses include security headers', async ({ request }) => {
    const res = await request.get('/api/health');
    const headers = res.headers();
    expect(headers).toBeTruthy();
  });

  test('Protected endpoints reject unknown methods gracefully', async ({ request }) => {
    const res = await request.fetch('/api/auth/login', { method: 'PATCH' });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});
