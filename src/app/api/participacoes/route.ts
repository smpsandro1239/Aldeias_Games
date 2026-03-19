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
            aldeiaId: user.aldeiaId,
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
      // User normal só vê as suas
      where.userId = user.id;
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

    // Verificar stock
    if (jogo.stockAtual < data.quantidade) {
      return NextResponse.json(
        { error: 'Stock insuficiente' },
        { status: 400 }
      );
    }

    // Calcular valor total
    const valorTotal = jogo.preco * data.quantidade;

    // Criar participações (pode ser múltipla)
    const participacoes = [];
    
    for (let i = 0; i < data.quantidade; i++) {
      const dados: Record<string, unknown> = {
        dadosParticipacao: JSON.stringify(data.dadosParticipacao),
        valorPago: jogo.preco,
        metodoPagamento: data.metodoPagamento,
        estadoPagamento: data.metodoPagamento === 'dinheiro' ? 'concluido' : 'pendente',
        jogoId: data.jogoId,
        userId: data.dadosCliente ? user.id : user.id, // Se tem dadosCliente, é venda externa
        vendedorId: hasRole(user.role, ['aldeia_admin', 'vendedor']) ? user.id : undefined,
      };

      // Para raspadinha, gerar seed e hash
      if (jogo.tipo === 'raspadinha') {
        const seed = generateSeed();
        const resultado = determineRaspadinhaResult(jogo.configuracao, jogo.stockInicial, jogo.stockAtual - i);
        const hash = generateHash(seed, resultado, jogo.stockAtual - i);
        
        dados.seedRaspe = seed;
        dados.hashRaspe = hash;
        dados.resultadoRaspe = resultado;
      }

      const participacao = await prisma.participacao.create({
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

    // Atualizar stock do jogo
    await prisma.jogo.update({
      where: { id: jogo.id },
      data: {
        stockAtual: { decrement: data.quantidade },
        totalParticipacoes: { increment: data.quantidade },
        totalAngariado: { increment: valorTotal },
      },
    });

    // Atualizar total do evento
    await prisma.evento.update({
      where: { id: jogo.eventoId },
      data: {
        totalParticipacoes: { increment: data.quantidade },
        totalAngariado: { increment: valorTotal },
      },
    });

    return NextResponse.json({
      success: true,
      data: data.quantidade === 1 ? participacoes[0] : participacoes,
      valorTotal,
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar participação:', error);
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
