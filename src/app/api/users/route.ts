import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import { createUserSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const aldeiaId = searchParams.get('aldeiaId');

    const where: Prisma.UserWhereInput = {};
    if (user.role === 'aldeia_admin') {
      where.aldeiaId = user.aldeiaId;
    } else if (aldeiaId) {
      where.aldeiaId = aldeiaId;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        role: true,
        aldeiaId: true,
        emailVerificado: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: users });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await getFullUserFromRequest(request);

    if (!adminUser || !hasRole(adminUser.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.errors }, { status: 400 });
    }

    const data = validation.data;

    if (adminUser.role === 'aldeia_admin') {
      if (data.role === 'super_admin') {
         return NextResponse.json({ error: 'Não pode criar super_admin' }, { status: 403 });
      }
      data.aldeiaId = adminUser.aldeiaId as string;
    }

    // Validação de aldeia obrigatória para certos papéis
    if ((data.role === 'vendedor' || data.role === 'aldeia_admin') && !data.aldeiaId) {
      return NextResponse.json(
        { error: 'Vendedores e administradores de aldeia devem estar vinculados a uma aldeia' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: 'Email já registado' }, { status: 400 });
    }

    // Validate aldeiaId references an existing aldeia
    if (data.aldeiaId) {
      const aldeiaExists = await prisma.aldeia.findUnique({
        where: { id: data.aldeiaId },
        select: { id: true }
      });
      if (!aldeiaExists) {
        return NextResponse.json({ error: 'Aldeia não encontrada' }, { status: 400 });
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        nome: data.nome,
        email: data.email,
        password: hashedPassword,
        telefone: data.telefone,
        role: data.role as any,
        aldeiaId: data.aldeiaId,
      },
      select: { id: true, nome: true, email: true, role: true, aldeiaId: true }
    });

    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
