import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hashPassword, verifyPassword } from '@/lib/auth';

// GET - Verificar se PIN está configurado
export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { vaultPinEnabled: true },
    });

    return NextResponse.json({
      success: true,
      data: { vaultPinEnabled: dbUser?.vaultPinEnabled ?? false },
    });
  } catch (error) {
    console.error('Error checking vault PIN:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Configurar ou verificar PIN
export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const { action, pin, password, confirmPin } = body;

    if (action === 'setup') {
      if (!pin || !password) {
        return NextResponse.json({ error: 'PIN e password são obrigatórios' }, { status: 400 });
      }
      if (!/^\d{4,6}$/.test(pin)) {
        return NextResponse.json({ error: 'PIN deve ter 4 a 6 dígitos' }, { status: 400 });
      }
      if (confirmPin && pin !== confirmPin) {
        return NextResponse.json({ error: 'PINs não coincidem' }, { status: 400 });
      }

      const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: { password: true } });
      if (!fullUser) {
        return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
      }

      const validPassword = await verifyPassword(password, fullUser.password);
      if (!validPassword) {
        return NextResponse.json({ error: 'Password incorreta' }, { status: 401 });
      }

      const hashedPin = await hashPassword(pin);
      await prisma.user.update({
        where: { id: user.id },
        data: { vaultPin: hashedPin, vaultPinEnabled: true },
      });

      return NextResponse.json({ success: true, message: 'PIN configurado com sucesso' });
    }

    if (action === 'verify') {
      if (!pin) {
        return NextResponse.json({ error: 'PIN é obrigatório' }, { status: 400 });
      }

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { vaultPin: true, vaultPinEnabled: true, aldeiaId: true },
      });

      if (!fullUser || !fullUser.vaultPinEnabled || !fullUser.vaultPin) {
        return NextResponse.json({ error: 'PIN não configurado' }, { status: 400 });
      }

      const validPin = await verifyPassword(pin, fullUser.vaultPin);
      if (!validPin) {
        return NextResponse.json({ error: 'PIN incorreta' }, { status: 401 });
      }

      if (!fullUser.aldeiaId) {
        return NextResponse.json({ error: 'Aldeia não associada' }, { status: 400 });
      }

      const vault = await prisma.vault.findUnique({
        where: { aldeiaId: fullUser.aldeiaId },
        select: { saldo: true },
      });

      return NextResponse.json({
        success: true,
        data: { saldo: vault?.saldo ?? 0 },
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Error with vault PIN:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
