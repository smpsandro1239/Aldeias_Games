import { PrismaClient, UserRole, EstadoJogo, MetodoPagamento, EstadoPagamento, PermissionKey, RoleName } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando Seed Completo e Exaustivo...');

  // 1. Limpar base de dados
  await prisma.transacao.deleteMany();
  await prisma.participacao.deleteMany();
  await prisma.numeroVendido.deleteMany();
  await prisma.premio.deleteMany();
  await prisma.jogo.deleteMany();
  await prisma.evento.deleteMany();
  await prisma.userGlobalRole.deleteMany();
  await prisma.userAldeiaRole.deleteMany();
  await prisma.notificacao.deleteMany();
  await prisma.user.deleteMany();
  await prisma.aldeia.deleteMany();
  await prisma.plano.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();

  console.log('🧹 Base de dados limpa');

  // 2. Criar Permissões (Matriz Completa)
  const permissions = Object.values(PermissionKey).map(key => ({
    key,
    description: `Permissão para ${key.toLowerCase().replace('_', ' ')}`
  }));

  const createdPerms: Record<string, any> = {};
  for (const p of permissions) {
    createdPerms[p.key] = await prisma.permission.create({ data: p });
  }

  const roles = [
    { name: RoleName.SUPER_ADMIN, description: 'Admin Total', permissions: Object.values(PermissionKey) },
    { name: RoleName.ALDEIA_ADMIN, description: 'Admin Org', permissions: [
      PermissionKey.VIEW_ALDEIA, PermissionKey.MANAGE_ALDEIA, PermissionKey.VIEW_EVENTO,
      PermissionKey.CREATE_EVENTO, PermissionKey.EDIT_EVENTO, PermissionKey.VIEW_JOGO,
      PermissionKey.CREATE_JOGO, PermissionKey.EDIT_JOGO, PermissionKey.MANAGE_PREMIOS,
      PermissionKey.VIEW_VENDEDORES, PermissionKey.MANAGE_VENDEDORES, PermissionKey.VIEW_VENDAS
    ]},
    { name: RoleName.GESTOR, description: 'Vendedor Plus', permissions: [
      PermissionKey.VIEW_EVENTO, PermissionKey.VIEW_JOGO, PermissionKey.EXECUTE_VENDA, PermissionKey.VIEW_VENDAS
    ]},
    { name: RoleName.VIEWER, description: 'Visitante', permissions: [PermissionKey.VIEW_EVENTO, PermissionKey.VIEW_JOGO] },
  ];

  const createdRoles: Record<string, any> = {};
  for (const r of roles) {
    const role = await prisma.role.create({ data: { name: r.name, description: r.description } });
    createdRoles[r.name] = role;
    for (const pk of r.permissions) {
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: createdPerms[pk].id }
      });
    }
  }

  // 3. Planos
  await prisma.plano.create({ data: { id: 'plano-pro', nome: 'Premium', precoMensal: 29.99, maxEventos: 100, maxJogos: 500, maxParticipacoes: 100000, maxVendedores: 200 } });

  const pass = await bcrypt.hash('123456', 10);

  // 4. Aldeias
  const aldeia1 = await prisma.aldeia.create({
    data: {
      nome: 'Vale a Zinha', slug: 'vale-a-zinha', tipoOrganizacao: 'aldeia', localidade: 'Viseu', email: 'geral@valeazinha.pt',
      ativo: true, verificado: true, planoId: 'plano-pro', metodosPagamentoDefault: '["saldo", "dinheiro", "mbway", "stripe"]'
    }
  });

  const aldeia2 = await prisma.aldeia.create({
    data: {
      nome: 'Escola Primária de Aveiro', slug: 'escola-aveiro', tipoOrganizacao: 'escola', localidade: 'Aveiro', email: 'direcao@escola-aveiro.pt',
      ativo: true, verificado: true, planoId: 'plano-pro', metodosPagamentoDefault: '["saldo", "dinheiro"]'
    }
  });

  // 5. Utilizadores por Role
  const users = [
    { email: 'admin@aldeias.pt', role: UserRole.super_admin, nome: 'Sandro Admin', globalRole: RoleName.SUPER_ADMIN },
    { email: 'admin.valeazinha@aldeias.pt', role: UserRole.aldeia_admin, nome: 'Ricardo Org', globalRole: RoleName.ALDEIA_ADMIN, aldeiaId: aldeia1.id },
    { email: 'vendedor1@valeazinha.pt', role: UserRole.vendedor, nome: 'João POS', globalRole: RoleName.GESTOR, aldeiaId: aldeia1.id },
    { email: 'jogador1@valeazinha.pt', role: UserRole.user, nome: 'Maria Sorte', globalRole: RoleName.VIEWER, aldeiaId: aldeia1.id },
    { email: 'jogador2@escola.pt', role: UserRole.user, nome: 'Pedro Aluno', globalRole: RoleName.VIEWER, aldeiaId: aldeia2.id },
  ];

  const dbUsers: Record<string, any> = {};
  for (const u of users) {
    const user = await prisma.user.create({
      data: { email: u.email, password: pass, nome: u.nome, role: u.role, aldeiaId: u.aldeiaId, emailVerificado: true, saldo: 1000.0 }
    });
    dbUsers[u.email] = user;
    await prisma.userGlobalRole.create({ data: { userId: user.id, roleId: createdRoles[u.globalRole].id } });
    if (u.aldeiaId) await prisma.userAldeiaRole.create({ data: { userId: user.id, roleId: createdRoles[u.globalRole].id, aldeiaId: u.aldeiaId } });
  }

  // 6. Eventos e Jogos (Full Portfolio)
  const ev1 = await prisma.evento.create({
    data: { nome: 'Festa de Verão 2026', slug: 'festa-26', aldeiaId: aldeia1.id, estado: 'ativo', publico: true, dataInicio: new Date(), dataFim: new Date(Date.now() + 10e9) }
  });

  // Jogo: Rifa
  const rifa = await prisma.jogo.create({
    data: {
      nome: 'Rifa Cabaz Natal', tipo: 'rifa', preco: 2.0, stockInicial: 200, stockAtual: 195, estado: EstadoJogo.aberto,
      eventoId: ev1.id, aldeiaId: aldeia1.id, configuracao: '{"numeroInicial":1,"numeroFinal":200}'
    }
  });

  // Jogo: Tombola
  const tombola = await prisma.jogo.create({
    data: {
      nome: 'Tombola Escolar', tipo: 'tombola', preco: 5.0, stockInicial: 50, stockAtual: 40, estado: EstadoJogo.aberto,
      eventoId: ev1.id, aldeiaId: aldeia1.id, configuracao: '{"numeroInicial":1,"numeroFinal":50}'
    }
  });

  // Jogo: Poio da Vaca
  const poio = await prisma.jogo.create({
    data: {
      nome: 'O Poio da Vaca 2026', tipo: 'poio_da_vaca', preco: 10.0, stockInicial: 100, stockAtual: 90, estado: EstadoJogo.aberto,
      eventoId: ev1.id, aldeiaId: aldeia1.id, configuracao: '{"letras":["A","B","C","D","E","F","G","H","I","J"],"numerosPorLetra":10}',
      dimensoesCampo: '{"x":10,"y":10,"total":100}', custoQuadrado: 10.0
    }
  });

  // Jogo: Raspadinha
  const rasp = await prisma.jogo.create({
    data: {
      nome: 'Raspadinha Aldeia Viva', tipo: 'raspadinha', preco: 1.5, stockInicial: 1000, stockAtual: 850, estado: EstadoJogo.aberto,
      eventoId: ev1.id, aldeiaId: aldeia1.id, configuracao: '{"premios":[{"nome":"Presunto","valorDinheiroAlternative":60,"percentagem":0.5,"convertivelSaldo":true},{"nome":"10€","valorDinheiroAlternative":10,"percentagem":2,"convertivelSaldo":true},{"nome":"1.5€","valorDinheiroAlternative":1.5,"percentagem":10,"convertivelSaldo":true}]}'
    }
  });

  // 7. Participações em Massa e Estados Diversos
  const player = dbUsers['jogador1@valeazinha.pt'];

  // Rifa (Paga)
  await prisma.participacao.create({
    data: { jogoId: rifa.id, userId: player.id, valorPago: 4.0, metodoPagamento: MetodoPagamento.saldo, estadoPagamento: EstadoPagamento.concluido, dataPagamento: new Date(), dadosParticipacao: '{"numeros":[7, 12]}' }
  });

  // Raspadinha (Revelada e Vencedora)
  await prisma.participacao.create({
    data: {
      jogoId: rasp.id, userId: player.id, valorPago: 1.5, metodoPagamento: MetodoPagamento.saldo, estadoPagamento: EstadoPagamento.concluido,
      revelado: true, dataRevelacao: new Date(), ganhador: true, resultadoRaspe: 'Presunto',
      dadosParticipacao: '{"grid":[],"hasWin":true,"result":"Presunto"}'
    }
  });

  // Poio da Vaca (Vários quadrados)
  await prisma.participacao.create({
    data: {
      jogoId: poio.id, userId: player.id, valorPago: 30.0, metodoPagamento: MetodoPagamento.dinheiro, estadoPagamento: EstadoPagamento.concluido,
      dadosParticipacao: '{"coordenadas":[{"letra":"A","numero":1},{"letra":"B","numero":2},{"letra":"C","numero":3}]}'
    }
  });

  // 8. Transações e Notificações
  await prisma.transacao.create({ data: { userId: player.id, valor: 50.0, tipo: 'carregamento_saldo', descricao: 'Carregamento inicial' } });
  await prisma.notificacao.create({ data: { userId: player.id, titulo: 'Bem-vindo!', mensagem: 'A sua conta está pronta.', tipo: 'sistema' } });

  console.log('✅ Seed exaustivo concluído com sucesso!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
