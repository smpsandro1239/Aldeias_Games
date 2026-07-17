import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;
const claimAttempts = new Map<string, number[]>();

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const attempts = claimAttempts.get(userId) || [];
  const recent = attempts.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (recent.length >= RATE_LIMIT_MAX) {
    const oldest = recent[0];
    const retryAfter = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  recent.push(now);
  claimAttempts.set(userId, recent);
  return { allowed: true };
}

type ClaimType = 'carteira' | 'cofre' | 'jogar_novamente';

const ROLES_WITH_CASHBOX = ['vendedor', 'aldeia_admin', 'super_admin'];

export async function POST(
  request: NextRequest,
  context: { params: Promise<{id: string}> }
) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    let claimType: ClaimType = 'carteira';
    try {
      const body = await request.json();
      if (body.claimType) claimType = body.claimType;
    } catch {}

    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Demasiadas tentativas. Tente novamente em ${rateLimit.retryAfter}s.` },
        { status: 429 }
      );
    }

    const participacao = await prisma.participacao.findUnique({
      where: { id },
      include: {
        jogo: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            configuracao: true,
          },
        },
      },
    });

    if (!participacao) {
      return NextResponse.json(
        { error: 'Participação não encontrada' },
        { status: 404 }
      );
    }

    const emailMatch = participacao.emailCliente && participacao.emailCliente === user.email;
    if (participacao.userId !== user.id && !emailMatch) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    if (participacao.jogo.tipo !== 'raspadinha') {
      return NextResponse.json(
        { error: 'Este endpoint é apenas para raspadinhas' },
        { status: 400 }
      );
    }

    const isNonRegularUser = ROLES_WITH_CASHBOX.includes(user.role);

    if (claimType === 'carteira' && isNonRegularUser) {
      return NextResponse.json(
        { error: 'Utilizadores com perfil de vendedor/administrador não podem reclamar prémios para a carteira. Use "cofre", "jogar_novamente" ou "pagar_cliente".' },
        { status: 400 }
      );
    }

    if (claimType !== 'carteira' && !isNonRegularUser) {
      return NextResponse.json(
        { error: 'Apenas vendedores e administradores podem usar esta opção de reclamação.' },
        { status: 400 }
      );
    }

    let dados: Record<string, unknown>;
    try {
      dados = typeof participacao.dadosParticipacao === 'string'
        ? JSON.parse(participacao.dadosParticipacao)
        : participacao.dadosParticipacao;
    } catch {
      return NextResponse.json(
        { error: 'Dados da participação inválidos' },
        { status: 500 }
      );
    }

    const grid = dados?.grid;
    let winningPrize: Record<string, unknown> | null = null;

    if (grid && Array.isArray(grid) && grid.length === 9) {
      const counts = new Map<string, { count: number; prize: Record<string, unknown> }>();
      for (const prize of grid) {
        const key = prize.nome as string;
        const existing = counts.get(key);
        if (existing) {
          existing.count++;
        } else {
          counts.set(key, { count: 1, prize });
        }
      }

      for (const [, data] of counts) {
        if (data.count >= 3 && ((data.prize.valorDinheiroAlternative as number) || 0) > 0) {
          winningPrize = data.prize;
          break;
        }
      }
    } else if (dados?.hasWin && dados?.winningPrize) {
      winningPrize = dados.winningPrize as Record<string, unknown>;
    } else if (participacao.resultadoRaspe && participacao.resultadoRaspe !== 'sem_premio') {
      const config = typeof participacao.jogo.configuracao === 'string'
        ? JSON.parse(participacao.jogo.configuracao)
        : participacao.jogo.configuracao;
      const premios = config?.premios || [];
      winningPrize = premios.find((p: Record<string, unknown>) => p.nome === participacao.resultadoRaspe) || null;
    }

    if (!winningPrize) {
      return NextResponse.json(
        { success: false, reason: 'no_win' },
        { status: 400 }
      );
    }

    const prizeAmount = (winningPrize.valorDinheiroAlternative as number) || 0;

    if (participacao.premioEntregue) {
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { saldo: true },
      });

      return NextResponse.json({
        success: true,
        alreadyClaimed: true,
        creditedAmount: prizeAmount,
        newSaldo: currentUser?.saldo || 0,
        prizeName: winningPrize.nome,
        claimType,
      });
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    if (claimType === 'cofre') {
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const cashbox = await tx.vendedorCashbox.findUnique({
          where: { userId: user.id },
        });

        if (!cashbox || cashbox.saldo < prizeAmount) {
          throw new Error('CAIXA_INSUFICIENTE');
        }

        await tx.vendedorCashbox.update({
          where: { userId: user.id },
          data: { saldo: { decrement: prizeAmount } },
        });

        await tx.vendedorCashboxTransaction.create({
          data: {
            cashboxId: cashbox.id,
            tipo: 'DEPOSITADO_NO_COFRE',
            valor: -prizeAmount,
            descricao: `Prémio raspadinha entregue ao cofre: ${winningPrize.nome}`,
            referencia: participacao.id,
            criadoPorId: user.id,
          },
        });

        let pedidoId: string | null = null;
        if (user.aldeiaId) {
          const pedido = await tx.pedidoDepositoCofre.create({
            data: {
              vendedorId: user.id,
              aldeiaId: user.aldeiaId,
              valor: prizeAmount,
              descricao: `Prémio raspadinha: ${winningPrize.nome}`,
              criadoPorId: user.id,
            },
          });
          pedidoId = pedido.id;
        }

        await tx.participacao.update({
          where: { id: participacao.id },
          data: {
            premioEntregue: true,
            ganhador: true,
          },
        });

        await tx.alteracaoParticipacao.create({
          data: {
            participacaoId: participacao.id,
            userId: user.id,
            tipoAlteracao: 'claim_cofre',
            dadosAnteriores: JSON.stringify({ premioEntregue: false, ganhador: false }),
            ip,
          },
        });

        const updatedCashbox = await tx.vendedorCashbox.findUnique({
          where: { userId: user.id },
          select: { saldo: true },
        });

        return {
          creditedAmount: 0,
          cashboxSaldo: updatedCashbox?.saldo || 0,
          pedidoId,
        };
      });

      await prisma.notificacao.create({
        data: {
          userId: user.id,
          tipo: 'deposito_criado',
          titulo: 'Prémio entregue ao cofre',
          mensagem: `O teu prémio "${winningPrize.nome}" no valor de ${prizeAmount.toFixed(2)}€ foi entregue ao cofre da aldeia.`,
          lida: false,
        },
      });

      const admins = await prisma.user.findMany({
        where: { aldeiaId: user.aldeiaId, role: { in: ['aldeia_admin', 'super_admin'] } },
        select: { id: true },
      });

      if (admins.length > 0) {
        await prisma.notificacao.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            tipo: 'deposito_criado' as const,
            titulo: 'Prémio entregue ao cofre',
            mensagem: `${user.nome} entregou ${prizeAmount.toFixed(2)}€ ao cofre (prémio: ${winningPrize.nome}).`,
            lida: false,
          })),
        });
      }

      return NextResponse.json({
        success: true,
        creditedAmount: 0,
        cashboxSaldo: result.cashboxSaldo,
        pedidoDepositoId: result.pedidoId,
        prizeName: winningPrize.nome,
        claimType: 'cofre',
      });
    }

    if (claimType === 'jogar_novamente') {
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { saldo: { increment: prizeAmount } },
          select: { saldo: true },
        });

        await tx.transacao.create({
          data: {
            userId: user.id,
            valor: prizeAmount,
            tipo: 'premio_dinheiro',
            descricao: `Prémio raspadinha (jogar novamente): ${winningPrize.nome}`,
            referencia: participacao.id,
          },
        });

        await tx.participacao.update({
          where: { id: participacao.id },
          data: {
            premioEntregue: true,
            ganhador: true,
          },
        });

        await tx.alteracaoParticipacao.create({
          data: {
            participacaoId: participacao.id,
            userId: user.id,
            tipoAlteracao: 'claim_jogar_novamente',
            dadosAnteriores: JSON.stringify({ premioEntregue: false, ganhador: false }),
            ip,
          },
        });

        return { creditedAmount: prizeAmount, newSaldo: updatedUser.saldo };
      });

      await prisma.notificacao.create({
        data: {
          userId: user.id,
          tipo: 'premio',
          titulo: 'Prémio convertido em crédito',
          mensagem: `O teu prémio "${winningPrize.nome}" no valor de ${prizeAmount.toFixed(2)}€ foi adicionado ao teu saldo para jogar novamente.`,
          lida: false,
        },
      });

      return NextResponse.json({
        success: true,
        creditedAmount: result.creditedAmount,
        newSaldo: result.newSaldo,
        prizeName: winningPrize.nome,
        claimType: 'jogar_novamente',
      });
    }

    if (claimType === 'pagar_cliente') {
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const cashbox = await tx.vendedorCashbox.findUnique({
          where: { userId: user.id },
        });

        if (!cashbox || cashbox.saldo < prizeAmount) {
          throw new Error('CAIXA_INSUFICIENTE');
        }

        await tx.vendedorCashbox.update({
          where: { userId: user.id },
          data: { saldo: { decrement: prizeAmount } },
        });

        await tx.vendedorCashboxTransaction.create({
          data: {
            cashboxId: cashbox.id,
            tipo: 'PAGO_AO_JOGADOR',
            valor: -prizeAmount,
            descricao: `Prémio pago ao cliente: ${winningPrize.nome}`,
            referencia: participacao.id,
            criadoPorId: user.id,
          },
        });

        await tx.participacao.update({
          where: { id: participacao.id },
          data: {
            premioEntregue: true,
            ganhador: true,
          },
        });

        await tx.alteracaoParticipacao.create({
          data: {
            participacaoId: participacao.id,
            userId: user.id,
            tipoAlteracao: 'claim_pagar_cliente',
            dadosAnteriores: JSON.stringify({ premioEntregue: false, ganhador: false }),
            ip,
          },
        });

        const updatedCashbox = await tx.vendedorCashbox.findUnique({
          where: { userId: user.id },
          select: { saldo: true },
        });

        return {
          cashboxSaldo: updatedCashbox?.saldo || 0,
        };
      });

      await prisma.notificacao.create({
        data: {
          userId: user.id,
          tipo: 'premio',
          titulo: 'Prémio pago ao cliente',
          mensagem: `Registaste o pagamento de ${prizeAmount.toFixed(2)}€ ao cliente pelo prémio "${winningPrize.nome}". Valor descontado da tua caixa.`,
          lida: false,
        },
      });

      return NextResponse.json({
        success: true,
        creditedAmount: 0,
        cashboxSaldo: result.cashboxSaldo,
        prizeName: winningPrize.nome,
        claimType: 'pagar_cliente',
      });
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { saldo: { increment: prizeAmount } },
        select: { saldo: true },
      });

      await tx.transacao.create({
        data: {
          userId: user.id,
          valor: prizeAmount,
          tipo: 'premio_dinheiro',
          descricao: `Prémio raspadinha: ${winningPrize.nome}`,
          referencia: participacao.id,
        },
      });

      await tx.participacao.update({
        where: { id: participacao.id },
        data: {
          premioEntregue: true,
          ganhador: true,
        },
      });

      await tx.alteracaoParticipacao.create({
        data: {
          participacaoId: participacao.id,
          userId: user.id,
          tipoAlteracao: 'claim',
          dadosAnteriores: JSON.stringify({ premioEntregue: false, ganhador: false }),
          ip,
        },
      });

      return { creditedAmount: prizeAmount, newSaldo: updatedUser.saldo };
    });

    await prisma.notificacao.create({
      data: {
        userId: user.id,
        tipo: 'premio',
        titulo: 'Prémio reclamado',
        mensagem: `O teu prémio "${winningPrize.nome}" no valor de ${prizeAmount.toFixed(2)}€ foi creditado na tua conta.`,
        lida: false,
      },
    });

    return NextResponse.json({
      success: true,
      creditedAmount: result.creditedAmount,
      newSaldo: result.newSaldo,
      prizeName: winningPrize.nome,
      claimType: 'carteira',
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Erro ao reclamar prémio:', error);

    if (error.message === 'CAIXA_INSUFICIENTE') {
      return NextResponse.json(
        { error: 'Saldo insuficiente na caixa para entregar este prémio ao cofre.' },
        { status: 400 }
      );
    }

    if ((err instanceof Error && 'code' in err) && (err as { code: string }).code === 'P2025') {
      return NextResponse.json(
        { error: 'Participação não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
