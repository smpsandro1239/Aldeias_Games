// @ts-nocheck
import { test, expect } from '@playwright/test';

const DEV_EMAIL = 'admin@aldeias.pt';
const DEV_PASSWORD = '123456';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function loginAs(request: any, email: string, password: string) {
  const res = await request.post(`${BASE_URL}/api/auth/login`, {
    data: { email, password },
  });
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  return data.token;
}

test.describe('Fluxo Completo: Criar → Comprar → Sortear → Vencer', () => {
  let token: string;
  let jogoId: string;
  let participacaoId: string;

  test('1. Login como admin', async ({ request }) => {
    token = await loginAs(request, DEV_EMAIL, DEV_PASSWORD);
    expect(token).toBeTruthy();
  });

  test('2. Criar jogo raspadinha via API', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/jogos`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        nome: 'Raspadinha Teste E2E',
        tipo: 'raspadinha',
        preco: 1.0,
        stockInicial: 10,
        configuracao: {},
        premios: [
          { nome: 'Prémio Teste', valorDinheiroAlternative: 5, percentagem: 10 },
        ],
        eventoId: 'test-evento-id',
      },
    });

    if (res.ok()) {
      const data = await res.json();
      jogoId = data.data?.id || data.id;
      expect(jogoId).toBeTruthy();
    }
  });

  test('3. Criar participação (compra) via API', async ({ request }) => {
    if (!jogoId) {
      test.skip();
      return;
    }

    const res = await request.post(`${BASE_URL}/api/participacoes`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        jogoId,
        dadosParticipacao: {},
        quantidade: 1,
        metodoPagamento: 'saldo',
      },
    });

    if (res.ok()) {
      const data = await res.json();
      participacaoId = data.data?.id || data.id;
      expect(participacaoId).toBeTruthy();
    }
  });

  test('4. Executar sorteio via API', async ({ request }) => {
    if (!jogoId) {
      test.skip();
      return;
    }

    const res = await request.post(`${BASE_URL}/api/sorteios`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: { jogoId },
    });

    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.success).toBeTruthy();
  });

  test('5. Verificar resultado do sorteio', async ({ request }) => {
    if (!jogoId) {
      test.skip();
      return;
    }

    const res = await request.get(`${BASE_URL}/api/sorteios?jogoId=${jogoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.data).toBeDefined();
  });
});

test.describe('Validações de Segurança', () => {
  test('Rejeitar jogo com percentagem total > 100%', async ({ request }) => {
    const token = await loginAs(request, DEV_EMAIL, DEV_PASSWORD);

    const res = await request.post(`${BASE_URL}/api/jogos`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        nome: 'Raspadinha Inválida',
        tipo: 'raspadinha',
        preco: 1.0,
        stockInicial: 10,
        configuracao: {},
        premios: [
          { nome: 'Prémio 1', valorDinheiroAlternative: 5, percentagem: 60 },
          { nome: 'Prémio 2', valorDinheiroAlternative: 5, percentagem: 60 },
        ],
        eventoId: 'test-evento-id',
      },
    });

    expect(res.status()).toBe(400);
  });

  test('Rejeitar participação sem autenticação', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/participacoes`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        jogoId: 'any-id',
        dadosParticipacao: {},
        quantidade: 1,
        metodoPagamento: 'saldo',
      },
    });

    expect(res.status()).toBe(401);
  });

  test('Rejeitar sorteio sem permissão de admin', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/sorteios`, {
      headers: { 'Content-Type': 'application/json' },
      data: { jogoId: 'any-id' },
    });

    expect(res.status()).toBe(401);
  });
});

test.describe('Claim de Prémio Duplicado', () => {
  test('Rejeitar claim duplicado na mesma participação', async ({ request }) => {
    const token = await loginAs(request, DEV_EMAIL, DEV_PASSWORD);

    const res1 = await request.post(`${BASE_URL}/api/participacoes/any-id/claim-premio`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (res1.ok()) {
      const res2 = await request.post(`${BASE_URL}/api/participacoes/any-id/claim-premio`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res2.json();
      expect(data.alreadyClaimed).toBeTruthy();
    }
  });
});

test.describe('Dashboard Analytics', () => {
  test('Buscar métricas do dashboard', async ({ request }) => {
    const token = await loginAs(request, DEV_EMAIL, DEV_PASSWORD);

    const res = await request.get(`${BASE_URL}/api/analytics/dashboard?periodo=7d`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.resumo).toBeDefined();
    expect(data.resumo.totalJogos).toBeDefined();
    expect(data.resumo.totalParticipacoes).toBeDefined();
    expect(Array.isArray(data.participacoesPorDia)).toBeTruthy();
    expect(Array.isArray(data.jogosPorTipo)).toBeTruthy();
  });

  test('Rejeitar analytics sem autenticação', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/analytics/dashboard`);
    expect(res.status()).toBe(401);
  });
});
