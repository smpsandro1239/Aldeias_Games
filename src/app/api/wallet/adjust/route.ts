import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { userId, valor, tipo, descricao } = await request.json();

    if (!userId || !valor) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    if (valor <= 0 && tipo !== 'cashback') {
      return NextResponse.json({ error: 'O valor deve ser positivo' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    const tipoTransacao = tipo || 'deposito';
    const descricaoTransacao = descricao || 'Ajuste de saldo pelo administrador';

    const [updatedUser, transacao] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          saldo: {
            increment: valor,
          },
        },
      }),
      prisma.transacao.create({
        data: {
          valor: valor,
          tipo: tipoTransacao as any,
          descricao: descricaoTransacao,
          referencia: user.id,
          userId: userId,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Saldo ajustado com sucesso',
      data: {
        novoSaldo: updatedUser.saldo,
        transacaoId: transacao.id,
      },
    });
  } catch (error) {
    console.error('Erro ao ajustar saldo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}