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
        select: { vaultPin: true, vaultPinEnabled: true, aldeiaId: true, role: true },
      });

      if (!fullUser || !fullUser.vaultPinEnabled || !fullUser.vaultPin) {
        return NextResponse.json({ error: 'PIN não configurado' }, { status: 400 });
      }

      const validPin = await verifyPassword(pin, fullUser.vaultPin);
      if (!validPin) {
        return NextResponse.json({ error: 'PIN incorreta' }, { status: 401 });
      }

      // Super admin: ver todas as aldeias
      if (fullUser.role === 'super_admin') {
        const aldeias = await prisma.aldeia.findMany({
          where: { ativo: true },
          include: {
            vault: {
              select: { saldo: true },
            },
          },
          orderBy: { nome: 'asc' },
        });

        const data = aldeias.map((a) => ({
          aldeiaId: a.id,
          nome: a.nome,
          slug: a.slug,
          saldo: a.vault?.saldo ?? 0,
        }));

        const total = data.reduce((sum, a) => sum + a.saldo, 0);

        return NextResponse.json({
          success: true,
          data: { aldeias: data, total },
        });
      }

      // Admin de aldeia / vendedor: ver apenas a sua aldeia
      if (!fullUser.aldeiaId) {
        return NextResponse.json({ error: 'Aldeia não associada' }, { status: 400 });
      }

      const aldeia = await prisma.aldeia.findUnique({
        where: { id: fullUser.aldeiaId },
        select: {
          id: true,
          nome: true,
          slug: true,
          vault: { select: { saldo: true } },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          aldeias: [{
            aldeiaId: aldeia!.id,
            nome: aldeia!.nome,
            slug: aldeia!.slug,
            saldo: aldeia!.vault?.saldo ?? 0,
          }],
          total: aldeia!.vault?.saldo ?? 0,
        },
      });
    }

    if (action === 'admin-reset') {
      const { targetUserId } = body;
      if (!targetUserId) {
        return NextResponse.json({ error: 'targetUserId é obrigatório' }, { status: 400 });
      }

      const isAdmin = user.role === 'super_admin' || user.role === 'aldeia_admin';
      if (!isAdmin) {
        return NextResponse.json({ error: 'Apenas administradores podem repor PIN' }, { status: 403 });
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, aldeiaId: true, nome: true, vaultPinEnabled: true },
      });

      if (!targetUser) {
        return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
      }

      if (user.role === 'aldeia_admin' && targetUser.aldeiaId !== user.aldeiaId) {
        return NextResponse.json({ error: 'Não tens permissão para repor o PIN deste utilizador' }, { status: 403 });
      }

      await prisma.user.update({
        where: { id: targetUserId },
        data: { vaultPin: null, vaultPinEnabled: false },
      });

      await prisma.notificacao.create({
        data: {
          userId: targetUserId,
          tipo: 'sistema',
          titulo: 'PIN do cofre reposto',
          mensagem: `O teu PIN do cofre foi reposto por um administrador. Podes configurar um novo PIN.`,
          lida: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: `PIN de ${targetUser.nome} foi reposto com sucesso`,
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Error with vault PIN:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
