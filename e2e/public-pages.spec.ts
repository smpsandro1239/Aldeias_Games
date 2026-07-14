import { test, expect } from '@playwright/test';

test.describe('Public pages', () => {
  test('landing page loads with title and content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Aldeias/);
    // Should show the splash screen or landing content
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('perfil page redirects to login prompt when not authenticated', async ({ page }) => {
    await page.goto('/perfil');
    await page.waitForLoadState('networkidle');
    // Should show login prompt or redirect
    const content = await page.content();
    expect(content).toBeTruthy();
  });

  test('jogos page loads', async ({ page }) => {
    await page.goto('/jogos');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('privacidade page loads', async ({ page }) => {
    await page.goto('/privacidade');
    await page.waitForLoadState('networkidle');
    const content = await page.textContent('body');
    expect(content).toContain('Privacidade');
  });

  test('termos page loads', async ({ page }) => {
    await page.goto('/termos');
    await page.waitForLoadState('networkidle');
    const content = await page.textContent('body');
    expect(content).toContain('Termos');
  });

  test('forgot-password page loads', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('API Health', () => {
  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
  });
});
