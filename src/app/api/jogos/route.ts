import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import { createJogoSchema } from '@/lib/validations';
import { getPaginationFromRequest, createPaginatedResponse } from '@/lib/pagination';
import { createHash } from 'crypto';
import { logJogoWrite } from '@/lib/audit';

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

function calcularRentabilidade(tipo: string, dados: any) {
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
    resultado.percentagemTotalPremios = premios.reduce((acc: number, p: any) => acc + (p.percentagem || 0), 0);
    resultado.lucroMinimoPercent = 100 - resultado.percentagemTotalPremios;
    resultado.custoMedioPrevisto = premios.reduce((acc: number, p: any) => 
      acc + ((p.valorDinheiroAlternative || 0) * (p.percentagem || 0) / 100), 0);
    resultado.lucroLiquidoPrevisto = resultado.receitaEsperada - (resultado.custoMedioPrevisto * stock);
  } else if (tipo === 'rifa') {
    const premios = dados.premios || [];
    const custoTotalPremios = premios.reduce((acc: number, p: any) => acc + (p.valorDinheiroAlternative || 0), 0);
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
    const jogosComConfig = jogos.map(jogo => ({
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

     // Validação defensiva no backend para rifa
     if (data.tipo === 'rifa') {
       const config = data.configuracao as any;
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
    } catch (calcError) {
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
    
    // Verificar lucro mínimo (50% mínimo)
    if (rentabilidade.lucroMinimoPercent < 50 && data.tipo === 'raspadinha') {
      return NextResponse.json(
        { error: 'Jogo não cumpre requisito mínimo de 50% de lucro. Ajuste os valores.' },
        { status: 400 }
      );
    }
    
    // Preparar dados para Prisma (sem os campos novos que ainda não existem na BD)
    const jogoData: any = {
      nome: data.nome,
      tipo: data.tipo,
      descricao: data.descricao,
      configuracao: JSON.stringify(data.configuracao),
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
          create: data.premios.map((p: any, idx: number) => ({
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

    const jogo = await prisma.jogo.create({
      data: createData,
      include: includeData,
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
  } catch (error: any) {
    console.error('Erro ao criar jogo:', error);
    console.error('Stack trace:', error.stack);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor', details: error.code || '' },
      { status: 500 }
    );
  }
}
