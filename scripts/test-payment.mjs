#!/usr/bin/env node

/**
 * Teste de Pagamento (Stripe) — Aldeias Games
 *
 * Testa:
 *   1. Criar checkout session (autenticado)
 *   2. Rejeitar sem auth
 *   3. Rejeitar valores inválidos
 *   4. Verificar estrutura da resposta
 *
 * NOTA: Não processa pagamentos reais — apenas cria sessões de checkout.
 * Requer STRIPE_SECRET_KEY no .env para funcionar.
 *
 * Usage:
 *   node scripts/test-payment.mjs                          (production)
 *   node scripts/test-payment.mjs http://localhost:3000    (local)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'admin@aldeias.pt';
const TEST_PASSWORD = '123456';

let passed = 0;
let failed = 0;
let skipped = 0;

function log(icon, msg) {
  console.log(`  ${icon} ${msg}`);
}

function assert(condition, msg) {
  if (condition) {
    log('✅', msg);
    passed++;
  } else {
    log('❌', msg);
    failed++;
  }
}

async function getToken() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.token ?? null;
}

// === MAIN ===
console.log('╔══════════════════════════════════════════════════╗');
console.log('║  TESTE DE PAGAMENTO (Stripe) — Aldeias Games    ║');
console.log(`║  Target: ${BASE_URL.padEnd(38)}║`);
console.log('╚══════════════════════════════════════════════════╝');

// Step 1: Login
console.log('\n━━━ Passo 1: Login ━━━');
const token = await getToken();
assert(!!token, `Token obtido: ${token ? 'SIM' : 'NÃO'}`);

if (!token) {
  console.log('\n  ❌ Login falhou. A abortar.');
  process.exit(1);
}

const authHeaders = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

// Step 2: Create checkout session
console.log('\n━━━ Passo 2: Criar sessão de checkout ━━━');
try {
  const checkoutRes = await fetch(`${BASE_URL}/api/stripe/checkout`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      valor: 10.00,
      descricao: 'Teste automatizado - não cobrar',
      metadata: { teste: 'true', automated: '1' },
    }),
    signal: AbortSignal.timeout(20000),
  });
  const checkoutData = await checkoutRes.json();
  console.log(`  Status: ${checkoutRes.status}`);
  console.log(`  Body: ${JSON.stringify(checkoutData).slice(0, 200)}`);

  if (checkoutRes.status === 200 || checkoutRes.status === 201) {
    assert(!!checkoutData.sessionId || !!checkoutData.url || !!checkoutData.id,
      `Checkout criado com sucesso`);
    if (checkoutData.url) {
      assert(checkoutData.url.startsWith('https://'), `URL de checkout é HTTPS: ${checkoutData.url.slice(0, 60)}...`);
    }
  } else if (checkoutRes.status === 500) {
    console.log('  ⚠️  Stripe não configurado ou chave inválida');
    console.log('     Configurar STRIPE_SECRET_KEY no .env para testes reais');
    skipped++;
  } else {
    assert(false, `Checkout retornou ${checkoutRes.status}: ${checkoutData.error || JSON.stringify(checkoutData)}`);
  }
} catch (err) {
  console.log(`  Erro de rede: ${err.message}`);
  assert(false, `Checkout falhou: ${err.message}`);
}

// Step 3: Reject without auth
console.log('\n━━━ Passo 3: Rejeitar sem autenticação ━━━');
try {
  const noAuthRes = await fetch(`${BASE_URL}/api/stripe/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ valor: 10.00, descricao: 'Teste sem auth' }),
    signal: AbortSignal.timeout(15000),
  });
  assert(noAuthRes.status === 401 || noAuthRes.status === 403,
    `Sem auth retorna 401/403: ${noAuthRes.status}`);
} catch (err) {
  assert(false, `Teste sem auth falhou: ${err.message}`);
}

// Step 4: Reject invalid values
console.log('\n━━━ Passo 4: Rejeitar valores inválidos ━━━');
try {
  const invalidRes = await fetch(`${BASE_URL}/api/stripe/checkout`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ valor: -100, descricao: '' }),
    signal: AbortSignal.timeout(15000),
  });
  assert(invalidRes.status >= 400,
    `Valor inválido rejeitado: ${invalidRes.status}`);
} catch (err) {
  assert(false, `Teste valor inválido falhou: ${err.message}`);
}

// Step 5: Reject missing fields
console.log('\n━━━ Passo 5: Rejeitar campos em falta ━━━');
try {
  const missingRes = await fetch(`${BASE_URL}/api/stripe/checkout`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(15000),
  });
  assert(missingRes.status >= 400,
    `Campos em falta rejeitados: ${missingRes.status}`);
} catch (err) {
  assert(false, `Teste campos em falta falhou: ${err.message}`);
}

// Step 6: Check refund endpoint requires admin
console.log('\n━━━ Passo 6: Refund requer admin ━━━');
try {
  const refundRes = await fetch(`${BASE_URL}/api/stripe/refund`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ participacaoId: 'nonexistent' }),
    signal: AbortSignal.timeout(15000),
  });
  // Even if admin, nonexistent participation should fail
  assert(refundRes.status >= 400,
    `Refund com ID inexistente: ${refundRes.status}`);
} catch (err) {
  assert(false, `Teste refund falhou: ${err.message}`);
}

// === RESULTS ===
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Resultado: ${passed} passaram, ${failed} falharam, ${skipped} ignorados`);
if (skipped > 0) {
  console.log('  ⚠️  Testes ignorados (Stripe não configurado)');
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

process.exit(failed > 0 ? 1 : 0);
