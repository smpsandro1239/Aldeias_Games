import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { tipoLoteria, resultados, dataSorteio } = body;

    if (!tipoLoteria || !resultados) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const jogosExternos = await prisma.jogo.findMany({
      where: {
        modoSorteio: 'externo',
        detalhesSorteioExterno: tipoLoteria,
        sorteado: false,
        evento: user.role === 'aldeia_admin' ? { aldeiaId: user.aldeiaId as string } : undefined,
      },
      include: {
        evento: true,
        participacoes: {
          where: { estadoPagamento: 'concluido' },
          include: { user: true },
        },
      },
    });

    if (jogosExternos.length === 0) {
      return NextResponse.json(
        { error: 'Não há jogos associados a esta loteria externa' },
        { status: 404 }
      );
    }

    const resultadosProcessados: { jogoId: string; numerosSorteados: string[]; vencedores: number }[] = [];

    for (const jogo of jogosExternos) {
      const config = JSON.parse(jogo.configuracao);
      const numerosSorteados = Array.isArray(resultados) ? resultados : [resultados];
      
      const numerosParticipados = jogo.participacoes.map((p: any) => JSON.parse(p.dadosParticipacao).numero);
      const matchingNumbers = numerosParticipados.filter((n: number) => numerosSorteados.includes(n.toString()));

      if (matchingNumbers.length > 0) {
        const seed = crypto.randomBytes(32).toString('hex');
        const resultado = { numerosSorteados, matchingNumbers };
        const hash = crypto
          .createHash('sha256')
          .update(`${seed}:${JSON.stringify(resultado)}:${Date.now()}`)
          .digest('hex');

        const [sorteio] = await prisma.$transaction([
          prisma.sorteio.create({
            data: {
              seed,
              hash,
              resultado: JSON.stringify(resultado),
              observacoes: `Resultado ${tipoLoteria} - ${dataSorteio || new Date().toISOString()}`,
              jogoId: jogo.id,
              vencedores: {
                create: matchingNumbers.map((numero: number, index: number) => {
                  const participacao = (jogo.participacoes as any[]).find((p) => JSON.parse(p.dadosParticipacao).numero === numero);
                  return {
                    posicao: index + 1,
                    dadosVencedor: JSON.stringify({
                      userId: participacao?.userId,
                      userNome: participacao?.user?.nome || participacao?.nomeCliente,
                      userEmail: participacao?.user?.email || participacao?.emailCliente,
                      userTelefone: participacao?.user?.telefone || participacao?.telefoneCliente,
                      numero,
                    }),
                  };
                }),
              },
            },
          }),
          prisma.jogo.update({
            where: { id: jogo.id },
            data: { sorteado: true, dataSorteio: new Date() },
          }),
        ]);

        for (const participacao of jogo.participacoes) {
          const dados = JSON.parse(participacao.dadosParticipacao);
          if (numerosSorteados.includes(dados.numero.toString())) {
            await prisma.participacao.update({
              where: { id: participacao.id },
              data: { ganhador: true },
            });
          }
        }

        resultadosProcessados.push({
          jogoId: jogo.id,
          numerosSorteados,
          vencedores: matchingNumbers.length,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Resultados processados para ${resultadosProcessados.length} jogo(s)`,
      data: resultadosProcessados,
    });
  } catch (error) {
    console.error('Erro ao processar resultados externos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const jogosExternos = await prisma.jogo.findMany({
      where: {
        modoSorteio: 'externo',
        evento: user.role === 'aldeia_admin' ? { aldeiaId: user.aldeiaId as string } : undefined,
      },
      select: {
        id: true,
        nome: true,
        detalhesSorteioExterno: true,
        tipo: true,
        estado: true,
        sorteado: true,
        evento: { select: { nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: jogosExternos,
    });
  } catch (error) {
    console.error('Erro ao listar jogos externos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}