import { NextRequest, NextResponse } from 'next/server';
import { sanitizeObject } from '@/lib/sanitization';
import { escapeHtml } from '@/lib/utils';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import { createParticipacaoSchema } from '@/lib/validations';
import { getPaginationFromRequest, createPaginatedResponse } from '@/lib/pagination';
import { sendTicketEmail } from '@/lib/email';
import { executeWithRetry } from '@/lib/transaction-retry';
import { createLogger, extractRequestContext } from '@/lib/logger';
import { isMethodAllowed } from '@/lib/payment-commissions';
// @ts-ignore - @prisma/client types generated at build time
import { Prisma } from '@prisma/client';
import { getGameHandler } from './_lib';

// GET - Listar participações
export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { page, limit } = getPaginationFromRequest(request);
    const skip = (page - 1) * limit;

     const url = new URL(request.url);
     const jogoId = url.searchParams.get('jogoId');
     const userId = url.searchParams.get('userId');
     const estadoPagamento = url.searchParams.get('estadoPagamento') as any || undefined;

     // Construir where
     let where: Record<string, unknown> = {};

     if (jogoId) {
       where.jogoId = jogoId;
     }

     if (estadoPagamento) {
       where.estadoPagamento = estadoPagamento;
     }

    // Filtrar por permissões
    if (user.role === 'super_admin') {
      // Super admin vê todas
      if (userId) {
        where.id = userId;
      }
    } else if (user.role === 'aldeia_admin') {
      // Admin vê participações dos jogos da sua aldeia
      const jogos = await prisma.jogo.findMany({
        where: {
          evento: {
            aldeiaId: user.aldeiaId as string,
          },
        },
        select: { id: true },
      });
      const jogoIds = jogos.map((j: { id: string }) => j.id);
      
      if (userId) {
        where = {
          ...where,
          AND: [
            { jogoId: { in: jogoIds } },
            { userId },
          ],
        };
      } else {
        where.jogoId = { in: jogoIds };
      }
    } else if (user.role === 'vendedor') {
      // Vendedor vê as que registou
      where.vendedorId = user.id;
    } else {
      // User normal vê as suas participações (por userId OU por email/telefone)
      const orConditions: any[] = [{ userId: user.id }];
      if ((user as any).email) {
        orConditions.push({ emailCliente: (user as any).email });
      }
      if ((user as any).telefone) {
        orConditions.push({ telefoneCliente: (user as any).telefone });
      }
      where.OR = orConditions;
    }

    const [participacoes, total] = await Promise.all([
      prisma.participacao.findMany({
        where,
        select: {
          id: true,
          valorPago: true,
          metodoPagamento: true,
          estadoPagamento: true,
          jogoId: true,
          userId: true,
          vendedorId: true,
          nomeCliente: true,
          telefoneCliente: true,
          emailCliente: true,
          ganhador: true,
          premioEntregue: true,
          createdAt: true,
          dadosParticipacao: true,
          hashParticipacao: true,
          hashRaspe: true,
          dadosVerificacao: true,
          seedRaspe: true,
          resultadoRaspe: true,
          revelado: true,
          dataRevelacao: true,
          jogo: {
            select: {
              id: true,
              nome: true,
              tipo: true,
              preco: true,
              sorteado: true,
              dataSorteio: true,
              premioId: true,
              evento: {
                select: {
                  id: true,
                  nome: true,
                  aldeia: {
                    select: {
                      id: true,
                      nome: true,
                    },
                  },
                },
              },
              premios: {
                select: {
                  id: true,
                  nome: true,
                  ordem: true,
                },
                orderBy: { ordem: 'asc' },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.participacao.count({ where }),
    ]);

    return NextResponse.json(
      createPaginatedResponse(participacoes, total, page, limit)
    );
} catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Erro ao criar participação:', error);
    const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: errMsg },
      { status: 500 }
    );
  }
}

// POST - Criar participação
export async function POST(request: NextRequest) {
  const log = createLogger({ ...extractRequestContext(request), userId: undefined });
  try {
    const user = await getFullUserFromRequest(request);
    log.info('Participação solicitada', { userId: user?.id });
    const body = await request.json();

    const normalizedBody = {
      ...body,
      dadosCliente: body?.dadosCliente ? {
        ...body.dadosCliente,
        telefone: typeof body.dadosCliente?.telefone === 'string'
          ? body.dadosCliente.telefone.replace(/\s+/g, '').replace(/[-().]/g, '')
          : body.dadosCliente?.telefone,
      } : body?.dadosCliente,
    };
    
    const hasDadosCliente = normalizedBody.dadosCliente && normalizedBody.dadosCliente.nome && (normalizedBody.dadosCliente.telefone || normalizedBody.dadosCliente.email);
    
    if (!user && !hasDadosCliente) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login ou forneça os seus dados de contacto.' },
        { status: 401 }
      );
    }

    const effectiveUser = user;

    const validation = createParticipacaoSchema.safeParse(normalizedBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }
    const data = validation.data;

    const jogo = await prisma.jogo.findUnique({
      where: { id: data.jogoId },
      include: { evento: true },
    });
    if (!jogo) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });
    }
    if (jogo.estado !== 'aberto') {
      return NextResponse.json(
        { error: 'Este jogo não está aberto para participações' },
        { status: 400 }
      );
    }

    // Validar se o método de pagamento está aceite pela aldeia
    if (data.metodoPagamento && jogo.aldeiaId) {
      const aldeia = await prisma.aldeia.findUnique({
        where: { id: jogo.aldeiaId },
        select: { metodosPagamentoAceites: true }
      });
      if (aldeia?.metodosPagamentoAceites && !isMethodAllowed(data.metodoPagamento, aldeia.metodosPagamentoAceites)) {
        return NextResponse.json(
          { error: 'Este método de pagamento não está disponível para esta aldeia' },
          { status: 400 }
        );
      }
    }

    let resolvedUserId: string | null = effectiveUser?.id ?? null;
    if (resolvedUserId) {
      const userExists = await prisma.user.findUnique({
        where: { id: resolvedUserId },
        select: { id: true },
      });
      if (!userExists) resolvedUserId = null;
    }

    if (jogo.stockAtual < data.quantidade) {
      return NextResponse.json({ error: 'Stock insuficiente' }, { status: 400 });
    }

    const valorTotal = jogo.tipo === 'euromilhoes'
      ? ((data.dadosParticipacao?.numeros as number[] | undefined)?.length || data.numerosSelecionados?.length || 1) * jogo.preco
      : jogo.preco * data.quantidade;

    if (data.metodoPagamento === 'saldo') {
      if (((user as any).saldo || 0) < valorTotal) {
        return NextResponse.json(
          { error: 'Saldo insuficiente na carteira' },
          { status: 400 }
        );
      }
    }

    // Verificar limite por utilizador
    if (!user || user.role === 'user') {
      const limite = jogo.limitePorUsuario;
      if (limite > 0) {
        const orConditions: any[] = [];
        if (hasDadosCliente) {
          if (data.dadosCliente?.email) orConditions.push({ emailCliente: data.dadosCliente.email });
          if (data.dadosCliente?.telefone) orConditions.push({ telefoneCliente: data.dadosCliente.telefone });
          const customerUser = await prisma.user.findFirst({
            where: {
              OR: [
                ...(data.dadosCliente?.email ? [{ email: data.dadosCliente.email }] : []),
                ...(data.dadosCliente?.telefone ? [{ telefone: data.dadosCliente.telefone }] : []),
              ]
            },
            select: { id: true }
          });
          if (customerUser) orConditions.push({ userId: customerUser.id });
        } else if (user) {
          orConditions.push({ userId: user.id });
          if ((user as any).email) orConditions.push({ emailCliente: (user as any).email });
          if ((user as any).telefone) orConditions.push({ telefoneCliente: (user as any).telefone });
        }
        if (orConditions.length > 0) {
          const count = await prisma.participacao.count({
            where: {
              jogoId: data.jogoId,
              estadoPagamento: { in: ["concluido", "pendente"] },
              OR: orConditions,
            },
          });
          if (count + data.quantidade > limite) {
            return NextResponse.json(
              { error: `Limite de participações excedido. O limite para este jogo é de ${limite} por utilizador.` },
              { status: 400 }
            );
          }
        }
      }
    }

    // Isolamento de aldeia
    if (user && user.role === 'vendedor' && jogo.evento.aldeiaId !== user.aldeiaId) {
      return NextResponse.json({ error: 'Não pode vender jogos de outra aldeia' }, { status: 403 });
    }
    if (user && user.role === 'aldeia_admin' && jogo.evento.aldeiaId !== user.aldeiaId) {
      return NextResponse.json({ error: 'Não pode criar participações para outra aldeia' }, { status: 403 });
    }

    // Validação específica do jogo (delegada ao handler)
    const handler = getGameHandler(jogo.tipo);
    if (handler?.validate) {
      try {
        await handler.validate(data, jogo);
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
    }

    // Transação atómica
    const result = await executeWithRetry(async () => {
      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const jogoLocked = await tx.jogo.findUnique({
          where: { id: data.jogoId },
          select: { stockAtual: true, preco: true, tipo: true, nome: true, eventoId: true },
        });
        if (!jogoLocked || jogoLocked.stockAtual < data.quantidade) {
          throw new Error('Stock insuficiente');
        }

        const updated = await tx.jogo.updateMany({
          where: { id: data.jogoId, stockAtual: { gte: data.quantidade } },
          data: {
            stockAtual: { decrement: data.quantidade },
            totalParticipacoes: { increment: data.quantidade },
            totalAngariado: { increment: valorTotal },
          },
        });
        if (updated.count === 0) throw new Error('Stock insuficiente - operação concorrente');

        const jogoFinal = await tx.jogo.findUnique({
          where: { id: data.jogoId },
          select: { stockAtual: true },
        });
        if (jogoFinal && jogoFinal.stockAtual <= 0) {
          await tx.jogo.update({ where: { id: data.jogoId }, data: { estado: 'fechado' } });
          const admins = await prisma.user.findMany({
            where: { aldeiaId: jogo.evento.aldeiaId, role: 'aldeia_admin' },
            select: { id: true },
          });
          if (admins.length > 0) {
            await prisma.notificacao.createMany({
              data: admins.map((admin: (typeof admins)[number]) => ({
                userId: admin.id,
                tipo: 'sistema' as const,
                titulo: 'Stock esgotado',
                mensagem: `O jogo "${jogo.nome}" atingiu stock zero e foi fechado automaticamente.`,
                lida: false,
              })),
            });
          }
        }

        const participacoes: any[] = [];
        for (let i = 0; i < data.quantidade; i++) {
          const dados: Record<string, unknown> = {
            dadosParticipacao: JSON.stringify(sanitizeObject(data.dadosParticipacao)),
            valorPago: jogo.preco,
            metodoPagamento: data.metodoPagamento,
            estadoPagamento: data.metodoPagamento === 'dinheiro' || data.metodoPagamento === 'saldo' ? 'concluido' : 'pendente',
            jogoId: data.jogoId,
            userId: resolvedUserId,
            vendedorId: effectiveUser && hasRole(effectiveUser.role, ['aldeia_admin', 'vendedor']) ? effectiveUser.id : undefined,
            nomeCliente: data.dadosCliente?.nome ? escapeHtml(String(data.dadosCliente.nome)) : undefined,
            telefoneCliente: data.dadosCliente?.telefone || undefined,
            emailCliente: data.dadosCliente?.email || undefined,
          };

          // Delegar dados específicos ao handler do jogo
          if (handler) {
            const gameData = handler.prepareData(data, jogo, participacoes);
            Object.assign(dados, gameData);
          }

          const participacao = await tx.participacao.create({
            data: dados as never,
            include: {
              jogo: { select: { id: true, nome: true, tipo: true, preco: true, configuracao: true } },
            },
          });
          participacoes.push(participacao);
        }

        // Pós-criação específica do jogo (delegada ao handler)
        if (handler?.postCreate) {
          await handler.postCreate(tx, data, jogo, participacoes);
        }

        // Atualizar total do evento
        await tx.evento.update({
          where: { id: jogoLocked.eventoId },
          data: {
            totalParticipacoes: { increment: data.quantidade },
            totalAngariado: { increment: valorTotal },
          },
        });

        // --- LÓGICA DE CARTEIRA E CASHBACK ---
        const isVendaInterna = !data.dadosCliente && effectiveUser?.id;
        const pagamentoConfirmado = data.metodoPagamento === 'dinheiro' || data.metodoPagamento === 'saldo';

        if (isVendaInterna && pagamentoConfirmado && effectiveUser) {
          const jogoConfig = JSON.parse(jogo.configuracao || '{}');
          const cashbackPercent = typeof jogoConfig.cashbackPercent === 'number'
            ? Math.min(jogoConfig.cashbackPercent / 100, 0.5)
            : 0.05;
          const cashbackValor = valorTotal * cashbackPercent;

          if (data.metodoPagamento === 'saldo') {
            await tx.user.update({
              where: { id: effectiveUser.id },
              data: { saldo: { decrement: valorTotal } },
            });
            await tx.transacao.create({
              data: {
                userId: effectiveUser.id,
                valor: -valorTotal,
                tipo: 'pagamento_jogo',
                descricao: `Pagamento de ${data.quantidade}x ${jogo.nome}`,
                referencia: jogo.id,
              },
            });
          }

          await tx.user.update({
            where: { id: effectiveUser.id },
            data: { saldo: { increment: cashbackValor } },
          });
          await tx.transacao.create({
            data: {
              userId: effectiveUser.id,
              valor: cashbackValor,
              tipo: 'cashback',
              descricao: `Cashback de compra: ${jogo.nome}`,
              referencia: jogo.id,
            },
          });
        } else if (data.metodoPagamento === 'saldo' && data.dadosCliente && effectiveUser) {
          await tx.user.update({
            where: { id: effectiveUser.id },
            data: { saldo: { decrement: valorTotal } },
          });
          await tx.transacao.create({
            data: {
              userId: effectiveUser.id,
              valor: -valorTotal,
              tipo: 'pagamento_jogo',
              descricao: `Pagamento de ${data.quantidade}x ${jogo.nome} (venda externa)`,
              referencia: jogo.id,
            },
          });
        }

        // --- LÓGICA DE CAIXA DO VENDEDOR ---
        // Quando vendedor vende em dinheiro, o valor entra na sua caixa física
        if (data.metodoPagamento === 'dinheiro' && effectiveUser && hasRole(effectiveUser.role, ['vendedor', 'aldeia_admin', 'super_admin'])) {
          const valorVenda = jogo.preco * data.quantidade;
          const cashbox = await tx.vendedorCashbox.upsert({
            where: { userId: effectiveUser.id },
            create: { userId: effectiveUser.id, saldo: valorVenda },
            update: { saldo: { increment: valorVenda } },
          });

          await tx.vendedorCashboxTransaction.create({
            data: {
              cashboxId: cashbox.id,
              tipo: 'RECEBIDO_DO_JOGADOR',
              valor: valorVenda,
              descricao: `Venda de ${data.quantidade}x ${jogo.nome} (dinheiro)`,
              referencia: participacoes[0]?.id,
              criadoPorId: effectiveUser.id,
            },
          });
        }

        return { participacoes, valorTotal };
      });
    });

    // Email de bilhete (pós-transação)
    if (jogo.tipo === 'rifa' && result.participacoes.length > 0) {
      const primeira = result.participacoes[0];
      if (primeira.estadoPagamento === 'concluido' && primeira.emailCliente) {
        const numeros = Array.isArray((data.dadosParticipacao as Record<string, unknown>)?.numeros)
          ? ((data.dadosParticipacao as Record<string, unknown>)?.numeros as number[])
          : [];
        try {
          await sendTicketEmail(
            primeira.emailCliente,
            primeira.nomeCliente || 'Cliente',
            jogo.nome,
            numeros.map((n: number) => n.toString()),
            jogo.evento.nome
          );
        } catch (err: any) {
          console.error('[Email] Erro ao enviar bilhete:', err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      participacao: data.quantidade === 1 ? (() => {
        const p = result.participacoes[0];
        try {
          const dados = typeof p.dadosParticipacao === 'string'
            ? JSON.parse(p.dadosParticipacao)
            : p.dadosParticipacao;
          return { ...p, grid: dados?.grid || null, hasWin: dados?.hasWin || false };
        } catch {
          return p;
        }
      })() : result.participacoes,
      valorTotal: result.valorTotal,
    }, { status: 201 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    log.error('Erro ao criar participação', error);
    if (error.message === 'Stock insuficiente' || error.message.includes('Stock insuficiente')) {
      return NextResponse.json({ error: 'Stock insuficiente' }, { status: 400 });
    }
    if (error.message && error.message.includes('já foi vendido')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
