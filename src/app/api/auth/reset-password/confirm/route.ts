import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hash } from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, novaPassword } = body;

    if (!token || !novaPassword) {
      return NextResponse.json(
        { error: 'Token e nova password são obrigatórios' },
        { status: 400 }
      );
    }

    if (novaPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password deve ter pelo menos 8 caracteres' },
        { status: 400 }
      );
    }

    const reset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!reset) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
    }

    if (reset.used) {
      return NextResponse.json({ error: 'Token já foi utilizado' }, { status: 400 });
    }

    if (new Date() > reset.expires) {
      return NextResponse.json({ error: 'Token expirou' }, { status: 400 });
    }

    const hashedPassword = await hash(novaPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Password alterada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao redefinir password:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
