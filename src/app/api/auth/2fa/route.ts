import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import QRCode from 'qrcode';

const otplib = require('otplib');
const authenticator = otplib.authenticator;

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'setup') {
      const secret = authenticator.generateSecret();
      const otpauth = authenticator.keyuri(user.email, 'Aldeias Games', secret);
      
      const qrCode = await QRCode.toDataURL(otpauth);

      await prisma.twoFactorAuth.upsert({
        where: { userId: user.id },
        update: { secret, enabled: false },
        create: { userId: user.id, secret },
      });

      return NextResponse.json({
        success: true,
        secret,
        qrCode,
        message: 'Escaneie o QR Code com a sua app de autenticação',
      });
    }

    if (action === 'verify') {
      const { code } = body;
      
      const tfa = await prisma.twoFactorAuth.findUnique({
        where: { userId: user.id },
      });

      if (!tfa) {
        return NextResponse.json({ error: '2FA não configurado' }, { status: 400 });
      }

      const isValid = authenticator.verify({
        token: code,
        secret: tfa.secret,
      });

      if (!isValid) {
        return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
      }

      await prisma.twoFactorAuth.update({
        where: { userId: user.id },
        data: { enabled: true },
      });

      return NextResponse.json({
        success: true,
        message: '2FA ativado com sucesso',
      });
    }

    if (action === 'disable') {
      await prisma.twoFactorAuth.update({
        where: { userId: user.id },
        data: { enabled: false },
      });

      return NextResponse.json({
        success: true,
        message: '2FA desativado',
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar 2FA:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const tfa = await prisma.twoFactorAuth.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      enabled: tfa?.enabled || false,
    });
  } catch (error) {
    console.error('Erro ao verificar 2FA:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
