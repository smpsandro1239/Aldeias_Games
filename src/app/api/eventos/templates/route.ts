import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const body = await request.json();
    const { 
      nome, descricao, aldeiaId, objectivoAngariacao,
      isTemplate, templateNome, frequenciaRecorrencia, diaSemanaRecorrencia
    } = body;

    if (!nome || !aldeiaId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Gerar slug único
    const slug = `${nome.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

    // Calcular próxima data se for recorrente
    let proximaData = null;
    if (frequenciaRecorrencia) {
      const next = new Date();
      next.setHours(9, 0, 0, 0);
      const dayOfWeek = diaSemanaRecorrencia !== undefined ? diaSemanaRecorrencia : next.getDay();
      const daysUntil = (dayOfWeek - next.getDay() + 7) % 7 || 7;
      next.setDate(next.getDate() + daysUntil);
      proximaData = next;
    }

    const evento = await any.create({
      data: {
        nome,
        slug,
        descricao,
        aldeiaId,
        objectivoAngariacao,
        publico: false,
        estado: 'rascunho',
        dataInicio: new Date(),
        dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        isTemplate: isTemplate || false,
        templateNome,
        frequenciaRecorrencia: frequenciaRecorrencia as any,
        diaSemanaRecorrencia,
        proximaData,
      }
    });

    return NextResponse.json({ success: true, data: evento });
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const aldeiaId = searchParams.get('aldeiaId');
    const templates = searchParams.get('templates') === 'true';

    const eventos = await any.findMany({
      where: {
        ...(templates ? { isTemplate: true } : { isTemplate: false }),
        ...(aldeiaId ? { aldeiaId } : {}),
      },
      include: {
        aldeia: { select: { nome: true } },
        _count: { select: { jogos: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: eventos });
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PUT - Executar recorrências (chamado por cron)
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const now = new Date();
    
    const eventosRecorrentes = await any.findMany({
      where: {
        isTemplate: true,
        frequenciaRecorrencia: { not: null },
        proximaData: { lte: now },
      }
    });

    const created: string[] = [];

    for (const evento of eventosRecorrentes) {
      // Criar novo evento baseado no template
      const novoSlug = `${evento.slug.split('-')[0]}-${Date.now()}`;
      
      const novoEvento = await any.create({
        data: {
          nome: evento.nome,
          slug: novoSlug,
          descricao: evento.descricao,
          aldeiaId: evento.aldeiaId,
          objectivoAngariacao: evento.objectivoAngariacao,
publico: false,
          estado: 'rascunho',
          dataInicio: now,
          dataFim: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        }
      });

      // Atualizar próxima data do template
      const nextDate = new Date(now);
      switch (evento.frequenciaRecorrencia) {
        case 'semanal':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'quinzenal':
          nextDate.setDate(nextDate.getDate() + 14);
          break;
        case 'mensal':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
      }

      await any.update({
        where: { id: evento.id },
        data: { proximaData: nextDate }
      });

      created.push(novoEvento.id);
    }

    return NextResponse.json({ success: true, created: created.length });
  } catch (error) {
    console.error('Erro ao processar recorrências:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}