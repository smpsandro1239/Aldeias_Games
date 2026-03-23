import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import { updateEventoSchema } from '@/lib/validations';
import { saveImage } from '@/lib/storage';

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

    const updated = await prisma.evento.update({
      where: { id },
      data: updateData,
    });

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
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
