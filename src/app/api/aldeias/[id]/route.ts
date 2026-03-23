import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import { updateAldeiaSchema } from '@/lib/validations';
import { saveImage } from '@/lib/storage';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const aldeia = await prisma.aldeia.findUnique({
      where: { id },
      include: {
        plano: true,
      },
    });

    if (!aldeia) {
      return NextResponse.json({ error: 'Aldeia não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ data: aldeia });
  } catch (error) {
    console.error('Erro ao buscar aldeia:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getFullUserFromRequest(request);

    if (!user || (!hasRole(user.role, ['super_admin', 'aldeia_admin']))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }
    
    // Se for admin de aldeia, só edita a sua própria
    if (user.role === 'aldeia_admin' && user.aldeiaId !== id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateAldeiaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.errors }, { status: 400 });
    }

    const data = validation.data;

    let logoUrl = undefined;
    if (data.logoBase64) {
      const saved = await saveImage(data.logoBase64, 'aldeias');
      logoUrl = saved.url;
    }

    const updateData: any = { ...data };
    delete updateData.logoBase64;
    if (logoUrl) {
      updateData.logoUrl = logoUrl;
    }

    const aldeia = await prisma.aldeia.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: aldeia });
  } catch (error) {
    console.error('Erro ao atualizar aldeia:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getFullUserFromRequest(request);

    // Só superadmin pode eliminar aldeias
    if (!user || !hasRole(user.role, ['super_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    await prisma.aldeia.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao eliminar aldeia:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
