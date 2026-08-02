import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getOfficialTime, getNextFriday, getBloqueioData } from "@/lib/time";
import { getFullUserFromRequest } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac/checkPermission";

// POST - Criar jogo de Euromilhões recorrente (nova grelha todas as sextas-feiras)
export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    const denied = await requirePermission(user.id, 'CREATE_JOGO', user.aldeiaId || undefined);
    if (denied) return denied;

    const body = await request.json();
    const {
      eventoId,
      nome,
      preco,
      stockInicial,
      limitePorUsuario,
      localSorteio,
      premioDescricao,
      premioValor,
      descricao,
    } = body;

    if (!eventoId || !nome || !preco || !stockInicial) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const evento = await prisma.evento.findUnique({
      where: { id: eventoId },
      include: { aldeia: true },
    });

    if (!evento) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    if (user.role === 'aldeia_admin' && evento.aldeiaId !== user.aldeiaId) {
      return NextResponse.json({ error: "Não pode criar jogos para outra aldeia" }, { status: 403 });
    }

    const premioValorNum = premioValor != null && premioValor !== "" ? Number(premioValor) : null;

    const horaOficial = await getOfficialTime();
    const proximaSexta = getNextFriday(horaOficial);
    const bloqueioData = getBloqueioData(proximaSexta);

    const config = {
      recorrente: true,
      frequenciaRecorrencia: "semanal",
      diaSemanaRecorrencia: 5, // Sexta-feira
      dataSorteio: proximaSexta.toISOString(),
      horaSorteio: "21:30",
      localSorteio: localSorteio || "",
      modoSorteio: "externo",
      premioDescricao: premioDescricao || null,
      premioValor: premioValorNum,
    };

    const jogo = await prisma.jogo.create({
      data: {
        nome,
        tipo: "euromilhoes",
        descricao: descricao || "Jogo recorrente de Euromilhões",
        configuracao: JSON.stringify(config),
        preco: Number(preco),
        stockInicial: Number(stockInicial),
        stockAtual: Number(stockInicial),
        limitePorUsuario: Number(limitePorUsuario) || 0,
        estado: "aberto",
        dataAbertura: new Date(),
        eventoId: evento.id,
        aldeiaId: evento.aldeiaId,
        modoSorteio: "externo",
        detalhesSorteioExterno: "Primeiro número do sorteio oficial do Euromilhões (sexta-feira, 21:30)",
        recorrente: true,
        frequenciaRecorrencia: "semanal",
        proximaDataCriacao: proximaSexta,
        ativo: true,
      },
    });

    const grelha = await prisma.grelhaEuromilhoes.create({
      data: {
        jogoId: jogo.id,
        numero: 1,
        estado: "aberta",
        numerosOcupados: "[]",
        premioDescricao: premioDescricao || null,
        premioValor: premioValorNum,
        sorteioData: proximaSexta,
        bloqueioData,
      },
    });

    return NextResponse.json(
      { success: true, data: jogo, grelha, proximaSexta: proximaSexta.toISOString() },
      { status: 201 }
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Erro ao criar jogo euromilhoes recorrente:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PUT - Processar jogos euromilhões recorrentes (chamado manualmente por cron)
export async function PUT(request: NextRequest) {
  return processarRecorrentes(request);
}

// GET - Processar jogos euromilhões recorrentes (Vercel Cron envia GET)
// Vercel envia automaticamente o header Authorization: Bearer ${CRON_SECRET}
export async function GET(request: NextRequest) {
  return processarRecorrentes(request);
}

async function processarRecorrentes(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const horaOficial = await getOfficialTime();
    const target = getNextFriday(horaOficial);
    const bloqueioData = getBloqueioData(target);

    const jogos = await prisma.jogo.findMany({
      where: {
        tipo: "euromilhoes",
        recorrente: true,
        ativo: true,
        proximaDataCriacao: { lte: horaOficial },
      },
    });

    const created: string[] = [];

    for (const jogo of jogos) {
      const config = JSON.parse(jogo.configuracao || "{}") as Record<string, unknown>;

      const existe = await prisma.grelhaEuromilhoes.findFirst({
        where: { jogoId: jogo.id, sorteioData: target },
        select: { id: true },
      });

      if (!existe) {
        const existingGrelhas = await prisma.grelhaEuromilhoes.findMany({
          where: { jogoId: jogo.id },
          select: { numero: true },
          orderBy: { numero: "asc" },
        });

        const usedNumeros = new Set(existingGrelhas.map((g: { numero: number }) => g.numero));
        let nextNumero = 1;
        while (usedNumeros.has(nextNumero)) {
          nextNumero++;
        }

        const premioValor = config.premioValor ?? config.recorrentePremioValor ?? null;
        const premioDescricao = config.premioDescricao ?? config.recorrentePremioDescricao ?? null;

        const grelha = await prisma.grelhaEuromilhoes.create({
          data: {
            jogoId: jogo.id,
            numero: nextNumero,
            estado: "aberta",
            numerosOcupados: "[]",
            premioDescricao: premioDescricao ? String(premioDescricao) : null,
            premioValor: premioValor != null ? Number(premioValor) : null,
            sorteioData: target,
            bloqueioData,
          },
        });

        created.push(grelha.id);
      }

      await prisma.jogo.update({
        where: { id: jogo.id },
        data: { proximaDataCriacao: target },
      });
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      grelhas: created,
      proximaSexta: target.toISOString(),
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Erro ao processar jogos euromilhões recorrentes:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
