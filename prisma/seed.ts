import { PrismaClient, UserRole, TipoOrganizacao, TipoJogo, EstadoEvento, EstadoJogo, MetodoPagamento, EstadoPagamento } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed da base de dados...');

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

  console.log('✅ Dados anteriores removidos');

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

  console.log('👤 Criando utilizadores...');

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

  const aldeiasData = [
    {
      nome: 'Aldeia de Vale de Azinha',
      slug: 'vale-azinha',
      tipo: TipoOrganizacao.aldeia,
      descricao: 'Aldeia tradicional do interior com tradição em festividades.',
      locality: 'Castelo Branco',
      users: [
        { email: 'admin.valeazinha@aldeias.pt', nome: 'João Silva', telefone: '+351910000001' },
      ],
      vendedores: [
        { email: 'vendedor.valeazinha@aldeias.pt', nome: 'Maria Santos', telefone: '+351910000011' },
        { email: 'vendedor2.valeazinha@aldeias.pt', nome: 'Pedro Costa', telefone: '+351910000012' },
      ],
      eventos: [
        { nome: 'Festa de São João 2026', slug: 'festa-sao-joao-2026', objetivo: 5000 },
        { nome: 'Magusto da Aldeia', slug: 'magusto-2026', objetivo: 2000 },
      ],
    },
    {
      nome: 'Escola Primária de São Miguel',
      slug: 'escola-sao-miguel',
      tipo: TipoOrganizacao.escola,
      descricao: 'Escola do 1º ciclo com atividades extracurriculares.',
      locality: 'Aveiro',
      users: [
        { email: 'diretor.saomiguel@aldeias.pt', nome: 'Ana Rodrigues', telefone: '+351920000001' },
      ],
      vendedores: [
        { email: 'professor.saomiguel@aldeias.pt', nome: 'Ricardo Lopes', telefone: '+351920000011' },
        { email: 'encarregado.saomiguel@aldeias.pt', nome: 'Teresa Ferreira', telefone: '+351920000012' },
      ],
      eventos: [
        { nome: 'Feira do Livro 2026', slug: 'feira-livro-2026', objetivo: 1500 },
        { nome: 'Gala de Final de Ano', slug: 'gala-2026', objetivo: 3000 },
      ],
    },
    {
      nome: 'Associação de Pais de Lisboa',
      slug: 'pais-lisboa',
      tipo: TipoOrganizacao.associacao_pais,
      descricao: 'Associação de pais para apoio às escolas de Lisboa.',
      locality: 'Lisboa',
      users: [
        { email: 'presidente.paislisboa@aldeias.pt', nome: 'Carlos Mendes', telefone: '+351930000001' },
      ],
      vendedores: [
        { email: 'pai1.paislisboa@aldeias.pt', nome: 'Sofia Almeida', telefone: '+351930000011' },
        { email: 'pai2.paislisboa@aldeias.pt', nome: 'Miguel Santos', telefone: '+351930000012' },
        { email: 'pai3.paislisboa@aldeias.pt', nome: 'Laura Oliveira', telefone: '+351930000013' },
      ],
      eventos: [
        { nome: 'Campanha de Natal 2025', slug: 'natal-2025', objetivo: 10000 },
        { nome: 'Carnaval das Escolas', slug: 'carnaval-2026', objetivo: 5000 },
      ],
    },
    {
      nome: 'Clube Desportivo de Faro',
      slug: 'cd-faro',
      tipo: TipoOrganizacao.clube,
      descricao: 'Clube desportivo com tradição no Algarve.',
      locality: 'Faro',
      users: [
        { email: 'presidente.cd-faro@aldeias.pt', nome: 'Francisco Nogueira', telefone: '+351940000001' },
      ],
      vendedores: [
        { email: 'atleta1.cd-faro@aldeias.pt', nome: 'Diogo Rodrigues', telefone: '+351940000011' },
        { email: 'atleta2.cd-faro@aldeias.pt', nome: 'Hugo Martins', telefone: '+351940000012' },
      ],
      eventos: [
        { nome: 'Torneio de Futebol 2026', slug: 'torneio-futebol-2026', objetivo: 8000 },
        { nome: 'Gala de Aniversário do Clube', slug: 'gala-aniversario-2026', objetivo: 6000 },
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
        // @ts-ignore
        localidades: aldeiaData.locality,
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

    for (const userData of aldeiaData.users) {
      const admin = await prisma.user.create({
        data: {
          email: userData.email,
          password: passwordHash,
          nome: userData.nome,
          telefone: userData.telefone,
          role: UserRole.aldeia_admin,
          aldeiaId: aldeia.id,
          emailVerificado: true,
        },
      });
      await prisma.user.update({
        where: { id: admin.id },
        data: { aldeiaPrincipalId: aldeia.id },
      });
    }

    for (const vendData of aldeiaData.vendedores) {
      await prisma.user.create({
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
    }

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

      const premio2 = await prisma.premio.create({
        data: {
          nome: 'Segundo Prémio',
          descricao: 'Segundo prémio do evento',
          valorDinheiroAlternative: evtData.objetivo * 0.15,
          aldeiaId: aldeia.id,
          ordem: 2,
        },
      });

      const premio3 = await prisma.premio.create({
        data: {
          nome: 'Terceiro Prémio',
          descricao: 'Terceiro prémio do evento',
          valorDinheiroAlternative: evtData.objetivo * 0.1,
          aldeiaId: aldeia.id,
          ordem: 3,
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

      const jogo1 = await prisma.jogo.create({
        data: {
          nome: 'Poio da Vaca',
          tipo: TipoJogo.poio_da_vaca,
          descricao: 'Jogo tradicional português',
          configuracao: JSON.stringify({ letras: ['A', 'B', 'C', 'D', 'E'], numerosPorLetra: 20 }),
          preco: 5,
          stockInicial: 100,
          stockAtual: Math.floor(Math.random() * 50) + 30,
          limitePorUsuario: 10,
          estado: EstadoJogo.aberto,
          dataAbertura: new Date(),
          eventoId: evento.id,
          premioId: premio1.id,
        },
      });

      await prisma.premio.update({ where: { id: premio1.id }, data: { jogoId: jogo1.id } });

      const jogo2 = await prisma.jogo.create({
        data: {
          nome: 'Rifa Principal',
          tipo: TipoJogo.rifa,
          descricao: 'Rifa com 500 números',
          configuracao: JSON.stringify({ numeroInicial: 1, numeroFinal: 500 }),
          preco: 2,
          stockInicial: 500,
          stockAtual: Math.floor(Math.random() * 200) + 100,
          limitePorUsuario: 20,
          estado: EstadoJogo.aberto,
          dataAbertura: new Date(),
          eventoId: evento.id,
          premioId: premio2.id,
        },
      });

      await prisma.premio.update({ where: { id: premio2.id }, data: { jogoId: jogo2.id } });

      const jogo3 = await prisma.jogo.create({
        data: {
          nome: 'Raspadinha da Sorte',
          tipo: TipoJogo.raspadinha,
          descricao: 'Raspe e ganhe!',
          configuracao: JSON.stringify({
            premios: [
              { nome: '€50', valor: 50, percentagem: 0.02 },
              { nome: '€20', valor: 20, percentagem: 0.05 },
              { nome: '€10', valor: 10, percentagem: 0.10 },
              { nome: '€5', valor: 5, percentagem: 0.20 },
            ],
            semPremioPercentagem: 0.63,
          }),
          preco: 3,
          stockInicial: 200,
          stockAtual: Math.floor(Math.random() * 100) + 50,
          limitePorUsuario: 15,
          estado: EstadoJogo.aberto,
          dataAbertura: new Date(),
          eventoId: evento.id,
          premioId: premio3.id,
        },
      });

      await prisma.premio.update({ where: { id: premio3.id }, data: { jogoId: jogo3.id } });

      console.log(`   ✅ ${evento.nome} criado com 3 jogos`);
    }

    console.log(`   ✅ ${aldeiaData.nome} criado com admin e vendedores`);
  }

  console.log('\n👥 Criando jogadores...');

  const jogadorNames = [
    'Pedro Santos', 'Ana Costa', 'Miguel Rodrigues', 'Sofia Almeida', 'João Ferreira',
    'Isabel Martins', 'Carlos Lima', 'Francisca Sousa', 'Antonio Pereira', 'Maria Gomes',
    'Luís Oliveira', 'Beatriz Santos', 'Ricardo Costa', 'Inês Rodrigues', 'Nuno Ferreira'
  ];

  for (let i = 0; i < 20; i++) {
    const nome = jogadorNames[i % jogadorNames.length];
    const count = Math.floor(i / jogadorNames.length) + 1;
    const nomeFinal = count > 1 ? `${nome} ${count}` : nome;

    const jogador = await prisma.user.create({
      data: {
        email: `jogador${i + 1}@email.pt`,
        password: passwordHash,
        nome: nomeFinal,
        telefone: `+351960${String(i).padStart(6, '0')}`,
        role: UserRole.user,
        emailVerificado: true,
        saldo: Math.floor(Math.random() * 50) + 10,
      },
    });
    jogadores.push(jogador);

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

  console.log('✅ 20 jogadores criados com saldo');

  console.log('\n🎫 Criando participações...');

  for (const aldeia of aldeias) {
    const eventos = await prisma.evento.findMany({ where: { aldeiaId: aldeia.id } });
    const jogos = await prisma.jogo.findMany({ where: { evento: { aldeiaId: aldeia.id } } });

    for (const jogo of jogos) {
      const numParticipacoes = Math.floor(Math.random() * 10) + 3;
      const shuffledJogadores = [...jogadores].sort(() => Math.random() - 0.5);

      for (let i = 0; i < numParticipacoes; i++) {
        const jogador = shuffledJogadores[i % shuffledJogadores.length];

        if (jogo.tipo === TipoJogo.rifa) {
          const numero = Math.floor(Math.random() * 500) + 1;
          await prisma.participacao.create({
            data: {
              jogoId: jogo.id,
              userId: jogador.id,
              dadosParticipacao: JSON.stringify({ numero }),
              valorPago: jogo.preco,
              metodoPagamento: MetodoPagamento.saldo,
              estadoPagamento: EstadoPagamento.concluido,
              dataPagamento: new Date(),
              createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            },
          });
        } else if (jogo.tipo === TipoJogo.raspadinha) {
          await prisma.participacao.create({
            data: {
              jogoId: jogo.id,
              userId: jogador.id,
              dadosParticipacao: JSON.stringify({ tipo: 'raspadinha' }),
              valorPago: jogo.preco,
              metodoPagamento: MetodoPagamento.saldo,
              estadoPagamento: EstadoPagamento.concluido,
              dataPagamento: new Date(),
              seedRaspe: Math.random().toString(36).substring(7),
              revelado: Math.random() > 0.5,
              createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            },
          });
        } else {
          const letra = ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)];
          const numero = Math.floor(Math.random() * 20) + 1;
          await prisma.participacao.create({
            data: {
              jogoId: jogo.id,
              userId: jogador.id,
              dadosParticipacao: JSON.stringify({ letra, numero }),
              valorPago: jogo.preco,
              metodoPagamento: MetodoPagamento.saldo,
              estadoPagamento: EstadoPagamento.concluido,
              dataPagamento: new Date(),
              createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            },
          });
        }
      }
    }
  }

  console.log('✅ Participações criadas');

  const adminAldeia = await prisma.user.create({
    data: {
      email: 'aldeia@gmail.com',
      password: passwordHash,
      nome: 'Administrador Teste',
      telefone: '+351900000002',
      role: UserRole.aldeia_admin,
      emailVerificado: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'vendedor@gmail.com',
      password: passwordHash,
      nome: 'Vendedor Teste',
      telefone: '+351900000003',
      role: UserRole.vendedor,
      emailVerificado: true,
    },
  });

  const jogadorPrincipal = await prisma.user.create({
    data: {
      email: 'smpsandro1239@gmail.com',
      password: passwordHash,
      nome: 'Jogador Principal',
      telefone: '+351900000004',
      role: UserRole.user,
      emailVerificado: true,
      saldo: 50,
    },
  });

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📊 Resumo:');
  console.log(`   - Planos: 3`);
  console.log(`   - Utilizadores: ${await prisma.user.count()}`);
  console.log(`   - Aldeias: ${aldeias.length}`);
  console.log(`   - Eventos: ${await prisma.evento.count()}`);
  console.log(`   - Prémios: ${await prisma.premio.count()}`);
  console.log(`   - Jogos: ${await prisma.jogo.count()}`);
  console.log(`   - Participações: ${await prisma.participacao.count()}`);
  console.log('\n🔑 Credenciais de teste:');
  console.log(`   - Super Admin: admin@aldeias.pt / 123456`);
  console.log(`   - Admin Aldeia: aldeia@gmail.com / 123456`);
  console.log(`   - Admin Vale Azinha: admin.valeazinha@aldeias.pt / 123456`);
  console.log(`   - Admin Escola São Miguel: diretor.saomiguel@aldeias.pt / 123456`);
  console.log(`   - Admin Associação Pais: presidente.paislisboa@aldeias.pt / 123456`);
  console.log(`   - Admin Clube Desportivo: presidente.cd-faro@aldeias.pt / 123456`);
  console.log(`   - Vendedor: vendedor@gmail.com / 123456`);
  console.log(`   - Jogador: smpsandro1239@gmail.com / 123456`);
  console.log(`   - Jogador 1: jogador1@email.pt / 123456`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
