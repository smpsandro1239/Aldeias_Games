import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
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

    // Rate limiting
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Demasiadas tentativas. Tente novamente em ${rateLimit.retryAfter}s.` },
        { status: 429 }
      );
    }

    // Find participation with related data
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

    // Owner check - by userId or by matching email
    const emailMatch = participacao.emailCliente && participacao.emailCliente === user.email;
    if (participacao.id !== user.id && !emailMatch) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    // Only for raspadinha
    if (participacao.jogo.tipo !== 'raspadinha') {
      return NextResponse.json(
        { error: 'Este endpoint é apenas para raspadinhas' },
        { status: 400 }
      );
    }

    // Parse dadosParticipacao
    let dados: any;
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
    
    let winningPrize: any = null;

    if (grid && Array.isArray(grid) && grid.length === 9) {
      const counts = new Map<string, { count: number; prize: any }>();
      for (const prize of grid) {
        const key = prize.nome;
        const existing = counts.get(key);
        if (existing) {
          existing.count++;
        } else {
          counts.set(key, { count: 1, prize });
        }
      }

      for (const [nome, data] of counts) {
        if (data.count >= 3 && (data.prize.valorDinheiroAlternative || 0) > 0) {
          winningPrize = data.prize;
          break;
        }
      }
    } else if (dados?.hasWin && dados?.winningPrize) {
      winningPrize = dados.winningPrize;
    } else if (participacao.resultadoRaspe && participacao.resultadoRaspe !== 'sem_premio') {
      const config = typeof participacao.jogo.configuracao === 'string'
        ? JSON.parse(participacao.jogo.configuracao)
        : participacao.jogo.configuracao;
      const premios = config?.premios || [];
      winningPrize = premios.find((p: any) => p.nome === participacao.resultadoRaspe);
    }

    if (!winningPrize) {
      return NextResponse.json(
        { success: false, reason: 'no_win' },
        { status: 400 }
      );
    }

    // Idempotency: if already claimed, return current state
    if (participacao.premioEntregue) {
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { saldo: true },
      });

      return NextResponse.json({
        success: true,
        alreadyClaimed: true,
        creditedAmount: winningPrize.valorDinheiroAlternative || 0,
        newSaldo: currentUser?.saldo || 0,
        prizeName: winningPrize.nome,
      });
    }

    // Process prize payout in atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Credit user saldo
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          saldo: { increment: winningPrize.valorDinheiroAlternative },
        },
        select: { saldo: true },
      });

      // Create transaction record
      await tx.transacao.create({
        data: {
          userId: user.id,
          valor: winningPrize.valorDinheiroAlternative,
          tipo: 'premio_dinheiro',
          descricao: `Prémio raspadinha: ${winningPrize.nome}`,
          referencia: participacao.id,
        },
      });

      // Update participation
      await tx.participacao.update({
        where: { id: participacao.id },
        data: {
          premioEntregue: true,
          ganhador: true,
        },
      });

      // Create audit log
      await tx.alteracaoParticipacao.create({
        data: {
          participacaoId: participacao.id,
          userId: user.id,
          campoAlterado: 'premioEntregue',
          valorAnterior: 'false',
          valorNovo: 'true',
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        } as any,
      });

      return {
        creditedAmount: winningPrize.valorDinheiroAlternative,
        newSaldo: updatedUser.saldo,
      };
    });

    return NextResponse.json({
      success: true,
      creditedAmount: result.creditedAmount,
      newSaldo: result.newSaldo,
      prizeName: winningPrize.nome,
    });
  } catch (error: any) {
    console.error('Erro ao reclamar prémio:', error);
    
    if (error.code === 'P2025') {
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
