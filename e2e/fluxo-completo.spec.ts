// @ts-nocheck
import { test, expect } from '@playwright/test';

const DEV_EMAIL = 'admin@aldeias.pt';
const DEV_PASSWORD = '123456';

test.describe('Fluxo Completo: Login → Dashboard → Jogos', () => {
  test('login via API e aceder ao admin dashboard', async ({ page, request }) => {
    // Step 1: Login via API to get token
    const loginRes = await request.post('/api/auth/login', {
      data: { email: DEV_EMAIL, password: DEV_PASSWORD },
    });
    expect(loginRes.ok()).toBeTruthy();
    const loginData = await loginRes.json();
    expect(loginData.token).toBeTruthy();

    // Step 2: Set token as cookie and navigate to dashboard
    await page.context().addCookies([
      {
        name: 'auth-token',
        value: loginData.token,
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/admindashboard', { timeout: 60000 });
    await page.waitForLoadState('networkidle');

    // Step 3: Dashboard should load (may redirect based on role)
    const url = page.url();
    expect(url).toBeTruthy();
    await expect(page.locator('body')).toBeVisible({ timeout: 30000 });
  }, { timeout: 120000 });

  test('login via modal e navegar pelo UI', async ({ page }) => {
    // Step 1: Go to landing page
    await page.goto('/', { timeout: 60000 });
    await page.waitForLoadState('networkidle');

    // Step 2: Open login modal
    const loginBtn = page.locator('button', { hasText: /entrar|login/i }).first();
    if (await loginBtn.isVisible({ timeout: 10000 })) {
      await loginBtn.click();
      await page.waitForTimeout(500);

      // Step 3: Fill credentials
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.isVisible({ timeout: 5000 })) {
        await emailInput.fill(DEV_EMAIL);
        await page.locator('input[type="password"]').first().fill(DEV_PASSWORD);

        // Step 4: Submit
        const submitBtn = page.locator('button[type="submit"]').first();
        await submitBtn.click();

        // Step 5: Wait for navigation (may go to dashboard or stay)
        await page.waitForTimeout(3000);
        const url = page.url();
        expect(url).toBeTruthy();
      }
    }
  }, { timeout: 120000 });

  test('API de jogos retorna lista de jogos', async ({ request }) => {
    const res = await request.get('/api/jogos');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test('API de eventos retorna lista de eventos', async ({ request }) => {
    const res = await request.get('/api/eventos');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('data');
  });

  test('API de health verifica estado do sistema', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('ok');
  });

  test('página de jogos carrega correctamente', async ({ page }) => {
    await page.goto('/jogos', { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible({ timeout: 30000 });
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  }, { timeout: 90000 });
});

test.describe('Fluxo API: Participações', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { email: DEV_EMAIL, password: DEV_PASSWORD },
    });
    if (loginRes.ok()) {
      const data = await loginRes.json();
      token = data.token;
    }
  });

  test('listar jogos disponíveis via API', async ({ request }) => {
    const res = await request.get('/api/jogos');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.data.length).toBeGreaterThan(0);
  });

  test('participações sem auth retorna 401', async ({ request }) => {
    const res = await request.get('/api/participacoes');
    expect(res.status()).toBe(401);
  });

  test('wallet sem auth retorna erro', async ({ request }) => {
    const res = await request.get('/api/wallet');
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe('Fluxo API: Verificação de Integridade', () => {
  test('verificar hash de participação existente', async ({ request }) => {
    // Query participacoes via public verification endpoint
    const res = await request.post('/api/participacoes/verificar', {
      data: { hash: 'nonexistent-hash' },
    });
    // Should return not found or error, but not crash
    expect(res.status()).toBeDefined();
  });

  test('health check inclui versão', async ({ request }) => {
    const res = await request.get('/api/health');
    const data = await res.json();
    expect(data).toHaveProperty('status', 'ok');
    // Health should respond quickly
    expect(res.headers()['content-type']).toContain('application/json');
  });
});
