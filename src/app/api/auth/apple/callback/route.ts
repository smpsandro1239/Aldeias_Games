import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { handleOAuthCallback } from '@/lib/oauth-handler';
import { verifyAppleIdToken } from '@/lib/apple-auth';

export async function POST(request: NextRequest) {
  try {
    // We need to extract form data to get id_token for Apple
    const formData = await request.formData();
    const idToken = formData.get('id_token') as string | null;
    
    return await handleOAuthCallback(request, 'apple', {
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: async () => {
        const { SignJWT } = await import('jose');
        
        const now = Math.floor(Date.now() / 1000);
        const exp = now + 15777000; // 6 months in future (max allowed by Apple)

        return await new SignJWT({
          iss: process.env.APPLE_TEAM_ID!,
          iat: now,
          exp: exp,
          aud: 'https://appleid.apple.com',
          sub: process.env.APPLE_CLIENT_ID!,
        })
          .setProtectedHeader({ alg: 'ES256', kid: process.env.APPLE_KEY_ID! })
          .sign(
            // Convert the PEM private key to a format jose can use
            await import('node:crypto').then(crypto => 
              crypto.createPrivateKey(process.env.APPLE_PRIVATE_KEY!)
            )
          );
      },
      tokenUrl: 'https://appleid.apple.com/auth/token',
      redirectUri: process.env.APPLE_REDIRECT_URI,
      scope: 'name email',
      // For Apple, we verify the ID token that came in the form data
      getUserData: async (tokenData: Record<string, unknown>) => {
        // Ignore tokenData (it's from the code exchange), use the id_token from form data
        if (!idToken) {
          throw new Error('No ID token in Apple request');
        }
        return await verifyAppleIdToken(idToken);
      },
      providerIdField: 'appleId',
      providerName: 'apple',
    });
  } catch (error) {
    logger.error('Apple OAuth callback error', { module: 'auth', error });
    return NextResponse.redirect(
      new URL('/?error=unexpected_error', request.url)
    );
  }
}