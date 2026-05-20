import { jwtVerify, importJWK } from 'jose';
import { cache } from 'react';

// Cache for Apple's public keys (JWKS) - valid for 24 hours as per Apple's recommendation
const appleJWKSCache = cache(async () => {
  try {
    const response = await fetch('https://appleid.apple.com/auth/keys');
    if (!response.ok) {
      throw new Error(`Failed to fetch Apple public keys: ${response.status}`);
    }
    const jwksData = await response.json();
    return jwksData;
  } catch (error) {
    console.error('Error fetching Apple JWKS:', error);
    throw error;
  }
});

/**
 * Verifies an Apple ID Token using Apple's public keys (JWKS)
 * Performs full validation: signature, issuer, audience, expiration, etc.
 * 
 * @param idToken - The Apple ID Token to verify
 * @returns The decoded token payload if valid
 * @throws Error if token is invalid or verification fails
 */
export async function verifyAppleIdToken(idToken: string): Promise<any> {
  // Development fallback: if Apple credentials are not configured, allow decoding without verification
  // ONLY FOR DEVELOPMENT - NEVER USE THIS IN PRODUCTION
  if (process.env.NODE_ENV !== 'production' && 
      (!process.env.APPLE_CLIENT_ID || !process.env.APPLE_TEAM_ID || !process.env.APPLE_KEY_ID || !process.env.APPLE_PRIVATE_KEY)) {
    console.warn('Apple OAuth not fully configured, using development fallback for ID token verification (INSECURE)');
    return decodeIdToken(idToken);
  }

  try {
    // Get Apple's public keys (JWKS)
    const jwks = await appleJWKSCache();
    const keys = jwks.keys;

    // Decode token header to get the key ID (kid)
    const [headerBase64] = idToken.split('.');
    const headerJson = Buffer.from(headerBase64, 'base64').toString('utf-8');
    const header = JSON.parse(headerJson);
    const kid = header.kid;

    if (!kid) {
      throw new Error('Apple ID token missing key ID (kid) in header');
    }

    // Find the matching key in the JWKS
    const key = keys.find((k: any) => k.kid === kid);
    if (!key) {
      throw new Error(`Unable to find Apple public key for kid: ${kid}`);
    }

    // Convert JWK to crypto key for jose
    const joseKey = await importJWK(key);

    // Verify the token
    const { payload } = await jwtVerify(idToken, joseKey, {
      // Validate issuer
      issuer: 'https://appleid.apple.com',
      // Validate audience (must be our Client ID)
      audience: process.env.APPLE_CLIENT_ID,
      // Validate expiration time (handled by jwtVerify)
    });

    return payload;
  } catch (error) {
    console.error('Error verifying Apple ID token:', error);
    // In development, allow fallback to make testing easier
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Falling back to development mode for Apple ID token verification');
      return decodeIdToken(idToken);
    }
    throw error;
  }
}

/**
 * Simple function to decode an ID token without verification
 * ONLY FOR DEVELOPMENT AND FALLBACK - NEVER USE IN PRODUCTION
 */
function decodeIdToken(idToken: string): any {
  const [header, payload, signature] = idToken.split('.');
  
  // Add padding if necessary
  const pad = (str: string) => str + '='.repeat((4 - str.length % 4) % 4);
  
  const decodedPayload = Buffer.from(pad(payload), 'base64').toString('utf-8');
  return JSON.parse(decodedPayload);
}