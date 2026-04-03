import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations';
import {
  verifyPassword,
  generateToken,
  updateLastLogin,
  logAccess,
} from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkRateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIdentifier } from '@/lib/rate-limit';

const otplib = require('otplib');
const authenticator = otplib.authenticator;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, rateLimitConfigs.login);

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.resetTime);
    }

    // Parse e validação do body
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      await logAccess(
        body.email || 'unknown',
        false,
        clientId,
        request.headers.get('user-agent') || 'unknown',
        undefined,
        'Dados de login inválidos'
      );

      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, password, totpCode } = validation.data;

    // Buscar utilizador
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        aldeia: true,
      },
    });

    if (!user) {
      await logAccess(
        email,
        false,
        clientId,
        request.headers.get('user-agent') || 'unknown',
        undefined,
        'Utilizador não encontrado'
      );

      return NextResponse.json(
        { error: 'Email ou password incorretos' },
        { status: 401 }
      );
    }

    // Verificar password
    const passwordValid = await verifyPassword(password, user.password);

    if (!passwordValid) {
      await logAccess(
        email,
        false,
        clientId,
        request.headers.get('user-agent') || 'unknown',
        user.id,
        'Password incorreta'
      );

      return NextResponse.json(
        { error: 'Email ou password incorretos' },
        { status: 401 }
      );
    }

    // Verificar se email está verificado
    if (!user.emailVerificado) {
      return NextResponse.json(
        { error: 'Email não verificado. Por favor verifique o seu email antes de fazer login.' },
        { status: 403 }
      );
    }

    // Verificar 2FA para roles admin
    const requiresTwoFactor = user.role === 'super_admin' || user.role === 'aldeia_admin';
    
    if (requiresTwoFactor) {
      const tfa = await prisma.twoFactorAuth.findUnique({
        where: { userId: user.id },
      });

      if (tfa?.enabled) {
        if (!totpCode) {
          // 2FA é necessário mas não foi fornecido
          return NextResponse.json(
            { requiresTwoFactor: true, message: 'Código 2FA necessário' },
            { status: 200 }
          );
        }

        // Verificar código 2FA
        const isValidCode = authenticator.verify({
          token: totpCode,
          secret: tfa.secret,
        });

        if (!isValidCode) {
          await logAccess(
            email,
            false,
            clientId,
            request.headers.get('user-agent') || 'unknown',
            user.id,
            'Código 2FA inválido'
          );

          return NextResponse.json(
            { error: 'Código 2FA inválido' },
            { status: 401 }
          );
        }
      }
    }

    // Gerar token JWT
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      aldeiaId: user.aldeiaId as string,
    });

    // Atualizar último login
    await updateLastLogin(user.id);

    // Registar log de acesso bem-sucedido
    await logAccess(
      email,
      true,
      clientId,
      request.headers.get('user-agent') || 'unknown',
      user.id
    );

    // Resposta
    return NextResponse.json({
      success: true,
      message: 'Login bem-sucedido',
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        telefone: user.telefone,
        role: user.role,
        aldeiaId: user.aldeiaId as string | null,
        aldeia: user.aldeia,
        notificacoesEmail: user.notificacoesEmail,
      },
      precisaAldeia: user.role !== 'super_admin' && !user.aldeiaId,
      token,
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
