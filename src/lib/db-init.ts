import prisma from './db';
import bcrypt from 'bcryptjs';

let seeded = false;

export async function ensureSeeded(): Promise<{ seeded: boolean; counts?: Record<string, number> }> {
  if (seeded) return { seeded: true };

  const permCount = await prisma.permission.count();
  if (permCount > 0) {
    seeded = true;
    return { seeded: true };
  }

  console.log('[db-init] Database empty — running seed...');
  await runSeed();
  seeded = true;

  const counts = await getCounts();
  return { seeded: true, counts };
}

export async function getSeedStatus(): Promise<{ seeded: boolean; counts: Record<string, number> }> {
  const permCount = await prisma.permission.count();
  if (permCount === 0) return { seeded: false, counts: {} };
  const counts = await getCounts();
  return { seeded: true, counts };
}

async function getCounts(): Promise<Record<string, number>> {
  const [
    users, aldeias, eventos, jogos, participacoes,
    transacoes, vaults, vendedorCashbox, notificacoes,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.aldeia.count(),
    prisma.evento.count(),
    prisma.jogo.count(),
    prisma.participacao.count(),
    prisma.transacao.count(),
    prisma.vault.count(),
    prisma.vendedorCashbox.count(),
    prisma.notificacao.count(),
  ]);
  return {
    users, aldeias, eventos, jogos, participacoes,
    transacoes, vaults, vendedorCashbox, notificacoes,
  };
}

