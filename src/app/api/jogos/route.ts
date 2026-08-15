import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { createJogoSchema } from '@/lib/validations';
import { getPaginationFromRequest, createPaginatedResponse } from '@/lib/pagination';
import { createHash } from 'crypto';
import { logJogoWrite } from '@/lib/audit';
import { createLogger, extractRequestContext } from '@/lib/logger';
import { getOfficialTime, getNextFriday, getBloqueioData } from '@/lib/time';
import { buildRaspadinhaPool } from '@/app/api/participacoes/_lib/raspadinha';
import { generateLetras as generatePoioLetras } from '@/lib/poio-utils';

function gerarHashVerificacao(dados: {
  tipo: string;
  nome: string;
  preco: number;
  stock: number;
  premios: Array<{ nome?: string; valor?: number; percentagem?: number }>;
  lucroMinimoPercent: number;
  custoMedioPrevisto: number;
  receitaEsperada: number;
  lucroLiquidoPrevisto: number;
}): string {
  const texto = JSON.stringify({
    ...dados,
    timestamp: new Date().toISOString(),
    versao: '1.0'
  });
  
  const hash = createHash('sha256').update(texto).digest('hex');
  return `AG-${hash.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

interface CalcularRentabilidadeData {
  preco?: number;
  stockInicial?: number;
  premios?: Array<{ percentagem?: number; valorDinheiroAlternative?: number }>;
  dimensoesCampo?: string;
  custoQuadrado?: number;
  valorCompraVaca?: number;
  [key: string]: unknown;
}

function calcularRentabilidade(tipo: string, dados: CalcularRentabilidadeData) {
  const resultado = {
    lucroMinimoPercent: 0,
    custoMedioPrevisto: 0,
    receitaEsperada: 0,
    lucroLiquidoPrevisto: 0,
    percentagemTotalPremios: 0
  };
  
  const preco = dados.preco || 0;
  const stock = dados.stockInicial || 0;
  resultado.receitaEsperada = preco * stock;
  
  if (tipo === 'raspadinha') {
    const premios = dados.premios || [];
    resultado.percentagemTotalPremios = premios.reduce((acc: number, p: { percentagem?: number; valorDinheiroAlternative?: number }) => acc + (p.percentagem || 0), 0);
    resultado.custoMedioPrevisto = premios.reduce((acc: number, p: { percentagem?: number; valorDinheiroAlternative?: number }) => 
      acc + ((p.valorDinheiroAlternative || 0) * (p.percentagem || 0) / 100), 0);
    resultado.lucroLiquidoPrevisto = resultado.receitaEsperada - (resultado.custoMedioPrevisto * stock);
    resultado.lucroMinimoPercent = resultado.receitaEsperada > 0
      ? (resultado.lucroLiquidoPrevisto / resultado.receitaEsperada) * 100
      : 0;
  } else if (tipo === 'rifa') {
    const premios = dados.premios || [];
    const custoTotalPremios = premios.reduce((acc: number, p: { percentagem?: number; valorDinheiroAlternative?: number }) => acc + (p.valorDinheiroAlternative || 0), 0);
    resultado.lucroLiquidoPrevisto = resultado.receitaEsperada - custoTotalPremios;
    resultado.lucroMinimoPercent = resultado.receitaEsperada > 0 
      ? (resultado.lucroLiquidoPrevisto / resultado.receitaEsperada) * 100 
      : 0;
  } else if (tipo === 'poio_da_vaca') {
    let dimensoes = { x: 10, y: 10 };
    try {
      if (dados.dimensoesCampo) {
        dimensoes = JSON.parse(dados.dimensoesCampo);
      }
    } catch {
      dimensoes = { x: 10, y: 10 };
    }
    const totalQuadrados = (dimensoes.x || 10) * (dimensoes.y || 10);
    const custoQuadrado = dados.custoQuadrado || 0;
    const valorCompraVaca = dados.valorCompraVaca || 0;
    resultado.receitaEsperada = totalQuadrados * custoQuadrado;
    resultado.lucroLiquidoPrevisto = resultado.receitaEsperada - valorCompraVaca;
    resultado.lucroMinimoPercent = resultado.receitaEsperada > 0 
      ? (resultado.lucroLiquidoPrevisto / resultado.receitaEsperada) * 100 
      : 0;
  }
  
  return resultado;
}

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
    const incluirEliminados = url.searchParams.get('incluirEliminados') === 'true';

    // Jogos eliminados (soft-delete) nunca aparecem em listas públicas/gerais
    let where: Record<string, unknown> = incluirEliminados ? {} : { eliminado: false };

    if (eventoId) {
      where.eventoId = eventoId;
    }

    if (tipo) {
      where.tipo = tipo as any;
    }

    if (estado) {
      where.estado = estado as any;
    }

    if (ativos === 'true') {
      where.estado = 'aberto';
    }

    // Filtrar por permissões
    if (user) {
      if (user.role === 'super_admin') {
        // Super admin vê tudo, sem filtro adicional
      } else if (user.role === 'aldeia_admin' || user.role === 'vendedor' || user.role === 'user') {
        if (user.aldeiaId) {
          where.evento = { aldeiaId: user.aldeiaId };
        } else {
          // Sem aldeia = sem jogos
          return NextResponse.json(
            createPaginatedResponse([], 0, page, limit)
          );
        }
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
              percentagem: true,
              ordem: true,
            },
            orderBy: {
              ordem: 'asc',
            },
          },
        },
      }),
      prisma.jogo.count({ where }),
    ]);

    // Adicionar configuracao a cada jogo
    const jogosComConfig = jogos.map((jogo: (typeof jogos)[number]) => ({
      ...jogo,
      configuracao: typeof jogo.configuracao === 'string' 
        ? JSON.parse(jogo.configuracao) 
        : jogo.configuracao,
    }));

    return NextResponse.json(
      createPaginatedResponse(jogosComConfig, total, page, limit)
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
  const log = createLogger(extractRequestContext(request));
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // RBAC: create jogo requires CREATE_JOGO permission (aldeia_admin / super_admin)
    const denied = await requirePermission(user.id, 'CREATE_JOGO', user.aldeiaId || undefined);
    if (denied) return denied;

    const body = await request.json();
    const validation = createJogoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

     const data = validation.data;

      // Validação defensiva no backend para rifa
      if (data.tipo === 'rifa') {
        const config = data.configuracao as Record<string, unknown>;
        const numeroInicial = config?.numeroInicial;
        const numeroFinal = config?.numeroFinal;

        if (typeof numeroInicial !== 'number' || typeof numeroFinal !== 'number') {
          return NextResponse.json(
            { error: 'Configuração de números inicial/final é obrigatória para rifa' },
            { status: 400 }
          );
        }

        if (numeroFinal <= numeroInicial) {
          return NextResponse.json(
            { error: 'Número final deve ser maior que número inicial para rifa' },
            { status: 400 }
          );
        }

        const intervalo = numeroFinal - numeroInicial + 1;
        if (intervalo < data.stockInicial) {
          return NextResponse.json(
            { error: 'Stock inicial excede o intervalo numérico disponível' },
            { status: 400 }
          );
        }

        if (!config?.dataSorteio || !config?.horaSorteio || !config?.localSorteio) {
          return NextResponse.json(
            { error: 'Data, hora e local do sorteio são obrigatórios para rifa' },
            { status: 400 }
          );
        }
      }

     // Verificar se evento exists
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

    if (evento.estado !== 'ativo' && evento.estado !== 'rascunho') {
      return NextResponse.json(
        { error: 'Evento não está disponível. Só é possível criar jogos para eventos ativos ou em rascunho.' },
        { status: 400 }
      );
    }

    if (new Date(evento.dataFim) < new Date()) {
      return NextResponse.json(
        { error: 'Evento já terminou. Só é possível criar jogos para eventos dentro do prazo.' },
        { status: 400 }
      );
    }

    if (user.role === 'aldeia_admin' && evento.aldeiaId !== user.aldeiaId) {
      return NextResponse.json(
        { error: 'Não pode criar jogos para outra aldeia' },
        { status: 403 }
      );
    }

    // Calcular rentabilidade com proteção contra erros
    let rentabilidade = {
      lucroMinimoPercent: 0,
      custoMedioPrevisto: 0,
      receitaEsperada: 0,
      lucroLiquidoPrevisto: 0,
      percentagemTotalPremios: 0
    };
    try {
      rentabilidade = calcularRentabilidade(data.tipo, data);
    } catch (calcError: unknown) {
      console.warn('Erro ao calcular rentabilidade, usando valores padrão:', calcError);
    }
    
    // Gerar hash de verificação
    const hashVerificacao = gerarHashVerificacao({
      tipo: data.tipo,
      nome: data.nome,
      preco: data.preco,
      stock: data.stockInicial,
      premios: data.premios || [],
      ...rentabilidade
    });
    
    // Verificar lucro mínimo (50% mínimo para raspadinha e poio da vaca)
    if (rentabilidade.lucroMinimoPercent < 50 && (data.tipo === 'raspadinha' || data.tipo === 'poio_da_vaca')) {
      return NextResponse.json(
        { error: 'Jogo não cumpre requisito mínimo de 50% de lucro. Ajuste os valores.' },
        { status: 400 }
      );
    }
    
    // Preparar dados para Prisma (sem os campos novos que ainda não existem na BD)
    // Raspadinha: gerar o pool de prémios (sorteio sem reposição) — garante que
    // saem exatamente round(stock * %/100) de cada prémio, em posições aleatórias.
    let configData = data.configuracao as Record<string, unknown>;
    if (data.tipo === 'raspadinha') {
      const premiosPool = (data.premios && data.premios.length > 0 ? data.premios : (configData.premios as any[]) || []) as Array<{ nome: string; percentagem?: number }>;
      configData = { ...configData, pool: buildRaspadinhaPool(premiosPool, data.stockInicial) };
    }
    if (data.tipo === 'poio_da_vaca') {
      // Config de poio auto-gerada quando ausente: letras por colunas +
      // numerosPorLetra (linhas). Evita jogos legacy sem letras a crashar
      // o sorteio. Se dimensoesCampo não existir, default 10x10.
      let dims = { x: 10, y: 10 };
      if (data.dimensoesCampo) {
        try {
          const parsed = JSON.parse(data.dimensoesCampo);
          if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            dims = { x: parsed.x, y: parsed.y };
          }
        } catch { /* ignore */ }
      }
      const letrasAtuais = Array.isArray(configData.letras) ? configData.letras : [];
      configData = {
        ...configData,
        letras: letrasAtuais.length > 0 ? letrasAtuais : generatePoioLetras(dims.x),
        numerosPorLetra: typeof configData.numerosPorLetra === 'number' ? configData.numerosPorLetra : dims.y,
      };
    }

    const jogoData: Record<string, unknown> = {
      nome: data.nome,
      tipo: data.tipo,
      descricao: data.descricao,
      configuracao: JSON.stringify(configData),
      preco: data.preco,
      stockInicial: data.stockInicial,
      stockAtual: data.stockInicial,
      limitePorUsuario: data.limitePorUsuario,
      estado: 'aberto',
      dataAbertura: new Date(),
      eventoId: data.eventoId,
      aldeiaId: evento.aldeiaId,
      modoSorteio: data.modoSorteio,
      detalhesSorteioExterno: data.detalhesSorteioExterno,
      custoQuadrado: data.custoQuadrado,
      valorMercadoVaca: data.valorMercadoVaca,
      valorCompraVaca: data.valorCompraVaca,
      dimensoesCampo: data.dimensoesCampo,
      premioId: data.premioId,
      custoPremioDinheiro: data.custoPremioDinheiro,
      valorPremioVaca: data.valorPremioVaca,
      hashVerificacao: hashVerificacao,
    };
    
    // Criar jogo
    const createData = {
      ...jogoData,
      ...(data.premios && data.premios.length > 0 ? {
        premios: {
          create: data.premios.map((p, idx: number) => ({
            nome: p.nome,
            descricao: p.descricao,
            valorDinheiroAlternative: p.valorDinheiroAlternative,
            percentagem: p.percentagem,
            ordem: p.ordem ?? idx,
            aldeiaId: evento.aldeiaId,
          }))
        }
      } : {}),
    };

    const includeData = {
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
    };

    const jogo = await prisma.$transaction(async (tx) => {
      const created = await tx.jogo.create({
        data: createData as Prisma.JogoCreateInput,
        include: includeData,
      });

      // Jogos de Euromilhões precisam de pelo menos uma grelha aberta para
      // serem jogáveis — criada automaticamente na criação do jogo.
      if (data.tipo === 'euromilhoes') {
        const config = data.configuracao as Record<string, unknown>;
        const horaOficial = await getOfficialTime();
        const sorteioData = getNextFriday(horaOficial);
        const premioValor = config?.recorrentePremioValor != null || config?.premioValor != null
          ? Number(config?.recorrentePremioValor ?? config?.premioValor)
          : null;
        const premioDescricao = config?.recorrentePremioDescricao || config?.premioDescricao || null;
        await tx.grelhaEuromilhoes.create({
          data: {
            jogoId: created.id,
            numero: 1,
            estado: 'aberta',
            numerosOcupados: '[]',
            premioDescricao: premioDescricao ? String(premioDescricao) : null,
            premioValor,
            sorteioData,
            bloqueioData: getBloqueioData(sorteioData),
          },
        });
      }

      return created;
    });

     // Log de auditoria: criação de jogo
      await logJogoWrite(
        user?.id || 'anonymous',
        jogo.id,
        jogo.nome,
        'create',
        undefined,
        request.headers.get('x-forwarded-for') ?? undefined,
        request.headers.get('user-agent') ?? undefined
      );

     return NextResponse.json(
       { success: true, data: jogo },
       { status: 201 }
     );
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Erro ao criar jogo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
