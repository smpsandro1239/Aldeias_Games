import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import { updateEventoSchema } from '@/lib/validations';
import { saveImage } from '@/lib/storage';
import { logAudit } from '@/lib/auditLog';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const evento = await prisma.evento.findUnique({
      where: { id },
      include: { aldeia: true }
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
    if (!evento) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });

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

    const updateData: any = { ...data };
    delete updateData.imagemBase64;

    if (imagemUrl) updateData.imagemUrl = imagemUrl;
    if (data.dataInicio) {
      const d = new Date(data.dataInicio);
      if (isNaN(d.getTime())) return NextResponse.json({ error: 'Data de início inválida' }, { status: 400 });
      updateData.dataInicio = d;
    }
    if (data.dataFim) {
      const d = new Date(data.dataFim);
      if (isNaN(d.getTime())) return NextResponse.json({ error: 'Data de fim inválida' }, { status: 400 });
      updateData.dataFim = d;
    }

    // Recorrência
    if (data.isRecurring !== undefined) {
      updateData.isTemplate = data.isRecurring;

      if (data.isRecurring) {
        updateData.templateNome = data.nome || evento.nome;
        updateData.frequenciaRecorrencia = data.recurrenceFrequency;
        updateData.diaSemanaRecorrencia = data.recurrenceDayOfWeek;

        // Recalcular próxima data se os parâmetros mudaram
        if (data.recurrenceFrequency && data.recurrenceDayOfWeek !== undefined && data.recurrenceTime) {
          const now = new Date();
          const [hours, minutes] = data.recurrenceTime.split(':').map(Number);

          let nextOccurrence = new Date(now);
          nextOccurrence.setHours(hours, minutes, 0, 0);

          const currentDay = nextOccurrence.getDay();
          const targetDay = data.recurrenceDayOfWeek;
          let daysToAdd = targetDay - currentDay;

          if (daysToAdd <= 0) {
            if (data.recurrenceFrequency === 'semanal') {
              daysToAdd += 7;
            } else if (data.recurrenceFrequency === 'quinzenal') {
              daysToAdd += 14;
            } else if (data.recurrenceFrequency === 'mensal') {
              nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
              nextOccurrence.setDate(1);
              while (nextOccurrence.getDay() !== targetDay) {
                nextOccurrence.setDate(nextOccurrence.getDate() + 1);
              }
            }
          } else {
            if (data.recurrenceFrequency === 'quinzenal') {
              daysToAdd += 7;
            } else if (data.recurrenceFrequency === 'mensal') {
              nextOccurrence.setMonth(nextOccurrence.getMonth() + 1);
              nextOccurrence.setDate(1);
              while (nextOccurrence.getDay() !== targetDay) {
                nextOccurrence.setDate(nextOccurrence.getDate() + 1);
              }
            }
          }

          if (data.recurrenceFrequency !== 'mensal') {
            nextOccurrence.setDate(nextOccurrence.getDate() + daysToAdd);
          }

          updateData.proximaData = nextOccurrence;
        }
      } else {
        updateData.templateNome = null;
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

     return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
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
