import { PrismaClient, UserRole, EstadoJogo, MetodoPagamento, EstadoPagamento, PermissionKey, RoleName } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando Seed Completo...');

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

  // 2. Criar Permissões
  const permissions = [
    { key: PermissionKey.VIEW_ALDEIA, description: 'Ver detalhes da aldeia' },
    { key: PermissionKey.MANAGE_ALDEIA, description: 'Gerir aldeia' },
    { key: PermissionKey.VIEW_EVENTO, description: 'Ver eventos' },
    { key: PermissionKey.CREATE_EVENTO, description: 'Criar eventos' },
    { key: PermissionKey.VIEW_JOGO, description: 'Ver jogos' },
    { key: PermissionKey.CREATE_JOGO, description: 'Criar jogos' },
    { key: PermissionKey.EXECUTE_VENDA, description: 'Executar vendas no POS' },
    { key: PermissionKey.VIEW_VENDAS, description: 'Ver histórico de vendas' },
    { key: PermissionKey.MANAGE_VENDEDORES, description: 'Gerir vendedores' },
  ];

  const createdPerms: Record<string, any> = {};
  for (const p of permissions) {
    createdPerms[p.key] = await prisma.permission.create({ data: p });
  }

  const roles = [
    { name: RoleName.SUPER_ADMIN, description: 'Administrador Global', permissions: permissions.map(p => p.key) },
    { name: RoleName.ALDEIA_ADMIN, description: 'Admin de Organização', permissions: [PermissionKey.VIEW_ALDEIA, PermissionKey.VIEW_EVENTO, PermissionKey.CREATE_EVENTO, PermissionKey.VIEW_JOGO, PermissionKey.CREATE_JOGO, PermissionKey.MANAGE_VENDEDORES, PermissionKey.VIEW_VENDAS] },
    { name: RoleName.GESTOR, description: 'Vendedor / POS', permissions: [PermissionKey.VIEW_EVENTO, PermissionKey.VIEW_JOGO, PermissionKey.EXECUTE_VENDA, PermissionKey.VIEW_VENDAS] },
    { name: RoleName.VIEWER, description: 'Utilizador Final', permissions: [PermissionKey.VIEW_EVENTO, PermissionKey.VIEW_JOGO] },
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
  console.log('✅ RBAC configurado');

  // 3. Criar Planos
  await prisma.plano.create({ data: { id: 'plano-pro', nome: 'Premium', precoMensal: 29.99, maxEventos: 50, maxJogos: 200, maxParticipacoes: 50000, maxVendedores: 100 } });
  console.log('✅ Planos criados');

  const pass = await bcrypt.hash('123456', 10);

  // 4. Criar Aldeia e Utilizadores
  const aldeia1 = await prisma.aldeia.create({
    data: {
      nome: 'Vale a Zinha', slug: 'vale-a-zinha', tipoOrganizacao: 'aldeia', localidade: 'Viseu', email: 'geral@valeazinha.pt',
      ativo: true, verificado: true, planoId: 'plano-pro', metodosPagamentoDefault: '["saldo", "dinheiro", "mbway", "stripe"]'
    }
  });

  const userData = [
    { email: 'admin@aldeias.pt', role: UserRole.super_admin, nome: 'Admin Global', globalRole: RoleName.SUPER_ADMIN },
    { email: 'admin.valeazinha@aldeias.pt', role: UserRole.aldeia_admin, nome: 'Admin Vale a Zinha', globalRole: RoleName.ALDEIA_ADMIN, aldeiaId: aldeia1.id },
    { email: 'vendedor1@valeazinha.pt', role: UserRole.vendedor, nome: 'João Vendedor', globalRole: RoleName.GESTOR, aldeiaId: aldeia1.id },
    { email: 'jogador1@valeazinha.pt', role: UserRole.user, nome: 'Maria Jogadora', globalRole: RoleName.VIEWER, aldeiaId: aldeia1.id },
  ];

  const users: any[] = [];
  for (const u of userData) {
    const user = await prisma.user.create({
      data: { email: u.email, password: pass, nome: u.nome, role: u.role, aldeiaId: u.aldeiaId, emailVerificado: true, saldo: 500.0 }
    });
    users.push(user);
    await prisma.userGlobalRole.create({ data: { userId: user.id, roleId: createdRoles[u.globalRole].id } });
    if (u.aldeiaId) await prisma.userAldeiaRole.create({ data: { userId: user.id, roleId: createdRoles[u.globalRole].id, aldeiaId: u.aldeiaId } });
  }

  // 5. Criar Evento e Jogos
  const ev = await prisma.evento.create({
    data: { nome: 'Festa Popular 2026', slug: 'festa-2026', aldeiaId: aldeia1.id, estado: 'ativo', publico: true, dataInicio: new Date(), dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
  });

  const rifa = await prisma.jogo.create({
    data: { nome: 'Rifa Cabaz', tipo: 'rifa', preco: 2.0, stockInicial: 100, stockAtual: 100, estado: EstadoJogo.aberto, eventoId: ev.id, aldeiaId: aldeia1.id, configuracao: '{"numeroInicial":1,"numeroFinal":100}' }
  });

  const poio = await prisma.jogo.create({
    data: {
      nome: 'Poio da Vaca', tipo: 'poio_da_vaca', preco: 10.0, stockInicial: 100, stockAtual: 100, estado: EstadoJogo.aberto, eventoId: ev.id, aldeiaId: aldeia1.id,
      configuracao: '{"letras":["A","B","C","D","E","F","G","H","I","J"],"numerosPorLetra":10}', dimensoesCampo: '{"x":10,"y":10,"total":100}', custoQuadrado: 10.0
    }
  });

  const rasp = await prisma.jogo.create({
    data: {
      nome: 'Raspadinha Sorte', tipo: 'raspadinha', preco: 1.0, stockInicial: 1000, stockAtual: 1000, estado: EstadoJogo.aberto, eventoId: ev.id, aldeiaId: aldeia1.id,
      configuracao: '{"premios":[{"nome":"Presunto","valorDinheiroAlternative":50,"percentagem":1,"convertivelSaldo":true},{"nome":"1€ Saldo","valorDinheiroAlternative":1,"percentagem":10,"convertivelSaldo":true}]}'
    }
  });

  console.log('✅ Jogos e Utilizadores criados. Seed concluído!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
