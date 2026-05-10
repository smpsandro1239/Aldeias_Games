import { PrismaClient, UserRole, TipoOrganizacao, TipoJogo, EstadoEvento, EstadoJogo, MetodoPagamento, EstadoPagamento, RoleName, PermissionKey, NivelEnsino } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';

const prisma = new PrismaClient();

// Funções auxiliares
function randomFloat(min: number, max: number): number {
  return (Math.random() * (max - min) + min);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateHash(data: string): string {
  return createHash('sha256').update(data + Date.now()).digest('hex').substring(0, 16);
}

function generateSeed(): string {
  return randomBytes(32).toString('hex');
}

async function main() {
  console.log('🌱 SEED COMPLETO - Aldeias Games');
  console.log('='.repeat(50));

  // Limpar dados existentes (ordem correta para evitar erros de foreign key)
  console.log('\n🧹 Limpeza da base de dados...');
  
  // Primeiro desativar constraints
  await prisma.$executeRaw`SET CONSTRAINTS ALL DEFERRED`;
  
  try {
    // Tables that depend on others
    await prisma.auditLog.deleteMany();
    await prisma.pedidoNotificacao.deleteMany();
    await prisma.pedidoCarregamento.deleteMany();
    await prisma.gamificacaoEvento.deleteMany();
    await prisma.direitoEsquecimento.deleteMany();
    await prisma.consentimento.deleteMany();
    await prisma.passwordReset.deleteMany();
    await prisma.twoFactorAuth.deleteMany();
    await prisma.userLevel.deleteMany();
    await prisma.userBadge.deleteMany();
    await prisma.badge.deleteMany();
    await prisma.userPermission.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.userGlobalRole.deleteMany();
    await prisma.userAldeiaRole.deleteMany();
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
    await prisma.premio.deleteMany();
    await prisma.jogo.deleteMany();
    await prisma.evento.deleteMany();
    await prisma.comissao.deleteMany();
    await prisma.user.deleteMany();
    await prisma.aldeia.deleteMany();
    await prisma.plano.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();
  } catch (e) {
    // Ignore errors during cleanup
  }
  
  console.log('✅ Base de dados limpa');

  // ========== CRIAR PERMISSIONS ==========
  console.log('\n🔐 Criando permissões...');
  
  const permissions = Object.values(PermissionKey).map(key => ({
    key,
    description: key.replace(/_/g, ' ').toLowerCase()
  }));

  const createdPermissions: Record<string, any> = {};
  for (const perm of permissions) {
    const p = await prisma.permission.create({ data: perm });
    createdPermissions[perm.key] = p;
  }
  console.log(`✅ ${permissions.length} permissões`);

  // ========== CRIAR ROLES ==========
  console.log('\n🎭 Criando roles...');

  const roleNames: Array<{ name: RoleName; description: string; permissions: PermissionKey[] }> = [
    {
      name: RoleName.SUPER_ADMIN,
      description: 'Super Administrador do sistema',
      permissions: Object.values(PermissionKey)
    },
    {
      name: RoleName.ALDEIA_ADMIN,
      description: 'Administrador de aldeia',
      permissions: [
        PermissionKey.VIEW_ALDEIA,
        PermissionKey.CREATE_EVENTO, PermissionKey.EDIT_EVENTO, PermissionKey.VIEW_EVENTO,
        PermissionKey.CREATE_JOGO, PermissionKey.EDIT_JOGO, PermissionKey.VIEW_JOGO,
        PermissionKey.MANAGE_PREMIOS, PermissionKey.VIEW_PREMIOS,
        PermissionKey.MANAGE_VENDEDORES, PermissionKey.VIEW_VENDEDORES,
        PermissionKey.EXECUTE_VENDA, PermissionKey.VIEW_VENDAS,
        PermissionKey.VIEW_ANALYTICS_LOCAL,
      ]
    },
    {
      name: RoleName.GESTOR,
      description: 'Gestor de vendas',
      permissions: [
        PermissionKey.VIEW_ALDEIA, PermissionKey.VIEW_EVENTO, PermissionKey.VIEW_JOGO,
        PermissionKey.VIEW_PREMIOS, PermissionKey.VIEW_VENDEDORES,
        PermissionKey.EXECUTE_VENDA, PermissionKey.VIEW_VENDAS,
        PermissionKey.VIEW_ANALYTICS_LOCAL,
      ]
    },
    {
      name: RoleName.COLABORADOR,
      description: 'Colaborador/Vendedor',
      permissions: [
        PermissionKey.VIEW_ALDEIA, PermissionKey.VIEW_EVENTO, PermissionKey.VIEW_JOGO,
        PermissionKey.EXECUTE_VENDA, PermissionKey.VIEW_VENDAS,
      ]
    },
    {
      name: RoleName.VIEWER,
      description: 'Apenas visualização',
      permissions: [
        PermissionKey.VIEW_ALDEIA, PermissionKey.VIEW_EVENTO, PermissionKey.VIEW_JOGO,
      ]
    }
  ];

  const createdRoles: Record<string, any> = {};
  for (const roleData of roleNames) {
    const role = await prisma.role.create({
      data: { name: roleData.name, description: roleData.description }
    });
    createdRoles[roleData.name] = role;

    for (const permKey of roleData.permissions) {
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: createdPermissions[permKey].id }
      });
    }
  }
  console.log(`✅ ${roleNames.length} roles`);

  // ========== CRIAR PLANOS ==========
  console.log('\n📦 Criando planos...');
  
  const planoBasico = await prisma.plano.create({
    data: {
      nome: 'Básico',
      descricao: 'Plano gratuito para pequenas comunidades',
      precoMensal: 0,
      maxEventos: 2, maxJogos: 5, maxParticipacoes: 100, maxVendedores: 2,
      ativo: true,
    }
  });

  const planoPro = await prisma.plano.create({
    data: {
      nome: 'Pro',
      descricao: 'Plano ideal para escolas e associações',
      precoMensal: 29.99,
      maxEventos: 10, maxJogos: 50, maxParticipacoes: 1000, maxVendedores: 10,
      ativo: true,
    }
  });

  const planoEnterprise = await prisma.plano.create({
    data: {
      nome: 'Enterprise',
      descricao: 'Plano completo para grandes organizações',
      precoMensal: 99.99,
      maxEventos: 100, maxJogos: 500, maxParticipacoes: 10000, maxVendedores: 50,
      ativo: true,
    }
  });
  console.log('✅ 3 planos');

  const passwordHash = await bcrypt.hash('123456', 10);

  // ========== CRIAR SUPER ADMIN ==========
  console.log('\n👤 Criando Super Administrador...');

  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@aldeias.pt',
      password: passwordHash,
      nome: 'Administrador Global',
      telefone: '+351900000001',
      role: UserRole.super_admin,
      emailVerificado: true,
      saldo: 1000,
    }
  });

  await prisma.userGlobalRole.create({
    data: { userId: superAdmin.id, roleId: createdRoles[RoleName.SUPER_ADMIN].id }
  });

  await prisma.twoFactorAuth.create({
    data: { userId: superAdmin.id, secret: generateSeed(), enabled: false }
  });

  await prisma.userLevel.create({
    data: { userId: superAdmin.id, nivel: 10, pontos: 10000, pontosParaProximoNivel: 0 }
  });
  console.log('✅ Super Admin criado');

  // ========== DADOS DAS ALDEIAS ==========
  const aldeiasData = [
    {
      nome: 'Junta de Freguesia de Vale de Azinha',
      slug: 'vale-azinha',
      tipo: TipoOrganizacao.aldeia,
      tipoNivel: null,
      descricao: 'Aldeia tradicional do interior com forte tradição em festividades e romarias.',
      morada: 'Largo da Igreja, 1',
      codigoPostal: '6160-000',
      localidade: 'Vale de Azinha',
      telefone: '+351275000001',
      email: 'geral@valeazinha.pt',
      responsavel: 'José Manuel Santos',
      planoId: planoPro.id,
      metodosDefault: '["saldo","dinheiro","mbway"]',
      allowMBWay: true,
      allowStripe: false,
      eventos: [
        {
          nome: 'Festa de São João 2026',
          slug: 'festa-sao-joao-2026',
          descricao: 'Festividades de São João com rifas, tombolas e jogos tradicionais.',
          dataInicio: new Date('2026-06-20'),
          dataFim: new Date('2026-06-24'),
          local: 'Largo da Aldeia',
          objectivo: 5000,
          jogos: ['raspadinha', 'rifa', 'tombola', 'poio_da_vaca']
        },
        {
          nome: 'Feira de Outono 2026',
          slug: 'feira-outono-2026',
          descricao: 'Feira anual de produtos locais com atividades para crianças.',
          dataInicio: new Date('2026-09-15'),
          dataFim: new Date('2026-09-17'),
          local: 'Recinto da Feira',
          objectivo: 3000,
          jogos: ['raspadinha', 'rifa', 'tombola', 'poio_da_vaca']
        }
      ],
      vendedores: [
        { email: 'vendedor1@valeazinha.pt', nome: 'Maria da Conceição', telefone: '+351910000011' },
        { email: 'vendedor2@valeazinha.pt', nome: 'António Fernandes', telefone: '+351910000012' },
        { email: 'vendedor3@valeazinha.pt', nome: 'Rosa Maria Gomes', telefone: '+351910000013' },
        { email: 'vendedor4@valeazinha.pt', nome: 'Pedro Miguel Costa', telefone: '+351910000014' },
        { email: 'vendedor5@valeazinha.pt', nome: 'Sofia Isabel Lima', telefone: '+351910000015' }
      ],
      jogadores: [
        { email: 'jogador1@valeazinha.pt', nome: 'João Pedro Santos', telefone: '+351930000001' },
        { email: 'jogador2@valeazinha.pt', nome: 'Ana Rita Ferreira', telefone: '+351930000002' },
        { email: 'jogador3@valeazinha.pt', nome: 'Miguel Ângelo Rocha', telefone: '+351930000003' },
        { email: 'jogador4@valeazinha.pt', nome: 'Sofia Alexandra Lopes', telefone: '+351930000004' },
        { email: 'jogador5@valeazinha.pt', nome: 'Tiago Manuel Costa', telefone: '+351930000005' },
        { email: 'jogador6@valeazinha.pt', nome: 'Catarina Beatriz Silva', telefone: '+351930000006' },
        { email: 'jogador7@valeazinha.pt', nome: 'Bruno Daniel Almeida', telefone: '+351930000007' },
        { email: 'jogador8@valeazinha.pt', nome: 'Liliana Filipa Martins', telefone: '+351930000008' },
        { email: 'jogador9@valeazinha.pt', nome: 'Ricardo João Pereira', telefone: '+351930000009' },
        { email: 'jogador10@valeazinha.pt', nome: 'Inês Raquel Sousa', telefone: '+351930000010' }
      ]
    },
    {
      nome: 'Escola Básica do 1º Ciclo de São Miguel',
      slug: 'escola-sao-miguel',
      tipo: TipoOrganizacao.escola,
      tipoNivel: NivelEnsino.primeiro_ciclo,
      descricao: 'Escola do 1º ciclo com atividades extracurriculares e eventos solidários.',
      morada: 'Rua das Flores, 12',
      codigoPostal: '3810-100',
      localidade: 'São Miguel, Aveiro',
      telefone: '+351234000001',
      email: 'direcao@saomiguel.edu.pt',
      responsavel: 'Doutora Ana Rodrigues',
      planoId: planoPro.id,
      metodosDefault: '["saldo","dinheiro"]',
      allowMBWay: false,
      allowStripe: false,
      eventos: [
        {
          nome: 'Feira do Livro 2026',
          slug: 'feira-livro-2026',
          descricao: 'Feira anual do livro com atividades para os alunos.',
          dataInicio: new Date('2026-04-23'),
          dataFim: new Date('2026-04-25'),
          local: 'Ginásio da Escola',
          objectivo: 1500,
          jogos: ['raspadinha', 'rifa', 'tombola', 'poio_da_vaca']
        },
        {
          nome: 'Tombola da Páscoa 2026',
          slug: 'tombola-pascoa-2026',
          descricao: 'Tombola solidária de Páscoa.',
          dataInicio: new Date('2026-04-10'),
          dataFim: new Date('2026-04-12'),
          local: 'Recinto Escolar',
          objectivo: 800,
          jogos: ['raspadinha', 'rifa', 'tombola', 'poio_da_vaca']
        }
      ],
      vendedores: [
        { email: 'vendedor1@saomiguel.edu.pt', nome: 'Ricardo Lopes', telefone: '+351920000011' },
        { email: 'vendedor2@saomiguel.edu.pt', nome: 'Sandra Beatriz', telefone: '+351920000012' },
        { email: 'vendedor3@saomiguel.edu.pt', nome: 'Paulo Jorge', telefone: '+351920000013' },
        { email: 'vendedor4@saomiguel.edu.pt', nome: 'Margarida Santos', telefone: '+351920000014' },
        { email: 'vendedor5@saomiguel.edu.pt', nome: 'Hugo Miguel', telefone: '+351920000015' }
      ],
      jogadores: [
        { email: 'jogador1@saomiguel.edu.pt', nome: 'Francisco Silva', telefone: '+351940000001' },
        { email: 'jogador2@saomiguel.edu.pt', nome: 'Maria Beatriz', telefone: '+351940000002' },
        { email: 'jogador3@saomiguel.edu.pt', nome: 'Lucas André', telefone: '+351940000003' },
        { email: 'jogador4@saomiguel.edu.pt', nome: 'Leonor Costa', telefone: '+351940000004' },
        { email: 'jogador5@saomiguel.edu.pt', nome: 'Duarte João', telefone: '+351940000005' },
        { email: 'jogador6@saomiguel.edu.pt', nome: 'Matilde Sousa', telefone: '+351940000006' },
        { email: 'jogador7@saomiguel.edu.pt', nome: 'Gustavo Lima', telefone: '+351940000007' },
        { email: 'jogador8@saomiguel.edu.pt', nome: 'Carolina Rodrigues', telefone: '+351940000008' },
        { email: 'jogador9@saomiguel.edu.pt', nome: 'Afonso Gabriel', telefone: '+351940000009' },
        { email: 'jogador10@saomiguel.edu.pt', nome: 'Ana Luísa', telefone: '+351940000010' }
      ]
    }
  ];

  // ========== CRIAR ALDEIAS, EVENTOS, JOGOS ==========
  const createdAldeias: any[] = [];
  
  for (const aldeiaData of aldeiasData) {
    console.log(`\n🏘️ Criando ${aldeiaData.nome}...`);

    // Criar aldeia
    const aldeia = await prisma.aldeia.create({
      data: {
        nome: aldeiaData.nome,
        slug: aldeiaData.slug,
        tipoOrganizacao: aldeiaData.tipo,
        nivelEnsino: aldeiaData.tipoNivel || undefined,
        descricao: aldeiaData.descricao,
        morada: aldeiaData.morada,
        codigoPostal: aldeiaData.codigoPostal,
        localidade: aldeiaData.localidade,
        telefone: aldeiaData.telefone,
        email: aldeiaData.email,
        responsavel: aldeiaData.responsavel,
        permitirMBWay: aldeiaData.allowMBWay || false,
        permitirStripe: aldeiaData.allowStripe || false,
        metodosPagamentoDefault: aldeiaData.metodosDefault,
        autorizacaoCM: true,
        documentosVerificados: true,
        ativo: true,
        verificado: true,
        dataVerificacao: new Date(),
        planoId: aldeiaData.planoId,
        dataInicioPlano: new Date(),
        dataFimPlano: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }
    });
    createdAldeias.push(aldeia);

    // Criar admin de aldeia
    const adminEmail = aldeiaData.slug.includes('vale') ? 'admin.valeazinha@aldeias.pt' : 'diretor.saomiguel@aldeias.pt';
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: passwordHash,
        nome: aldeiaData.responsavel,
        telefone: aldeiaData.telefone,
        role: UserRole.aldeia_admin,
        aldeiaId: aldeia.id,
        emailVerificado: true,
        saldo: 100,
      }
    });

    await prisma.userGlobalRole.create({
      data: { userId: admin.id, roleId: createdRoles[RoleName.ALDEIA_ADMIN].id }
    });

    await prisma.twoFactorAuth.create({
      data: { userId: admin.id, secret: generateSeed(), enabled: false }
    });

    await prisma.userLevel.create({
      data: { userId: admin.id, nivel: 5, pontos: 500, pontosParaProximoNivel: 500 }
    });

    // Criar vendedores
    const createdVendedores: any[] = [];
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
          saldo: 50,
          comissaoPercentual: randomInt(5, 15),
          comissaoAtiva: true,
        }
      });

      await prisma.userGlobalRole.create({
        data: { userId: vendedor.id, roleId: createdRoles[RoleName.COLABORADOR].id }
      });

      await prisma.twoFactorAuth.create({
        data: { userId: vendedor.id, secret: generateSeed(), enabled: false }
      });

      await prisma.userLevel.create({
        data: { userId: vendedor.id, nivel: randomInt(1, 3), pontos: randomInt(0, 100), pontosParaProximoNivel: randomInt(50, 200) }
      });

      createdVendedores.push(vendedor);
    }
    console.log(`   ✅ ${createdVendedores.length} vendedores criados`);

    // Criar jogadores
    const createdJogadores: any[] = [];
    for (const jogData of aldeiaData.jogadores) {
      const saldoInicial = randomFloat(10, 100);
      const jogador = await prisma.user.create({
        data: {
          email: jogData.email,
          password: passwordHash,
          nome: jogData.nome,
          telefone: jogData.telefone,
          role: UserRole.user,
          aldeiaId: aldeia.id,
          emailVerificado: true,
          saldo: saldoInicial,
        }
      });

      await prisma.userLevel.create({
        data: { userId: jogador.id, nivel: randomInt(1, 5), pontos: randomInt(0, 200), pontosParaProximoNivel: randomInt(50, 300) }
      });

      // Carregamento inicial
      await prisma.transacao.create({
        data: {
          userId: jogador.id,
          valor: saldoInicial,
          tipo: 'carregamento_saldo',
          descricao: 'Carregamento inicial via vendedor',
          estado: 'concluido',
          createdAt: new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000)
        }
      });

      createdJogadores.push(jogador);
    }
    console.log(`   ✅ ${createdJogadores.length} jogadores criados`);

    // Criar eventos e jogos
    for (const evtData of aldeiaData.eventos) {
      console.log(`   📅 Criando evento: ${evtData.nome}...`);

      const evento = await prisma.evento.create({
        data: {
          nome: evtData.nome,
          slug: evtData.slug,
          descricao: evtData.descricao,
          dataInicio: evtData.dataInicio,
          dataFim: evtData.dataFim,
          objectivoAngariacao: evtData.objectivo,
          estado: evtData.dataFim < new Date() ? EstadoEvento.finalizado : EstadoEvento.ativo,
          publico: true,
          aldeiaId: aldeia.id,
          totalAngariado: 0,
          totalParticipacoes: 0,
        }
      });

      // Criar jogos para este evento
      for (let i = 0; i < evtData.jogos.length; i++) {
        const tipoJogo = evtData.jogos[i] as TipoJogo;
        const jogoConfig = getJogoConfig(tipoJogo, evtData.objectivo);
        
        const jogo = await prisma.jogo.create({
          data: {
            nome: jogoConfig.nome,
            tipo: tipoJogo,
            descricao: jogoConfig.descricao,
            configuracao: JSON.stringify(jogoConfig.config),
            preco: jogoConfig.preco,
            stockInicial: jogoConfig.stock,
            stockAtual: randomInt(Math.floor(jogoConfig.stock * 0.3), jogoConfig.stock),
            limitePorUsuario: jogoConfig.limite,
            estado: evtData.dataFim < new Date() ? EstadoJogo.fechado : EstadoJogo.aberto,
            dataAbertura: evtData.dataInicio,
            lucroMinimoPercent: jogoConfig.lucroMinimo,
            percentagemTotalPremios: jogoConfig.percentagemPremios,
            eventoId: evento.id,
            aldeiaId: aldeia.id,
            totalParticipacoes: 0,
            totalAngariado: 0,
          }
        });

        // Criar prémios do jogo
        for (let p = 0; p < jogoConfig.premios.length; p++) {
          const premioData = jogoConfig.premios[p];
          await prisma.premio.create({
            data: {
              nome: premioData.nome,
              valorDinheiroAlternative: premioData.valor,
              percentagem: premioData.percentagem,
              ordem: p,
              aldeiaId: aldeia.id,
              jogoId: jogo.id,
            }
          });
        }

        // Simular participações
        const numParticipacoes = randomInt(5, 20);
        for (let j = 0; j < numParticipacoes; j++) {
          const jogador = randomChoice(createdJogadores);
          const vendedor = randomChoice(createdVendedores);
          const metodo = randomChoice([MetodoPagamento.saldo, MetodoPagamento.dinheiro, MetodoPagamento.mbway]) as MetodoPagamento;
          
          // Skip se jogador não tem saldo suficiente
          if (metodo === MetodoPagamento.saldo && jogador.saldo < jogoConfig.preco) continue;

          const isGanhador = Math.random() < jogoConfig.percentagemPremios / 100;
          const resultado = tipoJogo === TipoJogo.raspadinha 
            ? (isGanhador ? 'ganhou' : 'perdeu')
            : null;

          const participacao = await prisma.participacao.create({
            data: {
              dadosParticipacao: JSON.stringify({ numeros: [j + 1] }),
              valorPago: jogoConfig.preco,
              metodoPagamento: metodo,
              estadoPagamento: EstadoPagamento.concluido,
              dataPagamento: evtData.dataInicio,
              vendedorId: vendedor.id,
              nomeCliente: jogador.nome,
              telefoneCliente: jogador.telefone,
              emailCliente: jogador.email,
              ganhador: isGanhador,
              revelado: tipoJogo === TipoJogo.raspadinha ? true : evtData.dataFim < new Date(),
              dataRevelacao: tipoJogo === TipoJogo.raspadinha ? evtData.dataInicio : evtData.dataFim,
              seedRaspe: generateSeed(),
              hashRaspe: generateHash(generateSeed()),
              resultadoRaspe: resultado,
              jogoId: jogo.id,
              userId: jogador.id,
              createdAt: new Date(evtData.dataInicio.getTime() + randomInt(0, 3) * 24 * 60 * 60 * 1000)
            }
          });

          // Criar venda associada
          await prisma.venda.create({
            data: {
              valor: jogoConfig.preco,
              comissao: jogoConfig.preco * vendedor.comissaoPercentual / 100,
              metodoPagamento: metodo,
              dadosCliente: JSON.stringify({ nome: jogador.nome }),
              vendedorId: vendedor.id,
              createdAt: participacao.createdAt,
            }
          });
        }

        // Atualizar totals do jogo
        const totalAngariado = numParticipacoes * jogoConfig.preco;
        await prisma.jogo.update({
          where: { id: jogo.id },
          data: {
            totalParticipacoes: numParticipacoes,
            totalAngariado: totalAngariado,
          }
        });
      }

      console.log(`   ✅ Evento criado com ${evtData.jogos.length} jogos`);
    }

    console.log(`\n   ✅ ${aldeiaData.nome} completa!`);
  }

  // ========== CRIAR BADGES DE GAMIFICAÇÃO ==========
  console.log('\n🏆 Criando badges...');
  
  const badges = [
    { nome: 'Primeira Compra', descricao: 'Fez a primeira compra', criterio: 'primeira_compra', pontos: 10 },
    { nome: 'Comprador', descricao: 'Fez 10 compras', criterio: 'compras_10', pontos: 50 },
    { nome: 'Comprador VIP', descricao: 'Fez 50 compras', criterio: 'compras_50', pontos: 100 },
    { nome: 'Primeira Vitória', descricao: 'Ganhou pela primeira vez', criterio: 'primeira_vitoria', pontos: 20 },
    { nome: 'Sortudo', descricao: 'Ganhou 5 vezes', criterio: 'vitorias_5', pontos: 75 },
    { nome: 'Fiel', descricao: 'Participou em 5 eventos', criterio: 'eventos_5', pontos: 100 },
  ];

  for (const badgeData of badges) {
    await prisma.badge.create({ data: badgeData });
  }
  console.log(`✅ ${badges.length} badges criados`);

  // ========== RESUMO FINAL ==========
  console.log('\n' + '='.repeat(50));
  console.log('🎉 SEED COMPLETO CONCLUÍDO!');
  console.log('='.repeat(50));

  const counts = {
    roles: await prisma.role.count(),
    permissions: await prisma.permission.count(),
    planos: await prisma.plano.count(),
    aldeias: await prisma.aldeia.count(),
    eventos: await prisma.evento.count(),
    jogos: await prisma.jogo.count(),
    premios: await prisma.premio.count(),
    usuarios: await prisma.user.count(),
    vendedores: await prisma.user.count({ where: { role: UserRole.vendedor } }),
    jogadores: await prisma.user.count({ where: { role: UserRole.user } }),
    participacoes: await prisma.participacao.count(),
    vendas: await prisma.venda.count(),
    transacoes: await prisma.transacao.count(),
    badges: await prisma.badge.count(),
  };

  console.log('\n📊 Contagens:');
  for (const [key, value] of Object.entries(counts)) {
    console.log(`   ${key}: ${value}`);
  }

  console.log('\n🔑 Credenciais de teste:');
  console.log('   ➤ SUPER ADMIN: admin@aldeias.pt / 123456');
  console.log('   ➤ ADMIN ALDEIA: admin.valeazinha@aldeias.pt / 123456');
  console.log('   ➤ VENDEDOR: vendedor1@valeazinha.pt / 123456');
  console.log('   ➤ JOGADOR: jogador1@valeazinha.pt / 123456');
  console.log('\n💡 Para login rápido, usa os botões no modal de login.');
}

