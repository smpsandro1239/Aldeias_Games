import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import { executarSorteioSchema } from '@/lib/validations';
import crypto from 'crypto';

// GET - Listar sorteios
export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const jogoId = url.searchParams.get('jogoId');

    let where: Record<string, unknown> = {};

    if (jogoId) {
      where.jogoId = jogoId;
    }

    // Filtrar por permissões
    if (user.role === 'aldeia_admin') {
      const jogos = await prisma.jogo.findMany({
        where: {
          evento: {
            aldeiaId: user.aldeiaId,
          },
        },
        select: { id: true },
      });
      const jogoIds = jogos.map(j => j.id);
      where.jogoId = { in: jogoIds };
    } else if (user.role === 'vendedor' || user.role === 'user') {
      // Vendedor e user só vêem sorteios de jogos onde participaram
      const participacoes = await prisma.participacao.findMany({
        where: { userId: user.id },
        select: { jogoId: true },
      });
      const jogoIds = participacoes.map(p => p.jogoId);
      where.jogoId = { in: jogoIds };
    }

    const sorteios = await prisma.sorteio.findMany({
      where,
      include: {
        jogo: {
          select: {
            id: true,
            nome: true,
            tipo: true,
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
        vencedores: {
          orderBy: { posicao: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: sorteios,
    });
  } catch (error) {
    console.error('Erro ao listar sorteios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Executar sorteio
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
    const validation = executarSorteioSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { jogoId, observacoes } = validation.data;

    // Buscar jogo
    const jogo = await prisma.jogo.findUnique({
      where: { id: jogoId },
      include: {
        evento: true,
        participacoes: {
          where: {
            estadoPagamento: 'concluido',
          },
          include: {
            user: {
              select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
              },
            },
          },
        },
      },
    });

    if (!jogo) {
      return NextResponse.json(
        { error: 'Jogo não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissão
    if (user.role === 'aldeia_admin' && jogo.evento.aldeiaId !== user.aldeiaId) {
      return NextResponse.json(
        { error: 'Não pode executar sorteios de outra aldeia' },
        { status: 403 }
      );
    }

    // Verificar se já foi sorteado
    if (jogo.sorteado) {
      return NextResponse.json(
        { error: 'Este jogo já foi sorteado' },
        { status: 400 }
      );
    }

    // Verificar se há participações
    if (jogo.participacoes.length === 0) {
      return NextResponse.json(
        { error: 'Não há participações para sortear' },
        { status: 400 }
      );
    }

    // Gerar seed aleatória
    const seed = crypto.randomBytes(32).toString('hex');

    // Executar sorteio baseado no tipo de jogo
    let resultado: Record<string, unknown>;
    let vencedores: { posicao: number; participacaoId: string; dados: unknown }[] = [];

    if (jogo.tipo === 'poio_da_vaca') {
      // Sortear coordenada vencedora
      const config = JSON.parse(jogo.configuracao);
      const letra = config.letras[Math.floor(Math.random() * config.letras.length)];
      const numero = Math.floor(Math.random() * config.numerosPorLetra) + 1;
      
      resultado = { letraVencedora: letra, numeroVencedor: numero };
      
      // Encontrar vencedor(es)
      const vencedoresPoio = jogo.participacoes.filter(p => {
        const dados = JSON.parse(p.dadosParticipacao as string);
        return dados.letra === letra && dados.numero === numero;
      });

      vencedores = vencedoresPoio.map((v, index) => ({
        posicao: index + 1,
        participacaoId: v.id,
        dados: {
          userId: v.user.id,
          userNome: v.user.nome,
          letra,
          numero,
        },
      }));
    } else if (jogo.tipo === 'rifa' || jogo.tipo === 'tombola') {
      // Sortear número vencedor
      const config = JSON.parse(jogo.configuracao);
      const numeroVencedor = Math.floor(
        Math.random() * (config.numeroFinal - config.numeroInicial + 1)
      ) + config.numeroInicial;
      
      resultado = { numeroVencedor };
      
      // Encontrar vencedor(es)
      const vencedoresRifa = jogo.participacoes.filter(p => {
        const dados = JSON.parse(p.dadosParticipacao as string);
        return dados.numero === numeroVencedor;
      });

      vencedores = vencedoresRifa.map((v, index) => ({
        posicao: index + 1,
        participacaoId: v.id,
        dados: {
          userId: v.user.id,
          userNome: v.user.nome,
          numero: numeroVencedor,
        },
      }));
    } else {
      return NextResponse.json(
        { error: 'Tipo de jogo não suportado para sorteio' },
        { status: 400 }
      );
    }

    // Gerar hash para auditoria
    const hash = crypto
      .createHash('sha256')
      .update(`${seed}:${JSON.stringify(resultado)}:${Date.now()}`)
      .digest('hex');

    // Criar sorteio
    const sorteio = await prisma.sorteio.create({
      data: {
        seed,
        hash,
        resultado: JSON.stringify(resultado),
        observacoes,
        jogoId,
        vencedores: {
          create: vencedores.map(v => ({
            posicao: v.posicao,
            dadosVencedor: JSON.stringify(v.dados),
          })),
        },
      },
      include: {
        vencedores: true,
      },
    });

    // Atualizar jogo como sorteado
    await prisma.jogo.update({
      where: { id: jogoId },
      data: {
        sorteado: true,
        dataSorteio: new Date(),
      },
    });

    // Marcar participações como ganhadoras
    for (const vencedor of vencedores) {
      await prisma.participacao.update({
        where: { id: vencedor.participacaoId },
        data: { ganhador: true },
      });

      // Criar notificação para o vencedor
      const dados = vencedor.dados as { userId: string; userNome: string };
      await prisma.notificacao.create({
        data: {
          tipo: 'sorteio',
          titulo: 'Parabéns! Você ganhou!',
          mensagem: `Você foi o vencedor do sorteio "${jogo.nome}". Entre em contacto com a organização para receber o seu prémio!`,
          userId: dados.userId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Sorteio executado com sucesso',
      data: {
        sorteio,
        resultado,
        vencedores: vencedores.length,
      },
    });
  } catch (error) {
    console.error('Erro ao executar sorteio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
