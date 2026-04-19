import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { eventoId, tipoJogo, frequencia, diaSemana, hora } = body;

    if (!eventoId || !tipoJogo || !frequencia) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Get evento to know the aldeia
    const evento = await prisma.evento.findUnique({
      where: { id: eventoId },
      include: { aldeia: true }
    });

    if (!evento) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    // Calculate next creation date
    const now = new Date();
    const nextDate = new Date(now);
    
    // Set time
    nextDate.setHours(hora || 9, 0, 0, 0);
    
    // Adjust to next occurrence based on frequency
    const dayOfWeek = diaSemana || nextDate.getDay();
    const daysUntilNext = (dayOfWeek - nextDate.getDay() + 7) % 7 || 7;
    nextDate.setDate(nextDate.getDate() + daysUntilNext);

    // Create jogo recorrente
    const jogo = await prisma.jogo.create({
      data: {
        nome: `${evento.nome} - ${tipoJogo} ${nextDate.toLocaleDateString('pt-PT')}`,
        tipo: tipoJogo,
        descricao: `Jogo ${frequencia} automático`,
        configuracao: JSON.stringify({
          recorrente: true,
          frequencia,
          diaSemana,
          hora,
          premio: tipoJogo === 'tombola' ? { tipo: 'euromilhoes' } : null
        }),
        preco: tipoJogo === 'tombola' ? 5 : tipoJogo === 'rifa' ? 2 : 3,
        precoBase: tipoJogo === 'tombola' ? 5 : tipoJogo === 'rifa' ? 2 : 3,
        stockInicial: 100,
        stockAtual: 100,
        limitePorUsuario: 10,
        estado: 'aberto',
        eventoId,
        aldeiaId: evento.aldeiaId,
        recorrente: true,
        frequenciaRecorrencia: frequencia as any,
        proximaDataCriacao: nextDate,
        ativo: true,
      }
    });

    return NextResponse.json({ 
      success: true, 
      jogo,
      proximaData: nextDate.toISOString()
    });
  } catch (error) {
    console.error('Erro ao criar jogo recorrente:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// Endpoint para executar jobs de jogos recorrentes (chamado por cron)
export async function PUT(request: NextRequest) {
  try {
    // Verificar API key para segurança
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const now = new Date();
    
    // Buscar jogos recorrentes que precisam ser criados
    const jogosRecorrentes = await prisma.jogo.findMany({
      where: {
        recorrente: true,
        ativo: true,
        proximaDataCriacao: { lte: now },
      },
      include: { evento: true }
    });

    const created: string[] = [];

    for (const jogo of jogosRecorrentes) {
      // Calcular próxima data
      const config = JSON.parse(jogo.configuracao || '{}');
      const frequencia = config.frequencia || 'semanal';
      
      const nextDate = new Date(now);
      switch (frequencia) {
        case 'semanal':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'quinzenal':
          nextDate.setDate(nextDate.getDate() + 14);
          break;
        case 'mensual':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
      }

      // Criar novo jogo baseado no recorrente
      await prisma.jogo.create({
        data: {
          nome: `${jogo.evento.nome} - ${jogo.tipo} ${now.toLocaleDateString('pt-PT')}`,
          tipo: jogo.tipo,
          descricao: jogo.descricao,
          configuracao: jogo.configuracao,
          preco: jogo.preco,
          precoBase: jogo.precoBase,
          stockInicial: jogo.stockInicial,
          stockAtual: jogo.stockInicial,
          limitePorUsuario: jogo.limitePorUsuario,
          estado: 'aberto',
          eventoId: jogo.eventoId,
          aldeiaId: jogo.aldeiaId,
          recorrente: false, // O novo jogo não é recorrente
          ativo: true,
        }
      });

      // Atualizar próxima data do jogo recorrente
      await prisma.jogo.update({
        where: { id: jogo.id },
        data: { proximaDataCriacao: nextDate }
      });

      created.push(jogo.id);
    }

    return NextResponse.json({ 
      success: true, 
      created: created.length,
      jogos: created
    });
  } catch (error) {
    console.error('Erro ao processar jogos recorrentes:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}