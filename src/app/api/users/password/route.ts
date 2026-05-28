import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { hash, compare } from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { passwordAtual, novaPassword } = body;

    if (!passwordAtual || !novaPassword) {
      return NextResponse.json(
        { error: 'Password atual e nova password são obrigatórias' },
        { status: 400 }
      );
    }

    if (novaPassword.length < 8) {
      return NextResponse.json(
        { error: 'Nova password deve ter pelo menos 8 caracteres' },
        { status: 400 }
      );
    }

    const userAtual = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!userAtual) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    const passwordValida = await compare(passwordAtual, userAtual.password);

    if (!passwordValida) {
      return NextResponse.json(
        { error: 'Password atual está incorreta' },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(novaPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: 'Password alterada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao alterar password:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
