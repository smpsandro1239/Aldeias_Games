import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validations';
import { hashPassword, generateToken } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkRateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIdentifier } from '@/lib/rate-limit';
import { generateSlug } from '@/lib/utils';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, rateLimitConfigs.register);

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.resetTime);
    }

    // Parse e validação do body
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { nome, email, password, telefone, role, tipoOrganizacao, aldeiaId: aldeiaIdFromBody } = validation.data;

    // Verificar se email já existe - mensagem genérica (não revelar se existe)
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      // Mensagem genérica para prevenir enumeração de emails
      return NextResponse.json({
        success: true,
        message: 'Se o email existir e não estiver verificado, receberá instruções de verificação',
      });
    }

    // Hash da password
    const hashedPassword = await hashPassword(password);

    // Criar utilizador (sempre com papel 'user')
    let aldeiaId = aldeiaIdFromBody || undefined;
    const isNewOrganization = false;

    // Gerar token de verificação de email
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Criar utilizador (email não verificado)
    const user = await prisma.user.create({
      data: {
        nome,
        email: email.toLowerCase(),
        password: hashedPassword,
        telefone,
        role: 'user',
        aldeiaId,
        emailVerificado: false,
        notificacoesEmail: true,
      },
      include: {
        aldeia: true,
      },
    });

    // Criar notificação de boas-vindas
    await prisma.notificacao.create({
      data: {
        tipo: 'sistema',
        titulo: 'Bem-vindo ao Aldeias Games!',
        mensagem: 'A sua conta foi criada com sucesso. Por favor verifique o seu email para ativar a conta.',
        userId: user.id,
      },
    });

    // Enviar email de verificação
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${emailVerificationToken}`;
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Verificação de Email - Aldeias Games',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verificação de Email</h2>
            <p>Olá ${user.nome},</p>
            <p>Obrigado por se registar no Aldeias Games!</p>
            <p>Clique no botão abaixo para verificar o seu email:</p>
            <a href="${verifyUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
              Verificar Email
            </a>
            <p>Este link expira em 24 horas.</p>
            <p>Se não se registou, ignore este email.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Erro ao enviar email de verificação:', emailError);
    }

    // Armazenar token de verificação na DB (usando passwordResets temporariamente)
    // TODO: Criar modelo EmailVerification dedicado no schema
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: emailVerificationToken,
        expires: emailVerificationExpires,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Registo efetuado com sucesso. Por favor verifique o seu email para ativar a conta.',
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        telefone: user.telefone,
        role: user.role,
        aldeiaId: user.aldeiaId as string,
        aldeia: user.aldeia,
        emailVerificado: false,
      },
      isNewOrganization,
    }, { status: 201 });
  } catch (error) {
    console.error('Erro no registo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
