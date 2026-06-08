import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hash } from 'bcryptjs';
import crypto from 'crypto';

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

    // Validar complexidade da password (min 12 chars)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}$/;
    if (!passwordRegex.test(novaPassword)) {
      return NextResponse.json(
        { error: 'Password deve ter pelo menos 12 caracteres e conter: 1 maiúscula, 1 minúscula e 1 número' },
        { status: 400 }
      );
    }

    // Hash do token recebido para comparar com o armazenado
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const reset = await prisma.passwordReset.findUnique({
      where: { token: tokenHash },
    });

    if (!reset || reset.used || new Date() > reset.expires) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 });
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
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
