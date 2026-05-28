import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateToken } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token é obrigatório' }, { status: 400 });
    }

    // Hash do token para comparar com o armazenado
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Procurar token na tabela de password_resets (reutilizada para email verification)
    const verification = await prisma.passwordReset.findUnique({
      where: { token: tokenHash },
    });

    if (!verification) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
    }

    if (verification.used) {
      return NextResponse.json({ error: 'Token já foi utilizado' }, { status: 400 });
    }

    if (new Date() > verification.expires) {
      return NextResponse.json({ error: 'Token expirou. Por favor registe-se novamente.' }, { status: 400 });
    }

    // Marcar email como verificado
    const user = await prisma.user.update({
      where: { id: verification.id },
      data: { emailVerificado: true },
      include: { aldeia: true },
    });

    // Marcar token como usado
    await prisma.passwordReset.update({
      where: { id: verification.id },
      data: { used: true },
    });

    // Gerar JWT para login automático
    const jwtToken = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      aldeiaId: user.aldeiaId as string,
    });

    return NextResponse.json({
      success: true,
      message: 'Email verificado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        telefone: user.telefone,
        role: user.role,
        aldeiaId: user.aldeiaId,
        aldeia: user.aldeia,
        emailVerificado: true,
      },
      token: jwtToken,
    });
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// Reenviar email de verificação
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Mensagem genérica
    const genericMessage = 'Se o email existir e não estiver verificado, receberá um novo email de verificação';

    if (!user || user.emailVerificado) {
      return NextResponse.json({ success: true, message: genericMessage });
    }

    // Invalidar tokens anteriores
    await prisma.passwordReset.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Gerar novo token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expires,
      },
    });

    // Enviar email
    const { sendEmail } = await import('@/lib/email');
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Verificação de Email - Aldeias Games',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verificação de Email</h2>
            <p>Olá ${user.nome},</p>
            <p>Aqui está o seu novo link de verificação:</p>
            <a href="${verifyUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
              Verificar Email
            </a>
            <p>Este link expira em 24 horas.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
    }

    return NextResponse.json({ success: true, message: genericMessage });
  } catch (error) {
    console.error('Erro ao reenviar verificação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