async function runSeed() {
  const pw = await bcrypt.hash('123456', 10);
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
  const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000);

  // ── PERMISSOES ──
  const permKeys = [
    'MANAGE_ALDEIA', 'VIEW_ALDEIA',
    'CREATE_EVENTO', 'EDIT_EVENTO', 'DELETE_EVENTO', 'VIEW_EVENTO',
    'CREATE_JOGO', 'EDIT_JOGO', 'DELETE_JOGO', 'VIEW_JOGO',
    'MANAGE_PREMIOS', 'VIEW_PREMIOS',
    'MANAGE_VENDEDORES', 'VIEW_VENDEDORES',
    'EXECUTE_VENDA', 'VIEW_VENDAS',
    'VIEW_ANALYTICS_GLOBAL', 'VIEW_ANALYTICS_LOCAL',
    'MANAGE_USERS', 'MANAGE_PLANOS',
  ] as const;

  const perms: Record<string, { id: string }> = {};
  for (const k of permKeys) {
    perms[k] = await prisma.permission.upsert({
      where: { key: k },
      update: {},
      create: { key: k, description: k },
    });
  }

  // ── ROLES ──
  const roleDefs: { name: string; desc: string; pk: string[] }[] = [
    { name: 'SUPER_ADMIN', desc: 'Super Administrador', pk: [...permKeys] },
    { name: 'ALDEIA_ADMIN', desc: 'Admin de Aldeia', pk: ['VIEW_ALDEIA','CREATE_EVENTO','EDIT_EVENTO','DELETE_EVENTO','VIEW_EVENTO','CREATE_JOGO','EDIT_JOGO','DELETE_JOGO','VIEW_JOGO','MANAGE_PREMIOS','VIEW_PREMIOS','MANAGE_VENDEDORES','VIEW_VENDEDORES','EXECUTE_VENDA','VIEW_VENDAS','VIEW_ANALYTICS_LOCAL'] },
    { name: 'GESTOR', desc: 'Gestor', pk: ['VIEW_ALDEIA','VIEW_EVENTO','VIEW_JOGO','VIEW_PREMIOS','VIEW_VENDEDORES','EXECUTE_VENDA','VIEW_VENDAS'] },
    { name: 'COLABORADOR', desc: 'Colaborador', pk: ['VIEW_ALDEIA','VIEW_EVENTO','VIEW_JOGO','VIEW_PREMIOS','EXECUTE_VENDA'] },
    { name: 'VIEWER', desc: 'Visualizador', pk: ['VIEW_ALDEIA','VIEW_EVENTO','VIEW_JOGO','VIEW_PREMIOS'] },
    { name: 'MEMBRO', desc: 'Membro', pk: ['VIEW_ALDEIA','VIEW_EVENTO','VIEW_JOGO','VIEW_PREMIOS'] },
  ];

  const roles: Record<string, { id: string }> = {};
  for (const r of roleDefs) {
    const role = await prisma.role.upsert({
      where: { name: r.name as any },
      update: { description: r.desc },
      create: { name: r.name as any, description: r.desc },
    });
    roles[r.name] = role;
    for (const k of r.pk) {
      const existing = await prisma.rolePermission.findFirst({ where: { roleId: role.id, permissionId: perms[k].id } });
      if (!existing) {
        await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: perms[k].id } });
      }
    }
  }

  // ── PLANOS ──
  const planBas = await prisma.plano.upsert({
    where: { id: 'plano-basico' },
    update: {},
    create: { id: 'plano-basico', nome: 'Basico', descricao: 'Plano gratuito', precoMensal: 0, maxEventos: 10, maxJogos: 100, maxParticipacoes: 10000, maxVendedores: 10, ativo: true },
  });
  const planPro = await prisma.plano.upsert({
    where: { id: 'plano-pro' },
    update: {},
    create: { id: 'plano-pro', nome: 'Pro', descricao: 'Plano profissional', precoMensal: 29.99, maxEventos: 50, maxJogos: 500, maxParticipacoes: 100000, maxVendedores: 50, ativo: true },
  });
  const planPrem = await prisma.plano.upsert({
    where: { id: 'plano-premium' },
    update: {},
    create: { id: 'plano-premium', nome: 'Premium', descricao: 'Plano premium', precoMensal: 79.99, maxEventos: -1, maxJogos: -1, maxParticipacoes: -1, maxVendedores: -1, ativo: true },
  });

  // ── UTILIZADORES ──
  const uDefs = [
    { id: 'user-super-admin', email: 'admin@aldeias.pt', nome: 'Super Admin', role: 'super_admin' as const, rn: 'SUPER_ADMIN', saldo: 1000 },
    { id: 'user-ana-admin', email: 'admin.valeazenha@gmail.com', nome: 'Ana Silva', role: 'aldeia_admin' as const, rn: 'ALDEIA_ADMIN', saldo: 500 },
    { id: 'user-joao-vendedor', email: 'vendedor@gmail.com', nome: 'Joao Vendedor', role: 'vendedor' as const, rn: 'GESTOR', saldo: 200 },
    { id: 'user-carlos-vendedor', email: 'carlos@montealto.pt', nome: 'Carlos Vendedor', role: 'vendedor' as const, rn: 'GESTOR', saldo: 150 },
    { id: 'user-jogador', email: 'jogador@gmail.com', nome: 'Maria Jogadora', role: 'user' as const, rn: 'VIEWER', saldo: 100 },
    { id: 'user-jogador2', email: 'pedro@gmail.com', nome: 'Pedro Jogador', role: 'user' as const, rn: 'VIEWER', saldo: 50 },
    { id: 'user-jogador3', email: 'rita@anonimo.pt', nome: 'Rita Anonima', role: 'user' as const, rn: 'VIEWER', saldo: 0 },
  ];

  const U: Record<string, { id: string }> = {};
  for (const u of uDefs) {
    U[u.id] = await prisma.user.upsert({
      where: { id: u.id },
      update: { nome: u.nome, saldo: u.saldo },
      create: {
        id: u.id, email: u.email, password: pw, nome: u.nome,
        telefone: '+351 912 345 678', role: u.role,
        emailVerificado: true, saldo: u.saldo,
        onboardingCompleted: true, comissaoPercentual: 10, comissaoAtiva: true,
      },
    });
    const existingRole = await prisma.userGlobalRole.findFirst({ where: { userId: u.id } });
    if (!existingRole) {
      await prisma.userGlobalRole.create({ data: { userId: u.id, roleId: roles[u.rn].id } });
    }
    const existingLevel = await prisma.userLevel.findFirst({ where: { userId: u.id } });
    if (!existingLevel) {
      await prisma.userLevel.create({ data: { userId: u.id, nivel: 1, pontos: 0, pontosParaProximoNivel: 100 } });
    }
  }

  // ── ALDEIAS ──
  const a1 = await prisma.aldeia.upsert({
    where: { id: 'aldeia-vale-azenha' },
    update: {},
    create: {
      id: 'aldeia-vale-azenha', nome: 'Aldeia Vale de Azenha', slug: 'vale-azenha',
      tipoOrganizacao: 'aldeia', descricao: 'Aldeia no vale',
      morada: 'Rua da Fonte, 12', codigoPostal: '2500-100', localidade: 'Vale de Azenha',
      telefone: '+351 262 123 456', email: 'geral@valeazenha.pt', responsavel: 'Ana Silva',
      planoId: planBas.id, permitirMBWay: true, permitirStripe: true,
      metodosPagamentoDefault: '["saldo","dinheiro","mbway"]',
      autorizacaoCM: true, documentosVerificados: true, ativo: true, verificado: true,
      dataVerificacao: daysAgo(150), experiencia: 250, nivel: 2, pontos: 180,
    },
  });
  const a2 = await prisma.aldeia.upsert({
    where: { id: 'aldeia-monte-alto' },
    update: {},
    create: {
      id: 'aldeia-monte-alto', nome: 'Aldeia Monte Alto', slug: 'monte-alto',
      tipoOrganizacao: 'aldeia', descricao: 'Aldeia serrana',
      morada: 'Largo da Igreja, 5', codigoPostal: '2520-200', localidade: 'Monte Alto',
      telefone: '+351 262 987 654', email: 'geral@montealto.pt', responsavel: 'Admin Monte Alto',
      planoId: planBas.id, permitirMBWay: true, permitirStripe: false,
      metodosPagamentoDefault: '["saldo","dinheiro"]',
      autorizacaoCM: true, documentosVerificados: true, ativo: true, verificado: true,
      dataVerificacao: daysAgo(120), experiencia: 150, nivel: 1, pontos: 90,
    },
  });
  const a3 = await prisma.aldeia.upsert({
    where: { id: 'aldeia-escola-nova' },
    update: {},
    create: {
      id: 'aldeia-escola-nova', nome: 'Escola Nova', slug: 'escola-nova',
      tipoOrganizacao: 'escola', descricao: 'Escola do primeiro ciclo',
      nomeEscola: 'Escola Basica Nova', codigoEscola: 'ES-001', nivelEnsino: 'primeiro_ciclo',
      morada: 'Rua da Escola, 1', codigoPostal: '2530-300', localidade: 'Vila Nova',
      telefone: '+351 262 111 222', email: 'geral@escolanova.pt', responsavel: 'Diretora',
      planoId: planPro.id, permitirMBWay: false, permitirStripe: true,
      metodosPagamentoDefault: '["saldo","dinheiro","stripe"]',
      autorizacaoCM: true, documentosVerificados: true, ativo: true, verificado: true,
      dataVerificacao: daysAgo(60), experiencia: 80, nivel: 1, pontos: 45,
    },
  });

  // ── USER-ALDEIA ASSOCIATIONS ──
  const uaAssoc: [string, string, string][] = [
    ['user-super-admin', 'aldeia-vale-azenha', 'SUPER_ADMIN'],
    ['user-super-admin', 'aldeia-monte-alto', 'SUPER_ADMIN'],
    ['user-super-admin', 'aldeia-escola-nova', 'SUPER_ADMIN'],
    ['user-ana-admin', 'aldeia-vale-azenha', 'ALDEIA_ADMIN'],
    ['user-ana-admin', 'aldeia-escola-nova', 'ALDEIA_ADMIN'],
    ['user-joao-vendedor', 'aldeia-vale-azenha', 'GESTOR'],
    ['user-joao-vendedor', 'aldeia-escola-nova', 'COLABORADOR'],
    ['user-carlos-vendedor', 'aldeia-monte-alto', 'GESTOR'],
    ['user-jogador', 'aldeia-vale-azenha', 'VIEWER'],
    ['user-jogador', 'aldeia-monte-alto', 'VIEWER'],
    ['user-jogador2', 'aldeia-monte-alto', 'VIEWER'],
    ['user-jogador2', 'aldeia-escola-nova', 'MEMBRO'],
    ['user-jogador3', 'aldeia-vale-azenha', 'VIEWER'],
  ];
  for (const [uid, aid, rn] of uaAssoc) {
    const existing = await prisma.userAldeiaRole.findFirst({ where: { userId: U[uid].id, aldeiaId: aid } });
    if (!existing) {
      await prisma.userAldeiaRole.create({ data: { userId: U[uid].id, aldeiaId: aid, roleId: roles[rn].id } });
    }
  }

  // ── VAULTS ──
  const v1 = await prisma.vault.upsert({ where: { id: 'vault-001' }, update: {}, create: { id: 'vault-001', aldeiaId: a1.id, saldo: 350 } });
  const v2 = await prisma.vault.upsert({ where: { id: 'vault-002' }, update: {}, create: { id: 'vault-002', aldeiaId: a2.id, saldo: 120 } });
  const v3 = await prisma.vault.upsert({ where: { id: 'vault-003' }, update: {}, create: { id: 'vault-003', aldeiaId: a3.id, saldo: 0 } });

  // ── VENDEDOR CASHBOX ──
  const cb1 = await prisma.vendedorCashbox.upsert({ where: { id: 'cashbox-joao' }, update: {}, create: { id: 'cashbox-joao', userId: U['user-joao-vendedor'].id, saldo: 45 } });
  const cb2 = await prisma.vendedorCashbox.upsert({ where: { id: 'cashbox-carlos' }, update: {}, create: { id: 'cashbox-carlos', userId: U['user-carlos-vendedor'].id, saldo: 30 } });

  // ── EVENTOS ──
  const ev1 = await prisma.evento.upsert({
    where: { id: 'evento-festa-povo' }, update: {},
    create: { id: 'evento-festa-povo', nome: 'Festa do Povo', slug: 'festa-povo-vale-azenha', descricao: 'Festa tradicional', dataInicio: daysAgo(30), dataFim: daysFromNow(30), objectivoAngariacao: 5000, estado: 'ativo', publico: true, aldeiaId: a1.id, totalAngariado: 1250, totalParticipacoes: 45 },
  });
  const ev3 = await prisma.evento.upsert({
    where: { id: 'evento-serra-festa' }, update: {},
    create: { id: 'evento-serra-festa', nome: 'Festa da Serra', slug: 'festa-serra-monte-alto', descricao: 'Festa de verao', dataInicio: daysAgo(5), dataFim: daysFromNow(25), objectivoAngariacao: 8000, estado: 'ativo', publico: true, aldeiaId: a2.id, totalAngariado: 500, totalParticipacoes: 15 },
  });
  const ev4 = await prisma.evento.upsert({
    where: { id: 'evento-caminhada' }, update: {},
    create: { id: 'evento-caminhada', nome: 'Caminhada Solidaria', slug: 'caminhada-solidaria', descricao: 'Caminhada anual', dataInicio: daysAgo(120), dataFim: daysAgo(119), objectivoAngariacao: 2000, estado: 'finalizado', publico: false, aldeiaId: a2.id, totalAngariado: 1850, totalParticipacoes: 80 },
  });
  const ev6 = await prisma.evento.upsert({
    where: { id: 'evento-junina' }, update: {},
    create: { id: 'evento-junina', nome: 'Festa Junina', slug: 'festa-junina-escola', descricao: 'Festa junina', dataInicio: daysAgo(10), dataFim: daysFromNow(20), objectivoAngariacao: 4000, estado: 'ativo', publico: true, aldeiaId: a3.id, totalAngariado: 800, totalParticipacoes: 30 },
  });

  // ── JOGOS ──
  const j1 = await prisma.jogo.upsert({
    where: { id: 'rifa-solidaria-001' }, update: {},
    create: {
      id: 'rifa-solidaria-001', nome: 'Rifa Solidaria', tipo: 'rifa', descricao: 'Rifa 1-100',
      preco: 5, stockInicial: 100, stockAtual: 78, limitePorUsuario: 10, estado: 'aberto',
      dataAbertura: daysAgo(15), lucroMinimoPercent: 70, percentagemTotalPremios: 30,
      eventoId: ev1.id, aldeiaId: a1.id, totalParticipacoes: 22, totalAngariado: 110,
      configuracao: JSON.stringify({ numeroInicial: 1, numeroFinal: 100, numeroBlocos: 1, permitirStripe: true }),
    },
  });
  const j2 = await prisma.jogo.upsert({
    where: { id: 'rifa-natal-002' }, update: {},
    create: {
      id: 'rifa-natal-002', nome: 'Rifa de Natal', tipo: 'rifa', descricao: 'Rifa 1-200',
      preco: 3, stockInicial: 200, stockAtual: 140, limitePorUsuario: 20, estado: 'aberto',
      dataAbertura: daysAgo(10), lucroMinimoPercent: 75, percentagemTotalPremios: 25,
      eventoId: ev3.id, aldeiaId: a2.id, totalParticipacoes: 60, totalAngariado: 180,
      configuracao: JSON.stringify({ numeroInicial: 1, numeroFinal: 200, numeroBlocos: 2, permitirStripe: false }),
    },
  });
  const j3 = await prisma.jogo.upsert({
    where: { id: 'raspadinha-natal-001' }, update: {},
    create: {
      id: 'raspadinha-natal-001', nome: 'Raspadinha de Natal', tipo: 'raspadinha', descricao: 'Raspadinha natalicia',
      preco: 2, stockInicial: 200, stockAtual: 155, limitePorUsuario: 10, estado: 'aberto',
      dataAbertura: daysAgo(20), lucroMinimoPercent: 60, percentagemTotalPremios: 40,
      eventoId: ev3.id, aldeiaId: a2.id, totalParticipacoes: 45, totalAngariado: 90,
      configuracao: JSON.stringify({ premios: [{ nome: 'Euro', valorDinheiroAlternative: 2, percentagem: 0.25 }, { nome: 'Dois Euro', valorDinheiroAlternative: 5, percentagem: 0.15 }, { nome: 'Cinco Euro', valorDinheiroAlternative: 10, percentagem: 0.05 }, { nome: 'Dez Euro', valorDinheiroAlternative: 20, percentagem: 0.02 }] }),
    },
  });
  const j4 = await prisma.jogo.upsert({
    where: { id: 'raspadinha-verao-002' }, update: {},
    create: {
      id: 'raspadinha-verao-002', nome: 'Raspadinha de Verao', tipo: 'raspadinha', descricao: 'Raspadinha de verao',
      preco: 3, stockInicial: 100, stockAtual: 60, limitePorUsuario: 5, estado: 'aberto',
      dataAbertura: daysAgo(5), lucroMinimoPercent: 55, percentagemTotalPremios: 45,
      eventoId: ev1.id, aldeiaId: a1.id, totalParticipacoes: 40, totalAngariado: 120,
      configuracao: JSON.stringify({ premios: [{ nome: 'Nada', valorDinheiroAlternative: 0, percentagem: 0.50 }, { nome: 'Euro', valorDinheiroAlternative: 3, percentagem: 0.20 }, { nome: 'Cinco Euro', valorDinheiroAlternative: 8, percentagem: 0.10 }, { nome: 'Dez Euro', valorDinheiroAlternative: 15, percentagem: 0.05 }] }),
    },
  });
  const j5 = await prisma.jogo.upsert({
    where: { id: 'poio-vale-001' }, update: {},
    create: {
      id: 'poio-vale-001', nome: 'Poio do Vale', tipo: 'poio_da_vaca', descricao: 'Poio 5x10',
      preco: 2, stockInicial: 200, stockAtual: 170, limitePorUsuario: 10, estado: 'aberto',
      dataAbertura: daysAgo(12), custoQuadrado: 2, lucroMinimoPercent: 65, percentagemTotalPremios: 35,
      eventoId: ev1.id, aldeiaId: a1.id, totalParticipacoes: 30, totalAngariado: 60,
      configuracao: JSON.stringify({ letras: ['A','B','C','D','E'], numerosPorLetra: 10 }),
      dimensoesCampo: JSON.stringify({ x: 5, y: 10 }),
    },
  });
  const j7 = await prisma.jogo.upsert({
    where: { id: 'euromilhoes-001' }, update: {},
    create: {
      id: 'euromilhoes-001', nome: 'Euromilhoes Solidario', tipo: 'euromilhoes', descricao: 'Euro 5 nums 1-50',
      preco: 2, stockInicial: 10000, stockAtual: 9985, limitePorUsuario: 10, estado: 'aberto',
      dataAbertura: daysAgo(7), lucroMinimoPercent: 70, percentagemTotalPremios: 30,
      eventoId: ev1.id, aldeiaId: a1.id, totalParticipacoes: 15, totalAngariado: 30,
      configuracao: JSON.stringify({ premioDescricao: 'Premio: 1.000 EUR', premioValor: 1000 }),
    },
  });

  // ── PREMIOS ──
  const premData = [
    { id: 'premio-rifa1-1', nome: 'Vale 500 EUR', descricao: 'Vale compras', valorDinheiroAlternative: 500, percentagem: 5, ordem: 1, aldeiaId: a1.id, jogoId: j1.id },
    { id: 'premio-rifa1-2', nome: 'Cabaz Regional', descricao: 'Produtos tipicos', valorDinheiroAlternative: 100, percentagem: 10, ordem: 2, aldeiaId: a1.id, jogoId: j1.id },
    { id: 'premio-rifa2-1', nome: 'TV 43 polegadas', descricao: 'Smart TV', valorDinheiroAlternative: 350, percentagem: 3, ordem: 1, aldeiaId: a2.id, jogoId: j2.id },
    { id: 'premio-rasp1-1', nome: 'Vale 20 EUR', descricao: 'Vale compras', valorDinheiroAlternative: 20, percentagem: 15, ordem: 1, aldeiaId: a2.id, jogoId: j3.id },
    { id: 'premio-rasp2-1', nome: 'Vale 15 EUR', descricao: 'Vale compras', valorDinheiroAlternative: 15, percentagem: 10, ordem: 1, aldeiaId: a1.id, jogoId: j4.id },
    { id: 'premio-poio1-1', nome: 'Vale 25 EUR', descricao: 'Vale mercado', valorDinheiroAlternative: 25, percentagem: 5, ordem: 1, aldeiaId: a1.id, jogoId: j5.id },
    { id: 'premio-euro1-1', nome: 'Premio Mil EUR', descricao: '1000 EUR', valorDinheiroAlternative: 1000, percentagem: 1, ordem: 1, aldeiaId: a1.id, jogoId: j7.id },
  ];
  for (const p of premData) {
    await prisma.premio.upsert({ where: { id: p.id }, update: {}, create: p });
  }

  // ── GRELHAS EUROMILHOES ──
  const agora = new Date();
  const proxSexta = new Date(agora);
  const ds = agora.getDay();
  let dias = ds <= 5 ? 5 - ds : 5 + 7 - ds;
  if (ds === 5 && agora.getHours() >= 21) dias = 7;
  proxSexta.setDate(proxSexta.getDate() + dias);
  proxSexta.setHours(21, 30, 0, 0);
  const bloqueio = new Date(proxSexta.getTime() - 2 * 3600000);

  await prisma.grelhaEuromilhoes.upsert({
    where: { id: 'grelha-euro-001' }, update: {},
    create: { id: 'grelha-euro-001', jogoId: j7.id, numero: 1, estado: 'aberta', numerosOcupados: '[]', premioDescricao: '1.000 EUR', premioValor: 1000, sorteioData: proxSexta, bloqueioData: bloqueio },
  });

  // ── NOTIFICACOES (basic) ──
  const existingNotif = await prisma.notificacao.findFirst({ where: { userId: U['user-super-admin'].id } });
  if (!existingNotif) {
    await prisma.notificacao.create({ data: { tipo: 'sistema', titulo: 'Bem-vindo!', mensagem: 'Plataforma seeding automaticamente.', userId: U['user-super-admin'].id, lida: false } });
  }

  console.log('[db-init] Seed complete!');
}
