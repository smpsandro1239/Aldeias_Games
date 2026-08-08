// @ts-nocheck — @playwright/test in devDependencies (not available on Vercel)
import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT || 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'list',
  timeout: 120_000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Produção (next start) — modo dev (next dev) é instável neste projeto local:
    // Fast Refresh invalida chunks a meio das navegações → ChunkLoadError aleatório.
    // Correr antes: DATABASE_URL="file:./dev.db" npx next build --webpack
    command: 'npx next start -p ' + PORT,
    // O path SQLite é relativo ao diretório do schema (prisma/): "file:./dev.db" → prisma/dev.db.
    // "file:./prisma/dev.db" criaria prisma/prisma/dev.db (errado).
    // E2E_TEST=1 relaxa o rate-limit no proxy (a suite faz ~8 logins por run).
    env: { DATABASE_URL: 'file:./dev.db', E2E_TEST: '1' },
    port: Number(PORT),
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
