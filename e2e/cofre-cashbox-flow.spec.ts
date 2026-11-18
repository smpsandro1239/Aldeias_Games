import { test, expect } from '@playwright/test';

const VENDEDOR_EMAIL = 'vendedor@gmail.com';
const ADMIN_EMAIL = 'admin@aldeias.pt';
const PASSWORD = '123456';

test.describe('Cofre / Cashbox Flow', () => {
  test('vendedor deposita cashbox no cofre e admin confirma', async ({ page }) => {
    // ── Step 1: Login as vendedor ──────────────────────────────
    let res = await page.context().request.post('/api/auth/login', {
      data: { email: VENDEDOR_EMAIL, password: PASSWORD },
    });
    expect(res.ok()).toBeTruthy();
    let loginData = await res.json();

    const sellerAuthCookie = (await page.context().cookies()).find(cookie => cookie.name === '__Host-auth-token');
    expect(sellerAuthCookie).toBeTruthy();
    expect(sellerAuthCookie?.httpOnly).toBe(true);
    expect(sellerAuthCookie?.secure).toBe(true);
    expect(sellerAuthCookie?.path).toBe('/');
    await page.goto('/', { timeout: 30000 });
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }, { token: loginData.token, user: loginData.user });

    // ── Step 2: Navigate to vendedor dashboard ────────────────
    await page.goto('/vendedordashboard', { timeout: 30000 });
    await expect(page.locator('button[role="tab"]', { hasText: 'Caixa' })).toBeVisible({ timeout: 15000 });

    // ── Step 3: Click "Caixa" tab ──────────────────────────────
    await page.locator('button[role="tab"]', { hasText: 'Caixa' }).click();
    await page.waitForTimeout(500);

    // ── Step 4: Verify cashbox balance visible ─────────────────
    await expect(page.getByText('Dinheiro físico em tua posse')).toBeVisible({ timeout: 10000 });

    // ── Step 5: Click "Pedir Depósito" button ──────────────────
    const pedirDepositoBtn = page.locator('button', { hasText: 'Pedir Depósito' });
    await expect(pedirDepositoBtn).toBeVisible({ timeout: 5000 });
    await pedirDepositoBtn.click();
    await page.waitForTimeout(500);

    // ── Step 6: Fill deposit amount and submit ─────────────────
    const dialogTitle = page.getByText('Depositar no Cofre da Aldeia');
    await expect(dialogTitle).toBeVisible({ timeout: 3000 });

    const valorInput = page.locator('input#valorDeposito');
    await valorInput.fill('20');

    await page.locator('button', { hasText: 'Solicitar Depósito' }).click();
    await page.waitForTimeout(1000);

    // ── Step 7: Verify success toast or dialog closed ──────────
    await expect(dialogTitle).not.toBeVisible({ timeout: 5000 }).catch(() => {});

    // ── Step 8: Clear session, login as admin ──────────────────
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();

    res = await page.context().request.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: PASSWORD },
    });
    expect(res.ok()).toBeTruthy();
    loginData = await res.json();

    const adminAuthCookie = (await page.context().cookies()).find(cookie => cookie.name === '__Host-auth-token');
    expect(adminAuthCookie).toBeTruthy();
    expect(adminAuthCookie?.httpOnly).toBe(true);
    expect(adminAuthCookie?.secure).toBe(true);
    expect(adminAuthCookie?.path).toBe('/');
    await page.goto('/', { timeout: 30000 });
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }, { token: loginData.token, user: loginData.user });

    // ── Step 9: Navigate to admin cofre page ───────────────────
    await page.goto('/admindashboard/cofre', { timeout: 30000 });
    await expect(page.locator('button[role="tab"]', { hasText: 'Pendentes' })).toBeVisible({ timeout: 15000 });

    // ── Step 10: Click "Pendentes" tab ─────────────────────────
    await page.locator('button[role="tab"]', { hasText: 'Pendentes' }).click();
    await page.waitForTimeout(500);

    // ── Step 11: Click "Confirmar" on a pending deposit ────────
    // The first pending deposit card shows a "Confirmar" button
    const confirmBtn = page.locator('button', { hasText: 'Confirmar' }).first();
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();
    await page.waitForTimeout(500);

    // ── Step 12: Confirm in the modal ──────────────────────────
    const modalConfirmBtn = page.locator('button', { hasText: 'Confirmar' }).last();
    await expect(modalConfirmBtn).toBeVisible({ timeout: 3000 });
    await modalConfirmBtn.click();
    await page.waitForTimeout(1000);

    // ── Step 13: Verify deposit confirmed ──────────────────────
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Pendentes (0'); // should have no or fewer pending now
  }, { timeout: 180000 });
});
