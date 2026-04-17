import { PrismaClient, UserRole, TipoOrganizacao, TipoJogo, EstadoEvento, EstadoJogo, MetodoPagamento, EstadoPagamento, RoleName, PermissionKey } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function getJogoConfig(tipo: TipoJogo, objetivo: number) {
  switch (tipo) {
    case TipoJogo.raspadinha:
      return {
        nome: 'Raspadinha da Sorte',
        descricao: 'Raspe e ganhe!',
        preco: 3,
        stock: 200,
        limite: 15,
        config: {
          premios: [
            { nome: '€50', valor: 50, percentagem: 0.02 },
            { nome: '€20', valor: 20, percentagem: 0.05 },
            { nome: '€10', valor: 10, percentagem: 0.10 },
            { nome: '€5', valor: 5, percentagem: 0.20 },
          ],
          semPremioPercentagem: 0.63,
        },
      };
    case TipoJogo.tombola:
      return {
        nome: 'Tombola Millennium',
        descricao: 'Sorteio tradicional português',
        preco: 5,
        stock: 100,
        limite: 10,
        config: {
          numeros: Array.from({ length: 100 }, (_, i) => i + 1),
          premios: [
            { posicao: 1, nome: '1º Prémio', valor: objetivo * 0.40 },
            { posicao: 2, nome: '2º Prémio', valor: objetivo * 0.25 },
            { posicao: 3, nome: '3º Prémio', valor: objetivo * 0.15 },
          ],
        },
      };
    case TipoJogo.rifa:
      return {
        nome: 'Rifa Solidária',
        descricao: 'Apoia a comunidade!',
        preco: 2,
        stock: 50,
        limite: 5,
        config: {
          premios: [
            { nome: 'Cesto de Páscoa', valor: 150, percentagem: 0.15 },
            { nome: 'Bilhetes Festival', valor: 100, percentagem: 0.10 },
            { nome: 'Jantar Grátis', valor: 50, percentagem: 0.25 },
          ],
          semPremioPercentagem: 0.50,
        },
      };
    default:
      return {
        nome: 'Jogo Default',
        descricao: 'Jogo de teste',
        preco: 1,
        stock: 50,
        limite: 10,
        config: {},
      };
  }
}

