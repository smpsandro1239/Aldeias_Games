import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import { createJogoSchema } from '@/lib/validations';
import { getPaginationFromRequest, createPaginatedResponse } from '@/lib/pagination';

// GET - Listar jogos
export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    const { page, limit } = getPaginationFromRequest(request);
    const skip = (page - 1) * limit;

    const url = new URL(request.url);
    const eventoId = url.searchParams.get('eventoId');
    const tipo = url.searchParams.get('tipo');
    const estado = url.searchParams.get('estado');
    const ativos = url.searchParams.get('ativos');

    // Construir where
    let where: Record<string, unknown> = {};

    if (eventoId) {
      where.eventoId = eventoId;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (estado) {
      where.estado = estado;
    }

    if (ativos === 'true') {
      where.estado = 'aberto';
    }

    // Filtrar por permissões
    if (user) {
      if (user.role === 'aldeia_admin') {
        const eventos = await prisma.evento.findMany({
          where: { aldeiaId: user.aldeiaId as string },
          select: { id: true },
        });
        const eventoIds = eventos.map(e => e.id);
        where.eventoId = { in: eventoIds };
      } else if (user.role === 'vendedor') {
        const eventos = await prisma.evento.findMany({
          where: { aldeiaId: user.aldeiaId as string },
          select: { id: true },
        });
        const eventoIds = eventos.map(e => e.id);
        where.eventoId = { in: eventoIds };
      }
    } else {
      // Não autenticado só vê jogos abertos de eventos públicos
      where.estado = 'aberto';
      where.evento = {
        publico: true,
      };
    }

    const [jogos, total] = await Promise.all([
      prisma.jogo.findMany({
        where,
        include: {
          evento: {
            select: {
              id: true,
              nome: true,
              slug: true,
              aldeiaId: true,
              aldeia: {
                select: {
                  id: true,
                  nome: true,
                  slug: true,
                },
              },
            },
          },
          premios: {
            select: {
              id: true,
              nome: true,
              imagemUrl: true,
              valorDinheiroAlternative: true,
              ordem: true,
            },
            orderBy: {
              ordem: 'asc',
            },
          },
          _count: {
            select: {
              participacoes: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.jogo.count({ where }),
    ]);

    return NextResponse.json(
      createPaginatedResponse(jogos, total, page, limit)
    );
  } catch (error) {
    console.error('Erro ao listar jogos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar jogo
export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createJogoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verificar se evento existe e pertence à aldeia do admin
    const evento = await prisma.evento.findUnique({
      where: { id: data.eventoId },
      include: { aldeia: true },
    });

    if (!evento) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    if (user.role === 'aldeia_admin' && evento.aldeiaId !== user.aldeiaId) {
      return NextResponse.json(
        { error: 'Não pode criar jogos para outra aldeia' },
        { status: 403 }
      );
    }

    // Criar jogo
    const jogo = await prisma.jogo.create({
      data: {
        nome: data.nome,
        tipo: data.tipo,
        descricao: data.descricao,
        configuracao: JSON.stringify(data.configuracao),
        preco: data.preco,
        stockInicial: data.stockInicial,
        stockAtual: data.stockInicial,
        limitePorUsuario: data.limitePorUsuario,
        estado: 'rascunho',
        eventoId: data.eventoId,
        modoSorteio: data.modoSorteio,
        detalhesSorteioExterno: data.detalhesSorteioExterno,
        // Se vierem prémios no createJogo, criá-los
        premios: data.premios ? {
          create: data.premios.map(p => ({
            ...p,
            aldeiaId: evento.aldeiaId,
          }))
        } : undefined,
      },
      include: {
        evento: {
          select: {
            id: true,
            nome: true,
            aldeiaId: true,
          },
        },
        premios: {
          select: {
            id: true,
            nome: true,
            ordem: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: jogo },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar jogo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
