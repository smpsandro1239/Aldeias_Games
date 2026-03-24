import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import { createParticipacaoSchema } from '@/lib/validations';
import { getPaginationFromRequest, createPaginatedResponse } from '@/lib/pagination';
import crypto from 'crypto';

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

    // Construir where
    let where: Record<string, unknown> = {};

    if (jogoId) {
      where.jogoId = jogoId;
    }

    // Filtrar por permissões
    if (user.role === 'super_admin') {
      // Super admin vê todas
      if (userId) {
        where.userId = userId;
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
      const jogoIds = jogos.map(j => j.id);
      
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
        include: {
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
          user: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true,
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
  } catch (error) {
    console.error('Erro ao listar participações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar participação
export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createParticipacaoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Buscar jogo
    const jogo = await prisma.jogo.findUnique({
      where: { id: data.jogoId },
      include: {
        evento: true,
      },
    });

    if (!jogo) {
      return NextResponse.json(
        { error: 'Jogo não encontrado' },
        { status: 404 }
      );
    }

    if (jogo.estado !== 'aberto') {
      return NextResponse.json(
        { error: 'Este jogo não está aberto para participações' },
        { status: 400 }
      );
    }

    // Verificar stock (apenas para resposta inicial, a transação atomicará)
    if (jogo.stockAtual < data.quantidade) {
      return NextResponse.json(
        { error: 'Stock insuficiente' },
        { status: 400 }
      );
    }

    // Calcular valor total
    const valorTotal = jogo.preco * data.quantidade;

    // Verificar pagamento por saldo
    if (data.metodoPagamento === 'saldo') {
      if (((user as any).saldo || 0) < valorTotal) {
        return NextResponse.json(
          { error: 'Saldo insuficiente na carteira' },
          { status: 400 }
        );
      }
    }

    // Usar transação atómica para evitar race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Verificar stock dentro da transação com locking
      const jogoLocked = await tx.jogo.findUnique({
        where: { id: data.jogoId },
        select: { stockAtual: true, preco: true, tipo: true, nome: true },
      });

      if (!jogoLocked || jogoLocked.stockAtual < data.quantidade) {
        throw new Error('Stock insuficiente');
      }

      // Atualizar stock atomicamente (só executa se stock for suficiente)
      const updated = await tx.jogo.updateMany({
        where: {
          id: data.jogoId,
          stockAtual: { gte: data.quantidade }, // Condição atómica
        },
        data: {
          stockAtual: { decrement: data.quantidade },
          totalParticipacoes: { increment: data.quantidade },
          totalAngariado: { increment: valorTotal },
        },
      });

      if (updated.count === 0) {
        throw new Error('Stock insuficiente - operação concorrente');
      }

      // Criar participações (pode ser múltipla)
      const participacoes = [];
      
      for (let i = 0; i < data.quantidade; i++) {
        const dados: Record<string, unknown> = {
          dadosParticipacao: JSON.stringify(data.dadosParticipacao),
          valorPago: jogo.preco,
          metodoPagamento: data.metodoPagamento,
          estadoPagamento: data.metodoPagamento === 'dinheiro' ? 'concluido' : 'pendente',
          jogoId: data.jogoId,
          userId: data.dadosCliente ? null : user.id,
          vendedorId: hasRole(user.role, ['aldeia_admin', 'vendedor']) ? user.id : undefined,
          nomeCliente: data.dadosCliente?.nome,
          telefoneCliente: data.dadosCliente?.telefone,
          emailCliente: data.dadosCliente?.email,
        };

        if (jogo.tipo === 'raspadinha') {
          const seed = generateSeed();
          const resultado = determineRaspadinhaResult(jogo.configuracao, jogo.stockInicial, jogo.stockAtual - i);
          const hash = generateHash(seed, resultado, jogo.stockAtual - i);
          
          dados.seedRaspe = seed;
          dados.hashRaspe = hash;
          dados.resultadoRaspe = resultado;
        }

        const participacao = await tx.participacao.create({
          data: dados as never,
          include: {
            jogo: {
              select: {
                id: true,
                nome: true,
                tipo: true,
                preco: true,
              },
            },
          },
        });

        participacoes.push(participacao);
      }

      // Atualizar total do evento
      await tx.evento.update({
        where: { id: jogo.eventoId },
        data: {
          totalParticipacoes: { increment: data.quantidade },
          totalAngariado: { increment: valorTotal },
        },
      });

      // --- LÓGICA DE CARTEIRA E CASHBACK ---
      // Apenas aplicar cashback se a participação for para o utilizador autenticado
      // (não para vendas externas anónimas)
      const isVendaInterna = !data.dadosCliente && user.id;
      
      if (isVendaInterna) {
        const cashbackPercent = 0.05;
        const cashbackValor = valorTotal * cashbackPercent;

        // Se pagou com saldo, descontar
        if (data.metodoPagamento === 'saldo') {
          await tx.user.update({
            where: { id: user.id },
            data: {
              saldo: { decrement: valorTotal },
            },
          });

          await tx.transacao.create({
            data: {
              userId: user.id,
              valor: -valorTotal,
              tipo: 'pagamento_jogo',
              descricao: `Pagamento de ${data.quantidade}x ${jogo.nome}`,
              referencia: jogo.id,
            },
          });
        }

        // Adicionar Cashback apenas para vendas internas
        await tx.user.update({
          where: { id: user.id },
          data: {
            saldo: { increment: cashbackValor },
          },
        });

        await tx.transacao.create({
          data: {
            userId: user.id,
            valor: cashbackValor,
            tipo: 'cashback',
            descricao: `Cashback de compra: ${jogo.nome}`,
            referencia: jogo.id,
          },
        });
      } else if (data.metodoPagamento === 'saldo' && data.dadosCliente) {
        // Venda externa com saldo - não há cashback mas desconta do vendedor/admin
        await tx.user.update({
          where: { id: user.id },
          data: {
            saldo: { decrement: valorTotal },
          },
        });

        await tx.transacao.create({
          data: {
            userId: user.id,
            valor: -valorTotal,
            tipo: 'pagamento_jogo',
            descricao: `Pagamento de ${data.quantidade}x ${jogo.nome} (venda externa)`,
            referencia: jogo.id,
          },
        });
      }

      return { participacoes, valorTotal };
    });

    return NextResponse.json({
      success: true,
      data: data.quantidade === 1 ? result.participacoes[0] : result.participacoes,
      valorTotal: result.valorTotal,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar participação:', error);
    if (error.message === 'Stock insuficiente' || error.message.includes('Stock insuficiente')) {
      return NextResponse.json(
        { error: 'Stock insuficiente' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Funções auxiliares para raspadinha
function generateSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateHash(seed: string, resultado: string, cardNumber: number): string {
  return crypto
    .createHash('sha256')
    .update(`${seed}:${resultado}:${cardNumber}`)
    .digest('hex');
}

function determineRaspadinhaResult(configJson: string, stockInicial: number, cardNumber: number): string {
  const config = JSON.parse(configJson);
  const premios = config.premios || [];
  
  // Calcular ranges baseado nas percentagens
  let currentRange = 0;
  const ranges: { nome: string; start: number; end: number }[] = [];
  
  for (const premio of premios) {
    const count = Math.floor(stockInicial * premio.percentagem);
    if (count > 0) {
      ranges.push({
        nome: premio.nome,
        start: currentRange,
        end: currentRange + count,
      });
      currentRange += count;
    }
  }
  
  // Determinar prémio baseado no número do cartão
  for (const range of ranges) {
    if (cardNumber >= range.start && cardNumber < range.end) {
      return range.nome;
    }
  }
  
  return 'sem_premio';
}
