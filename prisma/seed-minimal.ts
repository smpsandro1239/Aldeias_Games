import { PrismaClient, UserRole, TipoJogo, EstadoJogo, MetodoPagamento, EstadoPagamento, RoleName, PermissionKey } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 SEED MÍNIMO - Criando dados para teste');

  // Limpar dados relevantes (em ordem correta)
  await prisma.$executeRaw`SET CONSTRAINTS ALL DEFERRED`;
  try {
    await prisma.participacao.deleteMany();
    await prisma.jogo.deleteMany();
    await prisma.evento.deleteMany();
    await prisma.aldeia.deleteMany();
    await prisma.user.deleteMany();
    await prisma.plano.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();
  } catch (e) {
    console.warn('Erro na limpeza (pode ser normal na primeira execução):', e);
  }

  // Criar permissões básicas
  const permissions = [
    { key: PermissionKey.VIEW_ALDEIA, description: 'ver aldeia' },
    { key: PermissionKey.VIEW_EVENTO, description: 'ver evento' },
    { key: PermissionKey.VIEW_JOGO, description: 'ver jogo' },
    { key: PermissionKey.EXECUTE_VENDA, description: 'executar venda' },
    { key: PermissionKey.VIEW_VENDAS, description: 'ver vendas' },
  ];

  const createdPermissions: Record<string, any> = {};
  for (const perm of permissions) {
    const p = await prisma.permission.upsert({
      where: { key: perm.key },
      update: perm,
      create: perm,
    });
    createdPermissions[perm.key] = p;
  }
  console.log(`✅ ${permissions.length} permissões`);

  // Criar roles
  const roleNames = [
    { name: RoleName.SUPER_ADMIN, description: 'Super Admin', permissions: Object.values(PermissionKey) as PermissionKey[] },
    { name: RoleName.ALDEIA_ADMIN, description: 'Admin Aldeia', permissions: [PermissionKey.VIEW_ALDEIA, PermissionKey.VIEW_EVENTO, PermissionKey.VIEW_JOGO, PermissionKey.EXECUTE_VENDA, PermissionKey.VIEW_VENDAS] },
    { name: RoleName.GESTOR, description: 'Gestor', permissions: [PermissionKey.VIEW_ALDEIA, PermissionKey.VIEW_EVENTO, PermissionKey.VIEW_JOGO, PermissionKey.EXECUTE_VENDA, PermissionKey.VIEW_VENDAS] },
    { name: RoleName.COLABORADOR, description: 'Colaborador', permissions: [PermissionKey.VIEW_ALDEIA, PermissionKey.VIEW_EVENTO, PermissionKey.VIEW_JOGO] },
    { name: RoleName.VIEWER, description: 'Utilizador', permissions: [PermissionKey.VIEW_ALDEIA, PermissionKey.VIEW_EVENTO, PermissionKey.VIEW_JOGO] },
  ];

  const createdRoles: Record<string, any> = {};
  for (const roleData of roleNames) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: { description: roleData.description },
      create: { name: roleData.name, description: roleData.description },
    });
    createdRoles[roleData.name] = role;

    for (const permKey of roleData.permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: createdPermissions[permKey].id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: createdPermissions[permKey].id
        }
      });
    }
  }
  console.log(`✅ ${roleNames.length} roles`);

  // Criar plano básico
  const plano = await prisma.plano.upsert({
    where: { id: 'plano-basico' },
    update: {
      descricao: 'Plano gratuito para testes',
      precoMensal: 0,
      maxEventos: 10,
      maxJogos: 100,
      maxParticipacoes: 10000,
      maxVendedores: 10,
      ativo: true,
    },
    create: {
      id: 'plano-basico',
      nome: 'Básico',
      descricao: 'Plano gratuito para testes',
      precoMensal: 0,
      maxEventos: 10,
      maxJogos: 100,
      maxParticipacoes: 10000,
      maxVendedores: 10,
      ativo: true,
    }
  });
  console.log('✅ Plano criado');

  // Criar hash de senha
  const passwordHash = await bcrypt.hash('123456', 10);

  // Criar utilizador de teste (admin)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@teste.pt' },
    update: {
      password: passwordHash,
      nome: 'Admin Teste',
      telefone: '+351 912 345 678',
      role: UserRole.super_admin,
      emailVerificado: true,
      saldo: 1000,
    },
    create: {
      email: 'admin@teste.pt',
      password: passwordHash,
      nome: 'Admin Teste',
      telefone: '+351 912 345 678',
      role: UserRole.super_admin,
      emailVerificado: true,
      saldo: 1000,
    }
  });
  console.log('✅ Utilizador admin criado');

  // Ligar utilizador ao role
  await prisma.userGlobalRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: createdRoles[RoleName.SUPER_ADMIN].id } },
    update: {},
    create: { userId: admin.id, roleId: createdRoles[RoleName.SUPER_ADMIN].id }
  });

  // Criar aldeia de teste
  const aldeia = await prisma.aldeia.upsert({
    where: { slug: 'teste-aldeia' },
    update: {
      nome: 'Aldeia de Teste',
      slug: 'teste-aldeia',
      tipoOrganizacao: 'aldeia',
      descricao: 'Aldeia para testes',
      morada: 'Rua de Teste, 1',
      codigoPostal: '1000-000',
      localidade: 'Teste',
      telefone: '+351 912 345 678',
      email: 'geral@teste-aldeia.pt',
      responsavel: 'Admin Teste',
      planoId: plano.id,
      permitirMBWay: false,
      permitirStripe: false,
      metodosPagamentoDefault: '["saldo","dinheiro"]',
      autorizacaoCM: true,
      documentosVerificados: true,
      ativo: true,
      verificado: true,
    },
    create: {
      nome: 'Aldeia de Teste',
      slug: 'teste-aldeia',
      tipoOrganizacao: 'aldeia',
      descricao: 'Aldeia para testes',
      morada: 'Rua de Teste, 1',
      codigoPostal: '1000-000',
      localidade: 'Teste',
      telefone: '+351 912 345 678',
      email: 'geral@teste-aldeia.pt',
      responsavel: 'Admin Teste',
      planoId: plano.id,
      permitirMBWay: false,
      permitirStripe: false,
      metodosPagamentoDefault: '["saldo","dinheiro"]',
      autorizacaoCM: true,
      documentosVerificados: true,
      ativo: true,
      verificado: true,
    }
  });
  console.log('✅ Aldeia criada');

  // Criar evento de teste
  const evento = await prisma.evento.upsert({
    where: { slug: 'evento-teste' },
    update: {
      nome: 'Evento de Teste',
      slug: 'evento-teste',
      descricao: 'Evento para testes de rifa',
      dataInicio: new Date('2026-06-01'),
      dataFim: new Date('2026-06-30'),
      objectivoAngariacao: 1000,
      estado: 'ativo',
      publico: true,
      aldeiaId: aldeia.id,
      totalAngariado: 0,
      totalParticipacoes: 0,
    },
    create: {
      nome: 'Evento de Teste',
      slug: 'evento-teste',
      descricao: 'Evento para testes de rifa',
      dataInicio: new Date('2026-06-01'),
      dataFim: new Date('2026-06-30'),
      objectivoAngariacao: 1000,
      estado: 'ativo',
      publico: true,
      aldeiaId: aldeia.id,
      totalAngariado: 0,
      totalParticipacoes: 0,
    }
  });
  console.log('✅ Evento criado');

  // Criar jogo de rifa de teste
  const jogo = await prisma.jogo.upsert({
    where: { id: 'rifa-teste-001' },
    update: {
      nome: 'Rifa de Teste',
      tipo: 'rifa',
      descricao: 'Rifa para teste de funcionalidade',
      preco: 5,
      stockInicial: 100,
      stockAtual: 100, // Todos disponíveis inicialmente
      limitePorUsuario: 10,
      estado: 'aberto',
      dataAbertura: new Date(),
      lucroMinimoPercent: 70,
      percentagemTotalPremios: 30,
      eventoId: evento.id,
      aldeiaId: aldeia.id,
      totalParticipacoes: 0,
      totalAngariado: 0,
      configuracao: JSON.stringify({
        numeroInicial: 1,
        numeroFinal: 100,
        numeroBlocos: 1,
        permitirStripe: false,
        valorPremios: null
      })
    },
    create: {
      id: 'rifa-teste-001',
      nome: 'Rifa de Teste',
      tipo: 'rifa',
      descricao: 'Rifa para teste de funcionalidade',
      preco: 5,
      stockInicial: 100,
      stockAtual: 100,
      limitePorUsuario: 10,
      estado: 'aberto',
      dataAbertura: new Date(),
      lucroMinimoPercent: 70,
      percentagemTotalPremios: 30,
      eventoId: evento.id,
      aldeiaId: aldeia.id,
      totalParticipacoes: 0,
      totalAngariado: 0,
      configuracao: JSON.stringify({
        numeroInicial: 1,
        numeroFinal: 100,
        numeroBlocos: 1,
        permitirStripe: false,
        valorPremios: null
      })
    }
  });
  console.log('✅ Jogo de rifa criado');

  // Criar prémios para a rifa
  await prisma.premio.upsert({
    where: { id: 'premio-1' },
    update: {
      nome: 'Grande Prémio',
      valorDinheiroAlternative: 150,
      percentagem: 30,
      ordem: 1,
      aldeiaId: aldeia.id,
      jogoId: jogo.id
    },
    create: {
      id: 'premio-1',
      nome: 'Grande Prémio',
      valorDinheiroAlternative: 150,
      percentagem: 30,
      ordem: 1,
      aldeiaId: aldeia.id,
      jogoId: jogo.id
    }
  });

  console.log('✅ Prémios criados');

  console.log('\n🎉 SEED MÍNIMO CONCLUÍDO!');
  console.log('🔑 Credenciais de teste:');
  console.log('   Email: admin@teste.pt');
  console.log('   Senha: 123456');
  console.log(`\n🎮 Jogo de rifa ID: ${jogo.id}`);
  console.log('   Acesse: http://localhost:3000/jogos/rifa?id=' + jogo.id);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });