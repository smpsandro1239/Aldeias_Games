import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateMFASecret, generateMFAQRCode } from '@/lib/mfa';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If MFA is already enabled, return error
    if (user.mfaEnabled) {
      return NextResponse.json({ error: 'MFA is already enabled' }, { status: 400 });
    }

    // Generate a new secret
    const secret = generateMFASecret();
    // Generate QR code
    const qrCode = await generateMFAQRCode(user.email, secret);

    // Save the secret to the user (but do not enable MFA yet)
    await prisma.user.update({
      where: { id: user.id },
      data: { mfaSecret: secret },
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