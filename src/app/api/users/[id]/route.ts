import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const adminUser = await getFullUserFromRequest(request);
    
    if (!adminUser || !hasRole(adminUser.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, nome: true, email: true, telefone: true, role: true, aldeiaId: true }
    });

    if (!targetUser) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    if (adminUser.role === 'aldeia_admin' && adminUser.aldeiaId !== targetUser.aldeiaId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    return NextResponse.json({ data: targetUser });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const adminUser = await getFullUserFromRequest(request);
    
    if (!adminUser || !hasRole(adminUser.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    if (adminUser.role === 'aldeia_admin' && adminUser.aldeiaId !== targetUser.aldeiaId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const updateData: any = {};
    if (body.nome) updateData.nome = body.nome;
    if (body.telefone !== undefined) updateData.telefone = body.telefone;
    if (body.role) {
       if (adminUser.role === 'aldeia_admin' && body.role === 'super_admin') {
         return NextResponse.json({ error: 'Proibido' }, { status: 403 });
       }
       updateData.role = body.role;
    }
    if (body.aldeiaId !== undefined && adminUser.role === 'super_admin') {
       updateData.aldeiaId = body.aldeiaId === "" ? null : body.aldeiaId;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, nome: true, email: true, role: true, aldeiaId: true }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const adminUser = await getFullUserFromRequest(request);
    
    if (!adminUser || !hasRole(adminUser.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    if (adminUser.role === 'aldeia_admin' && adminUser.aldeiaId !== targetUser.aldeiaId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }
    
    if (adminUser.id === id) {
      return NextResponse.json({ error: 'Não pode eliminar o próprio utilizador' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
