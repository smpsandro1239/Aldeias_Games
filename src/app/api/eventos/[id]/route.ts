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
  console.log('PUT /api/eventos/[id] - Function called');
  try {
    console.log('PUT /api/eventos/[id] - Starting update for event:', await context.params);

    const { id } = await context.params;
    const user = await getFullUserFromRequest(request);

    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      console.log('PUT /api/eventos/[id] - Unauthorized user:', user?.role);
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const evento = await prisma.evento.findUnique({ where: { id } });
    if (!evento) {
      console.log('PUT /api/eventos/[id] - Event not found:', id);
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    if (user.role === 'aldeia_admin' && user.aldeiaId !== evento.aldeiaId) {
      console.log('PUT /api/eventos/[id] - User not authorized for this aldeia:', user.aldeiaId, evento.aldeiaId);
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    console.log('PUT /api/eventos/[id] - About to read request body');
    const body = await request.json();
    console.log('PUT /api/eventos/[id] - Received body:', body);

    console.log('PUT /api/eventos/[id] - About to validate');
    const validation = updateEventoSchema.safeParse(body);
    console.log('PUT /api/eventos/[id] - Validation result:', validation.success);

    if (!validation.success) {
      console.log('PUT /api/eventos/[id] - Validation failed:', validation.error.errors);
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.errors }, { status: 400 });
    }

    const data = validation.data;
    console.log('PUT /api/eventos/[id] - Validated data:', data);
    let imagemUrl = undefined;
    if (data.imagemBase64) {
      const saved = await saveImage(data.imagemBase64, 'eventos');
      imagemUrl = saved.url;
    }

    const updateData: any = { ...data };
    delete updateData.imagemBase64;

    console.log('PUT /api/eventos/[id] - Preparing updateData:', updateData);

    if (imagemUrl) updateData.imagemUrl = imagemUrl;
    if (data.dataInicio) {
      const d = new Date(data.dataInicio);
      if (isNaN(d.getTime())) {
        console.log('PUT /api/eventos/[id] - Invalid start date:', data.dataInicio);
        return NextResponse.json({ error: 'Data de início inválida' }, { status: 400 });
      }
      updateData.dataInicio = d;
    }
    if (data.dataFim) {
      const d = new Date(data.dataFim);
      if (isNaN(d.getTime())) {
        console.log('PUT /api/eventos/[id] - Invalid end date:', data.dataFim);
        return NextResponse.json({ error: 'Data de fim inválida' }, { status: 400 });
      }
      updateData.dataFim = d;
    }

    console.log('PUT /api/eventos/[id] - Final updateData:', updateData);

    // Recorrência - Temporariamente desabilitado para debug
    console.log('PUT /api/eventos/[id] - Skipping recurrence processing for debug');
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
            console.log('PUT /api/eventos/[id] - Next occurrence calculated:', nextOccurrence);
  } catch (error) {
    console.error('PUT /api/eventos/[id] - Error updating event:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
        }
      } else {
        updateData.templateNome = null;
        updateData.frequenciaRecorrencia = null;
        updateData.diaSemanaRecorrencia = null;
        updateData.proximaData = null;
      }
    }

    console.log('PUT /api/eventos/[id] - Updating event in database');
    const updated = await prisma.evento.update({
      where: { id },
      data: updateData,
    });

    console.log('PUT /api/eventos/[id] - Event updated successfully:', updated.id);

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

    console.log('PUT /api/eventos/[id] - Audit log created, returning success');
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
