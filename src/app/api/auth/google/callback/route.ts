import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { handleOAuthCallback } from '@/lib/oauth-handler';
import { verifyGoogleIdToken } from '@/lib/oauth';

export async function GET(request: NextRequest) {
  try {
    return await handleOAuthCallback(request, 'google', {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      tokenUrl: 'https://oauth2.googleapis.com/token',
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      scope: 'openid email profile',
      getUserData: async (tokenData: any) => {
        const { id_token } = tokenData;
        if (!id_token) {
          throw new Error('No ID token in Google response');
        }
        return await verifyGoogleIdToken(id_token);
      },
      providerIdField: 'googleId',
      providerName: 'google',
    });
  } catch (error) {
    logger.error('Google OAuth callback error', { module: 'auth', error });
    return NextResponse.redirect(
      new URL('/?error=unexpected_error', request.url)
    );
  }
}