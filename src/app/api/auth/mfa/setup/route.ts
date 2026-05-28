import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateMFASecret, generateMFAQRCode } from '@/lib/mfa';

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if MFA is already enabled for this user
    const existingTwoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId: user.id },
    });
    if (existingTwoFactorAuth && existingTwoFactorAuth.enabled) {
      return NextResponse.json({ error: 'MFA is already enabled' }, { status: 400 });
    }

    // Generate a new secret
    const secret = generateMFASecret();
    // Generate QR code
    const qrCode = await generateMFAQRCode(user.email, secret);

    // Save the secret to the TwoFactorAuth record (MFA not enabled yet)
    await prisma.twoFactorAuth.upsert({
      where: { userId: user.id },
      update: { secret: secret },
      create: {
        userId: user.id,
        secret: secret,
        enabled: false,
      },
    });

    return NextResponse.json({
      secret,
      qrCode,
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
