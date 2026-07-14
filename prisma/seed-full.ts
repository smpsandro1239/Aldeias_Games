// @ts-nocheck
import { PrismaClient, UserRole, TipoJogo, EstadoJogo, GrelhaEstado, MetodoPagamento, EstadoPagamento, RoleName, PermissionKey, CashboxTipo, DepositoEstado, EstadoEntrega, VaultTipo, VaultEstado, TipoNotificacao } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 SEED COMPLETO - Povoando base de dados para testes\n');

  // ──────────────────────────────────────────────
  // LIMPEZA (ordem correta para evitar FK violations)
  // ──────────────────────────────────────────────
  console.log('🗑️  Limpando dados existentes...');
  await prisma.gameAnalytics.deleteMany();
  await prisma.vencedorSorteio.deleteMany();
  await prisma.sorteio.deleteMany();
  await prisma.alteracaoParticipacao.deleteMany();
  await prisma.numeroVendido.deleteMany();
  await prisma.participacao.deleteMany();
  await prisma.aposta.deleteMany();
  await prisma.notificacao.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.consentimento.deleteMany();
  await prisma.direitoEsquecimento.deleteMany();
  await prisma.entregaSaldo.deleteMany();
  await prisma.pedidoCarregamento.deleteMany();
  await prisma.pedidoNotificacao.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.userLevel.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.userAldeiaRole.deleteMany();
  await prisma.userGlobalRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.grelhaEuromilhoes.deleteMany();
  await prisma.premio.deleteMany();
  await prisma.jogo.deleteMany();
  await prisma.evento.deleteMany();
  await prisma.venda.deleteMany();
  await prisma.transacao.deleteMany();
  await prisma.comissao.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.twoFactorAuth.deleteMany();
  await prisma.logAcesso.deleteMany();
  await prisma.rateLimit.deleteMany();
  await prisma.gamificacaoEvento.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.logAcesso.deleteMany();
  await prisma.vendedorCashboxTransaction.deleteMany();
  await prisma.vendedorCashbox.deleteMany();
  await prisma.vaultTransaction.deleteMany();
  await prisma.vault.deleteMany();
  await prisma.pedidoDepositoCofre.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.aldeia.deleteMany();
  await prisma.plano.deleteMany();
  console.log('✅ Dados limpos\n');

  const passwordHash = await bcrypt.hash('123456', 10);

  // ──────────────────────────────────────────────
  // 1. PERMISSÕES
  // ──────────────────────────────────────────────
  const allPermissions = [
    { key: PermissionKey.MANAGE_ALDEIA, description: 'Gerir aldeia' },
    { key: PermissionKey.VIEW_ALDEIA, description: 'Ver aldeia' },
    { key: PermissionKey.CREATE_EVENTO, description: 'Criar evento' },
    { key: PermissionKey.EDIT_EVENTO, description: 'Editar evento' },
    { key: PermissionKey.DELETE_EVENTO, description: 'Eliminar evento' },
    { key: PermissionKey.VIEW_EVENTO, description: 'Ver evento' },
    { key: PermissionKey.CREATE_JOGO, description: 'Criar jogo' },
    { key: PermissionKey.EDIT_JOGO, description: 'Editar jogo' },
    { key: PermissionKey.DELETE_JOGO, description: 'Eliminar jogo' },
    { key: PermissionKey.VIEW_JOGO, description: 'Ver jogo' },
    { key: PermissionKey.MANAGE_PREMIOS, description: 'Gerir prémios' },
    { key: PermissionKey.VIEW_PREMIOS, description: 'Ver prémios' },
    { key: PermissionKey.MANAGE_VENDEDORES, description: 'Gerir vendedores' },
    { key: PermissionKey.VIEW_VENDEDORES, description: 'Ver vendedores' },
    { key: PermissionKey.EXECUTE_VENDA, description: 'Executar venda' },
    { key: PermissionKey.VIEW_VENDAS, description: 'Ver vendas' },
    { key: PermissionKey.VIEW_ANALYTICS_GLOBAL, description: 'Ver analytics global' },
    { key: PermissionKey.VIEW_ANALYTICS_LOCAL, description: 'Ver analytics local' },
    { key: PermissionKey.MANAGE_USERS, description: 'Gerir utilizadores' },
    { key: PermissionKey.MANAGE_PLANOS, description: 'Gerir planos' },
  ];

  const createdPermissions: Record<string, any> = {};
  for (const perm of allPermissions) {
    createdPermissions[perm.key] = await prisma.permission.create({ data: perm });
  }
  console.log(`✅ ${allPermissions.length} permissões`);

  // ──────────────────────────────────────────────
  // 2. ROLES + ROLE_PERMISSIONS
  // ──────────────────────────────────────────────
  const roleDefs = [
    {
      name: RoleName.SUPER_ADMIN, description: 'Super Administrador',
      perms: Object.values(PermissionKey),
    },
    {
      name: RoleName.ALDEIA_ADMIN, description: 'Administrador de Aldeia',
      perms: [
        PermissionKey.VIEW_ALDEIA, PermissionKey.CREATE_EVENTO,
        PermissionKey.EDIT_EVENTO, PermissionKey.DELETE_EVENTO,
        PermissionKey.VIEW_EVENTO, PermissionKey.CREATE_JOGO,
        PermissionKey.EDIT_JOGO, PermissionKey.DELETE_JOGO,
        PermissionKey.VIEW_JOGO, PermissionKey.MANAGE_PREMIOS,
        PermissionKey.VIEW_PREMIOS, PermissionKey.MANAGE_VENDEDORES,
        PermissionKey.VIEW_VENDEDORES, PermissionKey.EXECUTE_VENDA,
        PermissionKey.VIEW_VENDAS, PermissionKey.VIEW_ANALYTICS_LOCAL,
      ],
    },
    {
      name: RoleName.GESTOR, description: 'Gestor / Vendedor',
      perms: [
        PermissionKey.VIEW_ALDEIA, PermissionKey.VIEW_EVENTO,
        PermissionKey.VIEW_JOGO, PermissionKey.VIEW_PREMIOS,
        PermissionKey.VIEW_VENDEDORES, PermissionKey.EXECUTE_VENDA,
        PermissionKey.VIEW_VENDAS,
      ],
    },
    {
      name: RoleName.COLABORADOR, description: 'Colaborador',
      perms: [
        PermissionKey.VIEW_ALDEIA, PermissionKey.VIEW_EVENTO,
        PermissionKey.VIEW_JOGO, PermissionKey.VIEW_PREMIOS,
        PermissionKey.EXECUTE_VENDA,
      ],
    },
    {
      name: RoleName.VIEWER, description: 'Visualizador / Jogador',
      perms: [
        PermissionKey.VIEW_ALDEIA, PermissionKey.VIEW_EVENTO,
        PermissionKey.VIEW_JOGO, PermissionKey.VIEW_PREMIOS,
      ],
    },
    {
      name: RoleName.MEMBRO, description: 'Membro',
      perms: [
        PermissionKey.VIEW_ALDEIA, PermissionKey.VIEW_EVENTO,
        PermissionKey.VIEW_JOGO, PermissionKey.VIEW_PREMIOS,
      ],
    },
  ];

  const createdRoles: Record<string, any> = {};
  for (const rd of roleDefs) {
    const role = await prisma.role.create({
      data: { name: rd.name, description: rd.description },
    });
    createdRoles[rd.name] = role;
    for (const pk of rd.perms) {
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: createdPermissions[pk].id },
      });
    }
  }
  console.log(`✅ ${roleDefs.length} roles com permissões`);

  // ──────────────────────────────────────────────
  // 3. PLANO
  // ──────────────────────────────────────────────
  const plano = await prisma.plano.create({
    data: {
      id: 'plano-basico',
      nome: 'Básico',
      descricao: 'Plano gratuito para comunidades locais',
      precoMensal: 0,
      maxEventos: 10,
      maxJogos: 100,
      maxParticipacoes: 10000,
      maxVendedores: 10,
      ativo: true,
    },
  });
  console.log('✅ Plano básico');

  // ──────────────────────────────────────────────
  // 4. UTILIZADORES
  // ──────────────────────────────────────────────
  const usersData = [
    { id: 'user-super-admin', email: 'admin@aldeias.pt', nome: 'Super Admin', role: UserRole.super_admin, roleName: RoleName.SUPER_ADMIN, saldo: 1000 },
    { id: 'user-aldeia-admin', email: 'aldeia@gmail.com', nome: 'Admin Aldeia', role: UserRole.aldeia_admin, roleName: RoleName.ALDEIA_ADMIN, saldo: 500 },
    { id: 'user-vendedor', email: 'vendedor@gmail.com', nome: 'Vendedor', role: UserRole.vendedor, roleName: RoleName.GESTOR, saldo: 200 },
    { id: 'user-jogador', email: 'jogador@gmail.com', nome: 'Jogador', role: UserRole.user, roleName: RoleName.VIEWER, saldo: 100 },
    { id: 'user-jogador2', email: 'jogador2@gmail.com', nome: 'Jogador 2', role: UserRole.user, roleName: RoleName.VIEWER, saldo: 50 },
  ];

  const createdUsers: Record<string, any> = {};
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        id: u.id,
        email: u.email,
        password: passwordHash,
        nome: u.nome,
        telefone: '+351 912 345 678',
        role: u.role,
        emailVerificado: true,
        saldo: u.saldo,
        onboardingCompleted: true,
      },
    });
    createdUsers[u.id] = user;
    await prisma.userGlobalRole.create({
      data: { userId: user.id, roleId: createdRoles[u.roleName].id },
    });
    // UserLevel inicial
    await prisma.userLevel.create({
      data: { userId: user.id, nivel: 1, pontos: 0, pontosParaProximoNivel: 100 },
    });
  }
  console.log(`✅ ${usersData.length} utilizadores`);

  // ──────────────────────────────────────────────
  // 5. ALDEIAS
  // ──────────────────────────────────────────────
  const aldeia1 = await prisma.aldeia.create({
    data: {
      id: 'aldeia-vale-azenha',
      nome: 'Aldeia Vale de Azenha',
      slug: 'vale-azenha',
      tipoOrganizacao: 'aldeia',
      descricao: 'Pequena aldeia no vale conhecida pelas suas festas tradicionais',
      morada: 'Rua da Fonte, 12',
      codigoPostal: '2500-100',
      localidade: 'Vale de Azenha',
      telefone: '+351 262 123 456',
      email: 'geral@valeazenha.pt',
      responsavel: 'Admin Aldeia',
      planoId: plano.id,
      permitirMBWay: true,
      permitirStripe: true,
      metodosPagamentoDefault: '["saldo","dinheiro","mbway"]',
      autorizacaoCM: true,
      documentosVerificados: true,
      ativo: true,
      verificado: true,
      dataVerificacao: new Date('2026-01-15'),
    },
  });

  const aldeia2 = await prisma.aldeia.create({
    data: {
      id: 'aldeia-monte-alto',
      nome: 'Aldeia Monte Alto',
      slug: 'monte-alto',
      tipoOrganizacao: 'aldeia',
      descricao: 'Aldeia serrana conhecida pelos seus miradouros',
      morada: 'Largo da Igreja, 5',
      codigoPostal: '2520-200',
      localidade: 'Monte Alto',
      telefone: '+351 262 987 654',
      email: 'geral@montealto.pt',
      responsavel: 'Admin Aldeia',
      planoId: plano.id,
      permitirMBWay: true,
      permitirStripe: false,
      metodosPagamentoDefault: '["saldo","dinheiro"]',
      autorizacaoCM: true,
      documentosVerificados: true,
      ativo: true,
      verificado: true,
      dataVerificacao: new Date('2026-02-20'),
    },
  });
  console.log('✅ 2 aldeias');

  // Associar users às aldeias
  // Super Admin - associado a ambas como admin
  await prisma.userAldeiaRole.create({
    data: { userId: createdUsers['user-super-admin'].id, aldeiaId: aldeia1.id, roleId: createdRoles[RoleName.SUPER_ADMIN].id },
  });
  await prisma.userAldeiaRole.create({
    data: { userId: createdUsers['user-super-admin'].id, aldeiaId: aldeia2.id, roleId: createdRoles[RoleName.SUPER_ADMIN].id },
  });
  // Admin Aldeia - admin da aldeia1
  await prisma.userAldeiaRole.create({
    data: { userId: createdUsers['user-aldeia-admin'].id, aldeiaId: aldeia1.id, roleId: createdRoles[RoleName.ALDEIA_ADMIN].id },
  });
  // Vendedor - gestor da aldeia1
  await prisma.userAldeiaRole.create({
    data: { userId: createdUsers['user-vendedor'].id, aldeiaId: aldeia1.id, roleId: createdRoles[RoleName.GESTOR].id },
  });
  // Jogadores - viewers de ambas aldeias
  await prisma.userAldeiaRole.create({
    data: { userId: createdUsers['user-jogador'].id, aldeiaId: aldeia1.id, roleId: createdRoles[RoleName.VIEWER].id },
  });
  await prisma.userAldeiaRole.create({
    data: { userId: createdUsers['user-jogador2'].id, aldeiaId: aldeia1.id, roleId: createdRoles[RoleName.VIEWER].id },
  });

  // ──────────────────────────────────────────────
  // 5b. VAULT + VENDEDOR CASHBOX
  // ──────────────────────────────────────────────
  const vault1 = await prisma.vault.create({
    data: {
      id: 'vault-aldeia-001',
      aldeiaId: aldeia1.id,
      saldo: 250,
    },
  });
  await prisma.vault.create({
    data: {
      id: 'vault-aldeia-002',
      aldeiaId: aldeia2.id,
      saldo: 100,
    },
  });

  await prisma.vendedorCashbox.create({
    data: {
      id: 'cashbox-vendedor-001',
      userId: createdUsers['user-vendedor'].id,
      saldo: 40,
    },
  });
  console.log('✅ 2 vaults + 1 vendedor cashbox');

  // ──────────────────────────────────────────────
  // 6. EVENTOS (2 por aldeia)
  // ──────────────────────────────────────────────
  const hoje = new Date();
  const mesPassado = new Date(hoje); mesPassado.setMonth(mesPassado.getMonth() - 1);
  const mesSeguinte = new Date(hoje); mesSeguinte.setMonth(mesSeguinte.getMonth() + 1);
  const doisMesesSeguinte = new Date(hoje); doisMesesSeguinte.setMonth(doisMesesSeguinte.getMonth() + 2);

  const evento1 = await prisma.evento.create({
    data: {
      id: 'evento-festa-povo',
      nome: 'Festa do Povo',
      slug: 'festa-povo-vale-azenha',
      descricao: 'Festa tradicional em honra do padroeiro',
      dataInicio: mesPassado,
      dataFim: mesSeguinte,
      objectivoAngariacao: 5000,
      estado: 'ativo',
      publico: true,
      aldeiaId: aldeia1.id,
      totalAngariado: 1250,
      totalParticipacoes: 45,
    },
  });

  const evento2 = await prisma.evento.create({
    data: {
      id: 'evento-feira-anual',
      nome: 'Feira Anual',
      slug: 'feira-anual-vale-azenha',
      descricao: 'Feira anual com artesanato e gastronomia',
      dataInicio: new Date('2025-06-01'),
      dataFim: new Date('2025-06-15'),
      objectivoAngariacao: 3000,
      estado: 'finalizado',
      publico: true,
      aldeiaId: aldeia1.id,
      totalAngariado: 2800,
      totalParticipacoes: 120,
    },
  });

  const evento3 = await prisma.evento.create({
    data: {
      id: 'evento-serra-festa',
      nome: 'Festa da Serra',
      slug: 'festa-serra-monte-alto',
      descricao: 'Festa de verão no miradouro da serra',
      dataInicio: new Date(),
      dataFim: doisMesesSeguinte,
      objectivoAngariacao: 8000,
      estado: 'ativo',
      publico: true,
      aldeiaId: aldeia2.id,
      totalAngariado: 500,
      totalParticipacoes: 15,
    },
  });

  const evento4 = await prisma.evento.create({
    data: {
      id: 'evento-caminhada',
      nome: 'Caminhada Solidária',
      slug: 'caminhada-solidaria-monte-alto',
      descricao: 'Caminhada anual solidária',
      dataInicio: new Date('2025-09-01'),
      dataFim: new Date('2025-09-02'),
      objectivoAngariacao: 2000,
      estado: 'finalizado',
      publico: false,
      aldeiaId: aldeia2.id,
      totalAngariado: 1850,
      totalParticipacoes: 80,
    },
  });

  console.log('✅ 4 eventos');

  // ──────────────────────────────────────────────
  // 7. JOGOS
  // ──────────────────────────────────────────────
  const jogoRifa = await prisma.jogo.create({
    data: {
      id: 'rifa-teste-001',
      nome: 'Rifa de Teste',
      tipo: 'rifa',
      descricao: 'Rifa para teste de funcionalidade - números de 1 a 100',
      preco: 5,
      stockInicial: 100,
      stockAtual: 94,
      limitePorUsuario: 10,
      estado: 'aberto',
      dataAbertura: new Date(),
      lucroMinimoPercent: 70,
      percentagemTotalPremios: 30,
      eventoId: evento1.id,
      aldeiaId: aldeia1.id,
      totalParticipacoes: 6,
      totalAngariado: 30,
      configuracao: JSON.stringify({
        numeroInicial: 1,
        numeroFinal: 100,
        numeroBlocos: 1,
        permitirStripe: true,
        valorPremios: null,
      }),
    },
  });

  const jogoRaspadinha = await prisma.jogo.create({
    data: {
      id: 'raspadinha-natal-001',
      nome: 'Raspadinha de Natal',
      tipo: 'raspadinha',
      descricao: 'Raspadinha temática de Natal',
      preco: 2,
      stockInicial: 50,
      stockAtual: 48,
      limitePorUsuario: 5,
      estado: 'aberto',
      dataAbertura: new Date(),
      lucroMinimoPercent: 60,
      percentagemTotalPremios: 40,
      eventoId: evento3.id,
      aldeiaId: aldeia2.id,
      totalParticipacoes: 2,
      totalAngariado: 4,
      configuracao: JSON.stringify({
        permitirStripe: false,
        valorPremios: null,
        tema: 'natal',
      }),
    },
  });

  const jogoEuromilhoes = await prisma.jogo.create({
    data: {
      id: 'euromilhoes-teste-001',
      nome: 'Euromilhões Solidário',
      tipo: 'euromilhoes',
      descricao: 'Euromilhões da aldeia - escolha 5 números de 1 a 50',
      preco: 5,
      stockInicial: 10000,
      stockAtual: 10000,
      limitePorUsuario: 10,
      estado: 'aberto',
      dataAbertura: new Date(),
      lucroMinimoPercent: 70,
      percentagemTotalPremios: 30,
      eventoId: evento1.id,
      aldeiaId: aldeia1.id,
      totalParticipacoes: 0,
      totalAngariado: 0,
      configuracao: JSON.stringify({
        permitirStripe: true,
        valorPremios: '1000',
        premioDescricao: 'Prémio principal: 1.000€',
      }),
    },
  });

  const agora = new Date();
  const proxSexta = new Date(agora);
  const diaSemana = agora.getDay();
  let diasAteSexta = diaSemana <= 5 ? 5 - diaSemana : 5 + 7 - diaSemana;
  if (diaSemana === 5 && agora.getHours() >= 21 && agora.getMinutes() >= 30) diasAteSexta = 7;
  proxSexta.setDate(proxSexta.getDate() + diasAteSexta);
  proxSexta.setHours(21, 30, 0, 0);
  const bloqueio = new Date(proxSexta.getTime() - 2 * 60 * 60 * 1000);

  await prisma.grelhaEuromilhoes.create({
    data: {
      id: 'grelha-eurom-001',
      jogoId: jogoEuromilhoes.id,
      numero: 1,
      estado: 'aberta',
      numerosOcupados: '[]',
      premioDescricao: 'Prémio principal: 1.000€',
      premioValor: 1000,
      sorteioData: proxSexta,
      bloqueioData: bloqueio,
    },
  });

  console.log('✅ 3 jogos (inclui Euromilhões)');

  // ──────────────────────────────────────────────
  // 8. PRÉMIOS
  // ──────────────────────────────────────────────
  await prisma.premio.create({
    data: {
      id: 'premio-rifa-1',
      nome: 'Grande Prémio - Vale 500€',
      descricao: 'Vale de compras no valor de 500€',
      valorDinheiroAlternative: 500,
      percentagem: 5,
      ordem: 1,
      aldeiaId: aldeia1.id,
      jogoId: jogoRifa.id,
    },
  });

  await prisma.premio.create({
    data: {
      id: 'premio-rifa-2',
      nome: 'Cabaz de Produtos Regionais',
      descricao: 'Cabaz com produtos típicos da região',
      valorDinheiroAlternative: 100,
      percentagem: 10,
      ordem: 2,
      aldeiaId: aldeia1.id,
      jogoId: jogoRifa.id,
    },
  });

  await prisma.premio.create({
    data: {
      id: 'premio-raspadinha-1',
      nome: 'Vale 50€',
      descricao: 'Vale de compras de 50€',
      valorDinheiroAlternative: 50,
      percentagem: 15,
      ordem: 1,
      aldeiaId: aldeia2.id,
      jogoId: jogoRaspadinha.id,
    },
  });

  await prisma.premio.create({
    data: {
      id: 'premio-raspadinha-2',
      nome: 'Chocolate Artesanal',
      descricao: 'Caixa de chocolates artesanais',
      valorDinheiroAlternative: 15,
      percentagem: 25,
      ordem: 2,
      aldeiaId: aldeia2.id,
      jogoId: jogoRaspadinha.id,
    },
  });

  console.log('✅ 4 prémios');

  // ──────────────────────────────────────────────
  // 9. NÚMEROS VENDIDOS (grelha da rifa)
  // ──────────────────────────────────────────────
  const numerosVendidos = [1, 2, 3, 5, 7, 10];
  for (const num of numerosVendidos) {
    await prisma.numeroVendido.create({
      data: { jogoId: jogoRifa.id, numero: num },
    });
  }
  console.log(`✅ ${numerosVendidos.length} números vendidos`);

  // ──────────────────────────────────────────────
  // 10. PARTICIPAÇÕES
  // ──────────────────────────────────────────────
  // Participação do Jogador 1 na rifa (2 números)
  const part1 = await prisma.participacao.create({
    data: {
      id: 'part-jogador-001',
      dadosParticipacao: JSON.stringify({ numeros: [1, 2], tipo: 'rifa' }),
      valorPago: 10,
      metodoPagamento: 'saldo',
      estadoPagamento: 'concluido',
      dataPagamento: new Date(),
      hashParticipacao: 'abc123def456',
      dadosVerificacao: JSON.stringify({ metodo: 'saldo' }),
      ganhador: false,
      premioEntregue: false,
      jogoId: jogoRifa.id,
      userId: createdUsers['user-jogador'].id,
    },
  });

  // Participação do Jogador 2 na rifa (1 número)
  const part2 = await prisma.participacao.create({
    data: {
      id: 'part-jogador-002',
      dadosParticipacao: JSON.stringify({ numeros: [3], tipo: 'rifa' }),
      valorPago: 5,
      metodoPagamento: 'dinheiro',
      estadoPagamento: 'pendente',
      seedRaspe: null,
      ganhador: false,
      premioEntregue: false,
      jogoId: jogoRifa.id,
      userId: createdUsers['user-jogador2'].id,
    },
  });

  // Participação do Jogador 1 na raspadinha
  const part3 = await prisma.participacao.create({
    data: {
      id: 'part-jogador-003',
      dadosParticipacao: JSON.stringify({ numeros: [1], tipo: 'raspadinha' }),
      valorPago: 2,
      metodoPagamento: 'saldo',
      estadoPagamento: 'concluido',
      dataPagamento: new Date(),
      hashRaspe: 'raspe789abc',
      resultadoRaspe: JSON.stringify({ premio: 'Vale 50€', ganhou: true }),
      revelado: true,
      dataRevelacao: new Date(),
      ganhador: true,
      premioEntregue: false,
      jogoId: jogoRaspadinha.id,
      userId: createdUsers['user-jogador'].id,
    },
  });

  console.log('✅ 3 participações');

  // ──────────────────────────────────────────────
  // 10b. EUROMILHÕES PARTICIPAÇÕES
  // ──────────────────────────────────────────────
  const partEurom1 = await prisma.participacao.create({
    data: {
      id: 'part-eurom-001',
      dadosParticipacao: JSON.stringify({ numeros: [3, 12, 25, 38, 44], tipo: 'euromilhoes' }),
      valorPago: 5,
      metodoPagamento: 'saldo',
      estadoPagamento: 'concluido',
      dataPagamento: new Date(),
      hashParticipacao: 'eurom-hash-001',
      dadosVerificacao: JSON.stringify({ metodo: 'saldo' }),
      ganhador: false,
      premioEntregue: false,
      jogoId: jogoEuromilhoes.id,
      userId: createdUsers['user-jogador'].id,
      grelhaId: 'grelha-eurom-001',
      numerosSelecionados: '3,12,25,38,44',
    },
  });

  const partEurom2 = await prisma.participacao.create({
    data: {
      id: 'part-eurom-002',
      dadosParticipacao: JSON.stringify({ numeros: [7, 15, 28, 41, 49], tipo: 'euromilhoes' }),
      valorPago: 5,
      metodoPagamento: 'dinheiro',
      estadoPagamento: 'pendente',
      ganhador: false,
      premioEntregue: false,
      jogoId: jogoEuromilhoes.id,
      userId: createdUsers['user-jogador2'].id,
      grelhaId: 'grelha-eurom-001',
      numerosSelecionados: '7,15,28,41,49',
    },
  });

  // Atualizar numerosOcupados na grelha
  await prisma.grelhaEuromilhoes.update({
    where: { id: 'grelha-eurom-001' },
    data: { numerosOcupados: JSON.stringify(['3,12,25,38,44', '7,15,28,41,49']) },
  });

  console.log('✅ 2 participações euromilhões');

  // ──────────────────────────────────────────────
  // 11. TRANSAÇÕES
  // ──────────────────────────────────────────────
  // Carregamento de saldo para Jogador 1
  await prisma.transacao.create({
    data: {
      valor: 100,
      tipo: 'deposito',
      descricao: 'Carregamento inicial de saldo',
      referencia: 'DEP-2026-001',
      metodoPagamento: 'dinheiro',
      estado: 'concluido',
      userId: createdUsers['user-jogador'].id,
    },
  });

  // Pagamento da participação na rifa
  await prisma.transacao.create({
    data: {
      valor: -10,
      tipo: 'pagamento_jogo',
      descricao: 'Pagamento rifa - números 1,2',
      referencia: `PAY-${part1.id.slice(0, 8)}`,
      metodoPagamento: 'saldo',
      estado: 'concluido',
      userId: createdUsers['user-jogador'].id,
    },
  });

  // Cashback
  await prisma.transacao.create({
    data: {
      valor: 1,
      tipo: 'cashback',
      descricao: 'Cashback de 10% na participação',
      referencia: 'CB-2026-001',
      estado: 'concluido',
      userId: createdUsers['user-jogador'].id,
    },
  });

  // Carregamento para Jogador 2
  await prisma.transacao.create({
    data: {
      valor: 50,
      tipo: 'deposito',
      descricao: 'Carregamento de saldo',
      referencia: 'DEP-2026-002',
      metodoPagamento: 'mbway',
      estado: 'concluido',
      userId: createdUsers['user-jogador2'].id,
    },
  });

  // Comissão para vendedor
  await prisma.transacao.create({
    data: {
      valor: 2.5,
      tipo: 'comissao',
      descricao: 'Comissão de 5% sobre venda de rifa',
      referencia: 'COM-2026-001',
      estado: 'pendente',
      userId: createdUsers['user-vendedor'].id,
    },
  });

  // Prémio em dinheiro
  await prisma.transacao.create({
    data: {
      valor: 50,
      tipo: 'premio_dinheiro',
      descricao: 'Prémio raspadinha - Vale 50€',
      referencia: 'PREMIO-2026-001',
      estado: 'pendente',
      userId: createdUsers['user-jogador'].id,
    },
  });

  console.log('✅ 6 transações');

  // ──────────────────────────────────────────────
  // 11b. COMISSÕES + VENDAS + ENTREGAS
  // ──────────────────────────────────────────────
  await prisma.comissao.create({
    data: {
      id: 'comissao-vendedor-001',
      vendedorId: createdUsers['user-vendedor'].id,
      percentual: 5,
      metaVendas: 1000,
      bonusMeta: 2.5,
      aldeiaId: aldeia1.id,
    },
  });

  await prisma.venda.create({
    data: {
      id: 'venda-vendedor-001',
      valor: 10,
      comissao: 0.5,
      metodoPagamento: 'dinheiro',
      dadosCliente: JSON.stringify({ nome: 'Jogador', email: 'jogador@gmail.com' }),
      vendedorId: createdUsers['user-vendedor'].id,
    },
  });

  await prisma.entregaSaldo.create({
    data: {
      id: 'entrega-vendedor-001',
      vendedorId: createdUsers['user-vendedor'].id,
      adminId: createdUsers['user-aldeia-admin'].id,
      aldeiaId: aldeia1.id,
      valor: 30,
      estado: 'confirmado',
      dataSolicitacao: new Date(Date.now() - 3 * 60 * 60 * 1000),
      dataConfirmacao: new Date(Date.now() - 2 * 60 * 60 * 1000),
      observacoes: 'Entrega referente a vendas de rifa',
    },
  });

  console.log('✅ 1 comissão, 1 venda, 1 entrega');

  // ──────────────────────────────────────────────
  // 11c. PEDIDOS DEPÓSITO COFRE + VAULT TRANSACTIONS + CASHBOX TRANSACTIONS
  // ──────────────────────────────────────────────
  // Pedido pendente
  const pedidoDepPendente = await prisma.pedidoDepositoCofre.create({
    data: {
      id: 'dep-pendente-001',
      vendedorId: createdUsers['user-vendedor'].id,
      aldeiaId: aldeia1.id,
      valor: 20,
      descricao: 'Depósito de vendas de rifa',
      estado: 'pendente',
      referencias: JSON.stringify(['carregamento-pendente-001']),
      criadoPorId: createdUsers['user-vendedor'].id,
    },
  });

  // Pedido confirmado
  const pedidoDepConfirmado = await prisma.pedidoDepositoCofre.create({
    data: {
      id: 'dep-confirmado-001',
      vendedorId: createdUsers['user-vendedor'].id,
      aldeiaId: aldeia1.id,
      valor: 30,
      descricao: 'Depósito de vendas de rifa - confirmado',
      estado: 'confirmado',
      referencias: JSON.stringify(['carregamento-aprovado-001']),
      criadoPorId: createdUsers['user-vendedor'].id,
      confirmadoPorId: createdUsers['user-aldeia-admin'].id,
      confirmadoAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      observacoes: 'Valor conferido e depositado no cofre',
    },
  });

  // Pedido rejeitado
  await prisma.pedidoDepositoCofre.create({
    data: {
      id: 'dep-rejeitado-001',
      vendedorId: createdUsers['user-vendedor'].id,
      aldeiaId: aldeia1.id,
      valor: 100,
      descricao: 'Valor incorreto',
      estado: 'rejeitado',
      criadoPorId: createdUsers['user-vendedor'].id,
      rejeitadoPorId: createdUsers['user-aldeia-admin'].id,
      motivoRejeicao: 'Valor não corresponde ao registado no cashbox',
      observacoes: 'Vendedor deve conferir o montante em caixa',
    },
  });

  // Vault transactions
  await prisma.vaultTransaction.create({
    data: {
      vaultId: vault1.id,
      tipo: 'deposito',
      valor: 30,
      descricao: 'Depósito confirmado - vendas rifa',
      referencia: pedidoDepConfirmado.id,
      estado: 'confirmado',
      criadoPorId: createdUsers['user-aldeia-admin'].id,
      aprovadoPorId: createdUsers['user-aldeia-admin'].id,
      dataCriacao: new Date(Date.now() - 1 * 60 * 60 * 1000),
      dataAprovacao: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
  });

  await prisma.vaultTransaction.create({
    data: {
      vaultId: vault1.id,
      tipo: 'deposito',
      valor: 20,
      descricao: 'Depósito pendente - vendas rifa',
      referencia: pedidoDepPendente.id,
      estado: 'pendente',
      criadoPorId: createdUsers['user-vendedor'].id,
      dataCriacao: new Date(),
    },
  });

  // Vendedor cashbox transactions
  await prisma.vendedorCashboxTransaction.create({
    data: {
      cashboxId: 'cashbox-vendedor-001',
      tipo: 'RECEBIDO_DO_JOGADOR',
      valor: 20,
      descricao: 'Recebido do Jogador - carregamento pendente',
      referencia: 'carregamento-pendente-001',
      criadoPorId: createdUsers['user-vendedor'].id,
    },
  });

  await prisma.vendedorCashboxTransaction.create({
    data: {
      cashboxId: 'cashbox-vendedor-001',
      tipo: 'DEPOSITADO_NO_COFRE',
      valor: 30,
      descricao: 'Depositado no cofre - confirmado',
      referencia: pedidoDepConfirmado.id,
      criadoPorId: createdUsers['user-aldeia-admin'].id,
    },
  });

  console.log('✅ 3 pedidos depósito, 2 vault transactions, 2 cashbox transactions');

  // ──────────────────────────────────────────────
  // 12. PEDIDOS DE CARREGAMENTO
  // ──────────────────────────────────────────────
  // Pedido pendente
  await prisma.pedidoCarregamento.create({
    data: {
      id: 'carregamento-pendente-001',
      userId: createdUsers['user-jogador'].id,
      vendedorId: createdUsers['user-vendedor'].id,
      aldeiaId: aldeia1.id,
      valor: 20,
      estado: 'pendente',
      metodoPagamento: 'dinheiro',
      metodoValidacao: 'password',
      passwordOneTime: 'TEMP123',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      tentativaUsada: false,
      tentativasErro: 0,
      pagamentoConfirmado: false,
      requerAutorizacao: false,
      autorizado: false,
    },
  });

  // Pedido aprovado
  await prisma.pedidoCarregamento.create({
    data: {
      id: 'carregamento-aprovado-001',
      userId: createdUsers['user-jogador2'].id,
      vendedorId: createdUsers['user-vendedor'].id,
      aldeiaId: aldeia1.id,
      valor: 30,
      estado: 'confirmado',
      metodoPagamento: 'dinheiro',
      metodoValidacao: 'qr_code',
      qrCodeData: 'qr-data-encrypted-001',
      pagamentoConfirmado: true,
      confirmadoPorId: createdUsers['user-vendedor'].id,
      confirmadoAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      requerAutorizacao: false,
      autorizado: true,
      autorizadoPorId: createdUsers['user-aldeia-admin'].id,
      autorizadoAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      notificadoJogador: true,
      notificadoVendedor: true,
      notificadoAdmin: true,
    },
  });

  // Pedido rejeitado
  await prisma.pedidoCarregamento.create({
    data: {
      id: 'carregamento-rejeitado-001',
      userId: createdUsers['user-jogador'].id,
      vendedorId: createdUsers['user-vendedor'].id,
      aldeiaId: aldeia1.id,
      valor: 100,
      estado: 'cancelado',
      metodoPagamento: 'dinheiro',
      pagamentoConfirmado: false,
      requerAutorizacao: true,
      autorizado: false,
      motivoRejeicao: 'Valor excede limite diário sem autorização',
      observacoes: 'Solicitante deve contactar administração',
      notificadoJogador: true,
      notificadoVendedor: true,
      notificadoAdmin: true,
    },
  });

  console.log('✅ 3 pedidos de carregamento');

  // ──────────────────────────────────────────────
  // 12b. AUDIT LOGS + LOGS ACESSO
  // ──────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      userId: createdUsers['user-vendedor'].id,
      aldeiaId: aldeia1.id,
      action: 'deposito_criado',
      resource: 'PedidoDepositoCofre',
      resourceId: pedidoDepPendente.id,
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      metadata: JSON.stringify({ valor: 20, estado: 'pendente' }),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: createdUsers['user-aldeia-admin'].id,
      aldeiaId: aldeia1.id,
      action: 'deposito_confirmado',
      resource: 'PedidoDepositoCofre',
      resourceId: pedidoDepConfirmado.id,
      ip: '192.168.1.50',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0',
      metadata: JSON.stringify({ valor: 30, confirmadoPor: 'Admin Aldeia' }),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: createdUsers['user-aldeia-admin'].id,
      aldeiaId: aldeia1.id,
      action: 'deposito_rejeitado',
      resource: 'PedidoDepositoCofre',
      resourceId: 'dep-rejeitado-001',
      ip: '192.168.1.50',
      metadata: JSON.stringify({ valor: 100, motivo: 'Valor incorreto' }),
    },
  });

  await prisma.logAcesso.create({
    data: {
      userId: createdUsers['user-super-admin'].id,
      email: 'admin@aldeias.pt',
      sucesso: true,
      ip: '10.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    },
  });

  await prisma.logAcesso.create({
    data: {
      email: 'desconhecido@teste.com',
      sucesso: false,
      motivo: 'Credenciais inválidas',
      ip: '10.0.0.99',
      userAgent: 'curl/7.68.0',
    },
  });

  console.log('✅ 3 audit logs + 2 logs acesso');

  // ──────────────────────────────────────────────
  // 13. BADGES + USER_BADGES (gamificação)
  // ──────────────────────────────────────────────
  const badges = [
    { id: 'badge-primeira-compra', nome: 'Primeira Participação', descricao: 'Realizou a primeira participação', criterio: 'primeira_participacao', pontos: 10 },
    { id: 'badge-veterano', nome: 'Veterano', descricao: 'Participou em mais de 10 jogos', criterio: 'participacoes_10', pontos: 50, raro: true },
    { id: 'badge-vencedor', nome: 'Vencedor', descricao: 'Ganhou um prémio', criterio: 'ganhou_premio', pontos: 100, raro: true },
    { id: 'badge-early-adopter', nome: 'Early Adopter', descricao: 'Dos primeiros a usar a plataforma', criterio: 'primeiro_mes', pontos: 200, raro: true },
  ];

  for (const b of badges) {
    await prisma.badge.create({ data: b });
  }

  // Atribuir badges ao Jogador 1
  await prisma.userBadge.create({
    data: { userId: createdUsers['user-jogador'].id, badgeId: 'badge-primeira-compra' },
  });
  await prisma.userBadge.create({
    data: { userId: createdUsers['user-jogador'].id, badgeId: 'badge-vencedor' },
  });

  // Atribuir badge ao Jogador 2
  await prisma.userBadge.create({
    data: { userId: createdUsers['user-jogador2'].id, badgeId: 'badge-primeira-compra' },
  });

  console.log(`✅ ${badges.length} badges, 3 atribuídas`);

  // ──────────────────────────────────────────────
  // 14. NOTIFICAÇÕES
  // ──────────────────────────────────────────────
  await prisma.notificacao.create({
    data: {
      tipo: 'sistema',
      titulo: 'Bem-vindo à plataforma!',
      mensagem: 'Obrigado por te juntares à Aldeias Games.',
      userId: createdUsers['user-jogador'].id,
    },
  });
  await prisma.notificacao.create({
    data: {
      tipo: 'pagamento',
      titulo: 'Pagamento Confirmado',
      mensagem: 'A tua participação na rifa foi confirmada.',
      userId: createdUsers['user-jogador'].id,
    },
  });
  await prisma.notificacao.create({
    data: {
      tipo: 'premio',
      titulo: 'Parabéns! Ganhaste!',
      mensagem: 'Ganhaste um Vale 50€ na Raspadinha de Natal!',
      userId: createdUsers['user-jogador'].id,
      lida: false,
    },
  });

  console.log('✅ 3 notificações');

  // ──────────────────────────────────────────────
  // 15. GAMIFICAÇÃO - Eventos de pontuação
  // ──────────────────────────────────────────────
  await prisma.gamificacaoEvento.create({
    data: { tipo: 'participacao', pontos: 10, descricao: 'Participar num jogo' },
  });
  await prisma.gamificacaoEvento.create({
    data: { tipo: 'vitoria', pontos: 50, descricao: 'Ganhar um prémio' },
  });
  await prisma.gamificacaoEvento.create({
    data: { tipo: 'compartilhamento', pontos: 5, descricao: 'Partilhar nas redes sociais' },
  });
  await prisma.gamificacaoEvento.create({
    data: { tipo: 'convite_vendedor', pontos: 20, descricao: 'Convidar um novo vendedor' },
  });

  console.log('✅ 4 eventos de gamificação');

  // ──────────────────────────────────────────────
  // 15b. GAME ANALYTICS
  // ──────────────────────────────────────────────
  await prisma.gameAnalytics.create({
    data: {
      type: 'game_view',
      gameId: jogoRifa.id,
      gameType: 'rifa',
      source: 'pagina_jogos',
      description: 'Visualização da página da rifa',
      aldeiaId: aldeia1.id,
      userId: createdUsers['user-jogador'].id,
      sessionId: 'session-001',
    },
  });

  await prisma.gameAnalytics.create({
    data: {
      type: 'payment_success',
      gameId: jogoRifa.id,
      gameType: 'rifa',
      method: 'saldo',
      amount: 10,
      description: 'Pagamento bem-sucedido de participação na rifa',
      aldeiaId: aldeia1.id,
      userId: createdUsers['user-jogador'].id,
      sessionId: 'session-001',
    },
  });

  await prisma.gameAnalytics.create({
    data: {
      type: 'game_view',
      gameId: jogoEuromilhoes.id,
      gameType: 'euromilhoes',
      source: 'pagina_jogos',
      description: 'Visualização da página do Euromilhões',
      aldeiaId: aldeia1.id,
      userId: createdUsers['user-jogador'].id,
      sessionId: 'session-002',
    },
  });

  console.log('✅ 3 game analytics');

  // ──────────────────────────────────────────────
  // RESUMO
  // ──────────────────────────────────────────────
  console.log('\n' + '═'.repeat(40));
  console.log('📊 RESUMO DO SEED');
  console.log('═'.repeat(40));
  console.log(`✅ Aldeias:             2`);
  console.log(`✅ Eventos:             4`);
  console.log(`✅ Jogos:               3 (1 rifa, 1 raspadinha, 1 euromilhoes)`);
  console.log(`✅ Utilizadores:        ${usersData.length}`);
  console.log(`✅ Participações:       5 (3 gerais + 2 euromilhoes)`);
  console.log(`✅ Prémios:             4`);
  console.log(`✅ Transações:          6`);
  console.log(`✅ Números Vendidos:    ${numerosVendidos.length}`);
  console.log(`✅ Pedidos Carregamento: 3`);
  console.log(`✅ Pedidos Depósito:     3 (1 pendente, 1 confirmado, 1 rejeitado)`);
  console.log(`✅ Vaults:              2`);
  console.log(`✅ Vault Transactions:   2 (1 confirmada, 1 pendente)`);
  console.log(`✅ Cashbox Transactions: 2 (1 recebido, 1 depositado)`);
  console.log(`✅ Comissões:           1`);
  console.log(`✅ Vendas:              1`);
  console.log(`✅ Entregas Saldo:      1`);
  console.log(`✅ Audit Logs:          3`);
  console.log(`✅ Logs Acesso:         2`);
  console.log(`✅ Game Analytics:      3`);
  console.log(`✅ Badges:              ${badges.length}`);
  console.log(`✅ Notificações:        3`);
  console.log('═'.repeat(40));
  console.log('\n🔑 Credenciais de teste:');
  console.log('   admin@aldeias.pt / 123456  (super_admin)');
  console.log('   aldeia@gmail.com / 123456  (aldeia_admin)');
  console.log('   vendedor@gmail.com / 123456');
  console.log('   jogador@gmail.com / 123456');
  console.log('   jogador2@gmail.com / 123456');
  console.log(`\n🎮 Rifa ID: ${jogoRifa.id}`);
  console.log('   Aceder: http://localhost:3000/jogos/rifa?id=' + jogoRifa.id);
  console.log('   Números ocupados: ' + numerosVendidos.join(', '));
  console.log(`\n🎰 Euromilhões ID: ${jogoEuromilhoes.id}`);
  console.log('   Aceder: http://localhost:3000/jogos/euromilhoes?id=' + jogoEuromilhoes.id);
  console.log('   Grelha ID: grelha-eurom-001');
  console.log('\n🎉 SEED COMPLETO CONCLUÍDO!');
}

main()
  .catch((e) => {
    console.error('\n❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
