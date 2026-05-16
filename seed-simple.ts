import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 SEED SIMPLES - Criando dados mínimos para teste de rifa');

  try {
    // Limpar dados na ordem correta para evitar problemas de foreign key
    console.log('🧹 Limpando dados existentes...');
    await prisma.numeroVendido.deleteMany();
    await prisma.participacao.deleteMany();
    await prisma.premio.deleteMany();
    await prisma.jogo.deleteMany();
    await prisma.evento.deleteMany();
    await prisma.aldeia.deleteMany();
    await prisma.user.deleteMany();
    await prisma.plano.deleteMany();
    console.log('✅ Dados limpos');

    // Criar plano
    const plano = await prisma.plano.create({
      data: {
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

    // Criar utilizador admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@teste.pt',
        password: passwordHash,
        nome: 'Admin Teste',
        telefone: '+351 912 345 678',
        role: 'super_admin',
        emailVerificado: true,
        saldo: 1000,
      }
    });
    console.log('✅ Utilizador admin criado');

    // Criar aldeia
    const aldeia = await prisma.aldeia.create({
      data: {
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

    // Criar evento
    const evento = await prisma.evento.create({
      data: {
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

    // Criar jogo de rifa
    const jogo = await prisma.jogo.create({
      data: {
        nome: 'Rifa de Teste - Vale 500€',
        tipo: 'rifa',
        descricao: 'Rifa para teste com prémio de 500€ + cabaz',
        preco: 5,
        stockInicial: 100,
        stockAtual: 100,
        limitePorUsuario: 20,
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
          valorPremios: null,
          dataSorteio: '2026-06-30',
          horaSorteio: '21:00',
          localSorteio: 'Praça da Aldeia'
        })
      }
    });
    console.log('✅ Jogo de rifa criado');

    // Criar prémios para a rifa
    await prisma.premio.createMany({
      data: [
        {
          nome: 'Grande Prémio - Vale 500€ + Cabaz',
          valorDinheiroAlternative: 500,
          percentagem: 60,
          ordem: 1,
          jogoId: jogo.id,
          aldeiaId: aldeia.id
        },
        {
          nome: 'Segundo Prémio - 100€',
          valorDinheiroAlternative: 100,
          percentagem: 20,
          ordem: 2,
          jogoId: jogo.id,
          aldeiaId: aldeia.id
        },
        {
          nome: 'Terceiro Prémio - 50€',
          valorDinheiroAlternative: 50,
          percentagem: 10,
          ordem: 3,
          jogoId: jogo.id,
          aldeiaId: aldeia.id
        },
        {
          nome: 'Prémio de Consolação - 10€',
          valorDinheiroAlternative: 10,
          percentagem: 10,
          ordem: 4,
          jogoId: jogo.id,
          aldeiaId: aldeia.id
        }
      ]
    });
    console.log('✅ Prémios criados');

    console.log('\n🎉 SEED SIMPLES CONCLUÍDO!');
    console.log('🔑 Credenciais de teste:');
    console.log('   Email: admin@teste.pt');
    console.log('   Senha: 123456');
    console.log(`\n🎮 Jogo de rifa ID: ${jogo.id}`);
    console.log(`   Link directo: http://localhost:3000/jogos/rifa?id=${jogo.id}`);

  } catch (error) {
    console.error('❌ Erro no seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();