import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { participacaoId, valor } = await request.json();

    if (!participacaoId || !valor || valor <= 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Buscar participação
    const participacao = await prisma.participacao.findUnique({
      where: { id: participacaoId },
      include: {
        user: true,
        jogo: true,
      },
    });

    if (!participacao) {
      return NextResponse.json({ error: 'Participação não encontrada' }, { status: 404 });
    }

    if (!participacao.ganhador) {
      return NextResponse.json({ error: 'Esta participação não é vencedora' }, { status: 400 });
    }

    if (participacao.premioEntregue) {
      return NextResponse.json({ error: 'O prémio desta participação já foi entregue ou convertido' }, { status: 400 });
    }

    // Determinar qual utilizador vai receber o crédito
    let userIdToCredit = participacao.userId;
    
    if (!userIdToCredit) {
      // Se não há userId, tentar encontrar pelo email/telefone do cliente
      if (participacao.emailCliente) {
        const userByEmail = await prisma.user.findUnique({
          where: { email: participacao.emailCliente },
        });
        if (userByEmail) {
          userIdToCredit = userByEmail.id;
        }
      }
      
      // Se ainda não encontrou, tentar por telefone
      if (!userIdToCredit && participacao.telefoneCliente) {
        const userByPhone = await prisma.user.findFirst({
          where: { telefone: participacao.telefoneCliente },
        });
        if (userByPhone) {
          userIdToCredit = userByPhone.id;
        }
      }
    }

    if (!userIdToCredit) {
      return NextResponse.json({ error: 'Não foi possível identificar o vencedor para crédito. O vencedor não tem conta na aplicação.' }, { status: 400 });
    }

    // Executar transação no Prisma
    const [updatedUser, updatedParticipacao, transacao] = await prisma.$transaction([
      // 1. Atualizar saldo do utilizador
      prisma.user.update({
        where: { id: userIdToCredit },
        data: {
          saldo: {
            increment: valor,
          },
        },
      }),
      // 2. Marcar prémio como entregue
      prisma.participacao.update({
        where: { id: participacaoId },
        data: {
          premioEntregue: true,
        },
      }),
      // 3. Registar transação
      prisma.transacao.create({
        data: {
          valor: valor,
          tipo: 'premio_dinheiro',
          descricao: `Conversão de prémio: ${participacao.jogo.nome}`,
          referencia: participacaoId,
          userId: userIdToCredit,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Prémio convertido em saldo com sucesso',
      data: {
        novoSaldo: updatedUser.saldo,
        transacaoId: transacao.id,
      },
    });
  } catch (error) {
    console.error('Erro ao converter prémio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
