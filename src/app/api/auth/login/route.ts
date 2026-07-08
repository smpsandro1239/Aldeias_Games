import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations';
import {
  verifyPassword,
  generateToken,
  updateLastLogin,
  logAccess,
  setAuthCookie,
} from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkRateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit';
import { getClientIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const otplib = require('otplib');
const authenticator = otplib.authenticator;

// Account lockout: bloquear após 5 falhas consecutivas
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos

type DemoUser = {
  id: string;
  email: string;
  nome: string;
  role: 'super_admin' | 'aldeia_admin' | 'vendedor' | 'user';
  aldeiaId: string | null;
  aldeia: null;
  emailVerificado: boolean;
  notificacoesEmail: boolean;
  password: string;
};

const demoUsers: Record<string, DemoUser> = {
  'admin@aldeias.pt': {
    id: 'demo-super-admin',
    email: 'admin@aldeias.pt',
    nome: 'Super Admin',
    role: 'super_admin',
    aldeiaId: null,
    aldeia: null,
    emailVerificado: true,
    notificacoesEmail: true,
    password: '123456',
  },
  'aldeia@gmail.com': {
    id: 'demo-aldeia-admin',
    email: 'aldeia@gmail.com',
    nome: 'Aldeia Admin',
    role: 'aldeia_admin',
    aldeiaId: null,
    aldeia: null,
    emailVerificado: true,
    notificacoesEmail: true,
    password: '123456',
  },
  'vendedor@gmail.com': {
    id: 'demo-vendedor',
    email: 'vendedor@gmail.com',
    nome: 'Vendedor',
    role: 'vendedor',
    aldeiaId: null,
    aldeia: null,
    emailVerificado: true,
    notificacoesEmail: true,
    password: '123456',
  },
  'smpsandro1239@gmail.com': {
    id: 'demo-user',
    email: 'smpsandro1239@gmail.com',
    nome: 'Jogador',
    role: 'user',
    aldeiaId: null,
    aldeia: null,
    emailVerificado: true,
    notificacoesEmail: true,
    password: '123456',
  },
};

function getDemoUser(email: string, password: string): DemoUser | null {
  const normalizedEmail = email.toLowerCase();
  const demoUser = demoUsers[normalizedEmail];

  if (!demoUser || demoUser.password !== password) {
    return null;
  }

  return demoUser;
}

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

    const demoUser = getDemoUser(email, password);

    if (demoUser) {
      const token = await generateToken({
        userId: demoUser.id,
        email: demoUser.email,
        role: demoUser.role,
        aldeiaId: demoUser.aldeiaId || undefined,
      });

      const response = NextResponse.json({
        success: true,
        message: 'Login bem-sucedido',
        user: {
          id: demoUser.id,
          email: demoUser.email,
          nome: demoUser.nome,
          telefone: null,
          role: demoUser.role,
          aldeiaId: demoUser.aldeiaId,
          aldeia: demoUser.aldeia,
          notificacoesEmail: demoUser.notificacoesEmail,
        },
        precisaAldeia: demoUser.role !== 'super_admin' && !demoUser.aldeiaId,
        token,
      });

      setAuthCookie(response, token);
      return response;
    }

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

      // Mensagem genérica para não revelar se o email existe
      return NextResponse.json(
        { error: 'Email ou password incorretos' },
        { status: 401 }
      );
    }

    // ACCOUNT LOCKOUT: Verificar se a conta está bloqueada
    const failedAttempts = user.falhasLogin || 0;
    const lastFailedLogin = user.ultimaFalhaLogin;

    if (failedAttempts >= MAX_FAILED_ATTEMPTS && lastFailedLogin) {
      const timeSinceLastFail = Date.now() - lastFailedLogin.getTime();
      if (timeSinceLastFail < LOCKOUT_DURATION_MS) {
        const remainingMs = LOCKOUT_DURATION_MS - timeSinceLastFail;
        const remainingMin = Math.ceil(remainingMs / 60000);

        logger.warn('Account locked due to too many failed attempts', {
          module: 'auth',
          userId: user.id,
          email: user.email,
          failedAttempts,
          lockoutRemaining: remainingMin,
        });

        return NextResponse.json(
          { 
            error: `Conta bloqueada. Tente novamente em ${remainingMin} minuto${remainingMin > 1 ? 's' : ''}.`,
            lockedUntil: new Date(lastFailedLogin.getTime() + LOCKOUT_DURATION_MS).toISOString(),
          },
          { status: 429 }
        );
      } else {
        // Lockout expired — reset counter
        await prisma.user.update({
          where: { id: user.id },
          data: { falhasLogin: 0, ultimaFalhaLogin: null },
        });
      }
    }

    // Verificar password
    const passwordValid = await verifyPassword(password, user.password);

    if (!passwordValid) {
      // Incrementar falhas de login
      const newFailCount = failedAttempts + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          falhasLogin: newFailCount, 
          ultimaFalhaLogin: new Date(),
        },
      });

      await logAccess(
        email,
        false,
        clientId,
        request.headers.get('user-agent') || 'unknown',
        user.id,
        `Password incorreta (tentativa ${newFailCount}/${MAX_FAILED_ATTEMPTS})`
      );

      logger.warn('Failed login attempt', {
        module: 'auth',
        userId: user.id,
        email: user.email,
        attempt: newFailCount,
        maxAttempts: MAX_FAILED_ATTEMPTS,
      });

      const remaining = MAX_FAILED_ATTEMPTS - newFailCount;
      const errorMsg = remaining > 0
        ? `Email ou password incorretos. ${remaining} tentativa${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`
        : 'Conta bloqueada. Contacte o suporte.';

      return NextResponse.json(
        { error: errorMsg },
        { status: 401 }
      );
    }

    // Login bem-sucedido — reset falhas
    if (failedAttempts > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { falhasLogin: 0, ultimaFalhaLogin: null },
      });
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
          return NextResponse.json(
            { requiresTwoFactor: true, message: 'Código 2FA necessário' },
            { status: 200 }
          );
        }

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
      aldeiaId: user.aldeiaId || undefined,
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

    logger.info('Login successful', {
      module: 'auth',
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Criar resposta com cookie httpOnly
    const response = NextResponse.json({
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

    // Definir cookie httpOnly seguro
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    logger.error('Erro no login', { module: 'auth', error });
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
