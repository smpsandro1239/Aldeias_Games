import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { verifyMFAOTP } from '@/lib/mfa';

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId: userData.userId },
    });
    if (!twoFactorAuth || !twoFactorAuth.secret) {
      return NextResponse.json({ error: 'MFA secret not found. Please set up MFA first.' }, { status: 400 });
    }

    const isValid = verifyMFAOTP(token, twoFactorAuth.secret);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Enable MFA for the user
    await prisma.twoFactorAuth.update({
      where: { userId: userData.userId },
      data: { enabled: true },
    });

    return NextResponse.json({ success: true, message: 'MFA enabled successfully' });
  } catch (error) {
    console.error('MFA verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
