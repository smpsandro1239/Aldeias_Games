import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { getPaginationFromRequest, createPaginatedResponse } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { page, limit } = getPaginationFromRequest(request);
    const skip = (page - 1) * limit;
    const url = new URL(request.url);

    const jogoId = url.searchParams.get('jogoId');
    const jogoTipo = url.searchParams.get('jogoTipo');
    const aldeiaIdParam = url.searchParams.get('aldeiaId');
    const eventoId = url.searchParams.get('eventoId');
    const search = url.searchParams.get('search');
    const estadoPagamento = url.searchParams.get('estadoPagamento');
    const ganhador = url.searchParams.get('ganhador');

    // Build jogo relation filter
    const jogoFilters: Record<string, unknown>[] = [];
    if (jogoId) jogoFilters.push({ id: jogoId });
    if (jogoTipo) jogoFilters.push({ tipo: jogoTipo });
    if (eventoId) jogoFilters.push({ evento: { id: eventoId } });
    if (aldeiaIdParam) jogoFilters.push({ evento: { aldeiaId: aldeiaIdParam } });

    const where: Record<string, unknown> = {};

    if (estadoPagamento) where.estadoPagamento = estadoPagamento;
    if (ganhador === 'true') where.ganhador = true;
    if (ganhador === 'false') where.ganhador = false;

    if (jogoFilters.length > 0) {
      where.jogo = jogoFilters.length === 1 ? jogoFilters[0] : { AND: jogoFilters };
    }

    if (search) {
      where.OR = [
        { hashParticipacao: { contains: search } },
        { hashRaspe: { contains: search } },
        { nomeCliente: { contains: search } },
        { emailCliente: { contains: search } },
        { telefoneCliente: { contains: search } },
      ];
    }

    // Role-based filtering
    if (user.role === 'super_admin') {
      // See everything
    } else if (user.role === 'aldeia_admin') {
      const jogos = await prisma.jogo.findMany({
        where: { evento: { aldeiaId: user.aldeiaId as string } },
        select: { id: true },
      });
      const jogoIds = jogos.map((j: { id: string }) => j.id);
      where.jogoId = { in: jogoIds };
      // Remove any jogo relation filter since jogoId already scopes
      delete where.jogo;
    } else if (user.role === 'vendedor') {
      where.OR = [
        { vendedorId: user.id },
        { userId: user.id },
      ];
    } else {
      const orConditions: Record<string, unknown>[] = [{ userId: user.id }];
      if ((user as Record<string, unknown>).email) {
        orConditions.push({ emailCliente: (user as Record<string, unknown>).email });
      }
      if ((user as Record<string, unknown>).telefone) {
        orConditions.push({ telefoneCliente: (user as Record<string, unknown>).telefone });
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
          dadosParticipacao: true,
          hashParticipacao: true,
          hashRaspe: true,
          dadosVerificacao: true,
          seedRaspe: true,
          resultadoRaspe: true,
          revelado: true,
          ganhador: true,
          premioEntregue: true,
          nomeCliente: true,
          telefoneCliente: true,
          emailCliente: true,
          createdAt: true,
          vendedorId: true,
          userId: true,
          jogo: {
            select: {
              id: true,
              nome: true,
              tipo: true,
              preco: true,
              sorteado: true,
              dataSorteio: true,
              evento: {
                select: {
                  id: true,
                  nome: true,
                  aldeia: {
                    select: { id: true, nome: true, slug: true },
                  },
                },
              },
            },
          },
          vendedor: {
            select: { id: true, nome: true, email: true },
          },
          user: {
            select: { id: true, nome: true, email: true },
          },
          numerosVendidos: {
            select: { numero: true },
            orderBy: { numero: 'asc' },
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
    console.error('Erro ao buscar números jogados:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}
