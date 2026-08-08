// @ts-nocheck - Playwright test runner (types resolved at runtime)
import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@aldeias.pt';
const PASSWORD = '123456';

test.describe('Verificação Pública de Raspadinhas', () => {
  test('compra raspadinha e verifica o hash na página pública', async ({ page, request }) => {
    // 0. Garantir dados (auto-seed) antes de qualquer fluxo
    await request.post('/api/seed');
    for (let i = 0; i < 20; i++) {
      const statusRes = await request.get('/api/seed');
      const status = await statusRes.json();
      if (status?.seeded) break;
      await page.waitForTimeout(2000);
    }

    // 1. Login via API (cookie httpOnly partilhado com a página)
    const loginRes = await request.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: PASSWORD },
    });
    if (!loginRes.ok()) {
      throw new Error(`Login falhou: ${await loginRes.text()}`);
    }
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
    await page.goto('/', { timeout: 120000, waitUntil: 'domcontentloaded' });
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
    }, loginData.token);

    // Warm-up das rotas de verificação (dev: evita ChunkLoadError por Fast Refresh concorrente)
    await page.goto('/verificar', { timeout: 120000, waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Verificar Participação')).toBeVisible({ timeout: 60000 });

    // 2. Encontrar jogo raspadinha ativo
    const jogosRes = await page.request.get('/api/jogos?ativos=true', {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    expect(jogosRes.ok(), `jogos falhou: ${await jogosRes.text()}`).toBeTruthy();
    const jogosData = await jogosRes.json();
    const lista = jogosData.data || [];
    const jogo = lista.find((j) => j.tipo === 'raspadinha');
    expect(jogo, 'deve existir uma raspadinha ativa (seed)').toBeTruthy();

    // 3. Comprar raspadinha com saldo via API (Bearer dispensa CSRF do proxy)
    const partRes = await page.request.post('/api/participacoes', {
      headers: { Authorization: `Bearer ${loginData.token}` },
      data: { jogoId: jogo.id, metodoPagamento: 'saldo', quantidade: 1, dadosParticipacao: {} },
    });
    expect(partRes.ok(), `participação deve ser criada (${await partRes.text()})`).toBeTruthy();
    const partData = await partRes.json();
    const participacao = partData.participacao || partData.data;
    const hash = participacao?.hashRaspe || participacao?.hashParticipacao;
    expect(hash, 'participação deve devolver hash').toBeTruthy();

    // 4. Página pública de verificação (redireciona de /verificar-raspadinha → /verificar)
    await page.goto(`/verificar-raspadinha?hash=${encodeURIComponent(hash)}`, {
      timeout: 30000,
      waitUntil: 'domcontentloaded',
    });
    await expect(page).toHaveURL(/(\/verificar-raspadinha|\/verificar)(\?|$)/, { timeout: 15000 });
    await expect(page.getByText('Verificar Participação')).toBeVisible({ timeout: 15000 });

    // 5. O hash autêntico é validado
    await expect(page.getByText('Válida')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/verificada com sucesso/i)).toBeVisible({ timeout: 15000 });

    // 6. Hash adulterado → inválida / não corresponde
    const input = page.getByPlaceholder('Cole o hash da participação...');
    const tampered = hash.slice(0, -1) + (hash.endsWith('a') ? 'b' : 'a');
    await input.fill(tampered);
    await page.getByRole('button', { name: 'Verificar' }).click();
    await expect(page.getByText('Inválida')).toBeVisible({ timeout: 15000 });

    // 7. Hash desconhecido → participação não encontrada
    await input.fill('hash-inexistente-xyz');
    await page.getByRole('button', { name: 'Verificar' }).click();
    await expect(page.getByText(/não encontrada/i)).toBeVisible({ timeout: 15000 });
  }, { timeout: 180000 });
});
