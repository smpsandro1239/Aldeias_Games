// test api

async function runTests() {
  const BASE_URL = 'http://localhost:3000';
  let token = '';

  const baseHeaders = { 
    'Content-Type': 'application/json',
    'Origin': 'http://localhost:3000',
    'Referer': 'http://localhost:3000'
  };

  console.log('--- 1. Login Super Admin ---');
  let res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify({ email: 'admin@aldeias.pt', password: '123456' })
  });
  let data = await res.json();
  if (data.token) {
    token = data.token;
    console.log('✅ Login success');
  } else {
    console.log('❌ Login failed:', data);
    return;
  }

  const headers = {
    ...baseHeaders,
    'Authorization': `Bearer ${token}`
  };

  console.log('\n--- 2. List Aldeias ---');
  res = await fetch(`${BASE_URL}/api/aldeias`, { headers });
  data = await res.json();
  console.log(res.ok ? `✅ List Aldeias success: ${data.data.length} found` : `❌ List Aldeias failed: ${JSON.stringify(data)}`);

  console.log('\n--- 3. Create Aldeia ---');
  res = await fetch(`${BASE_URL}/api/aldeias`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      nome: 'Aldeia API Test',
      slug: 'aldeia-api-test',
      tipoOrganizacao: 'associacao',
      responsavel: 'John Doe',
      telefone: '+351912345678',
      email: 'test@aldeia-api.com',
      morada: 'Rua X',
      codigoPostal: '1000-000',
      localidade: 'Lisbon',
      planoId: data.data[0].planoId // just stealing a planoId
    })
  });
  data = await res.json();
  const newAldeiaId = data.data?.id;
  console.log(res.ok ? `✅ Create Aldeia success: ${newAldeiaId}` : `❌ Create Aldeia failed: ${JSON.stringify(data)}`);

  if (newAldeiaId) {
    console.log('\n--- 4. Edit Aldeia ---');
    res = await fetch(`${BASE_URL}/api/aldeias/${newAldeiaId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        nome: 'Aldeia API Test Edited'
      })
    });
    data = await res.json();
    console.log(res.ok ? `✅ Edit Aldeia success: ${data.data.nome}` : `❌ Edit Aldeia failed: ${JSON.stringify(data)}`);
  }

  console.log('\n--- 5. List Users ---');
  res = await fetch(`${BASE_URL}/api/users`, { headers });
  data = await res.json();
  console.log(res.ok ? `✅ List Users success: ${data.data.length} found` : `❌ List Users failed: ${JSON.stringify(data)}`);

  const firstUser = data.data.find(u => u.role === 'user');
  if (firstUser) {
    console.log('\n--- 6. Edit User Role ---');
    res = await fetch(`${BASE_URL}/api/users/${firstUser.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ role: 'aldeia_admin', aldeiaId: newAldeiaId || undefined })
    });
    data = await res.json();
    console.log(res.ok ? `✅ Edit User Role success` : `❌ Edit User Role failed: ${JSON.stringify(data)}`);
  } else {
    console.log('No user to edit found.');
  }

  console.log('\n--- 7. Get Analytics ---');
  res = await fetch(`${BASE_URL}/api/dashboard/stats`, { headers });
  data = await res.json();
  console.log(res.ok ? `✅ Get Analytics success: ${JSON.stringify(data.data).substring(0, 100)}...` : `❌ Get Analytics failed: ${JSON.stringify(data)}`);
}

runTests();
