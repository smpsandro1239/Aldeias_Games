import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const { participacaoId, valor, observacoes } = await request.json();

    if (!participacaoId || !valor || valor <= 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    if (!observacoes || typeof observacoes !== 'string' || observacoes.trim().length < 3) {
      return NextResponse.json({ error: 'Indique uma observação (mínimo 3 caracteres) para registar na auditoria' }, { status: 400 });
    }

    // HIGH #11: Validar limite máximo de conversão de prémio (prevenir abuso)
    const MAX_PRIZE_CONVERSION = 10000; // €10,000
    if (valor > MAX_PRIZE_CONVERSION) {
      return NextResponse.json({ error: `Valor máximo de conversão: €${MAX_PRIZE_CONVERSION}` }, { status: 400 });
    }

    // Buscar participação
    const participacao = await prisma.participacao.findUnique({
      where: { id: participacaoId },
      include: {
        user: {
          select: { id: true, nome: true, email: true, telefone: true },
        },
        jogo: {
          include: {
            premios: true,
            evento: { select: { aldeiaId: true } },
          },
        },
      },
    });

    if (!participacao) {
      return NextResponse.json({ error: 'Participação não encontrada' }, { status: 404 });
    }

    // Scoping por aldeia
    if (user.role !== 'super_admin' && participacao.jogo.evento?.aldeiaId !== user.aldeiaId) {
      return NextResponse.json({ error: 'Não pode converter prémios de outra aldeia' }, { status: 403 });
    }

    if (!participacao.ganhador) {
      return NextResponse.json({ error: 'Esta participação não é vencedora' }, { status: 400 });
    }

    if (participacao.premioEntregue) {
      return NextResponse.json({ error: 'O prémio desta participação já foi entregue ou convertido' }, { status: 400 });
    }

    // Transparência: o valor convertido tem de corresponder a um prémio configurado no jogo
    const allowedValues: number[] = [];
    for (const p of participacao.jogo.premios ?? []) {
      if (typeof p.valorDinheiroAlternative === 'number' && p.valorDinheiroAlternative > 0) {
        allowedValues.push(p.valorDinheiroAlternative);
      }
    }
    const config = typeof participacao.jogo.configuracao === 'string'
      ? JSON.parse(participacao.jogo.configuracao)
      : participacao.jogo.configuracao;
    for (const p of (config?.premios ?? [])) {
      if (typeof p?.valorDinheiroAlternative === 'number' && p.valorDinheiroAlternative > 0) {
        allowedValues.push(p.valorDinheiroAlternative);
      }
    }
    if (allowedValues.length > 0 && !allowedValues.some(v => Math.abs(v - valor) < 0.001)) {
      return NextResponse.json({
        error: `O valor ${valor.toFixed(2)}€ não corresponde a nenhum prémio configurado para este jogo`,
      }, { status: 400 });
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

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    // Executar transação no Prisma (forma em array — evita TransactionClient stale do cliente local)
    const [updatedUser, , transacao] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userIdToCredit },
        data: {
          saldo: {
            increment: valor,
          },
        },
      }),
      prisma.participacao.update({
        where: { id: participacaoId },
        data: {
          premioEntregue: true,
        },
      }),
      prisma.transacao.create({
        data: {
          valor: valor,
          tipo: 'premio_dinheiro',
          descricao: `Conversão de prémio: ${participacao.jogo.nome}`,
          referencia: participacaoId,
          userId: userIdToCredit,
        },
      }),
      prisma.alteracaoParticipacao.create({
        data: {
          participacaoId: participacaoId,
          userId: user.id,
          tipoAlteracao: 'convert_prize',
          dadosAnteriores: JSON.stringify({ premioEntregue: false }),
          motivo: `Prémio "${participacao.jogo.nome}" convertido em ${valor.toFixed(2)}€ de saldo. Observações: ${observacoes.trim()}`,
          ip,
        },
      }),
    ]);

    logAudit({
      userId: user.id,
      aldeiaId: participacao.jogo.evento?.aldeiaId,
      action: 'premio.convertido',
      resource: 'participacao',
      resourceId: participacaoId,
      metadata: {
        valor,
        userIdCreditado: userIdToCredit,
        jogoId: participacao.jogoId,
        jogoNome: participacao.jogo.nome,
        observacoes,
      },
      ip,
      userAgent,
    });

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
