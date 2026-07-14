import { NextRequest, NextResponse } from 'next/server';
import { generateToken, setAuthCookie } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { verifyToken } from '@/lib/auth';
// @ts-ignore
import type { User } from '@prisma/client';
import { verifyAppleIdToken } from '@/lib/apple-auth';

/**
 * Generic OAuth callback handler for providers like Google and Apple
 * Handles the common logic: code exchange, token verification, user lookup/creation, account linking
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
    // Provider-specific function to get user data from token response
    getUserData: (tokenData: any) => Promise<any>;
    // Field in User model to store the provider ID
    providerIdField: keyof User;
    // Provider name for logging
    providerName: string;
  }
) {
  try {
    // Handle different HTTP methods for different providers
    // Apple uses POST for callback, Google uses GET
    const formData = await request.formData();
    const code = formData.get('code') as string | null;
    const state = formData.get('state') as string | null;
    const error = formData.get('error') as string | null;

    // Handle provider-specific errors
    if (error) {
      logger.error(`${options.providerName} OAuth error`, {
        module: 'auth',
        provider: options.providerName,
        error
      });
      return NextResponse.redirect(
        new URL(`/?error=${options.providerName}_sign_in_failed`, request.url)
      );
    }

    // CSRF protection using state parameter
    const storedState = request.cookies.get(`${options.providerName.toLowerCase()}_oauth_state`)?.value;
    if (!state || state !== storedState) {
      logger.warn(`Invalid ${options.providerName} OAuth state`, {
        module: 'auth',
        provider: options.providerName,
        state,
        storedState
      });
      return NextResponse.redirect(
        new URL('/?error=invalid_state', request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(`/?error=missing_${options.providerName}_code`, request.url)
      );
    }

    // Exchange authorization code for tokens
    const clientSecret = typeof options.clientSecret === 'function'
      ? await options.clientSecret()
      : options.clientSecret;

    const tokenResponse = await fetch(options.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: options.clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: options.redirectUri ||
          `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/${provider}/callback`,
        ...(options.scope ? { scope: options.scope } : {}),
      }),
    });

    if (!tokenResponse.ok) {
      logger.error(`Failed to exchange ${options.providerName} auth code`, {
        module: 'auth',
        provider: options.providerName,
        status: tokenResponse.status,
        body: await tokenResponse.text(),
      });
      return NextResponse.redirect(
        new URL(`/?error=${options.providerName}_token_exchange_failed`, request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Get user data from the provider (ID token verification happens here)
    const userData = await options.getUserData(tokenData);

    const { email, name, providerId, email_verified: emailVerified } = userData;

    if (!email) {
      return NextResponse.redirect(
        new URL(`/?error=${options.providerName}_no_email`, request.url)
      );
    }

    // For Apple, verify email is verified (important for privacy)
    if (options.providerName === 'apple' && !emailVerified) {
      return NextResponse.redirect(
        new URL('/?error=unverified_email', request.url)
      );
    }

    // Find existing user by email (case-insensitive)
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Prepare update data
    const updateData: any = {
      nome: name || email.split('@')[0],
      [options.providerIdField]: providerId,
      // Set authProvider if not already set
      ...(user && !user.authProvider ? { authProvider: options.providerName } : {}),
      // Always update last login
      ultimoLogin: new Date(),
    };

    // If user doesn't exist, create new one
    if (!user) {
      // Generate random password (required for schema but not used for OAuth login)
      const randomPassword = Math.random().toString(36).slice(-12);
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: passwordHash,
          nome: name || email.split('@')[0],
          telefone: '+351 900 000 000', // Placeholder - will be updated in onboarding
          role: 'user', // Default role for OAuth users
          emailVerificado: emailVerified ?? true, // Trust provider's verification
          saldo: 0,
          authProvider: options.providerName,
          ultimoLogin: new Date(),
          onboardingCompleted: false, // New users need onboarding
          [options.providerIdField]: providerId,
        },
      });

      logger.info(`New user created via ${options.providerName} OAuth`, {
        module: 'auth',
        provider: options.providerName,
        userId: user.id,
        email: user.email,
      });
    } else {
      // Existing user - link account (account linking)
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      logger.info(`Existing user linked with ${options.providerName} OAuth (account linking)`, {
        module: 'auth',
        provider: options.providerName,
        userId: user.id,
        email: user.email,
        providerId: providerId,
      });
    }

    // Generate JWT token for the user
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      aldeiaId: user.aldeiaId || undefined,
    });

    // Check if onboarding is needed
    const needsOnboarding = !user.onboardingCompleted;

    // Create redirect response
    let redirectUrl = new URL('/', request.url);

    if (needsOnboarding) {
      // Redirect to onboarding page
      redirectUrl = new URL('/onboarding', request.url);
    } else {
      // Redirect to appropriate dashboard based on role
      const role = user.role;
      if (role === 'super_admin') {
        redirectUrl = new URL('/admin', request.url);
      } else if (role === 'aldeia_admin') {
        redirectUrl = new URL('/aldeia/dashboard', request.url);
      } else if (role === 'vendedor') {
        redirectUrl = new URL('/vendedor/dashboard', request.url);
      } else {
        redirectUrl = new URL('/jogador/dashboard', request.url);
      }
    }

    const response = NextResponse.redirect(redirectUrl);

    // Set secure httpOnly cookie
    setAuthCookie(response, token);

    // Clear the state cookie
    response.cookies.set({
      name: `${options.providerName.toLowerCase()}_oauth_state`,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    logger.info(`${options.providerName} OAuth login successful`, {
      module: 'auth',
      provider: options.providerName,
      userId: user.id,
      email: user.email,
      role: user.role,
      needsOnboarding,
    });

    return response;
  } catch (error) {
    logger.error(`${options.providerName} OAuth error`, {
      module: 'auth',
      provider: options.providerName,
      error
    });
    // Generic error fallback
    return NextResponse.redirect(
      new URL('/?error=unexpected_error', request.url)
    );
  }
}