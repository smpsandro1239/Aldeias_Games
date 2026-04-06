import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Logout efetuado com sucesso',
  });

  // Limpar cookie httpOnly
  clearAuthCookie(response);

  return response;
}
