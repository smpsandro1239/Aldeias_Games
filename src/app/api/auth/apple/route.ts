import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { handleOAuthCallback } from '@/lib/oauth-handler';

export async function POST(request: NextRequest) {
  try {
    return await handleOAuthCallback(request, 'apple', {
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: async () => {
        const { SignJWT } = await import('jose');
        
        const now = Math.floor(Date.now() / 1000);
        const exp = now + 15777000; // 6 meses no futuro (máximo permitido pela Apple)

        return await new SignJWT({
          iss: process.env.APPLE_TEAM_ID!,
          iat: now,
          exp: exp,
          aud: 'https://appleid.apple.com',
          sub: process.env.APPLE_CLIENT_ID!,
        })
          .setProtectedHeader({ alg: 'ES256', kid: process.env.APPLE_KEY_ID! })
          .sign(
            // Converter a chave privada PEM para um formato que o jose possa usar
            await import('node:crypto').then(crypto => 
              crypto.createPrivateKey(process.env.APPLE_PRIVATE_KEY!)
            )
          );
      },
      tokenUrl: 'https://appleid.apple.com/auth/token',
      // Apple usa POST para o callback, mas nosso handler espera GET... vamos adaptar
      redirectUri: process.env.APPLE_REDIRECT_URI,
      scope: 'name email',
      // Para Apple, recebemos o id_token diretamente no form data (não no token response)
      getUserData: async (tokenData: any) => {
        // Para Apple, o id_token vem no form data original, não no token response
        // Vamos precisar acessar o form data original - vamos mudar nossa abordagem
        throw new Error('Apple implementation needs to access original form data');
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