async function main() {
  console.log('🌱 Iniciando seed da base de dados...');

  // Limpar dados existentes
  await prisma.userPermission.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.alteracaoParticipacao.deleteMany();
  await prisma.vencedorSorteio.deleteMany();
  await prisma.sorteio.deleteMany();
  await prisma.participacao.deleteMany();
  await prisma.venda.deleteMany();
  await prisma.aposta.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.notificacao.deleteMany();
  await prisma.logAcesso.deleteMany();
  await prisma.transacao.deleteMany();
  await prisma.jogo.deleteMany();
  await prisma.premio.deleteMany();
  await prisma.evento.deleteMany();
  await prisma.comissao.deleteMany();
  await prisma.user.deleteMany();
  await prisma.aldeia.deleteMany();
  await prisma.plano.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();

  console.log('✅ Dados anteriores removidos');

  // ========== CRIAR PERMISSIONS ==========
  console.log('🔐 Criando permissões...');
  
  const permissions = [
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
  for (const perm of permissions) {
    const p = await prisma.permission.create({ data: perm });
    createdPermissions[perm.key] = p;
  }
  console.log(`✅ ${permissions.length} permissões criadas`);

  // ========== CRIAR ROLES ==========
  console.log('🎭 Criando roles...');

  const superAdminRole = await prisma.role.create({
    data: {
      name: RoleName.SUPER_ADMIN,
      description: 'Super Administrador do sistema',
    },
  });

  const aldeiaAdminRole = await prisma.role.create({
    data: {
      name: RoleName.ALDEIA_ADMIN,
      description: 'Administrador de aldeia',
    },
  });

  const gestorRole = await prisma.role.create({
    data: {
      name: RoleName.GESTOR,
      description: 'Gestor de vendas',
    },
  });

  const colaboradorRole = await prisma.role.create({
    data: {
      name: RoleName.COLABORADOR,
      description: 'Colaborador/Vendedor',
    },
  });

  const viewerRole = await prisma.role.create({
    data: {
      name: RoleName.VIEWER,
      description: 'Apenas visualização',
    },
  });

  // Atribuir permissões às roles
  const rolePermissions: Record<string, string[]> = {
    SUPER_ADMIN: Object.values(PermissionKey),
    ALDEIA_ADMIN: [
      PermissionKey.VIEW_ALDEIA,
      PermissionKey.CREATE_EVENTO,
      PermissionKey.EDIT_EVENTO,
      PermissionKey.VIEW_EVENTO,
      PermissionKey.CREATE_JOGO,
      PermissionKey.EDIT_JOGO,
      PermissionKey.VIEW_JOGO,
      PermissionKey.MANAGE_PREMIOS,
      PermissionKey.VIEW_PREMIOS,
      PermissionKey.MANAGE_VENDEDORES,
      PermissionKey.VIEW_VENDEDORES,
      PermissionKey.EXECUTE_VENDA,
      PermissionKey.VIEW_VENDAS,
      PermissionKey.VIEW_ANALYTICS_LOCAL,
    ],
    GESTOR: [
      PermissionKey.VIEW_ALDEIA,
      PermissionKey.VIEW_EVENTO,
      PermissionKey.VIEW_JOGO,
      PermissionKey.VIEW_PREMIOS,
      PermissionKey.VIEW_VENDEDORES,
      PermissionKey.EXECUTE_VENDA,
      PermissionKey.VIEW_VENDAS,
      PermissionKey.VIEW_ANALYTICS_LOCAL,
    ],
    COLABORADOR: [
      PermissionKey.VIEW_ALDEIA,
      PermissionKey.VIEW_EVENTO,
      PermissionKey.VIEW_JOGO,
      PermissionKey.EXECUTE_VENDA,
      PermissionKey.VIEW_VENDAS,
    ],
    VIEWER: [
      PermissionKey.VIEW_ALDEIA,
      PermissionKey.VIEW_EVENTO,
      PermissionKey.VIEW_JOGO,
    ],
  };

  const roles: Record<string, any> = {
    SUPER_ADMIN: superAdminRole,
    ALDEIA_ADMIN: aldeiaAdminRole,
    GESTOR: gestorRole,
    COLABORADOR: colaboradorRole,
    VIEWER: viewerRole,
  };

  for (const [roleName, perms] of Object.entries(rolePermissions)) {
    const role = roles[roleName];
    for (const permKey of perms) {
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: createdPermissions[permKey].id },
      });
    }
  }
  console.log('✅ Roles e permissões criadas');

  // ========== CRIAR PLANOS ==========
  console.log('📦 Criando planos...');
  
  const planoGratuito = await prisma.plano.create({
    data: {
      nome: 'Gratuito',
      descricao: 'Plano básico para pequenas comunidades',
      precoMensal: 0,
      maxEventos: 2,
      maxJogos: 5,
      maxParticipacoes: 100,
      maxVendedores: 1,
      ativo: true,
    },
  });

  const planoPro = await prisma.plano.create({
    data: {
      nome: 'Pro',
      descricao: 'Plano ideal para escolas e associações',
      precoMensal: 29.99,
      maxEventos: 10,
      maxJogos: 50,
      maxParticipacoes: 1000,
      maxVendedores: 10,
      ativo: true,
    },
  });

  const planoEnterprise = await prisma.plano.create({
    data: {
      nome: 'Enterprise',
      descricao: 'Plano completo para grandes organizações',
      precoMensal: 99.99,
      maxEventos: 100,
      maxJogos: 500,
      maxParticipacoes: 10000,
      maxVendedores: 50,
      ativo: true,
    },
  });

  console.log('✅ Planos criados');

  const passwordHash = await bcrypt.hash('123456', 10);

  // ========== CRIAR SUPER ADMIN ==========
  console.log('👤 Criando Super Administrador...');

  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@aldeias.pt',
      password: passwordHash,
      nome: 'Super Administrador',
      telefone: '+351900000001',
      role: UserRole.super_admin,
      emailVerificado: true,
      saldo: 100,
    },
  });

  // Atribuir role SUPER_ADMIN ao super admin
  await prisma.userGlobalRole.create({
    data: { userId: superAdmin.id, roleId: superAdminRole.id },
  });

  await prisma.twoFactorAuth.create({
    data: { userId: superAdmin.id, secret: 'JBSWY3DPEHPK3PXP', enabled: false },
  });

  // ========== CRIAR ALDEIAS ==========
  const aldeiasData = [
    {
      nome: 'Aldeia de Vale de Azinha',
      slug: 'vale-azinha',
      tipo: TipoOrganizacao.aldeia,
      descricao: 'Aldeia tradicional do interior com tradição em festividades.',
      locality: 'Castelo Branco',
      users: [{ email: 'admin.valeazinha@aldeias.pt', nome: 'João Silva', telefone: '+351910000001' }],
      vendedores: [
        { email: 'vendedor.valeazinha@aldeias.pt', nome: 'Maria Santos', telefone: '+351910000011' },
      ],
      eventos: [
        { nome: 'Festa de São João 2026', slug: 'festa-sao-joao-2026', objetivo: 5000, tipoJogo: TipoJogo.raspadinha },
        { nome: 'Tombola de Natal 2026', slug: 'tombola-natal-2026', objetivo: 3000, tipoJogo: TipoJogo.tombola },
        { nome: 'Rifa daianta 2026', slug: 'rifa-crianca-2026', objetivo: 2000, tipoJogo: TipoJogo.rifa },
      ],
    },
    {
      nome: 'Escola Primária de São Miguel',
      slug: 'escola-sao-miguel',
      tipo: TipoOrganizacao.escola,
      descricao: 'Escola do 1º ciclo com atividades extracurriculares.',
      locality: 'Aveiro',
      users: [{ email: 'diretor.saomiguel@aldeias.pt', nome: 'Ana Rodrigues', telefone: '+351920000001' }],
      vendedores: [{ email: 'professor.saomiguel@aldeias.pt', nome: 'Ricardo Lopes', telefone: '+351920000011' }],
      eventos: [
        { nome: 'Feira do Livro 2026', slug: 'feira-livro-2026', objetivo: 1500, tipoJogo: TipoJogo.raspadinha },
        { nome: 'Tombola da Páscoa 2026', slug: 'tombola-pascoa-2026', objetivo: 1000, tipoJogo: TipoJogo.tombola },
        { nome: 'Rifa da Escola 2026', slug: 'rifa-escola-2026', objetivo: 800, tipoJogo: TipoJogo.rifa },
      ],
    },
  ];

  const aldeias: any[] = [];
  const jogadores: any[] = [];

  for (const aldeiaData of aldeiasData) {
    console.log(`\n🏘️ Criando ${aldeiaData.nome}...`);

    const aldeia = await prisma.aldeia.create({
      data: {
        nome: aldeiaData.nome,
        slug: aldeiaData.slug,
        tipoOrganizacao: aldeiaData.tipo,
        descricao: aldeiaData.descricao,
        responsavel: aldeiaData.users[0].nome,
        telefone: aldeiaData.users[0].telefone,
        email: aldeiaData.users[0].email,
        morada: 'Rua Principal',
        codigoPostal: '4000-000',
        localidade: aldeiaData.locality,
        autorizacaoCM: true,
        documentosVerificados: true,
        ativo: true,
        verificado: true,
        dataVerificacao: new Date(),
        planoId: planoPro.id,
        dataInicioPlano: new Date(),
        dataFimPlano: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
    aldeias.push(aldeia);

    // Criar admin de aldeia
    const admin = await prisma.user.create({
      data: {
        email: aldeiaData.users[0].email,
        password: passwordHash,
        nome: aldeiaData.users[0].nome,
        telefone: aldeiaData.users[0].telefone,
        role: UserRole.aldeia_admin,
        aldeiaId: aldeia.id,
        emailVerificado: true,
      },
    });

    // Atribuir role ALDEIA_ADMIN
    await prisma.userGlobalRole.create({
      data: { userId: admin.id, roleId: aldeiaAdminRole.id },
    });

    await prisma.twoFactorAuth.create({
      data: { userId: admin.id, secret: 'JBSWY3DPEHPK3PXP', enabled: false },
    });

    // Criar vendedores
    for (const vendData of aldeiaData.vendedores) {
      const vendedor = await prisma.user.create({
        data: {
          email: vendData.email,
          password: passwordHash,
          nome: vendData.nome,
          telefone: vendData.telefone,
          role: UserRole.vendedor,
          aldeiaId: aldeia.id,
          emailVerificado: true,
        },
      });

      // Atribuir role COLABORADOR
      await prisma.userGlobalRole.create({
        data: { userId: vendedor.id, roleId: colaboradorRole.id },
      });
    }

    // Criar eventos e jogos
    for (const evtData of aldeiaData.eventos) {
      const premio1 = await prisma.premio.create({
        data: {
          nome: 'Primeiro Prémio',
          descricao: 'Grande prémio do evento',
          valorDinheiroAlternative: evtData.objetivo * 0.3,
          aldeiaId: aldeia.id,
          ordem: 1,
        },
      });

      const evento = await prisma.evento.create({
        data: {
          nome: evtData.nome,
          slug: evtData.slug,
          descricao: `Evento de angariação de fundos em ${aldeiaData.nome}`,
          dataInicio: new Date(),
          dataFim: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          objectivoAngariacao: evtData.objetivo,
          estado: EstadoEvento.ativo,
          publico: true,
          aldeiaId: aldeia.id,
        },
      });

      const jogoConfig = getJogoConfig(evtData.tipoJogo, evtData.objetivo);
      
      const jogo = await prisma.jogo.create({
        data: {
          nome: jogoConfig.nome,
          tipo: evtData.tipoJogo,
          descricao: jogoConfig.descricao,
          configuracao: JSON.stringify(jogoConfig.config),
          preco: jogoConfig.preco,
          stockInicial: jogoConfig.stock,
          stockAtual: jogoConfig.stock,
          limitePorUsuario: jogoConfig.limite,
          estado: EstadoJogo.aberto,
          dataAbertura: new Date(),
          eventoId: evento.id,
          premioId: premio1.id,
        },
      });

      await prisma.premio.update({ where: { id: premio1.id }, data: { jogoId: jogo.id } });
      console.log(`   ✅ ${evento.nome} criado com jogo`);
    }

    console.log(`   ✅ ${aldeiaData.nome} criado`);
  }

  // ========== CRIAR JOGADORES ==========
  console.log('\n👥 Criando jogadores...');

  const jogadorNames = [
    'Pedro Santos', 'Ana Costa', 'Miguel Rodrigues', 'Sofia Almeida', 'João Ferreira',
    'Isabel Martins', 'Carlos Lima', 'Francisca Sousa', 'Antonio Pereira', 'Maria Gomes',
  ];

  for (let i = 0; i < 10; i++) {
    const nome = jogadorNames[i];
    const aldeiaId = aldeias[i % aldeias.length].id;

    const jogador = await prisma.user.create({
      data: {
        email: `jogador${i + 1}@email.pt`,
        password: passwordHash,
        nome: nome,
        telefone: `+351960${String(i).padStart(6, '0')}`,
        role: UserRole.user,
        emailVerificado: true,
        saldo: Math.floor(Math.random() * 50) + 10,
        aldeiaId: aldeiaId,
      },
    });
    jogadores.push(jogador);

    // Criar transação inicial
    await prisma.transacao.create({
      data: {
        userId: jogador.id,
        valor: Math.floor(Math.random() * 50) + 10,
        tipo: 'carregamento_saldo',
        descricao: 'Carregamento inicial',
        estado: 'concluido',
      },
    });
  }

  console.log('✅ 10 jogadores criados com saldo');

  // ========== RESUMO ==========
  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📊 Resumo:');
  console.log(`   - Roles: ${await prisma.role.count()}`);
  console.log(`   - Permissões: ${await prisma.permission.count()}`);
  console.log(`   - Utilizadores: ${await prisma.user.count()}`);
  console.log(`   - Aldeias: ${aldeias.length}`);
  console.log(`   - Eventos: ${await prisma.evento.count()}`);
  console.log(`   - Jogos: ${await prisma.jogo.count()}`);

  console.log('\n🔑 Credenciais de teste:');
  console.log(`   ➤ SUPER ADMIN: admin@aldeias.pt / 123456`);
  console.log(`   ➤ ADMIN ALDEIA: admin.valeazinha@aldeias.pt / 123456`);
  console.log(`   ➤ VENDEDOR: vendedor.valeazinha@aldeias.pt / 123456`);
  console.log(`   ➤ JOGADOR: jogador1@email.pt / 123456`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
