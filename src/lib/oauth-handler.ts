import { NextRequest, NextResponse } from 'next/server';
import { generateToken, setAuthCookie } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { User } from '@prisma/client';

/**
 * Generic OAuth callback handler for providers like Google and Apple
 */
export async function handleOAuthCallback(
  request: NextRequest,
  provider: 'google' | 'apple',
  options: {
    clientId: string;
    clientSecret: string | (() => Promise<string>);
    tokenUrl: string;
    redirectUri?: string;
    scope?: string;
    getUserData: (tokenData: any) => Promise<any>;
    providerIdField: keyof User;
    providerName: string;
  }
) {
  try {
    let code: string | null = null;
    let state: string | null = null;
    let error: string | null = null;

    if (request.method === 'POST') {
      const formData = await request.formData();
      code = formData.get('code') as string | null;
      state = formData.get('state') as string | null;
      error = formData.get('error') as string | null;
    } else {
      const { searchParams } = new URL(request.url);
      code = searchParams.get('code');
      state = searchParams.get('state');
      error = searchParams.get('error');
    }

    if (error) {
      logger.error(`${options.providerName} OAuth error`, { module: 'auth', provider: options.providerName, error });
      return NextResponse.redirect(new URL(`/?error=${options.providerName}_sign_in_failed`, request.url));
    }

    const storedState = request.cookies.get(`${options.providerName.toLowerCase()}_oauth_state`)?.value;
    if (!state || state !== storedState) {
      logger.warn(`Invalid ${options.providerName} OAuth state`, { module: 'auth', state, storedState });
      return NextResponse.redirect(new URL('/?error=invalid_state', request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL(`/?error=missing_${options.providerName}_code`, request.url));
    }

    const clientSecret = typeof options.clientSecret === 'function' ? await options.clientSecret() : options.clientSecret;

    const tokenResponse = await fetch(options.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: options.clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: options.redirectUri || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/${provider}/callback`,
        ...(options.scope ? { scope: options.scope } : {}),
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL(`/?error=${options.providerName}_token_exchange_failed`, request.url));
    }

    const tokenData = await tokenResponse.json();
    const userData = await options.getUserData(tokenData);
    const { email, name, providerId, email_verified: emailVerified } = userData;

    if (!email) {
      return NextResponse.redirect(new URL(`/?error=${options.providerName}_no_email`, request.url));
    }

    let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-12);
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: passwordHash,
          nome: name || email.split('@')[0],
          telefone: '+351 900 000 000',
          role: 'user',
          emailVerificado: emailVerified ?? true,
          saldo: 0,
          authProvider: options.providerName,
          ultimoLogin: new Date(),
          onboardingCompleted: false,
          [options.providerIdField]: providerId,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          [options.providerIdField]: providerId,
          ultimoLogin: new Date(),
          ...(user.authProvider ? {} : { authProvider: options.providerName })
        },
      });
    }

    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      aldeiaId: user.aldeiaId || undefined,
    });

    const response = NextResponse.redirect(new URL(user.onboardingCompleted ? '/' : '/onboarding', request.url));
    setAuthCookie(response, token);
    response.cookies.set({
      name: `${options.providerName.toLowerCase()}_oauth_state`,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    logger.error(`${options.providerName} OAuth error`, { module: 'auth', error });
    return NextResponse.redirect(new URL('/?error=unexpected_error', request.url));
  }
}
