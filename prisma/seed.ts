import { PrismaClient, UserRole, TipoOrganizacao, TipoJogo, EstadoEvento, EstadoJogo } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed da base de dados...');

  // Limpar dados existentes (opcional - cuidado em produção)
  await prisma.alteracaoParticipacao.deleteMany();
  await prisma.vencedorSorteio.deleteMany();
  await prisma.sorteio.deleteMany();
  await prisma.participacao.deleteMany();
  await prisma.venda.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.notificacao.deleteMany();
  await prisma.logAcesso.deleteMany();
  await prisma.jogo.deleteMany();
  await prisma.premio.deleteMany();
  await prisma.evento.deleteMany();
  await prisma.user.deleteMany();
  await prisma.aldeia.deleteMany();
  await prisma.plano.deleteMany();

  console.log('✅ Dados anteriores removidos');

  // ============================================
  // CRIAR PLANOS
  // ============================================
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

  // ============================================
  // CRIAR UTILIZADORES
  // ============================================
  console.log('👤 Criando utilizadores...');

  const passwordHash = await bcrypt.hash('123456', 10);

  // Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@aldeias.pt',
      password: passwordHash,
      nome: 'Super Administrador',
      telefone: '+351900000001',
      role: UserRole.super_admin,
      emailVerificado: true,
      notificacoesEmail: true,
    },
  });

  // Admin Aldeia
  const adminAldeia = await prisma.user.create({
    data: {
      email: 'aldeia@gmail.com',
      password: passwordHash,
      nome: 'Administrador da Aldeia',
      telefone: '+351900000002',
      role: UserRole.aldeia_admin,
      emailVerificado: true,
      notificacoesEmail: true,
    },
  });

  // Vendedor
  const vendedor = await prisma.user.create({
    data: {
      email: 'vendedor@gmail.com',
      password: passwordHash,
      nome: 'Vendedor Teste',
      telefone: '+351900000003',
      role: UserRole.vendedor,
      emailVerificado: true,
      notificacoesEmail: true,
    },
  });

  // Jogador
  const jogador = await prisma.user.create({
    data: {
      email: 'smpsandro1239@gmail.com',
      password: passwordHash,
      nome: 'Jogador Teste',
      telefone: '+351900000004',
      role: UserRole.user,
      emailVerificado: true,
      notificacoesEmail: true,
    },
  });

  console.log('✅ Utilizadores criados');

  // ============================================
  // CRIAR ALDEIA
  // ============================================
  console.log('🏘️ Criando aldeia...');

  const aldeia = await prisma.aldeia.create({
    data: {
      nome: 'Vila Verde',
      slug: 'vila-verde',
      tipoOrganizacao: TipoOrganizacao.aldeia,
      descricao: 'Uma aldeia tradicional portuguesa com muita história para contar.',
      responsavel: 'Administrador da Aldeia',
      telefone: '+351900000002',
      email: 'aldeia@gmail.com',
      morada: 'Rua Principal, 123',
      codigoPostal: '4000-000',
      localidade: 'Porto',
      autorizacaoCM: true,
      numeroAlvara: 'ALV-2024-001',
      documentosVerificados: true,
      ativo: true,
      verificado: true,
      dataVerificacao: new Date(),
      planoId: planoPro.id,
      dataInicioPlano: new Date(),
      dataFimPlano: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
    },
  });

  // Atualizar utilizadores com a aldeia
  await prisma.user.update({
    where: { id: adminAldeia.id },
    data: { aldeiaId: aldeia.id },
  });

  await prisma.user.update({
    where: { id: vendedor.id },
    data: { aldeiaId: aldeia.id },
  });

  console.log('✅ Aldeia criada');

  // ============================================
  // CRIAR EVENTO
  // ============================================
  console.log('📅 Criando evento...');

  const evento = await prisma.evento.create({
    data: {
      nome: 'Festa de Verão 2024',
      slug: 'festa-verao-2024',
      descricao: 'Grande festa de verão com rifas, jogos e muita diversão para toda a família!',
      dataInicio: new Date(),
      dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      objectivoAngariacao: 5000,
      estado: EstadoEvento.ativo,
      publico: true,
      aldeiaId: aldeia.id,
    },
  });

  console.log('✅ Evento criado');

  // ============================================
  // CRIAR PRÉMIOS
  // ============================================
  console.log('🎁 Criando prémios...');

  const premio1 = await prisma.premio.create({
    data: {
      nome: 'Viagem aos Açores',
      descricao: 'Viagem de 3 dias para 2 pessoas aos Açores',
      valorDinheiroAlternative: 1500,
      aldeiaId: aldeia.id,
      ordem: 1,
    },
  });

  const premio2 = await prisma.premio.create({
    data: {
      nome: 'Smartphone Samsung Galaxy',
      descricao: 'Samsung Galaxy S24 Ultra 256GB',
      valorDinheiroAlternative: 1200,
      aldeiaId: aldeia.id,
      ordem: 2,
    },
  });

  const premio3 = await prisma.premio.create({
    data: {
      nome: 'Prémio em Dinheiro €500',
      descricao: 'Transferência bancária de €500',
      valorDinheiroAlternative: 500,
      aldeiaId: aldeia.id,
      ordem: 3,
    },
  });

  console.log('✅ Prémios criados');

  // ============================================
  // CRIAR JOGOS
  // ============================================
  console.log('🎮 Criando jogos...');

  // Poio da Vaca
  const poioDaVaca = await prisma.jogo.create({
    data: {
      nome: 'Poio da Vaca - Grande Prémio',
      tipo: TipoJogo.poio_da_vaca,
      descricao: 'Grelha tradicional do Poio da Vaca com grandes prémios!',
      configuracao: JSON.stringify({
        letras: ['A', 'B', 'C', 'D', 'E'],
        numerosPorLetra: 20,
        precos: { individual: 5, cartao: 20 },
      }),
      preco: 5,
      stockInicial: 100,
      stockAtual: 100,
      limitePorUsuario: 10,
      estado: EstadoJogo.aberto,
      dataAbertura: new Date(),
      eventoId: evento.id,
      premioId: premio1.id,
    },
  });

  // Rifa
  const rifa = await prisma.jogo.create({
    data: {
      nome: 'Rifa da Festa',
      tipo: TipoJogo.rifa,
      descricao: 'Rifa com números de 1 a 1000',
      configuracao: JSON.stringify({
        numeroInicial: 1,
        numeroFinal: 1000,
      }),
      preco: 2,
      stockInicial: 1000,
      stockAtual: 1000,
      limitePorUsuario: 20,
      estado: EstadoJogo.aberto,
      dataAbertura: new Date(),
      eventoId: evento.id,
      premioId: premio2.id,
    },
  });

  // Raspadinha
  const raspadinha = await prisma.jogo.create({
    data: {
      nome: 'Raspadinha da Sorte',
      tipo: TipoJogo.raspadinha,
      descricao: 'Raspe e descubra o seu prémio!',
      configuracao: JSON.stringify({
        premios: [
          { nome: '€100', tipo: 'dinheiro', percentagem: 0.01, valor: 100 },
          { nome: '€50', tipo: 'dinheiro', percentagem: 0.02, valor: 50 },
          { nome: '€20', tipo: 'dinheiro', percentagem: 0.05, valor: 20 },
          { nome: '€10', tipo: 'dinheiro', percentagem: 0.10, valor: 10 },
          { nome: '€5', tipo: 'dinheiro', percentagem: 0.20, valor: 5 },
        ],
        semPremioPercentagem: 0.62,
      }),
      preco: 3,
      stockInicial: 500,
      stockAtual: 500,
      limitePorUsuario: 15,
      estado: EstadoJogo.aberto,
      dataAbertura: new Date(),
      eventoId: evento.id,
      premioId: premio3.id,
    },
  });

  console.log('✅ Jogos criados');

  // ============================================
  // CRIAR NOTIFICAÇÕES
  // ============================================
  console.log('🔔 Criando notificações...');

  await prisma.notificacao.create({
    data: {
      tipo: 'sistema',
      titulo: 'Bem-vindo ao Aldeias Games!',
      mensagem: 'A sua conta foi criada com sucesso. Explore os jogos disponíveis!',
      userId: jogador.id,
    },
  });

  await prisma.notificacao.create({
    data: {
      tipo: 'campanha',
      titulo: 'Nova campanha disponível',
      mensagem: 'A Festa de Verão 2024 já começou! Participe nos jogos.',
      userId: jogador.id,
    },
  });

  console.log('✅ Notificações criadas');

  // ============================================
  // RESUMO
  // ============================================
  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📊 Resumo:');
  console.log(`   - Planos: 3`);
  console.log(`   - Utilizadores: 4`);
  console.log(`   - Aldeias: 1`);
  console.log(`   - Eventos: 1`);
  console.log(`   - Prémios: 3`);
  console.log(`   - Jogos: 3`);
  console.log(`   - Notificações: 2`);
  console.log('\n🔑 Credenciais de teste:');
  console.log(`   - Super Admin: admin@aldeias.pt / 123456`);
  console.log(`   - Admin Aldeia: aldeia@gmail.com / 123456`);
  console.log(`   - Vendedor: vendedor@gmail.com / 123456`);
  console.log(`   - Jogador: smpsandro1239@gmail.com / 123456`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
