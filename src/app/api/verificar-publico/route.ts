import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hash } = body;

    if (!hash || typeof hash !== 'string' || hash.trim().length === 0) {
      return NextResponse.json({ error: 'Hash é obrigatório' }, { status: 400 });
    }

    const cleanHash = hash.trim();

    const participacao = await prisma.participacao.findFirst({
      where: {
        OR: [
          { hashRaspe: cleanHash },
          { hashParticipacao: cleanHash },
        ],
      },
      include: {
        jogo: { select: { id: true, nome: true, tipo: true, preco: true, aldeia: { select: { nome: true } } } },
        user: { select: { id: true, nome: true } },
      },
    });

    if (!participacao) {
      return NextResponse.json({
        valido: false,
        mensagem: 'Participação não encontrada com este hash.',
      });
    }

    let hashCorresponde = false;
    let resultado: string | null = null;

    if (participacao.hashRaspe && participacao.seedRaspe && participacao.dadosParticipacao) {
      const dados = JSON.parse(participacao.dadosParticipacao);
      const uniqueSalt = dados.uniqueSalt;
      const timestamp = dados.generatedAt;

      if (uniqueSalt && timestamp && participacao.resultadoRaspe) {
        const novoHash = crypto.createHash('sha256')
          .update(`${participacao.seedRaspe}:${participacao.resultadoRaspe}:${uniqueSalt}:${timestamp}`)
          .digest('hex');
        hashCorresponde = novoHash === cleanHash;
        resultado = participacao.resultadoRaspe;
      }
    } else if (participacao.dadosVerificacao) {
      try {
        const verifData = JSON.parse(participacao.dadosVerificacao);
        const { seed, timestamp, uniqueSalt } = verifData;

        if (seed && timestamp && uniqueSalt) {
          let dadosPart = null;
          try { dadosPart = JSON.parse(participacao.dadosParticipacao); } catch {}

          let resultadoStr = 'sem_premio';
          if (dadosPart?.numeros) resultadoStr = JSON.stringify(dadosPart.numeros);
          else if (dadosPart?.coordenadas) resultadoStr = JSON.stringify(dadosPart.coordenadas);

          const novoHash = crypto.createHash('sha256')
            .update(`${seed}:${resultadoStr}:${uniqueSalt}:${timestamp}`)
            .digest('hex');
          hashCorresponde = novoHash === cleanHash;
          resultado = resultadoStr;
        }
      } catch {}
    }

    return NextResponse.json({
      valido: hashCorresponde,
      mensagem: hashCorresponde
        ? 'Hash verificada com sucesso. Esta participação é autêntica.'
        : 'Hash não corresponde. Participação pode ter sido adulterada.',
      participacao: {
        id: participacao.id,
        jogo: participacao.jogo.nome,
        tipoJogo: participacao.jogo.tipo,
        aldeia: participacao.jogo.aldeia?.nome || '—',
        valorPago: participacao.valorPago,
        data: participacao.createdAt,
        ganhador: participacao.ganhador,
        premioEntregue: participacao.premioEntregue,
        resultado,
      },
    });
  } catch (error) {
    console.error('Erro na verificação pública:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
