import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const participacao = await prisma.participacao.findUnique({
      where: { id },
      include: {
        jogo: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            preco: true,
            aldeia: { select: { id: true, nome: true } },
            configuracao: true,
          },
        },
        user: { select: { id: true, nome: true } },
        vendedor: { select: { id: true, nome: true } },
      },
    });

    if (!participacao) {
      return NextResponse.json({ error: 'Participação não encontrada' }, { status: 404 });
    }

    const user = await getFullUserFromRequest(request);
    const isOwner = user?.id === participacao.userId;
    const isSeller = user?.id === participacao.vendedorId;
    const isAdmin = user?.role === 'super_admin' || user?.role === 'aldeia_admin';
    const isPublic = !user;

    if (!isOwner && !isSeller && !isAdmin && !isPublic) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    let hash = participacao.hashRaspe || participacao.hashParticipacao;
    let verificavel = false;
    let resultado: string | null = null;
    let numerosSelecionados: number[] | number[][] | null = null;
    let coordenadas: { letra: string; numero: number }[] | null = null;
    let dadosPart: Record<string, unknown> = {};

    try {
      dadosPart = JSON.parse(participacao.dadosParticipacao || '{}');
    } catch {}

    if (participacao.hashRaspe && participacao.seedRaspe && participacao.resultadoRaspe) {
      const uniqueSalt = dadosPart.uniqueSalt;
      const timestamp = dadosPart.generatedAt;

      if (uniqueSalt && timestamp) {
        const novoHash = crypto.createHash('sha256')
          .update(`${participacao.seedRaspe}:${participacao.resultadoRaspe}:${uniqueSalt}:${timestamp}`)
          .digest('hex');
        verificavel = novoHash === hash;
        resultado = participacao.resultadoRaspe;
      }

      const grid = dadosPart.grid;
      if (Array.isArray(grid)) {
        numerosSelecionados = null;
      }
    } else if (participacao.dadosVerificacao) {
      try {
        const verifData = JSON.parse(participacao.dadosVerificacao);
        const { seed, timestamp, uniqueSalt } = verifData;

        if (seed && timestamp && uniqueSalt) {
          let resultadoStr = 'sem_premio';
          if (dadosPart.numeros) {
            resultadoStr = JSON.stringify(dadosPart.numeros);
            numerosSelecionados = dadosPart.numeros as number[];
          } else if (dadosPart.coordenadas) {
            resultadoStr = JSON.stringify(dadosPart.coordenadas);
            coordenadas = dadosPart.coordenadas as { letra: string; numero: number }[];
          }

          const novoHash = crypto.createHash('sha256')
            .update(`${seed}:${resultadoStr}:${uniqueSalt}:${timestamp}`)
            .digest('hex');
          verificavel = novoHash === hash;
          resultado = resultadoStr;
        }
      } catch {}
    }

    const hasSorteio = participacao.jogo.tipo !== 'raspadinha';
    const aguardaSorteio = hasSorteio && !participacao.jogo.sorteado;

    let tipoProva: 'participacao' | 'premio' = 'participacao';
    if (participacao.ganhador) {
      tipoProva = 'premio';
    }

    return NextResponse.json({
      id: participacao.id,
      hash,
      tipoProva,
      jogoNome: participacao.jogo.nome,
      jogoTipo: participacao.jogo.tipo,
      aldeia: participacao.jogo.aldeia?.nome || '—',
      aldeiaId: participacao.jogo.aldeia?.id,
      valorPago: participacao.valorPago,
      premioValor: participacao.ganhador ? (dadosPart.winningPrize as any)?.valorDinheiroAlternative || null : null,
      resultado,
      ganhador: participacao.ganhador,
      premioEntregue: participacao.premioEntregue,
      aguardaSorteio,
      sorteado: participacao.jogo.sorteado,
      numerosSelecionados,
      coordenadas,
      grid: dadosPart.grid || null,
      data: participacao.createdAt,
      nomeCliente: participacao.nomeCliente || participacao.user?.nome || null,
      vendedor: participacao.vendedor?.nome || null,
      verificavel,
    });
  } catch (error) {
    console.error('Erro ao buscar prova:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
