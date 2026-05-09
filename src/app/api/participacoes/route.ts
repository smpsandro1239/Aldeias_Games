import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import { createParticipacaoSchema } from '@/lib/validations';
import { getPaginationFromRequest, createPaginatedResponse } from '@/lib/pagination';
import crypto from 'crypto';
import { sendTicketEmail } from '@/lib/email';
import { executeWithRetry } from '@/lib/transaction-retry';


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
     const estadoPagamento = url.searchParams.get('estadoPagamento') as any || undefined;

     // Construir where
     let where: Record<string, unknown> = {};

     if (jogoId) {
       where.jogoId = jogoId;
     }

     if (estadoPagamento) {
       where.estadoPagamento = estadoPagamento;
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
            aldeiaId: user.aldeiaId as string,
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
      // User normal vê as suas participações (por userId OU por email/telefone)
      const orConditions: any[] = [{ userId: user.id }];
      if ((user as any).email) {
        orConditions.push({ emailCliente: (user as any).email });
      }
      if ((user as any).telefone) {
        orConditions.push({ telefoneCliente: (user as any).telefone });
      }
      where.OR = orConditions;
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
              sorteado: true,
              dataSorteio: true,
              premioId: true,
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
              premios: {
                select: {
                  id: true,
                  nome: true,
                  ordem: true,
                },
                orderBy: { ordem: 'asc' },
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
    console.error('Erro ao criar participação:', error);
    const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: errMsg },
      { status: 500 }
    );
  }
}

