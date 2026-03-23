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

    const { email, password } = validation.data;

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
        aldeiaId: user.aldeiaId as string,
        aldeia: user.aldeia,
        notificacoesEmail: user.notificacoesEmail,
      },
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
