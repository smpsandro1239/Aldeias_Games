// @ts-nocheck - Playwright test runner (types resolved at runtime)
import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@aldeias.pt';
const PASSWORD = '123456';

test.describe('Login + Compra Raspadinha', () => {
  test('login via API e compra raspadinha com saldo', async ({ page, request }) => {
    // 1. Login via API
    const loginRes = await request.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: PASSWORD },
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
    // Populate localStorage so user info is available client-side
    await page.goto('/', { timeout: 30000 });
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, loginData.token);

    // 2. Navigate to jogos page
    await page.goto('/jogos', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/jogos/);
    await expect(page.getByText('Os Teus Jogos')).toBeVisible({ timeout: 10000 });

    // 3. Expand the evento section inside the already-expanded aldeia
    await page.getByText('Festa da Serra').click();
    await page.waitForTimeout(500);

    // 4. Click on "Raspadinha de Natal" game card
    await page.locator('button', { hasText: 'Raspadinha de Natal' }).click();
    await page.waitForLoadState('networkidle');

    // 5. Verify we're on the raspadinha game page
    await expect(page).toHaveURL(/raspadinha-premium/);
    await expect(page.getByText('Raspadinha de Natal')).toBeVisible({ timeout: 10000 });

    // 6. Click "Participar por 2€"
    const participarBtn = page.locator('button', { hasText: 'Participar' });
    await expect(participarBtn).toBeVisible({ timeout: 10000 });
    await participarBtn.click();
    await page.waitForTimeout(500);

    // 7. Handle player-data-confirm modal (admin role)
    const playerDataDialog = page.getByText('Dados do Jogador');
    if (await playerDataDialog.isVisible().catch(() => false)) {
      await page.locator('button', { hasText: 'jogar com os meus dados' }).click();
      await page.waitForTimeout(500);
    }

    // 8. In payment dialog, select "Saldo Aldeias"
    const saldoBtn = page.locator('button', { hasText: 'Saldo Aldeias' });
    await expect(saldoBtn).toBeVisible({ timeout: 5000 });
    await saldoBtn.click();

    // 9. Wait for game to process (button changes from "A processar..." to "Raspar Tudo")
    await expect(page.locator('button', { hasText: 'Raspar Tudo' })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(500);

    // 10. Click "Raspar Tudo" to auto-reveal all slots
    await page.locator('button', { hasText: 'Raspar Tudo' }).click();
    await page.waitForTimeout(1500);

    // 11. Verify the game completed — either shows "Reclamar Prémio" or "Comprar Nova"
    const bodyText = await page.textContent('body');
    const completed = bodyText.includes('Reclamar Prémio') || bodyText.includes('Comprar Nova');
    expect(completed).toBeTruthy();
  }, { timeout: 120000 });
});
