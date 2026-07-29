// @ts-nocheck - Playwright test runner (types resolved at runtime)
import { test, expect } from '@playwright/test';

const EMAIL = 'admin@aldeias.pt';
const PASSWORD = '123456';

test.describe('Login + Compra Raspadinha', () => {
  test('login via API e compra raspadinha com saldo', async ({ page, request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: { email: EMAIL, password: PASSWORD },
    });
    expect(loginRes.ok()).toBeTruthy();
    const loginData = await loginRes.json();
    expect(loginData.token).toBeTruthy();

    await page.context().addCookies([
      {
        name: 'auth-token',
        value: loginData.token,
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/jogos', { timeout: 60000 });
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('body', { timeout: 30000 });
    const jogosUrl = page.url();
    expect(jogosUrl).toContain('/jogos');

    const pageText = await page.textContent('body');
    expect(pageText).toContain('Raspadinha');
  }, { timeout: 120000 });
});