// POST - Criar participação
export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    const body = await request.json();
    
    const hasDadosCliente = body.dadosCliente && body.dadosCliente.nome && (body.dadosCliente.telefone || body.dadosCliente.email);
    
    if (!user && !hasDadosCliente) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login ou forneça os seus dados de contacto.' },
        { status: 401 }
      );
    }

    // Se não há utilizador autenticado, usamos os dados do cliente
    const effectiveUser = user;
    const isAnonymous = !user && hasDadosCliente;

    // VALIDAÇÃO DE VENDEDOR: Se o utilizador é vendedor, o vendedorId é sempre o seu próprio ID
    // Se é admin, também pode ser vendedor da transação
    const isVendedorOrAdmin = user && hasRole(user.role, ['aldeia_admin', 'vendedor']);

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

    // Verificar stock (apenas para resposta inicial, a transação atomicará)
    if (jogo.stockAtual < data.quantidade) {
      return NextResponse.json(
        { error: 'Stock insuficiente' },
        { status: 400 }
      );
    }

    // Calcular valor total
    const valorTotal = jogo.preco * data.quantidade;

    // Verificar pagamento por saldo
    if (data.metodoPagamento === 'saldo') {
      if (((user as any).saldo || 0) < valorTotal) {
        return NextResponse.json(
          { error: 'Saldo insuficiente na carteira' },
          { status: 400 }
        );
      }
    }

    // Verificar isolamento de aldeia para vendedores
    if (user && user.role === 'vendedor' && jogo.evento.aldeiaId !== user.aldeiaId) {
      return NextResponse.json(
        { error: 'Não pode vender jogos de outra aldeia' },
        { status: 403 }
      );
    }

     // Verificar isolamento de aldeia para admins
     if (user && user.role === 'aldeia_admin' && jogo.evento.aldeiaId !== user.aldeiaId) {
       return NextResponse.json(
         { error: 'Não pode criar participações para outra aldeia' },
         { status: 403 }
       );
     }

     // Validação adicional para rifa/tombola: consistência de números
     if (jogo.tipo === 'rifa' || jogo.tipo === 'tombola') {
       const numeros = data.dadosParticipacao?.numeros;
       if (!Array.isArray(numeros) || numeros.length !== data.quantidade) {
         return NextResponse.json(
           { error: 'Quantidade deve corresponder ao número de números selecionados' },
           { status: 400 }
         );
       }
       if (new Set(numeros).size !== numeros.length) {
         return NextResponse.json(
           { error: 'Números duplicados na seleção' },
           { status: 400 }
         );
       }
     }

     // DEBUG: Log payment method
    console.log('Creating participation with:', {
      metodoPagamento: data.metodoPagamento,
      valorTotal,
      userSaldo: (user as any).saldo,
      isVendaInterna: !data.dadosCliente && effectiveUser?.id,
      effectiveUserId: effectiveUser?.id
    });

     // Usar transação atómica para evitar race conditions
     const result = await executeWithRetry(async () => {
       return await prisma.$transaction(async (tx) => {
      // Verificar stock dentro da transação com locking
      const jogoLocked = await tx.jogo.findUnique({
        where: { id: data.jogoId },
        select: { stockAtual: true, preco: true, tipo: true, nome: true },
      });

      if (!jogoLocked || jogoLocked.stockAtual < data.quantidade) {
        throw new Error('Stock insuficiente');
      }

      // Atualizar stock atomicamente (só executa se stock for suficiente)
      const updated = await tx.jogo.updateMany({
        where: {
          id: data.jogoId,
          stockAtual: { gte: data.quantidade }, // Condição atómica
        },
        data: {
          stockAtual: { decrement: data.quantidade },
          totalParticipacoes: { increment: data.quantidade },
          totalAngariado: { increment: valorTotal },
        },
      });

      if (updated.count === 0) {
        throw new Error('Stock insuficiente - operação concorrente');
      }

       // Criar participações (pode ser múltipla)
       const participacoes: any[] = [];
      
      for (let i = 0; i < data.quantidade; i++) {
        const dados: Record<string, unknown> = {
          dadosParticipacao: JSON.stringify(data.dadosParticipacao),
          valorPago: jogo.preco,
          metodoPagamento: data.metodoPagamento,
          estadoPagamento: data.metodoPagamento === 'dinheiro' ? 'concluido' : 'pendente',
          jogoId: data.jogoId,
          userId: effectiveUser?.id ?? null,
          vendedorId: effectiveUser && hasRole(effectiveUser.role, ['aldeia_admin', 'vendedor']) ? effectiveUser.id : undefined,
          nomeCliente: data.dadosCliente?.nome,
          telefoneCliente: data.dadosCliente?.telefone,
          emailCliente: data.dadosCliente?.email,
        };

        // Gerar hash para todos os tipos de jogo (segurança)
        const seed = generateSeed();
        const timestamp = new Date().toISOString();
        
        if (jogo.tipo === 'raspadinha') {
          const config = typeof jogo.configuracao === 'string'
            ? JSON.parse(jogo.configuracao)
            : jogo.configuracao;
          const outcome = determineRaspadinhaOutcome(config);
          const grid = buildGridFromOutcome(outcome, config);
          const rngSeed = crypto.randomBytes(32).toString('hex');
          const uniqueSalt = crypto.randomBytes(32).toString('hex');

          const hash = generateHash(rngSeed, outcome.hasWin ? (outcome.winningPrize?.nome || 'no_win') : 'no_win', uniqueSalt, timestamp);

          dados.seedRaspe = rngSeed;
          dados.hashRaspe = hash;
          dados.uniqueSalt = uniqueSalt;
          dados.resultadoRaspe = outcome.hasWin ? outcome.winningPrize?.nome : 'sem_premio';
          dados.dadosParticipacao = JSON.stringify({
            grid,
            winningPrize: outcome.hasWin ? outcome.winningPrize : null,
            hasWin: outcome.hasWin,
            generatedAt: new Date().toISOString(),
            rngSeed,
            uniqueSalt,
            roll: outcome.roll,
          });
        } else if (jogo.tipo === 'rifa' || jogo.tipo === 'tombola') {
          // Para rifas, verificar se números já estão ocupados
          const numerosSelecionados = data.dadosParticipacao?.numeros || [];
          
          // Buscar números já vendidos neste jogo
          const participacoesExistentes = await tx.participacao.findMany({
            where: { jogoId: jogo.id },
            select: { dadosParticipacao: true }
          });
          
          const numerosOcupados = new Set<number>();
          for (const p of participacoesExistentes) {
            try {
              const dados = typeof p.dadosParticipacao === 'string' 
                ? JSON.parse(p.dadosParticipacao) 
                : p.dadosParticipacao;
              if (dados?.numeros) {
                dados.numeros.forEach((n: number) => numerosOcupados.add(n));
              }
            } catch {}
          }
          
          // Verificar se algum número já está ocupado
          for (const num of numerosSelecionados) {
            if (numerosOcupados.has(num)) {
              throw new Error(`O número ${num} já foi vendido`);
            }
          }
          
          const resultado = JSON.stringify(numerosSelecionados);
          const uniqueSalt = crypto.randomBytes(32).toString('hex');
          const hash = generateHash(seed, resultado, uniqueSalt, timestamp);

          dados.hashParticipacao = hash;
          dados.dadosVerificacao = JSON.stringify({
            seed,
            timestamp,
            numeros: numerosSelecionados,
            uniqueSalt,
            hash
          });
        } else if (jogo.tipo === 'poio_da_vaca') {
          // Para poio da vaca, usar as coordenadas como "resultado"
          const coordenadas = data.dadosParticipacao?.coordenadas || [];
          const resultado = JSON.stringify(coordenadas);
          const uniqueSalt = crypto.randomBytes(32).toString('hex');
          const hash = generateHash(seed, resultado, uniqueSalt, timestamp);

          dados.hashParticipacao = hash;
          dados.dadosVerificacao = JSON.stringify({
            seed,
            timestamp,
            coordenadas,
            uniqueSalt,
            hash
          });
        }

        const participacao = await tx.participacao.create({
          data: dados as never,
          include: {
            jogo: {
              select: {
                id: true,
                nome: true,
                tipo: true,
                preco: true,
                configuracao: true,
              },
            },
          },
        });

         participacoes.push(participacao);
       }

       // Criar registros de números vendidos para rifa/tombola (prevenção de race condition)
       if (jogo.tipo === 'rifa' || jogo.tipo === 'tombola') {
         const numerosSelecionados = data.dadosParticipacao?.numeros || [];
         if (numerosSelecionados.length > 0 && participacoes.length > 0) {
            await tx.numeroVendido.createMany({
              data: numerosSelecionados.map((num: number) => ({
                jogoId: data.jogoId,
                numero: num,
                participacaoId: participacoes[0].id,
              })),
            });
         }
       }

       // Atualizar total do evento
      await tx.evento.update({
        where: { id: jogo.eventoId },
        data: {
          totalParticipacoes: { increment: data.quantidade },
          totalAngariado: { increment: valorTotal },
        },
      });

      // --- LÓGICA DE CARTEIRA E CASHBACK ---
      // Apenas aplicar cashback se a participação for para o utilizador autenticado
      // (não para vendas externas anónimas)
      const isVendaInterna = !data.dadosCliente && effectiveUser?.id;
      
      // Cashback só é dado quando pagamento é confirmado (dinheiro ou saldo)
      // Para MBWay/Stripe, o cashback será dado quando o webhook confirmar o pagamento
      const pagamentoConfirmado = data.metodoPagamento === 'dinheiro' || data.metodoPagamento === 'saldo';
      
      if (isVendaInterna && pagamentoConfirmado && effectiveUser) {
        const cashbackPercent = 0.05;
        const cashbackValor = valorTotal * cashbackPercent;

        // Se pagou com saldo, descontar
        if (data.metodoPagamento === 'saldo') {
          await tx.user.update({
            where: { id: effectiveUser.id },
            data: {
              saldo: { decrement: valorTotal },
            },
          });

          await tx.transacao.create({
            data: {
              userId: effectiveUser.id,
              valor: -valorTotal,
              tipo: 'pagamento_jogo',
              descricao: `Pagamento de ${data.quantidade}x ${jogo.nome}`,
              referencia: jogo.id,
            },
          });
        }

        // Adicionar Cashback APENAS para pagamentos confirmados
        await tx.user.update({
          where: { id: effectiveUser.id },
          data: {
            saldo: { increment: cashbackValor },
          },
        });

        await tx.transacao.create({
          data: {
            userId: effectiveUser.id,
            valor: cashbackValor,
            tipo: 'cashback',
            descricao: `Cashback de compra: ${jogo.nome}`,
            referencia: jogo.id,
          },
        });
      } else if (data.metodoPagamento === 'saldo' && data.dadosCliente && effectiveUser) {
        // Venda externa com saldo - não há cashback mas desconta do vendedor/admin
        await tx.user.update({
          where: { id: effectiveUser.id },
          data: {
            saldo: { decrement: valorTotal },
          },
        });

        await tx.transacao.create({
          data: {
            userId: effectiveUser.id,
            valor: -valorTotal,
            tipo: 'pagamento_jogo',
            descricao: `Pagamento de ${data.quantidade}x ${jogo.nome} (venda externa)`,
            referencia: jogo.id,
          },
        });
      }

        return { participacoes, valorTotal };
      });
     });

      // Enviar email de bilhete para pagamentos confirmados (rifa/tombola)
      if ((jogo.tipo === 'rifa' || jogo.tipo === 'tombola') && result.participacoes.length > 0) {
        const primeira = result.participacoes[0];
        if (primeira.estadoPagamento === 'concluido' && primeira.emailCliente) {
          const numeros = data.dadosParticipacao?.numeros || [];
          try {
            await sendTicketEmail(
              primeira.emailCliente,
              primeira.nomeCliente || 'Cliente',
              jogo.nome,
              numeros.map((n: number) => n.toString()),
              jogo.evento.nome
            );
          } catch (err) {
            console.error('[Email] Erro ao enviar bilhete:', err);
          }
        }
      }

      return NextResponse.json({
      success: true,
      participacao: data.quantidade === 1 ? (() => {
        const p = result.participacoes[0];
        // Parse dadosParticipacao to extract grid for client
        try {
          const dados = typeof p.dadosParticipacao === 'string' 
            ? JSON.parse(p.dadosParticipacao) 
            : p.dadosParticipacao;
          return {
            ...p,
            grid: dados?.grid || null,
            hasWin: dados?.hasWin || false,
          };
        } catch {
          return p;
        }
      })() : result.participacoes,
      valorTotal: result.valorTotal,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar participação:', error);
    if (error.message === 'Stock insuficiente' || error.message.includes('Stock insuficiente')) {
      return NextResponse.json(
        { error: 'Stock insuficiente' },
        { status: 400 }
      );
    }
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

function generateHash(seed: string, resultado: string, salt: string, timestamp?: string): string {
  const data = timestamp
    ? `${seed}:${resultado}:${salt}:${timestamp}`
    : `${seed}:${resultado}:${salt}`;
  return crypto
    .createHash('sha256')
    .update(data)
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

// ============================================================
// NEW: Probabilistic outcome + grid generation for raspadinha
// ============================================================

interface RaspadinhaOutcome {
  hasWin: boolean;
  winningPrize: any | null;
  roll: number;
}

function determineRaspadinhaOutcome(config: Record<string, any>): RaspadinhaOutcome {
  const premios = (config.premios as any[]) || [];
  
  // Use crypto-secure integer random (0-9999) for precision
  const rollInt = crypto.randomInt(0, 10000);
  const roll = rollInt / 10000;
  
  // Build cumulative probability ranges from config percentagens
  // Each percentagem is in basis points (e.g., 2% = 200 basis points)
  let cumulativeBp = 0;
  for (const premio of premios) {
    const probBp = Math.round((premio.percentagem || 0) * 100);
    cumulativeBp += probBp;
    if (rollInt < cumulativeBp) {
      return { hasWin: true, winningPrize: premio, roll };
    }
  }
  
  return { hasWin: false, winningPrize: null, roll };
}

function buildGridFromOutcome(
  outcome: RaspadinhaOutcome,
  config: Record<string, any>
): any[] {
  const premios = (config.premios as any[]) || [];
  const grid: any[] = [];
  
  if (outcome.hasWin && outcome.winningPrize) {
    const winningPrize = outcome.winningPrize;
    
    for (let i = 0; i < 3; i++) grid.push({ ...winningPrize });
    
    const otherPrizes = premios.filter((p: any) => p.nome !== winningPrize.nome);
    const fillerPool = otherPrizes.length > 0 ? otherPrizes : premios;
    
    for (let i = 0; i < 6; i++) {
      const pick = fillerPool[crypto.randomInt(0, fillerPool.length)];
      grid.push({ ...pick });
    }
    
    const counts = new Map<string, number>();
    grid.forEach((p) => counts.set(p.nome, (counts.get(p.nome) || 0) + 1));
    
    for (const [nome, count] of counts) {
      if (nome !== winningPrize.nome && count >= 3) {
        const idx = grid.findIndex((p) => p.nome === nome);
        if (idx !== -1) {
          grid[idx] = { ...fillerPool[crypto.randomInt(0, fillerPool.length)] };
        }
      }
    }
  } else {
    const maxPerPrize = 2;
    const counts = new Map<string, number>();
    
    for (let i = 0; i < 9; i++) {
      let attempts = 0;
      while (attempts < 50) {
        const pick = premios[crypto.randomInt(0, premios.length)];
        const currentCount = counts.get(pick.nome) || 0;
        if (currentCount < maxPerPrize) {
          grid.push({ ...pick });
          counts.set(pick.nome, currentCount + 1);
          break;
        }
        attempts++;
      }
      if (i >= grid.length) {
        const sorted = [...premios].sort((a, b) => 
          (a.valorDinheiroAlternative || 0) - (b.valorDinheiroAlternative || 0)
        );
        grid.push({ ...sorted[0] });
      }
    }
  }
  
  // Fisher-Yates shuffle
  for (let i = grid.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [grid[i], grid[j]] = [grid[j], grid[i]];
  }
  
  return grid;
}
