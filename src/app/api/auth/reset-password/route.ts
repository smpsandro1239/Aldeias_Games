import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hash } from 'bcryptjs';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, nome: true, email: true },
    });

    // Mensagem genérica - não revelar se email existe
    const genericMessage = 'Se o email existir, receberá um link de recuperação';

    if (!user) {
      return NextResponse.json({
        success: true,
        message: genericMessage,
      });
    }

    // Gerar token e hash
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Invalidar tokens anteriores não utilizados
    await prisma.passwordReset.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Armazenar hash do token (não o token em si)
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expires,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Recuperação de Password - Aldeias Games',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Recuperação de Password</h2>
            <p>Olá ${user.nome},</p>
            <p>Recebemos um pedido para recuperação da sua password.</p>
            <p>Clique no botão abaixo para criar uma nova password:</p>
            <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
              Recuperar Password
            </a>
            <p>Este link expira em 15 minutos.</p>
            <p>Se não pediu esta recuperação, ignore este email.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: genericMessage,
    });
  } catch (error) {
    console.error('Erro ao processar pedido de recuperação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
