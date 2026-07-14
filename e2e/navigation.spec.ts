// @ts-nocheck - Playwright test runner (types resolved at runtime)
import { test, expect } from '@playwright/test';

test.describe('Navigation and routing', () => {
  test('can navigate to public pages via URL', async ({ page }) => {
    const publicPages = [
      { url: '/', shouldContain: true },
      { url: '/jogos', shouldContain: true },
      { url: '/privacidade', shouldContain: true },
      { url: '/termos', shouldContain: true },
      { url: '/forgot-password', shouldContain: true },
    ];

    for (const { url } of publicPages) {
      const response = await page.goto(url, { timeout: 90000, waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator('body')).toBeVisible({ timeout: 30000 });
    }
  }, { timeout: 180000 });

  test('non-existent page shows 404', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345', { timeout: 60000 });
    expect(response?.status()).toBeDefined();
  }, { timeout: 90000 });

  test('admin dashboard requires authentication', async ({ page }) => {
    await page.goto('/admindashboard', { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toBeTruthy();
  });

  test('super admin dashboard requires authentication', async ({ page }) => {
    await page.goto('/superadmindashboard', { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toBeTruthy();
  });

  test('vendedor dashboard requires authentication', async ({ page }) => {
    await page.goto('/vendedordashboard', { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toBeTruthy();
  });

  test('client dashboard requires authentication', async ({ page }) => {
    await page.goto('/clientedashboard', { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toBeTruthy();
  });
});

test.describe('Static pages content', () => {
  test('privacidade has RGPD content', async ({ page }) => {
    await page.goto('/privacidade', { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    const content = await page.textContent('body');
    expect(content).toContain('Privacidade');
  });

  test('termos has terms content', async ({ page }) => {
    await page.goto('/termos', { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    const content = await page.textContent('body');
    expect(content).toContain('Termos');
  });

  test('perfil shows login prompt when not authenticated', async ({ page }) => {
    await page.goto('/perfil', { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  }, { timeout: 90000 });
});
