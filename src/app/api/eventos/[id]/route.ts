import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import { updateEventoSchema } from '@/lib/validations';
import { saveImage } from '@/lib/storage';
import { logCRUD as logAudit } from '@/lib/audit';

interface RouteContext {
  params: Promise<{ id: string }>
}

// Função robusta para calcular próxima data de recorrência
function calculateNextRecurrenceDate(
  frequency: 'semanal' | 'quinzenal' | 'mensal',
  dayOfWeek: number, // 0=Domingo, 6=Sábado
  time: string // formato HH:MM
): Date {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);

  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Horário inválido');
  }

  let nextDate = new Date(now);

  if (frequency === 'semanal') {
    // Próxima ocorrência da semana
    const currentDay = now.getDay();
    const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;

    if (daysUntilTarget === 0) {
      // Mesmo dia da semana - verificar se já passou
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const targetTime = hours * 60 + minutes;

      if (currentTime >= targetTime) {
        // Já passou hoje, próxima semana
        nextDate.setDate(now.getDate() + 7);
      }
    } else {
      // Próximo dia da semana
      nextDate.setDate(now.getDate() + daysUntilTarget);
    }
  } else if (frequency === 'quinzenal') {
    // A cada duas semanas
    const currentDay = now.getDay();
    const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;

    if (daysUntilTarget === 0) {
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const targetTime = hours * 60 + minutes;

      if (currentTime >= targetTime) {
        // Já passou, próxima quinzena
        nextDate.setDate(now.getDate() + 14);
      }
    } else {
      nextDate.setDate(now.getDate() + daysUntilTarget);
    }
  } else if (frequency === 'mensal') {
    // Todo mês no mesmo dia da semana
    const currentDay = now.getDay();
    const targetDay = dayOfWeek;

    // Encontrar o próximo mês
    nextDate.setMonth(now.getMonth() + 1);
    nextDate.setDate(1); // Primeiro dia do próximo mês

    // Encontrar o dia da semana correto
    const firstDayOfMonth = nextDate.getDay();
    const daysToAdd = (targetDay - firstDayOfMonth + 7) % 7;

    nextDate.setDate(nextDate.getDate() + daysToAdd);
  }

  // Definir horário
  nextDate.setHours(hours, minutes, 0, 0);

  return nextDate;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const evento = await prisma.evento.findUnique({
      where: { id },
      include: {
        aldeia: true,
        jogos: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            preco: true,
            stockInicial: true,
            estado: true
          }
        }
      }
    });
    if (!evento) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    return NextResponse.json({ data: evento });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getFullUserFromRequest(request);

    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const evento = await prisma.evento.findUnique({ where: { id } });
    if (!evento) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    if (user.role === 'aldeia_admin' && user.aldeiaId !== evento.aldeiaId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();

    const validation = updateEventoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.errors }, { status: 400 });
    }

    const data = validation.data;

    let imagemUrl = undefined;
    if (data.imagemBase64) {
      const saved = await saveImage(data.imagemBase64, 'eventos');
      imagemUrl = saved.url;
    }

    const updateData: Prisma.EventoUpdateInput = { ...data };
    delete updateData.imagemBase64;
    // Remover campos que não devem ir para o banco
    delete updateData.jogosSelecionados;
    delete updateData.isRecurring;
    delete updateData.recurrenceFrequency;
    delete updateData.recurrenceDayOfWeek;
    delete updateData.recurrenceTime;
    delete updateData.maxOccurrences;


    if (imagemUrl) updateData.imagemUrl = imagemUrl;
    if (data.dataInicio) {
      const d = new Date(data.dataInicio);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Data de início inválida' }, { status: 400 });
      }
      updateData.dataInicio = d;
    }
    if (data.dataFim) {
      const d = new Date(data.dataFim);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Data de fim inválida' }, { status: 400 });
      }
      updateData.dataFim = d;
    }

    // Processamento de recorrência robusto
    if (data.isRecurring !== undefined) {
      updateData.isTemplate = data.isRecurring;

      if (data.isRecurring && data.recurrenceFrequency && data.recurrenceDayOfWeek !== undefined && data.recurrenceTime) {
        try {
          const proximaData = calculateNextRecurrenceDate(
            data.recurrenceFrequency,
            data.recurrenceDayOfWeek,
            data.recurrenceTime
          );
          updateData.proximaData = proximaData;
          updateData.frequenciaRecorrencia = data.recurrenceFrequency;
          updateData.diaSemanaRecorrencia = data.recurrenceDayOfWeek;
        } catch (error) {
          console.error('❌ Erro ao calcular recorrência:', error);
          return NextResponse.json({ error: 'Erro ao calcular próxima recorrência' }, { status: 400 });
        }
      } else if (!data.isRecurring) {
        updateData.frequenciaRecorrencia = null;
        updateData.diaSemanaRecorrencia = null;
        updateData.proximaData = null;
      }
    }

    const updated = await prisma.evento.update({
      where: { id },
      data: updateData,
    });

    // Audit log for event update
    try {
      await logAudit(
        user.id,
        'update',
        'evento',
        id,
        {
          oldValues: { nome: evento.nome, estado: evento.estado, dataInicio: evento.dataInicio, dataFim: evento.dataFim },
          newValues: { nome: updated.nome, estado: updated.estado, dataInicio: updated.dataInicio, dataFim: updated.dataFim }
        },
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );
    } catch (auditError) {
      console.error('❌ Erro no audit log:', auditError);
      // Não falhar por causa do audit log
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getFullUserFromRequest(request);
    
    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const evento = await prisma.evento.findUnique({ where: { id } });
    if (!evento) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });

    if (user.role === 'aldeia_admin' && user.aldeiaId !== evento.aldeiaId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

     await prisma.evento.delete({ where: { id } });

     // Audit log
     await logAudit(
       user.id,
       'delete',
       'evento',
       id,
       { nome: evento.nome, aldeiaId: evento.aldeiaId, estado: evento.estado },
       request.headers.get('x-forwarded-for') || 'unknown',
       request.headers.get('user-agent') || 'unknown'
     );

     return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
