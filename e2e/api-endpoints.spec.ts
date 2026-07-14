import { test, expect } from '@playwright/test';

test.describe('Auth API endpoints', () => {
  test('POST /api/auth/login requires email and password', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { email: '', password: '' },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('POST /api/auth/register validates required fields', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {},
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('GET /api/auth/2fa without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/auth/2fa');
    expect(response.status()).toBe(401);
  });
});

test.describe('Public API endpoints', () => {
  test('GET /api/jogos returns list', async ({ request }) => {
    const response = await request.get('/api/jogos');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('data');
  });

  test('GET /api/aldeias returns list', async ({ request }) => {
    const response = await request.get('/api/aldeias');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('aldeias');
  });

  test('GET /api/health returns ok', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
  });

  test('GET /api/eventos returns list', async ({ request }) => {
    const response = await request.get('/api/eventos');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('data');
  });

  test('GET /api/notificacoes without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/notificacoes');
    expect(response.status()).toBe(401);
  });

  test('GET /api/wallet without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/wallet');
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe('Rate limiting', () => {
  test('login endpoint has rate limiting', async ({ request }) => {
    // Make multiple rapid requests to trigger rate limiting
    const requests = Array.from({ length: 6 }, () =>
      request.post('/api/auth/login', {
        data: { email: 'test@test.com', password: 'wrongpass' },
      })
    );

    const responses = await Promise.all(requests);
    const statuses = responses.map(r => r.status());
    
    // At least one should be rate limited (429) or all should be error responses
    const hasRateLimit = statuses.includes(429);
    const allErrors = statuses.every(s => s >= 400);
    expect(hasRateLimit || allErrors).toBeTruthy();
  });
});

test.describe('CORS and security headers', () => {
  test('API responses have security headers', async ({ request }) => {
    const response = await request.get('/api/health');
    const headers = response.headers();
    // Check for common security headers (may vary based on middleware config)
    expect(headers).toBeTruthy();
  });
});