function getJogoConfig(tipo: TipoJogo, objetivo: number) {
  const percentagemPremios = randomInt(30, 50);
  const lucroMinimo = 100 - percentagemPremios;
  
  switch (tipo) {
    case TipoJogo.raspadinha:
      return {
        nome: 'Raspadinha da Sorte',
        descricao: 'Raspe e ganhe prémios!',
        preco: randomChoice([2, 3]),
        stock: randomInt(100, 200),
        limite: randomInt(5, 15),
        percentagemPremios,
        lucroMinimo,
        config: {
          titulo: 'RASPADINHA DA SORTE',
          subtitulo: 'Raspe para revelar o seu prémio!',
          premios: [
            { nome: 'Prémio Grande', valor: objetivo * 0.3, percentagem: 2 },
            { nome: 'Prémio Médio', valor: objetivo * 0.1, percentagem: 5 },
            { nome: 'Prémio Pequeno', valor: objetivo * 0.05, percentagem: 10 },
            { nome: 'Valor Pago', valor: 0, percentagem: percentagemPremios - 17 },
          ],
        },
        premios: [
          { nome: 'Grande Prémio', valor: objetivo * 0.3, percentagem: 2 },
          { nome: 'Prémio Médio', valor: objetivo * 0.1, percentagem: 5 },
          { nome: 'Prémio Pequeno', valor: objetivo * 0.05, percentagem: 10 },
          { nome: 'Valor da Raspadinha', valor: 0, percentagem: percentagemPremios - 17 },
        ],
      };
    case TipoJogo.tombola:
      return {
        nome: 'Tombola Millennium',
        descricao: 'Sorteio tradicional português',
        preco: randomChoice([2, 5]),
        stock: randomInt(50, 100),
        limite: randomInt(5, 10),
        percentagemPremios,
        lucroMinimo,
        config: {
          dataSorteio: new Date(),
          local: 'Recinto da festa',
        },
        premios: [
          { nome: '1º Prémio', valor: objetivo * 0.4, percentagem: 1 },
          { nome: '2º Prémio', valor: objetivo * 0.25, percentagem: 2 },
          { nome: '3º Prémio', valor: objetivo * 0.15, percentagem: 3 },
        ],
      };
    case TipoJogo.rifa:
      return {
        nome: 'Rifa Solidária',
        descricao: 'Apoia a comunidade!',
        preco: randomChoice([2, 3]),
        stock: randomInt(50, 100),
        limite: randomInt(3, 10),
        percentagemPremios,
        lucroMinimo,
        config: {
          numeroInicial: 1,
          numeroFinal: 100,
        },
        premios: [
          { nome: '1º Prémio', valor: objetivo * 0.4, percentagem: 1 },
          { nome: '2º Prémio', valor: objetivo * 0.25, percentagem: 2 },
          { nome: '3º Prémio', valor: objetivo * 0.15, percentagem: 3 },
        ],
      };
    case TipoJogo.poio_da_vaca:
      return {
        nome: 'Poio da Vaca',
        descricao: 'Encontra a vaca escondida!',
        preco: randomChoice([2, 5]),
        stock: 100,
        limite: randomInt(5, 10),
        percentagemPremios,
        lucroMinimo,
        config: {
          dimensoesX: 10,
          dimensoesY: 10,
          custoQuadrado: randomChoice([2, 5]),
          valorCompraVaca: objetivo * 0.5,
          valorMercadoVaca: objetivo * 0.6,
        },
        premios: [
          { nome: 'Valor da Vaca', valor: objetivo * 0.5, percentagem: 1 },
        ],
      };
    default:
      return {
        nome: 'Jogo Padrão',
        descricao: 'Jogo de teste',
        preco: 2,
        stock: 50,
        limite: 10,
        percentagemPremios: 30,
        lucroMinimo: 70,
        config: {},
        premios: [
          { nome: 'Prémio', valor: 10, percentagem: 10 },
        ],
      };
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });