import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie, clearRefreshTokenCookie, revokeAllRefreshTokens, getFullUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  // Revoke all refresh tokens for the user
  const user = await getFullUserFromRequest(request);
  if (user) {
    await revokeAllRefreshTokens(user.id);
  }

  const response = NextResponse.json({
    success: true,
    message: 'Logout efetuado com sucesso',
  });

  clearAuthCookie(response);
  clearRefreshTokenCookie(response);

  return response;
}
