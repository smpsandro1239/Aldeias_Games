// @ts-nocheck
import { PrismaClient, UserRole, TipoJogo, EstadoJogo, GrelhaEstado, MetodoPagamento, EstadoPagamento, RoleName, PermissionKey, CashboxTipo, DepositoEstado, EstadoEntrega, VaultTipo, VaultEstado, TipoNotificacao } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000);
const hoursAgo = (n: number) => new Date(Date.now() - n * 3600000);

async function main() {
  console.log('SEED COMPLETO v3.12.0\n');

  // ── LIMPEZA ──
  console.log('Limpando dados...');
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
  await prisma.vendedorCashboxTransaction.deleteMany();
  await prisma.vendedorCashbox.deleteMany();
  await prisma.vaultTransaction.deleteMany();
  await prisma.vault.deleteMany();
  await prisma.pedidoDepositoCofre.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.aldeia.deleteMany();
  await prisma.plano.deleteMany();
  console.log('Dados limpos\n');

  const pw = await bcrypt.hash('123456', 10);

  // ── 1. PERMISSOES ──
  const allPerms = [
    PermissionKey.MANAGE_ALDEIA, PermissionKey.VIEW_ALDEIA,
    PermissionKey.CREATE_EVENTO, PermissionKey.EDIT_EVENTO, PermissionKey.DELETE_EVENTO, PermissionKey.VIEW_EVENTO,
    PermissionKey.CREATE_JOGO, PermissionKey.EDIT_JOGO, PermissionKey.DELETE_JOGO, PermissionKey.VIEW_JOGO,
    PermissionKey.MANAGE_PREMIOS, PermissionKey.VIEW_PREMIOS,
    PermissionKey.MANAGE_VENDEDORES, PermissionKey.VIEW_VENDEDORES,
    PermissionKey.EXECUTE_VENDA, PermissionKey.VIEW_VENDAS,
    PermissionKey.VIEW_ANALYTICS_GLOBAL, PermissionKey.VIEW_ANALYTICS_LOCAL,
    PermissionKey.MANAGE_USERS, PermissionKey.MANAGE_PLANOS,
  ];
  const perms: Record<string, any> = {};
  for (const k of allPerms) {
    perms[k] = await prisma.permission.create({ data: { key: k, description: k } });
  }
  console.log(`+ ${allPerms.length} permissoes`);

  // ── 2. ROLES ──
  const roleDefs: { name: RoleName; desc: string; pk: PermissionKey[] }[] = [
    { name: RoleName.SUPER_ADMIN, desc: 'Super Administrador', pk: [...allPerms] },
    { name: RoleName.ALDEIA_ADMIN, desc: 'Admin de Aldeia', pk: [PermissionKey.VIEW_ALDEIA, PermissionKey.CREATE_EVENTO, PermissionKey.EDIT_EVENTO, PermissionKey.DELETE_EVENTO, PermissionKey.VIEW_EVENTO, PermissionKey.CREATE_JOGO, PermissionKey.EDIT_JOGO, PermissionKey.DELETE_JOGO, PermissionKey.VIEW_JOGO, PermissionKey.MANAGE_PREMIOS, PermissionKey.VIEW_PREMIOS, PermissionKey.MANAGE_VENDEDORES, PermissionKey.VIEW_VENDEDORES, PermissionKey.EXECUTE_VENDA, PermissionKey.VIEW_VENDAS, PermissionKey.VIEW_ANALYTICS_LOCAL] },
    { name: RoleName.GESTOR, desc: 'Gestor', pk: [PermissionKey.VIEW_ALDEIA, PermissionKey.VIEW_EVENTO, PermissionKey.VIEW_JOGO, PermissionKey.VIEW_PREMIOS, PermissionKey.VIEW_VENDEDORES, PermissionKey.EXECUTE_VENDA, PermissionKey.VIEW_VENDAS] },
    { name: RoleName.COLABORADOR, desc: 'Colaborador', pk: [PermissionKey.VIEW_ALDEIA, PermissionKey.VIEW_EVENTO, PermissionKey.VIEW_JOGO, PermissionKey.VIEW_PREMIOS, PermissionKey.EXECUTE_VENDA] },
    { name: RoleName.VIEWER, desc: 'Visualizador', pk: [PermissionKey.VIEW_ALDEIA, PermissionKey.VIEW_EVENTO, PermissionKey.VIEW_JOGO, PermissionKey.VIEW_PREMIOS, PermissionKey.VIEW_VENDEDORES] },
    { name: RoleName.MEMBRO, desc: 'Membro', pk: [PermissionKey.VIEW_ALDEIA, PermissionKey.VIEW_EVENTO, PermissionKey.VIEW_JOGO, PermissionKey.VIEW_PREMIOS, PermissionKey.VIEW_VENDEDORES] },
  ];
  const roles: Record<string, any> = {};
  for (const r of roleDefs) {
    const role = await prisma.role.create({ data: { name: r.name, description: r.desc } });
    roles[r.name] = role;
    for (const k of r.pk) {
      await prisma.rolePermission.create({ data: { roleId: role.id, permissionId: perms[k].id } });
    }
  }
  console.log(`+ ${roleDefs.length} roles`);

  // ── 3. PLANOS ──
  const planBas = await prisma.plano.create({ data: { id: 'plano-basico', nome: 'Basico', descricao: 'Plano gratuito', precoMensal: 0, maxEventos: 10, maxJogos: 100, maxParticipacoes: 10000, maxVendedores: 10, ativo: true } });
  const planPro = await prisma.plano.create({ data: { id: 'plano-pro', nome: 'Pro', descricao: 'Plano profissional', precoMensal: 29.99, maxEventos: 50, maxJogos: 500, maxParticipacoes: 100000, maxVendedores: 50, ativo: true } });
  const planPrem = await prisma.plano.create({ data: { id: 'plano-premium', nome: 'Premium', descricao: 'Plano premium', precoMensal: 79.99, maxEventos: -1, maxJogos: -1, maxParticipacoes: -1, maxVendedores: -1, ativo: true } });
  console.log('+ 3 planos');

  // ── 4. UTILIZADORES ──
  const uDefs = [
    { id: 'user-super-admin', email: 'admin@aldeias.pt', nome: 'Super Admin', role: UserRole.super_admin, rn: RoleName.SUPER_ADMIN, saldo: 1000, n: 5, p: 800 },
    { id: 'user-ana-admin', email: 'admin.valeazenha@gmail.com', nome: 'Ana Silva', role: UserRole.aldeia_admin, rn: RoleName.ALDEIA_ADMIN, saldo: 500, n: 3, p: 350 },
    { id: 'user-joao-vendedor', email: 'vendedor@gmail.com', nome: 'Joao Vendedor', role: UserRole.vendedor, rn: RoleName.GESTOR, saldo: 200, n: 2, p: 150 },
    { id: 'user-carlos-vendedor', email: 'carlos@montealto.pt', nome: 'Carlos Vendedor', role: UserRole.vendedor, rn: RoleName.GESTOR, saldo: 150, n: 2, p: 120 },
    { id: 'user-jogador', email: 'jogador@gmail.com', nome: 'Maria Jogadora', role: UserRole.user, rn: RoleName.VIEWER, saldo: 100, n: 1, p: 50 },
    { id: 'user-jogador2', email: 'pedro@gmail.com', nome: 'Pedro Jogador', role: UserRole.user, rn: RoleName.VIEWER, saldo: 50, n: 0, p: 10 },
    { id: 'user-jogador3', email: 'rita@anonimo.pt', nome: 'Rita Anonima', role: UserRole.user, rn: RoleName.VIEWER, saldo: 0, n: 0, p: 0 },
  ];
  const U: Record<string, any> = {};
  for (const u of uDefs) {
    const user = await prisma.user.create({ data: { id: u.id, email: u.email, password: pw, nome: u.nome, telefone: '+351 912 345 678', role: u.role, emailVerificado: true, saldo: u.saldo, onboardingCompleted: true, comissaoPercentual: 10, comissaoAtiva: true } });
    U[u.id] = user;
    await prisma.userGlobalRole.create({ data: { userId: user.id, roleId: roles[u.rn].id } });
    await prisma.userLevel.create({ data: { userId: user.id, nivel: u.n, pontos: u.p, pontosParaProximoNivel: (u.n + 1) * 100 } });
  }
  console.log(`+ ${uDefs.length} utilizadores`);

  // ── 5. ALDEIAS ──
  const a1 = await prisma.aldeia.create({ data: { id: 'aldeia-vale-azenha', nome: 'Aldeia Vale de Azenha', slug: 'vale-azenha', tipoOrganizacao: 'aldeia', descricao: 'Aldeia no vale', morada: 'Rua da Fonte, 12', codigoPostal: '2500-100', localidade: 'Vale de Azenha', telefone: '+351 262 123 456', email: 'geral@valeazenha.pt', responsavel: 'Ana Silva', planoId: planBas.id, permitirMBWay: true, permitirStripe: true, metodosPagamentoDefault: '["saldo","dinheiro","mbway"]', autorizacaoCM: true, documentosVerificados: true, ativo: true, verificado: true, dataVerificacao: daysAgo(150), experiencia: 250, nivel: 2, pontos: 180 } });
  const a2 = await prisma.aldeia.create({ data: { id: 'aldeia-monte-alto', nome: 'Aldeia Monte Alto', slug: 'monte-alto', tipoOrganizacao: 'aldeia', descricao: 'Aldeia serrana', morada: 'Largo da Igreja, 5', codigoPostal: '2520-200', localidade: 'Monte Alto', telefone: '+351 262 987 654', email: 'geral@montealto.pt', responsavel: 'Admin Monte Alto', planoId: planBas.id, permitirMBWay: true, permitirStripe: false, metodosPagamentoDefault: '["saldo","dinheiro"]', autorizacaoCM: true, documentosVerificados: true, ativo: true, verificado: true, dataVerificacao: daysAgo(120), experiencia: 150, nivel: 1, pontos: 90 } });
  const a3 = await prisma.aldeia.create({ data: { id: 'aldeia-escola-nova', nome: 'Escola Nova', slug: 'escola-nova', tipoOrganizacao: 'escola', descricao: 'Escola do primeiro ciclo', nomeEscola: 'Escola Basica Nova', codigoEscola: 'ES-001', nivelEnsino: 'primeiro_ciclo', morada: 'Rua da Escola, 1', codigoPostal: '2530-300', localidade: 'Vila Nova', telefone: '+351 262 111 222', email: 'geral@escolanova.pt', responsavel: 'Diretora', planoId: planPro.id, permitirMBWay: false, permitirStripe: true, metodosPagamentoDefault: '["saldo","dinheiro","stripe"]', autorizacaoCM: true, documentosVerificados: true, ativo: true, verificado: true, dataVerificacao: daysAgo(60), experiencia: 80, nivel: 1, pontos: 45 } });
  console.log('+ 3 aldeias');

  // ── 5b. ASSOCIACOES USER-ALDEIA ──
  const uaAssoc: [string, string, RoleName][] = [
    ['user-super-admin', a1.id, RoleName.SUPER_ADMIN],
    ['user-super-admin', a2.id, RoleName.SUPER_ADMIN],
    ['user-super-admin', a3.id, RoleName.SUPER_ADMIN],
    ['user-ana-admin', a1.id, RoleName.ALDEIA_ADMIN],
    ['user-ana-admin', a3.id, RoleName.ALDEIA_ADMIN],
    ['user-joao-vendedor', a1.id, RoleName.GESTOR],
    ['user-joao-vendedor', a3.id, RoleName.COLABORADOR],
    ['user-carlos-vendedor', a2.id, RoleName.GESTOR],
    ['user-jogador', a1.id, RoleName.VIEWER],
    ['user-jogador', a2.id, RoleName.VIEWER],
    ['user-jogador2', a2.id, RoleName.VIEWER],
    ['user-jogador2', a3.id, RoleName.MEMBRO],
    ['user-jogador3', a1.id, RoleName.VIEWER],
  ];
  for (const [uid, aid, rn] of uaAssoc) {
    await prisma.userAldeiaRole.create({ data: { userId: U[uid].id, aldeiaId: aid, roleId: roles[rn].id } });
  }
  console.log(`+ ${uaAssoc.length} user-aldeia roles`);

  // ── 5c. VAULTS ──
  const v1 = await prisma.vault.create({ data: { id: 'vault-001', aldeiaId: a1.id, saldo: 350 } });
  const v2 = await prisma.vault.create({ data: { id: 'vault-002', aldeiaId: a2.id, saldo: 120 } });
  const v3 = await prisma.vault.create({ data: { id: 'vault-003', aldeiaId: a3.id, saldo: 0 } });
  console.log('+ 3 vaults');

  // ── 5d. VENDEDOR CASHBOX ──
  const cb1 = await prisma.vendedorCashbox.create({ data: { id: 'cashbox-joao', userId: U['user-joao-vendedor'].id, saldo: 45 } });
  const cb2 = await prisma.vendedorCashbox.create({ data: { id: 'cashbox-carlos', userId: U['user-carlos-vendedor'].id, saldo: 30 } });
  console.log('+ 2 vendedor cashbox');

  // ── 6. EVENTOS (6) ──
  const ev1 = await prisma.evento.create({ data: { id: 'evento-festa-povo', nome: 'Festa do Povo', slug: 'festa-povo-vale-azenha', descricao: 'Festa tradicional', dataInicio: daysAgo(30), dataFim: daysFromNow(30), objectivoAngariacao: 5000, estado: 'ativo', publico: true, aldeiaId: a1.id, totalAngariado: 1250, totalParticipacoes: 45 } });
  const ev2 = await prisma.evento.create({ data: { id: 'evento-feira-anual', nome: 'Feira Anual', slug: 'feira-anual-vale-azenha', descricao: 'Feira anual', dataInicio: daysAgo(60), dataFim: daysAgo(45), objectivoAngariacao: 3000, estado: 'finalizado', publico: true, aldeiaId: a1.id, totalAngariado: 2800, totalParticipacoes: 120 } });
  const ev3 = await prisma.evento.create({ data: { id: 'evento-serra-festa', nome: 'Festa da Serra', slug: 'festa-serra-monte-alto', descricao: 'Festa de verao', dataInicio: daysAgo(5), dataFim: daysFromNow(25), objectivoAngariacao: 8000, estado: 'ativo', publico: true, aldeiaId: a2.id, totalAngariado: 500, totalParticipacoes: 15 } });
  const ev4 = await prisma.evento.create({ data: { id: 'evento-caminhada', nome: 'Caminhada Solidaria', slug: 'caminhada-solidaria', descricao: 'Caminhada anual', dataInicio: daysAgo(120), dataFim: daysAgo(119), objectivoAngariacao: 2000, estado: 'finalizado', publico: false, aldeiaId: a2.id, totalAngariado: 1850, totalParticipacoes: 80 } });
  const ev5 = await prisma.evento.create({ data: { id: 'evento-leilao', nome: 'Leilao Solidario', slug: 'leilao-solidario-escola', descricao: 'Leilao da escola', dataInicio: daysFromNow(7), dataFim: daysFromNow(14), objectivoAngariacao: 1500, estado: 'rascunho', publico: false, aldeiaId: a3.id, totalAngariado: 0, totalParticipacoes: 0 } });
  const ev6 = await prisma.evento.create({ data: { id: 'evento-junina', nome: 'Festa Junina', slug: 'festa-junina-escola', descricao: 'Festa junina', dataInicio: daysAgo(10), dataFim: daysFromNow(20), objectivoAngariacao: 4000, estado: 'ativo', publico: true, aldeiaId: a3.id, totalAngariado: 800, totalParticipacoes: 30 } });
  console.log('+ 6 eventos');

  // ── 7. JOGOS (8) ──
  const j1 = await prisma.jogo.create({ data: { id: 'rifa-solidaria-001', nome: 'Rifa Solidaria', tipo: 'rifa', descricao: 'Rifa 1-100', preco: 5, stockInicial: 100, stockAtual: 78, limitePorUsuario: 10, estado: 'aberto', dataAbertura: daysAgo(15), lucroMinimoPercent: 70, percentagemTotalPremios: 30, eventoId: ev1.id, aldeiaId: a1.id, totalParticipacoes: 22, totalAngariado: 110, configuracao: JSON.stringify({ numeroInicial: 1, numeroFinal: 100, numeroBlocos: 1, permitirStripe: true }) } });
  const j2 = await prisma.jogo.create({ data: { id: 'rifa-natal-002', nome: 'Rifa de Natal', tipo: 'rifa', descricao: 'Rifa 1-200', preco: 3, stockInicial: 200, stockAtual: 140, limitePorUsuario: 20, estado: 'aberto', dataAbertura: daysAgo(10), lucroMinimoPercent: 75, percentagemTotalPremios: 25, eventoId: ev3.id, aldeiaId: a2.id, totalParticipacoes: 60, totalAngariado: 180, configuracao: JSON.stringify({ numeroInicial: 1, numeroFinal: 200, numeroBlocos: 2, permitirStripe: false }) } });
  const j3 = await prisma.jogo.create({ data: { id: 'raspadinha-natal-001', nome: 'Raspadinha de Natal', tipo: 'raspadinha', descricao: 'Raspadinha natalicia', preco: 2, stockInicial: 200, stockAtual: 155, limitePorUsuario: 10, estado: 'aberto', dataAbertura: daysAgo(20), lucroMinimoPercent: 60, percentagemTotalPremios: 40, eventoId: ev3.id, aldeiaId: a2.id, totalParticipacoes: 45, totalAngariado: 90, configuracao: JSON.stringify({ premios: [{ nome: 'Euro', valorDinheiroAlternative: 2, percentagem: 0.25 }, { nome: 'Dois Euro', valorDinheiroAlternative: 5, percentagem: 0.15 }, { nome: 'Cinco Euro', valorDinheiroAlternative: 10, percentagem: 0.05 }, { nome: 'Dez Euro', valorDinheiroAlternative: 20, percentagem: 0.02 }] }) } });
  const j4 = await prisma.jogo.create({ data: { id: 'raspadinha-verao-002', nome: 'Raspadinha de Verao', tipo: 'raspadinha', descricao: 'Raspadinha de verao', preco: 3, stockInicial: 100, stockAtual: 60, limitePorUsuario: 5, estado: 'aberto', dataAbertura: daysAgo(5), lucroMinimoPercent: 55, percentagemTotalPremios: 45, eventoId: ev1.id, aldeiaId: a1.id, totalParticipacoes: 40, totalAngariado: 120, configuracao: JSON.stringify({ premios: [{ nome: 'Nada', valorDinheiroAlternative: 0, percentagem: 0.50 }, { nome: 'Euro', valorDinheiroAlternative: 3, percentagem: 0.20 }, { nome: 'Cinco Euro', valorDinheiroAlternative: 8, percentagem: 0.10 }, { nome: 'Dez Euro', valorDinheiroAlternative: 15, percentagem: 0.05 }] }) } });
  const j5 = await prisma.jogo.create({ data: { id: 'poio-vale-001', nome: 'Poio do Vale', tipo: 'poio_da_vaca', descricao: 'Poio 5x10', preco: 2, stockInicial: 200, stockAtual: 170, limitePorUsuario: 10, estado: 'aberto', dataAbertura: daysAgo(12), custoQuadrado: 2, lucroMinimoPercent: 65, percentagemTotalPremios: 35, eventoId: ev1.id, aldeiaId: a1.id, totalParticipacoes: 30, totalAngariado: 60, configuracao: JSON.stringify({ letras: ['A','B','C','D','E'], numerosPorLetra: 10 }), dimensoesCampo: JSON.stringify({ x: 5, y: 10 }) } });
  const j6 = await prisma.jogo.create({ data: { id: 'poio-serra-002', nome: 'Poio da Serra', tipo: 'poio_da_vaca', descricao: 'Poio 8x8 finalizado', preco: 2, stockInicial: 64, stockAtual: 0, limitePorUsuario: 5, estado: 'fechado', dataAbertura: daysAgo(30), dataFecho: daysAgo(5), isFinalizado: true, sorteado: 42, custoQuadrado: 2, lucroMinimoPercent: 70, percentagemTotalPremios: 30, eventoId: ev4.id, aldeiaId: a2.id, totalParticipacoes: 64, totalAngariado: 128, configuracao: JSON.stringify({ letras: ['A','B','C','D','E','F','G','H'], numerosPorLetra: 8 }), dimensoesCampo: JSON.stringify({ x: 8, y: 8 }) } });
  const j7 = await prisma.jogo.create({ data: { id: 'euromilhoes-001', nome: 'Euromilhoes Solidario', tipo: 'euromilhoes', descricao: 'Euro 5 nums 1-50', preco: 2, stockInicial: 10000, stockAtual: 9985, limitePorUsuario: 10, estado: 'aberto', dataAbertura: daysAgo(7), lucroMinimoPercent: 70, percentagemTotalPremios: 30, eventoId: ev1.id, aldeiaId: a1.id, totalParticipacoes: 15, totalAngariado: 30, configuracao: JSON.stringify({ premioDescricao: 'Premio: 1.000 EUR', premioValor: 1000 }) } });
  const j8 = await prisma.jogo.create({ data: { id: 'euromilhoes-002', nome: 'Euromilhoes Monte', tipo: 'euromilhoes', descricao: 'Euro finalizado', preco: 2, stockInicial: 50, stockAtual: 0, limitePorUsuario: 5, estado: 'finalizado', dataAbertura: daysAgo(20), dataFecho: daysAgo(7), isFinalizado: true, sorteado: 13, lucroMinimoPercent: 70, percentagemTotalPremios: 30, eventoId: ev4.id, aldeiaId: a2.id, totalParticipacoes: 50, totalAngariado: 100, configuracao: JSON.stringify({ premioDescricao: 'Premio: 200 EUR', premioValor: 200 }) } });
  console.log('+ 8 jogos (2rifa,2rasp,2poio,2euro)');

  // ── 8. PREMIOS (10) ──
  const premData = [
    { id: 'premio-rifa1-1', nome: 'Vale 500 EUR', descricao: 'Vale compras', valorDinheiroAlternative: 500, percentagem: 5, ordem: 1, aldeiaId: a1.id, jogoId: j1.id },
    { id: 'premio-rifa1-2', nome: 'Cabaz Regional', descricao: 'Produtos tipicos', valorDinheiroAlternative: 100, percentagem: 10, ordem: 2, aldeiaId: a1.id, jogoId: j1.id },
    { id: 'premio-rifa2-1', nome: 'TV 43 polegadas', descricao: 'Smart TV', valorDinheiroAlternative: 350, percentagem: 3, ordem: 1, aldeiaId: a2.id, jogoId: j2.id },
    { id: 'premio-rifa2-2', nome: 'Tablet', descricao: 'Tablet 10"', valorDinheiroAlternative: 150, percentagem: 5, ordem: 2, aldeiaId: a2.id, jogoId: j2.id },
    { id: 'premio-rasp1-1', nome: 'Vale 20 EUR', descricao: 'Vale compras', valorDinheiroAlternative: 20, percentagem: 15, ordem: 1, aldeiaId: a2.id, jogoId: j3.id },
    { id: 'premio-rasp1-2', nome: 'Chocolate Artesanal', descricao: 'Caixa chocolates', valorDinheiroAlternative: 15, percentagem: 25, ordem: 2, aldeiaId: a2.id, jogoId: j3.id },
    { id: 'premio-rasp2-1', nome: 'Vale 15 EUR', descricao: 'Vale compras', valorDinheiroAlternative: 15, percentagem: 10, ordem: 1, aldeiaId: a1.id, jogoId: j4.id },
    { id: 'premio-poio1-1', nome: 'Vale 25 EUR', descricao: 'Vale mercado', valorDinheiroAlternative: 25, percentagem: 5, ordem: 1, aldeiaId: a1.id, jogoId: j5.id },
    { id: 'premio-poio1-2', nome: 'Queijo Serra', descricao: 'Queijo artesanal', valorDinheiroAlternative: 12, percentagem: 10, ordem: 2, aldeiaId: a1.id, jogoId: j5.id },
    { id: 'premio-euro1-1', nome: 'Premio Mil EUR', descricao: '1000 EUR', valorDinheiroAlternative: 1000, percentagem: 1, ordem: 1, aldeiaId: a1.id, jogoId: j7.id },
  ];
  for (const p of premData) await prisma.premio.create({ data: p });
  console.log('+ 10 premios');

  // ── 9. GRELHAS EUROMILHOES (4) ──
  const agora = new Date();
  const proxSexta = new Date(agora);
  const ds = agora.getDay();
  let dias = ds <= 5 ? 5 - ds : 5 + 7 - ds;
  if (ds === 5 && agora.getHours() >= 21) dias = 7;
  proxSexta.setDate(proxSexta.getDate() + dias);
  proxSexta.setHours(21, 30, 0, 0);
  const bloqueio = new Date(proxSexta.getTime() - 2 * 3600000);

  const g1 = await prisma.grelhaEuromilhoes.create({ data: { id: 'grelha-euro-001', jogoId: j7.id, numero: 1, estado: 'aberta', numerosOcupados: '[]', premioDescricao: '1.000 EUR', premioValor: 1000, sorteioData: proxSexta, bloqueioData: bloqueio } });
  await prisma.grelhaEuromilhoes.create({ data: { id: 'grelha-euro-002', jogoId: j7.id, numero: 2, estado: 'aberta', numerosOcupados: '[]', premioDescricao: '500 EUR', premioValor: 500, sorteioData: daysFromNow(14), bloqueioData: daysFromNow(14) } });
  await prisma.grelhaEuromilhoes.create({ data: { id: 'grelha-euro-003', jogoId: j7.id, numero: 3, estado: 'preenchida', numerosOcupados: JSON.stringify([1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35,37,39,41,43,45,47,49,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50]), premioDescricao: '200 EUR', premioValor: 200, sorteioData: daysAgo(2), bloqueioData: daysAgo(2), dataSorteio: daysAgo(2) } });
  await prisma.grelhaEuromilhoes.create({ data: { id: 'grelha-euro-004', jogoId: j8.id, numero: 1, estado: 'sorteada', numerosOcupados: JSON.stringify([1,2,3,4,5,6,7,8,9,10,11,12,13]), premioDescricao: '200 EUR', premioValor: 200, sorteioData: daysAgo(7), bloqueioData: daysAgo(7), dataSorteio: daysAgo(7), dataFecho: daysAgo(7), numeroSorteado: 13, fonteResultado: 'manual', vencedorId: U['user-jogador'].id } });
  console.log('+ 4 grelhas euromilhoes');

  // ── 10. PARTICIPACOES (20) ──
  const parts: any[] = [];
  // Rifa j1 - jogador
  parts.push(await prisma.participacao.create({ data: { dadosParticipacao: JSON.stringify({ numeros: [1,2,3] }), valorPago: 15, metodoPagamento: 'saldo', estadoPagamento: 'concluido', dataPagamento: daysAgo(10), hashParticipacao: 'hash-rifa-001', ganhador: false, jogoId: j1.id, userId: U['user-jogador'].id } }));
  // Rifa j1 - jogador2
  parts.push(await prisma.participacao.create({ data: { dadosParticipacao: JSON.stringify({ numeros: [5,7] }), valorPago: 10, metodoPagamento: 'dinheiro', estadoPagamento: 'pendente', ganhador: false, jogoId: j1.id, userId: U['user-jogador2'].id, vendedorId: U['user-joao-vendedor'].id } }));
  // Rifa j1 - rita anonima via vendedor
  parts.push(await prisma.participacao.create({ data: { dadosParticipacao: JSON.stringify({ numeros: [10] }), valorPago: 5, metodoPagamento: 'dinheiro', estadoPagamento: 'concluido', dataPagamento: daysAgo(5), ganhador: false, jogoId: j1.id, vendedorId: U['user-joao-vendedor'].id, nomeCliente: 'Rita', telefoneCliente: '911111111' } }));
  // Rifa j2 - jogador
  parts.push(await prisma.participacao.create({ data: { dadosParticipacao: JSON.stringify({ numeros: [1,50,100] }), valorPago: 9, metodoPagamento: 'saldo', estadoPagamento: 'concluido', dataPagamento: daysAgo(8), ganhador: false, jogoId: j2.id, userId: U['user-jogador'].id } }));
  // Rifa j2 - carlos vendeu
  parts.push(await prisma.participacao.create({ data: { dadosParticipacao: JSON.stringify({ numeros: [5,10,15,20] }), valorPago: 12, metodoPagamento: 'dinheiro', estadoPagamento: 'concluido', dataPagamento: daysAgo(6), ganhador: false, jogoId: j2.id, vendedorId: U['user-carlos-vendedor'].id, nomeCliente: 'Anonimo' } }));
  // Rasp j3 - jogador ganhou
  parts.push(await prisma.participacao.create({ data: { dadosParticipacao: JSON.stringify({}), valorPago: 2, metodoPagamento: 'saldo', estadoPagamento: 'concluido', dataPagamento: daysAgo(7), hashRaspe: 'raspe-001', resultadoRaspe: JSON.stringify({ premio: 'Euro', valor: 2, ganhou: true }), revelado: true, dataRevelacao: daysAgo(7), ganhador: true, premioEntregue: false, jogoId: j3.id, userId: U['user-jogador'].id } }));
  // Rasp j3 - jogador2 perdeu
  parts.push(await prisma.participacao.create({ data: { dadosParticipacao: JSON.stringify({}), valorPago: 2, metodoPagamento: 'saldo', estadoPagamento: 'concluido', dataPagamento: daysAgo(6), hashRaspe: 'raspe-002', resultadoRaspe: JSON.stringify({ premio: 'Nada', ganhou: false }), revelado: true, dataRevelacao: daysAgo(6), ganhador: false, jogoId: j3.id, userId: U['user-jogador2'].id } }));
  // Rasp j3 - nao revelado
  parts.push(await prisma.participacao.create({ data: { dadosParticipacao: JSON.stringify({}), valorPago: 2, metodoPagamento: 'saldo', estadoPagamento: 'concluido', dataPagamento: daysAgo(3), revelado: false, ganhador: false, jogoId: j3.id, userId: U['user-jogador3'].id } }));
  // Rasp j4 - jogador ganhou grande
  parts.push(await prisma.participacao.create({ data: { dadosParticipacao: JSON.stringify({}), valorPago: 3, metodoPagamento: 'saldo', estadoPagamento: 'concluido', dataPagamento: daysAgo(4), hashRaspe: 'raspe-004', resultadoRaspe: JSON.stringify({ premio: 'Dez Euro', valor: 15, ganhou: true }), revelado: true, dataRevelacao: daysAgo(4), ganhador: true, premioEntregue: true, jogoId: j4.id, userId: U['user-jogador'].id } }));
  // Rasp j4 - falhou pagamento
  parts.push(await prisma.participacao.create({ data: { dadosParticipacao: JSON.stringify({}), valorPago: 3, metodoPagamento: 'mbway', estadoPagamento: 'falhou', ganhador: false, jogoId: j4.id, userId: U['user-jogador2'].id } }));
  // Rasp j4 - reembolsado
  parts.push(await prisma.participacao.create({ data: { dadosParticipacao: JSON.stringify({}), valorPago: 3, metodoPagamento: 'stripe', estadoPagamento: 'reembolsado', dataPagamento: daysAgo(3), ganhador: false, jogoId: j4.id, userId: U['user-jogador3'].id } }));
  // Poio j5 - jogador
  parts.push(await prisma.participacao.create({ data: { dadosParticipacao: JSON.stringify({ coordenadas: [{ letra: 'A', numero: 5 }] }), valorPago: 2, metodoPagamento: 'saldo', estadoPagamento: 'concluido', dataPagamento: daysAgo(10), ganhador: false, jogoId: j5.id, userId: U['user-jogador'].id } }));
  // Poio j5 - jogador2
  parts.push(await prisma.participacao.create({ data: { dadosParticipacao: JSON.stringify({ coordenadas: [{ letra: 'B', numero: 3 }] }), valorPago: 2, metodoPagamento: 'saldo', estadoPagamento: 'concluido', dataPagamento: daysAgo(9), ganhador: false, jogoId: j5.id, userId: U['user-jogador2'].id } }));
  // Poio j5 - carlos vendeu
  parts.push(await prisma.participacao.create({ data: { dadosParticipacao: JSON.stringify({ coordenadas: [{ letra: 'C', numero: 7 }] }), valorPago: 2, metodoPagamento: 'dinheiro', estadoPagamento: 'concluido', dataPagamento: daysAgo(8), ganhador: false, jogoId: j5.id, vendedorId: U['user-carlos-vendedor'].id, nomeCliente: 'Passante' } }));
  // Euro j7 - jogador
  parts.push(await prisma.participacao.create({ data: { dadosParticipacao: JSON.stringify({ numeros: [3,12,25,38,44] }), valorPago: 2, metodoPagamento: 'saldo', estadoPagamento: 'concluido', dataPagamento: daysAgo(5), hashParticipacao: 'hash-euro-001', ganhador: false, jogoId: j7.id, userId: U['user-jogador'].id, grelhaId: g1.id, numerosSelecionados: '3,12,25,38,44' } }));
  // Euro j7 - jogador2
  parts.push(await prisma.participacao.create({ data: { dadosParticipacao: JSON.stringify({ numeros: [7,15,28,41,49] }), valorPago: 2, metodoPagamento: 'dinheiro', estadoPagamento: 'pendente', ganhador: false, jogoId: j7.id, userId: U['user-jogador2'].id, vendedorId: U['user-joao-vendedor'].id, grelhaId: g1.id, numerosSelecionados: '7,15,28,41,49' } }));
  // Euro j8 - jogador ganhou (sorteado=13)
  parts.push(await prisma.participacao.create({ data: { dadosParticipacao: JSON.stringify({ numeros: [5,10,13,30,42] }), valorPago: 2, metodoPagamento: 'saldo', estadoPagamento: 'concluido', dataPagamento: daysAgo(15), hashParticipacao: 'hash-euro-002', ganhador: true, premioEntregue: false, jogoId: j8.id, userId: U['user-jogador'].id, grelhaId: 'grelha-euro-004', numerosSelecionados: '5,10,13,30,42' } }));
  // Euro j8 - jogador2 perdeu
  parts.push(await prisma.participacao.create({ data: { dadosParticipacao: JSON.stringify({ numeros: [1,2,3,4,5] }), valorPago: 2, metodoPagamento: 'saldo', estadoPagamento: 'concluido', dataPagamento: daysAgo(14), ganhador: false, jogoId: j8.id, userId: U['user-jogador2'].id, grelhaId: 'grelha-euro-004', numerosSelecionados: '1,2,3,4,5' } }));
  console.log(`+ ${parts.length} participacoes`);

  // ── 11. NUMEROS VENDIDOS (RIFA) ──
  const numsRifa1 = [1, 2, 3, 5, 7, 10];
  for (const n of numsRifa1) {
    await prisma.numeroVendido.create({ data: { jogoId: j1.id, numero: n } });
  }
  const numsRifa2 = [1, 5, 10, 15, 20, 50, 100];
  for (const n of numsRifa2) {
    await prisma.numeroVendido.create({ data: { jogoId: j2.id, numero: n } });
  }
  console.log(`+ ${numsRifa1.length + numsRifa2.length} numeros vendidos`);

  // ── 12. TRANSAÇOES (15+) ──
  const txData = [
    { valor: 100, tipo: 'deposito' as const, descricao: 'Carregamento inicial', referencia: 'DEP-001', metodoPagamento: 'dinheiro', estado: 'concluido', userId: U['user-jogador'].id },
    { valor: 50, tipo: 'deposito' as const, descricao: 'Carregamento MBWay', referencia: 'DEP-002', metodoPagamento: 'mbway', estado: 'concluido', userId: U['user-jogador2'].id },
    { valor: -15, tipo: 'pagamento_jogo' as const, descricao: 'Pagamento rifa solidaria', referencia: 'PAY-001', metodoPagamento: 'saldo', estado: 'concluido', userId: U['user-jogador'].id },
    { valor: -10, tipo: 'pagamento_jogo' as const, descricao: 'Pagamento rifa j1', referencia: 'PAY-002', metodoPagamento: 'saldo', estado: 'concluido', userId: U['user-jogador2'].id },
    { valor: 1, tipo: 'cashback' as const, descricao: 'Cashback 10%', referencia: 'CB-001', estado: 'concluido', userId: U['user-jogador'].id },
    { valor: 5, tipo: 'comissao' as const, descricao: 'Comissao venda rifa', referencia: 'COM-001', estado: 'concluido', userId: U['user-joao-vendedor'].id },
    { valor: 3, tipo: 'comissao' as const, descricao: 'Comissao venda rifa natal', referencia: 'COM-002', estado: 'pendente', userId: U['user-carlos-vendedor'].id },
    { valor: 20, tipo: 'premio_dinheiro' as const, descricao: 'Premio raspadinha 15 EUR', referencia: 'PREMIO-001', estado: 'concluido', userId: U['user-jogador'].id },
    { valor: 150, tipo: 'premio_dinheiro' as const, descricao: 'Premio raspadinha verao 15 EUR', referencia: 'PREMIO-002', estado: 'concluido', userId: U['user-jogador'].id },
    { valor: 200, tipo: 'premio_dinheiro' as const, descricao: 'Premio euromilhoes Monte', referencia: 'PREMIO-003', estado: 'pendente', userId: U['user-jogador'].id },
    { valor: 30, tipo: 'deposito' as const, descricao: 'Carregamento vendedor', referencia: 'DEP-003', metodoPagamento: 'dinheiro', estado: 'concluido', userId: U['user-joao-vendedor'].id },
    { valor: 20, tipo: 'carregamento_saldo' as const, descricao: 'Recarga de saldo', referencia: 'REC-001', metodoPagamento: 'dinheiro', estado: 'concluido', userId: U['user-jogador3'].id },
    { valor: -2, tipo: 'pagamento_jogo' as const, descricao: 'Pagamento euromilhoes', referencia: 'PAY-003', metodoPagamento: 'saldo', estado: 'concluido', userId: U['user-jogador'].id },
    { valor: 5, tipo: 'bonus_meta' as const, descricao: 'Bonus meta vendas', referencia: 'BONUS-001', estado: 'concluido', userId: U['user-joao-vendedor'].id },
    { valor: 10, tipo: 'transferencia_vendedor_admin' as const, descricao: 'Transferencia vendedor->admin', referencia: 'TRANS-001', estado: 'concluido', userId: U['user-joao-vendedor'].id },
  ];
  for (const t of txData) await prisma.transacao.create({ data: t });
  console.log(`+ ${txData.length} transacoes`);

  // ── 13. VAULT TRANSACTIONS ──
  await prisma.vaultTransaction.create({ data: { vaultId: v1.id, tipo: 'deposito', valor: 50, descricao: 'Deposito vendas rifa', estado: 'confirmado', criadoPorId: U['user-ana-admin'].id, aprovadoPorId: U['user-ana-admin'].id, dataCriacao: daysAgo(5), dataAprovacao: daysAgo(5) } });
  await prisma.vaultTransaction.create({ data: { vaultId: v1.id, tipo: 'deposito', valor: 30, descricao: 'Deposito pendente', estado: 'pendente', criadoPorId: U['user-joao-vendedor'].id, dataCriacao: daysAgo(1) } });
  await prisma.vaultTransaction.create({ data: { vaultId: v2.id, tipo: 'deposito', valor: 20, descricao: 'Deposito Monte Alto', estado: 'confirmado', criadoPorId: U['user-carlos-vendedor'].id, aprovadoPorId: U['user-super-admin'].id, dataCriacao: daysAgo(3), dataAprovacao: daysAgo(3) } });
  await prisma.vaultTransaction.create({ data: { vaultId: v1.id, tipo: 'levantamento', valor: 25, descricao: 'Levantamento material festa', estado: 'confirmado', criadoPorId: U['user-ana-admin'].id, aprovadoPorId: U['user-super-admin'].id, dataCriacao: daysAgo(10), dataAprovacao: daysAgo(9) } });
  await prisma.vaultTransaction.create({ data: { vaultId: v2.id, tipo: 'deposito', valor: 15, descricao: 'Deposito rejeitado', estado: 'rejeitado', criadoPorId: U['user-carlos-vendedor'].id, dataCriacao: daysAgo(7) } });
  console.log('+ 5 vault transactions');

  // ── 14. CASHBOX TRANSACTIONS ──
  await prisma.vendedorCashboxTransaction.create({ data: { cashboxId: cb1.id, tipo: 'RECEBIDO_DO_JOGADOR', valor: 20, descricao: 'Recebido jogador', referencia: 'carregamento-001', criadoPorId: U['user-joao-vendedor'].id } });
  await prisma.vendedorCashboxTransaction.create({ data: { cashboxId: cb1.id, tipo: 'RECEBIDO_DO_JOGADOR', valor: 15, descricao: 'Recebido jogador 2', referencia: 'carregamento-002', criadoPorId: U['user-joao-vendedor'].id } });
  await prisma.vendedorCashboxTransaction.create({ data: { cashboxId: cb1.id, tipo: 'DEPOSITADO_NO_COFRE', valor: 30, descricao: 'Depositado no cofre', referencia: 'dep-001', criadoPorId: U['user-ana-admin'].id } });
  await prisma.vendedorCashboxTransaction.create({ data: { cashboxId: cb2.id, tipo: 'RECEBIDO_DO_JOGADOR', valor: 10, descricao: 'Recebido jogador', referencia: 'carregamento-003', criadoPorId: U['user-carlos-vendedor'].id } });
  await prisma.vendedorCashboxTransaction.create({ data: { cashboxId: cb2.id, tipo: 'DEPOSITADO_NO_COFRE', valor: 10, descricao: 'Depositado cofre', referencia: 'dep-002', criadoPorId: U['user-carlos-vendedor'].id } });
  console.log('+ 5 cashbox transactions');

  // ── 15. PEDIDOS DEPOSITO COFRE (5) ──
  await prisma.pedidoDepositoCofre.create({ data: { id: 'dep-pend-001', vendedorId: U['user-joao-vendedor'].id, aldeiaId: a1.id, valor: 20, descricao: 'Deposito pendente', estado: 'pendente', criadoPorId: U['user-joao-vendedor'].id } });
  await prisma.pedidoDepositoCofre.create({ data: { id: 'dep-conf-001', vendedorId: U['user-joao-vendedor'].id, aldeiaId: a1.id, valor: 30, descricao: 'Deposito confirmado', estado: 'confirmado', criadoPorId: U['user-joao-vendedor'].id, confirmadoPorId: U['user-ana-admin'].id, confirmadoAt: daysAgo(1), observacoes: 'Valor conferido' } });
  await prisma.pedidoDepositoCofre.create({ data: { id: 'dep-rej-001', vendedorId: U['user-joao-vendedor'].id, aldeiaId: a1.id, valor: 100, descricao: 'Valor incorreto', estado: 'rejeitado', criadoPorId: U['user-joao-vendedor'].id, rejeitadoPorId: U['user-ana-admin'].id, motivoRejeicao: 'Valor nao confere' } });
  await prisma.pedidoDepositoCofre.create({ data: { id: 'dep-conf-002', vendedorId: U['user-carlos-vendedor'].id, aldeiaId: a2.id, valor: 15, descricao: 'Deposito Monte Alto', estado: 'confirmado', criadoPorId: U['user-carlos-vendedor'].id, confirmadoPorId: U['user-super-admin'].id, confirmadoAt: daysAgo(2) } });
  await prisma.pedidoDepositoCofre.create({ data: { id: 'dep-pend-002', vendedorId: U['user-carlos-vendedor'].id, aldeiaId: a2.id, valor: 10, descricao: 'Deposito pendente Monte Alto', estado: 'pendente', criadoPorId: U['user-carlos-vendedor'].id } });
  console.log('+ 5 pedidos deposito cofre');

  // ── 16. PEDIDOS CARREGAMENTO (6) ──
  await prisma.pedidoCarregamento.create({ data: { id: 'carreg-pend-001', userId: U['user-jogador'].id, vendedorId: U['user-joao-vendedor'].id, aldeiaId: a1.id, valor: 20, estado: 'pendente', metodoPagamento: 'dinheiro', metodoValidacao: 'password', passwordOneTime: 'TEMP123', expiresAt: daysFromNow(1), pagamentoConfirmado: false, requerAutorizacao: false, autorizado: false } });
  await prisma.pedidoCarregamento.create({ data: { id: 'carreg-conf-001', userId: U['user-jogador2'].id, vendedorId: U['user-joao-vendedor'].id, aldeiaId: a1.id, valor: 30, estado: 'confirmado', metodoPagamento: 'dinheiro', metodoValidacao: 'qr_code', qrCodeData: 'qr-001', pagamentoConfirmado: true, confirmadoPorId: U['user-joao-vendedor'].id, confirmadoAt: daysAgo(1), requerAutorizacao: false, autorizado: true, autorizadoPorId: U['user-ana-admin'].id, autorizadoAt: daysAgo(1), notificadoJogador: true, notificadoVendedor: true, notificadoAdmin: true } });
  await prisma.pedidoCarregamento.create({ data: { id: 'carreg-cancel-001', userId: U['user-jogador'].id, vendedorId: U['user-joao-vendedor'].id, aldeiaId: a1.id, valor: 100, estado: 'cancelado', metodoPagamento: 'dinheiro', pagamentoConfirmado: false, requerAutorizacao: true, autorizado: false, motivoRejeicao: 'Valor excede limite', observacoes: 'Contactar admin', notificadoJogador: true, notificadoVendedor: true } });
  await prisma.pedidoCarregamento.create({ data: { id: 'carreg-pend-002', userId: U['user-jogador3'].id, vendedorId: U['user-carlos-vendedor'].id, aldeiaId: a2.id, valor: 10, estado: 'pendente', metodoPagamento: 'dinheiro', pagamentoConfirmado: false, requerAutorizacao: false, autorizado: false } });
  await prisma.pedidoCarregamento.create({ data: { id: 'carreg-exp-001', userId: U['user-jogador2'].id, vendedorId: U['user-carlos-vendedor'].id, aldeiaId: a2.id, valor: 15, estado: 'expirado', metodoPagamento: 'dinheiro', expiresAt: daysAgo(2), pagamentoConfirmado: false, requerAutorizacao: false, autorizado: false } });
  await prisma.pedidoCarregamento.create({ data: { id: 'carreg-conf-002', userId: U['user-jogador3'].id, vendedorId: U['user-joao-vendedor'].id, aldeiaId: a1.id, valor: 20, estado: 'confirmado', metodoPagamento: 'dinheiro', pagamentoConfirmado: true, confirmadoPorId: U['user-joao-vendedor'].id, confirmadoAt: daysAgo(3), requerAutorizacao: false, autorizado: true, autorizadoPorId: U['user-ana-admin'].id, autorizadoAt: daysAgo(3), notificadoJogador: true, notificadoVendedor: true } });
  console.log('+ 6 pedidos carregamento');

  // ── 17. SORTIOS + VENCEDORES ──
  const sort1 = await prisma.sorteio.create({ data: { seed: 'seed-rifa-001', hash: 'hash-rifa-001', resultado: JSON.stringify({ numeros: [1,50,100], vencedor: null }), observacoes: 'Sorteio rifa natal', jogoId: j2.id, fase: 'concluido' } });
  await prisma.sorteio.create({ data: { seed: 'seed-poio-001', hash: 'hash-poio-001', resultado: JSON.stringify({ numero: 42 }), observacoes: 'Sorteio poio serra', jogoId: j6.id, fase: 'concluido' } });
  await prisma.sorteio.create({ data: { seed: 'seed-euro-001', hash: 'hash-euro-001', resultado: JSON.stringify({ numero: 13 }), observacoes: 'Sorteio euromilhoes Monte', jogoId: j8.id, fase: 'concluido' } });
  console.log('+ 3 sorteios');

  // ── 18. NOTIFICACOES (15) ──
  const notifData = [
    { tipo: 'sistema' as TipoNotificacao, titulo: 'Bem-vindo!', mensagem: 'Obrigado por juntares.', userId: U['user-jogador'].id, lida: true },
    { tipo: 'pagamento' as TipoNotificacao, titulo: 'Pagamento Confirmado', mensagem: 'Participacao na rifa confirmada.', userId: U['user-jogador'].id, lida: true },
    { tipo: 'premio' as TipoNotificacao, titulo: 'Premio!', mensagem: 'Ganhaste na raspadinha!', userId: U['user-jogador'].id, lida: false },
    { tipo: 'sistema' as TipoNotificacao, titulo: 'Novo jogo disponivel', mensagem: 'Raspadinha de verao ja esta aberta!', userId: U['user-jogador'].id, lida: false },
    { tipo: 'deposito_criado' as TipoNotificacao, titulo: 'Deposito solicitado', mensagem: 'Novo deposito de 20 EUR pendente.', userId: U['user-ana-admin'].id, lida: false },
    { tipo: 'deposito_confirmado' as TipoNotificacao, titulo: 'Deposito confirmado', mensagem: 'Deposito de 30 EUR confirmado.', userId: U['user-joao-vendedor'].id, lida: true },
    { tipo: 'deposito_rejeitado' as TipoNotificacao, titulo: 'Deposito rejeitado', mensagem: 'Deposito de 100 EUR rejeitado.', userId: U['user-joao-vendedor'].id, lida: false },
    { tipo: 'alerta' as TipoNotificacao, titulo: 'Stock baixo', mensagem: 'Raspadinha de verao com stock baixo!', userId: U['user-ana-admin'].id, lida: false },
    { tipo: 'sistema' as TipoNotificacao, titulo: 'Atualizacao', mensagem: 'Plataforma atualizada para v3.12.', userId: U['user-super-admin'].id, lida: true },
    { tipo: 'pagamento' as TipoNotificacao, titulo: 'Pagamento pendente', mensagem: 'Tens pagamentos por confirmar.', userId: U['user-joao-vendedor'].id, lida: false },
    { tipo: 'sistema' as TipoNotificacao, titulo: 'Bem-vindo!', mensagem: 'Conta criada com sucesso.', userId: U['user-jogador2'].id, lida: true },
    { tipo: 'premio' as TipoNotificacao, titulo: 'Premioreclamado', mensagem: 'Premio de 15 EUR creditado.', userId: U['user-jogador'].id, lida: true },
    { tipo: 'sistema' as TipoNotificacao, titulo: 'Lembrete', mensagem: 'Tens raspadinhas por revelar.', userId: U['user-jogador3'].id, lida: false },
    { tipo: 'campanha' as TipoNotificacao, titulo: 'Promocao!', mensagem: 'Raspadinha de verao com desconto.', userId: U['user-jogador'].id, lida: false },
    { tipo: 'pagamento' as TipoNotificacao, titulo: 'Carregamento efetuado', mensagem: 'Saldo creditado com sucesso.', userId: U['user-jogador3'].id, lida: true },
  ];
  for (const n of notifData) await prisma.notificacao.create({ data: n });
  console.log(`+ ${notifData.length} notificacoes`);

  // ── 19. AUDIT LOGS (15) ──
  const auditData = [
    { userId: U['user-joao-vendedor'].id, aldeiaId: a1.id, action: 'deposito_criado', resource: 'PedidoDepositoCofre', ip: '192.168.1.100', metadata: JSON.stringify({ valor: 20 }) },
    { userId: U['user-ana-admin'].id, aldeiaId: a1.id, action: 'deposito_confirmado', resource: 'PedidoDepositoCofre', ip: '192.168.1.50', metadata: JSON.stringify({ valor: 30 }) },
    { userId: U['user-ana-admin'].id, aldeiaId: a1.id, action: 'deposito_rejeitado', resource: 'PedidoDepositoCofre', ip: '192.168.1.50', metadata: JSON.stringify({ valor: 100 }) },
    { userId: U['user-super-admin'].id, action: 'sorteio.executado', resource: 'Sorteio', resourceId: sort1.id, ip: '10.0.0.1', metadata: JSON.stringify({ jogoId: j2.id }) },
    { userId: U['user-jogador'].id, action: 'participacao.criada', resource: 'Participacao', ip: '192.168.2.10', metadata: JSON.stringify({ jogoTipo: 'rifa' }) },
    { userId: U['user-jogador'].id, action: 'claim.premio', resource: 'Participacao', ip: '192.168.2.10', metadata: JSON.stringify({ valor: 20 }) },
    { userId: U['user-ana-admin'].id, aldeiaId: a1.id, action: 'jogo.criado', resource: 'Jogo', resourceId: j5.id, ip: '192.168.1.50', metadata: JSON.stringify({ tipo: 'poio_da_vaca' }) },
    { userId: U['user-ana-admin'].id, aldeiaId: a1.id, action: 'jogo.fechado', resource: 'Jogo', resourceId: j6.id, ip: '192.168.1.50', metadata: JSON.stringify({ sorteado: 42 }) },
    { userId: U['user-joao-vendedor'].id, aldeiaId: a1.id, action: 'carregamento.solicitado', resource: 'PedidoCarregamento', ip: '192.168.1.100', metadata: JSON.stringify({ valor: 20 }) },
    { userId: U['user-carlos-vendedor'].id, aldeiaId: a2.id, action: 'deposito_criado', resource: 'PedidoDepositoCofre', ip: '192.168.1.200', metadata: JSON.stringify({ valor: 15 }) },
    { userId: U['user-super-admin'].id, action: 'user.login', resource: 'User', ip: '10.0.0.1', metadata: JSON.stringify({ email: 'admin@aldeias.pt' }) },
    { userId: U['user-ana-admin'].id, aldeiaId: a1.id, action: 'evento.criado', resource: 'Evento', ip: '192.168.1.50', metadata: JSON.stringify({ nome: 'Festa do Povo' }) },
    { userId: U['user-jogador'].id, action: 'jogo.visualizado', resource: 'Jogo', ip: '192.168.2.10', metadata: JSON.stringify({ jogoId: j7.id }) },
    { userId: U['user-super-admin'].id, action: 'levantamento.solicitado', resource: 'VaultTransaction', ip: '10.0.0.1', metadata: JSON.stringify({ valor: 25 }) },
    { userId: U['user-joao-vendedor'].id, aldeiaId: a1.id, action: 'venda.executada', resource: 'Venda', ip: '192.168.1.100', metadata: JSON.stringify({ valor: 5 }) },
  ];
  for (const a of auditData) await prisma.auditLog.create({ data: a });
  console.log(`+ ${auditData.length} audit logs`);

  // ── 20. LOGS ACESSO (10) ──
  const logData = [
    { userId: U['user-super-admin'].id, email: 'admin@aldeias.pt', sucesso: true, ip: '10.0.0.1', userAgent: 'Chrome/120' },
    { userId: U['user-ana-admin'].id, email: 'admin.valeazenha@gmail.com', sucesso: true, ip: '192.168.1.50', userAgent: 'Firefox/121' },
    { userId: U['user-joao-vendedor'].id, email: 'vendedor@gmail.com', sucesso: true, ip: '192.168.1.100', userAgent: 'Chrome/120' },
    { userId: U['user-jogador'].id, email: 'jogador@gmail.com', sucesso: true, ip: '192.168.2.10', userAgent: 'Safari/17' },
    { userId: U['user-jogador2'].id, email: 'pedro@gmail.com', sucesso: true, ip: '192.168.2.20', userAgent: 'Chrome/120' },
    { email: 'hacker@evil.com', sucesso: false, ip: '203.0.113.50', userAgent: 'curl/7.68', motivo: 'Credenciais invalidas' },
    { email: 'hacker@evil.com', sucesso: false, ip: '203.0.113.50', userAgent: 'curl/7.68', motivo: 'Credenciais invalidas' },
    { email: 'admin@aldeias.pt', sucesso: false, ip: '203.0.113.99', userAgent: 'Chrome/120', motivo: 'Password incorreta' },
    { userId: U['user-carlos-vendedor'].id, email: 'carlos@montealto.pt', sucesso: true, ip: '192.168.1.200', userAgent: 'Chrome/120' },
    { userId: U['user-jogador3'].id, email: 'rita@anonimo.pt', sucesso: true, ip: '192.168.3.10', userAgent: 'Mobile Safari' },
  ];
  for (const l of logData) await prisma.logAcesso.create({ data: l });
  console.log(`+ ${logData.length} logs acesso`);

  // ── 21. GAMIFICACAO ──
  await prisma.gamificacaoEvento.create({ data: { tipo: 'participacao', pontos: 10, descricao: 'Participar num jogo' } });
  await prisma.gamificacaoEvento.create({ data: { tipo: 'vitoria', pontos: 50, descricao: 'Ganhar um premio' } });
  await prisma.gamificacaoEvento.create({ data: { tipo: 'compartilhamento', pontos: 5, descricao: 'Partilhar nas redes' } });
  await prisma.gamificacaoEvento.create({ data: { tipo: 'convite_vendedor', pontos: 20, descricao: 'Convidar vendedor' } });
  await prisma.gamificacaoEvento.create({ data: { tipo: 'primeira_compra', pontos: 15, descricao: 'Primeira compra na plataforma' } });
  console.log('+ 5 gamificacao eventos');

  // ── 22. BADGES + USER BADGES ──
  const badgeDefs = [
    { id: 'badge-1part', nome: 'Primeira Participacao', descricao: 'Primeira participacao', criterio: 'primeira_participacao', pontos: 10 },
    { id: 'badge-10part', nome: 'Veterano', descricao: '10+ participacoes', criterio: 'participacoes_10', pontos: 50, raro: true },
    { id: 'badge-win', nome: 'Vencedor', descricao: 'Ganhou premio', criterio: 'ganhou_premio', pontos: 100, raro: true },
    { id: 'badge-early', nome: 'Early Adopter', descricao: 'Primeiro mes', criterio: 'primeiro_mes', pontos: 200, raro: true },
    { id: 'badge-social', nome: 'Social Butterfly', descricao: '10 compartilhamentos', criterio: 'compartilhamentos_10', pontos: 30 },
  ];
  for (const b of badgeDefs) await prisma.badge.create({ data: b });
  await prisma.userBadge.create({ data: { userId: U['user-jogador'].id, badgeId: 'badge-1part' } });
  await prisma.userBadge.create({ data: { userId: U['user-jogador'].id, badgeId: 'badge-win' } });
  await prisma.userBadge.create({ data: { userId: U['user-jogador'].id, badgeId: 'badge-early' } });
  await prisma.userBadge.create({ data: { userId: U['user-jogador2'].id, badgeId: 'badge-1part' } });
  await prisma.userBadge.create({ data: { userId: U['user-jogador3'].id, badgeId: 'badge-1part' } });
  console.log(`+ ${badgeDefs.length} badges, 5 user-badges`);

  // ── 23. CONSENTIMENTOS ──
  await prisma.consentimento.create({ data: { tipo: 'cookies', concedeu: true, userId: U['user-jogador'].id, ip: '192.168.2.10' } });
  await prisma.consentimento.create({ data: { tipo: 'dados_pessoais', concedeu: true, userId: U['user-jogador'].id, ip: '192.168.2.10' } });
  await prisma.consentimento.create({ data: { tipo: 'cookies', concedeu: false, userId: U['user-jogador2'].id, ip: '192.168.2.20' } });
  await prisma.consentimento.create({ data: { tipo: 'marketing', concedeu: true, userId: U['user-jogador3'].id, ip: '192.168.3.10' } });
  console.log('+ 4 consentimentos');

  // ── 24. DIREITO ESQUECIMENTO ──
  await prisma.direitoEsquecimento.create({ data: { userId: U['user-jogador3'].id, estado: 'pendente', notas: 'Pedido de eliminacao de dados' } });
  console.log('+ 1 direito esquecimento');

  // ── 25. COMISSOES + VENDAS + ENTREGAS ──
  await prisma.comissao.create({ data: { id: 'com-001', vendedorId: U['user-joao-vendedor'].id, percentual: 10, metaVendas: 500, bonusMeta: 25, aldeiaId: a1.id } });
  await prisma.comissao.create({ data: { id: 'com-002', vendedorId: U['user-carlos-vendedor'].id, percentual: 8, metaVendas: 300, bonusMeta: 15, aldeiaId: a2.id } });
  await prisma.venda.create({ data: { id: 'venda-001', valor: 15, comissao: 1.5, metodoPagamento: 'dinheiro', dadosCliente: JSON.stringify({ nome: 'Maria' }), vendedorId: U['user-joao-vendedor'].id } });
  await prisma.venda.create({ data: { id: 'venda-002', valor: 12, comissao: 0.96, metodoPagamento: 'dinheiro', dadosCliente: JSON.stringify({ nome: 'Anonimo' }), vendedorId: U['user-carlos-vendedor'].id } });
  await prisma.entregaSaldo.create({ data: { id: 'entrega-001', vendedorId: U['user-joao-vendedor'].id, adminId: U['user-ana-admin'].id, aldeiaId: a1.id, valor: 30, estado: 'concluido', dataSolicitacao: daysAgo(3), dataConfirmacao: daysAgo(2), dataConclusao: daysAgo(2), observacoes: 'Entrega rifa' } });
  await prisma.entregaSaldo.create({ data: { id: 'entrega-002', vendedorId: U['user-carlos-vendedor'].id, adminId: U['user-super-admin'].id, aldeiaId: a2.id, valor: 10, estado: 'solicitado', dataSolicitacao: daysAgo(1) } });
  console.log('+ 2 comissoes, 2 vendas, 2 entregas');

  // ── 26. GAME ANALYTICS ──
  await prisma.gameAnalytics.create({ data: { type: 'game_view', gameId: j1.id, gameType: 'rifa', source: 'pagina_jogos', description: 'View rifa', aldeiaId: a1.id, userId: U['user-jogador'].id, sessionId: 's-001' } });
  await prisma.gameAnalytics.create({ data: { type: 'payment_success', gameId: j1.id, gameType: 'rifa', method: 'saldo', amount: 15, description: 'Pagamento rifa', aldeiaId: a1.id, userId: U['user-jogador'].id, sessionId: 's-001' } });
  await prisma.gameAnalytics.create({ data: { type: 'game_view', gameId: j7.id, gameType: 'euromilhoes', source: 'pagina_jogos', description: 'View euro', aldeiaId: a1.id, userId: U['user-jogador'].id, sessionId: 's-002' } });
  await prisma.gameAnalytics.create({ data: { type: 'scratch_reveal', gameId: j3.id, gameType: 'raspadinha', description: 'Revelar raspadinha', won: true, prizeValue: 2, aldeiaId: a2.id, userId: U['user-jogador'].id, sessionId: 's-003' } });
  await prisma.gameAnalytics.create({ data: { type: 'participation_start', gameId: j5.id, gameType: 'poio_da_vaca', source: 'jogo_detalhe', aldeiaId: a1.id, userId: U['user-jogador'].id, sessionId: 's-004' } });
  console.log('+ 5 game analytics');

  // ── 27. PUSH SUBSCRIPTIONS ──
  await prisma.pushSubscription.create({ data: { endpoint: 'https://fcm.googleapis.com/push/test-001', p256dh: 'test-key-001', auth: 'auth-001', userId: U['user-jogador'].id } });
  await prisma.pushSubscription.create({ data: { endpoint: 'https://fcm.googleapis.com/push/test-002', p256dh: 'test-key-002', auth: 'auth-002', userId: U['user-jogador2'].id } });
  console.log('+ 2 push subscriptions');

  // ── RESUMO ──
  console.log('\n' + '='.repeat(45));
  console.log('RESUMO SEED v3.12.0');
  console.log('='.repeat(45));
  console.log('Aldeias:             3');
  console.log('Eventos:             6');
  console.log('Jogos:               8 (2rifa,2rasp,2poio,2euro)');
  console.log('Utilizadores:        7');
  console.log('Participacoes:       20');
  console.log('Premios:             10');
  console.log('Transacoes:         15');
  console.log('Numeros Vendidos:   13');
  console.log('Vault Transactions:  5');
  console.log('Cashbox Trans:       5');
  console.log('Depositos Cofre:     5');
  console.log('Carregamentos:       6');
  console.log('Sorteios:            3');
  console.log('Notificacoes:       15');
  console.log('Audit Logs:         15');
  console.log('Logs Acesso:        10');
  console.log('Badges:              5 + 5 user-badges');
  console.log('Game Analytics:      5');
  console.log('Consentimentos:      4');
  console.log('='.repeat(45));
  console.log('\nCredenciais:');
  console.log('  admin@aldeias.pt / 123456 (super_admin)');
  console.log('  admin.valeazenha@gmail.com / 123456 (aldeia_admin)');
  console.log('  vendedor@gmail.com / 123456 (vendedor)');
  console.log('  carlos@montealto.pt / 123456 (vendedor)');
  console.log('  jogador@gmail.com / 123456 (user)');
  console.log('  pedro@gmail.com / 123456 (user)');
  console.log('  rita@anonimo.pt / 123456 (user)');
  console.log('\nSEED COMPLETO!');
}

main()
  .catch((e) => { console.error('Erro no seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
