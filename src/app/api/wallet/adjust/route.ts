import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    const body = await request.json();
    const { userId, valor, tipo, descricao, aldeiaId } = body;

    // Allow vendor to deliver money to admin
    const isVendorDelivery = tipo === 'entrega_admin' && user?.role === 'vendedor';
    
    if (!user || (!hasRole(user.role, ['super_admin', 'aldeia_admin']) && !isVendorDelivery)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Vendor delivery to admin
    if (isVendorDelivery) {
      if (!valor || valor >= 0) {
        return NextResponse.json({ error: 'Valor deve ser negativo para entrega' }, { status: 400 });
      }

      const valorAbs = Math.abs(valor);
      if (user.saldo < valorAbs) {
        return NextResponse.json({ error: 'Saldo insuficiente' }, { status: 400 });
      }

      const [updatedUser, transacao] = await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { saldo: { increment: valor } },
        }),
prisma.transacao.create({
          data: {
            valor: valor,
            tipo: 'entrega_admin' as any,
            descricao: descricao || `Entrega de dinheiro à aldeia`,
            userId: user.id,
            dadosAdicionais: {
              aldeiaId,
              entregaConfirmada: false,
            },
          },
        }),
      ]);

      // Notify admin
      const adminUsers = await prisma.user.findMany({
        where: { aldeiaId, role: 'aldeia_admin' },
        select: { id: true }
      });

      for (const admin of adminUsers) {
        await prisma.notificacao.create({
          data: {
            userId: admin.id,
            tipo: 'sistema',
            titulo: 'Dinheiro Recebido',
            mensagem: `O vendedor ${user.nome} entregou ${valorAbs}€ à aldeia.`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Entregue ${valorAbs}€ com sucesso`,
        novoSaldo: updatedUser.saldo,
      });
    }

    // Original admin-only logic continues
    if (!userId || valor === undefined || valor === null) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    if (!userId || valor === undefined || valor === null) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    if (valor <= 0) {
      return NextResponse.json({ error: 'O valor deve ser positivo' }, { status: 400 });
    }

    // Motivo é obrigatório para ajustes manuais
    if (!descricao || descricao.trim().length < 3) {
      return NextResponse.json({ error: 'Motivo/descrição é obrigatório para ajustes de saldo' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    const valorAntes = targetUser.saldo;
    const valorDepois = valorAntes + valor;
    const tipoTransacao = tipo || 'deposito';

    // Verificar se saldo não ficaria negativo
    if (valorDepois < 0) {
      return NextResponse.json({ error: 'Saldo não pode ficar negativo' }, { status: 400 });
    }

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
          descricao: descricao,
          referencia: user.id,
          userId: userId,
          dadosAdicionais: {
            auditTrail: {
              adminId: user.id,
              adminEmail: user.email,
              adminNome: user.nome,
              valorAntes,
              valorDepois,
              valorAjuste: valor,
              motivo: descricao,
              timestamp: new Date().toISOString(),
              ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            },
          },
        },
      }),
    ]);

    // Notificar o utilizador sobre o ajuste de saldo
    await prisma.notificacao.create({
      data: {
        userId: userId,
        tipo: 'sistema',
        titulo: 'Saldo Ajustado',
        mensagem: `O seu saldo foi ajustado em ${valor >= 0 ? '+' : ''}${valor.toFixed(2)}€ por um administrador. Motivo: ${descricao}`,
        dados: JSON.stringify({
          valorAntes,
          valorDepois,
          valorAjuste: valor,
          motivo: descricao,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Saldo ajustado com sucesso',
      data: {
        novoSaldo: updatedUser.saldo,
        valorAntes,
        valorDepois: updatedUser.saldo,
        transacaoId: transacao.id,
      },
    });
  } catch (error) {
    console.error('Erro ao ajustar saldo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}