const baseHeaders = {
  'Content-Type': 'application/json',
  'Origin': 'http://localhost:3000',
  'Referer': 'http://localhost:3000'
};
const BASE_URL = 'http://localhost:3000';

async function testAldeiaAdmin() {
  console.log('--- 1. Login Aldeia Admin ---');
  let res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify({ email: 'aldeia@gmail.com', password: '123456' })
  });
  let data = await res.json();
  if (!data.token) {
    console.log('❌ Login failed', data);
    return;
  }
  let token = data.token;
  let aldeiaId = data.user.aldeiaId;
  console.log('✅ Login success. AldeiaId:', aldeiaId);

  const headers = { ...baseHeaders, 'Authorization': `Bearer ${token}` };

  console.log('\n--- 2. Dashboard Stats ---');
  res = await fetch(`${BASE_URL}/api/dashboard/stats?aldeiaId=${aldeiaId}`, { headers });
  data = await res.json();
  console.log(res.ok ? '✅ Stats ok' : '❌ Stats failed', res.ok ? '' : data);

  console.log('\n--- 3. Create Event ---');
  res = await fetch(`${BASE_URL}/api/eventos`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      nome: 'Evento API Test',
      slug: 'evento-api-test',
      descricao: 'Teste',
      dataInicio: new Date().toISOString(),
      dataFim: new Date(Date.now() + 86400000).toISOString(),
      objectivoAngariacao: 1000,
      aldeiaId,
      publico: true,
      estado: 'ativo'
    })
  });
  data = await res.json();
  let eventoId = data.data?.id;
  console.log(res.ok ? '✅ Event created' : '❌ Event fail', res.ok ? '' : data);

  if (eventoId) {
    console.log('\n--- 4. Create Game ---');
    res = await fetch(`${BASE_URL}/api/jogos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        nome: 'Rifa API Test',
        tipo: 'rifa',
        preco: 2,
        stockInicial: 100,
        limitePorUsuario: 10,
        eventoId,
        estado: 'aberto',
        configuracao: JSON.stringify({ numeroInicial: 1, numeroFinal: 100 })
      })
    });
    data = await res.json();
    console.log(res.ok ? '✅ Game created' : '❌ Game fail', res.ok ? '' : data);
  }
}

testAldeiaAdmin();
