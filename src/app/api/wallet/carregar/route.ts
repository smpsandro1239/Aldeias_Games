import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requireAnyOfPermissions } from '@/lib/rbac/checkPermission';
import { isMethodAllowed } from '@/lib/payment-commissions';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas admins e vendedores podem registar carregamentos (para tracking)
    const body = await request.json();
    const { 
      valor, 
      metodoPagamento, 
      metodoCarregamento,
      nomeTitularConta,
      iban,
      telefoneMBWay,
      descricao,
      eventoId,
      aldeiaId 
    } = body;

    // Utilizadores normais podem fazer pedido ao vendedor
    if (metodoCarregamento === 'vendedor') {
      // Todos os utilizadores podem pedir ao vendedor
    } else if (body.vendedorId) {
      // Todos os utilizadores podem carregar quando escolhem um vendedor responsável
    } else {
      const denied = await requireAnyOfPermissions(user.id, ['EXECUTE_VENDA', 'MANAGE_ALDEIA']);
      if (denied) return denied;
    }

    if (!valor || valor <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    // Validar se o método de carregamento está aceite pela aldeia
    const aldeiaTargetId = aldeiaId || user.aldeiaId;
    if (aldeiaTargetId && metodoCarregamento) {
      const aldeia = await prisma.aldeia.findUnique({
        where: { id: aldeiaTargetId },
        select: { metodosPagamentoAceites: true }
      });
      if (aldeia?.metodosPagamentoAceites && !isMethodAllowed(metodoCarregamento, aldeia.metodosPagamentoAceites)) {
        return NextResponse.json({ 
          error: 'Este método de pagamento não está disponível para esta aldeia' 
        }, { status: 400 });
      }
    }

    // Limite máximo de carregamento por transação (prevenir abuso)
    const MAX_CARREGAMENTO = 10000; // €10,000
    if (valor > MAX_CARREGAMENTO) {
      return NextResponse.json({ 
        error: `Valor máximo de carregamento: €${MAX_CARREGAMENTO}` 
      }, { status: 400 });
    }

    // Para "pedido ao vendedor" (ou qualquer método com vendedor selecionado), criar um pedido pendente
    if (body.vendedorId) {
      const aldeiaTargetIdForPedido = aldeiaId || user.aldeiaId;
      const pedido = await prisma.pedidoCarregamento.create({
        data: {
          valor: valor,
          estado: 'pendente',
          userId: user.id,
          vendedorId: body.vendedorId,
          aldeiaId: aldeiaTargetIdForPedido,
          metodoPagamento: metodoCarregamento || 'vendedor',
        },
        include: {
          vendedor: { select: { id: true, nome: true, telefone: true } },
          user: { select: { id: true, nome: true } }
        }
      });

      // Notificar vendedor sobre novo pedido de carregamento
      try {
        const metodoLabel = metodoCarregamento === 'vendedor' ? 'presencialmente' :
                           metodoCarregamento === 'dinheiro' ? 'em dinheiro' :
                           metodoCarregamento === 'mbway' ? 'via MBWay' :
                           metodoCarregamento === 'transferencia' ? 'por transferência' : metodoCarregamento;
        await (prisma.notificacao as any).create({
          data: {
            userId: body.vendedorId,
            tipo: 'sistema',
            titulo: '💰 Novo pedido de carregamento',
            mensagem: `Utilizador ${user.nome} pediu um carregamento de €${valor.toFixed(2)} ${metodoLabel}. Confirme ao receber o pagamento.`,
            estado: 'pendente',
            dadosAdicionais: {
              pedidoId: pedido.id,
              valor,
              metodoCarregamento: metodoCarregamento || 'vendedor',
              user: { nome: user.nome, email: user.email, telefone: user.telefone },
            }
          }
        });
      } catch (error) {
        console.error('Erro ao criar notificação para vendedor:', error);
      }

      return NextResponse.json({
        success: true,
        data: {
          id: pedido.id,
          valor: pedido.valor,
          estado: pedido.estado,
          vendedor: pedido.vendedor,
          dataHora: pedido.createdAt
        }
      });
    }

    if (!metodoCarregamento || !['dinheiro', 'mbway', 'transferencia'].includes(metodoCarregamento)) {
      return NextResponse.json({ error: 'Método de carregamento inválido' }, { status: 400 });
    }

    // PROTEÇÃO CONTRA INFLAÇÃO: Apenas registar a transação, não incrementar saldo automaticamente
    // O saldo só é incrementado quando o pagamento é confirmado via Stripe/MBWay webhook
    // Para carregamentos em dinheiro, o admin deve confirmar manualmente

    // Verificar se já existe um carregamento idêntico nos últimos 5 minutos (proteção contra duplicados)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingCarregamento = await (prisma.transacao as any).findFirst({
      where: {
        userId: user.id,
        tipo: 'carregamento_saldo',
        valor: valor,
        createdAt: { gte: fiveMinutesAgo },
      },
    });

    if (existingCarregamento) {
      return NextResponse.json({ 
        error: 'Carregamento duplicado detectado. Aguarde antes de tentar novamente.' 
      }, { status: 429 });
    }

    const carregamento = await (prisma.transacao as any).create({
      data: {
        userId: user.id,
        tipo: 'carregamento_saldo',
        valor: valor,
        descricao: descricao || `Carregamento de saldo - ${metodoCarregamento}`,
        dadosAdicionais: {
          metodoPagamento: metodoCarregamento,
          estado: metodoCarregamento === 'dinheiro' ? 'pendente_confirmacao' : 'concluido',
          nomeVendedor: user.nome,
          emailVendedor: user.email,
          telefoneVendedor: user.telefone,
          nomeTitularConta: nomeTitularConta || null,
          iban: iban || null,
          telefoneMBWay: telefoneMBWay || null,
          dataHora: new Date().toISOString(),
          eventoId: eventoId || null,
          aldeiaId: aldeiaTargetId,
        }
      },
    });

    // NÃO incrementar saldo aqui — pagamento em dinheiro requer confirmação manual do admin
    // O saldo é incrementado quando o admin confirma via /api/admin/pedidos-carregamento/[id]/confirmar

    const adminsDaAldeia = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'super_admin' },
          { role: 'aldeia_admin', aldeiaId: aldeiaTargetId }
        ]
      },
      select: { id: true, email: true, nome: true, telefone: true }
    });

    const eventoInfo = eventoId ? await prisma.evento.findUnique({
      where: { id: eventoId },
      select: { nome: true }
    }) : null;

    const notificacoes = [];

    for (const admin of adminsDaAldeia) {
      const notificacao = await (prisma.notificacao as any).create({
        data: {
          userId: admin.id,
          tipo: 'sistema',
          titulo: '💰 Carregamento de Saldo Registado',
          mensagem: `Vendedor ${user.nome} carregou €${valor.toFixed(2)} via ${metodoCarregamento}${eventoInfo ? ` para evento ${eventoInfo.nome}` : ''}`,
          estado: 'pendente',
          dadosAdicionais: {
            carregamentoId: carregamento.id,
            valor,
            metodoPagamento: metodoCarregamento,
            vendedor: { nome: user.nome, email: user.email, telefone: user.telefone },
            conta: { nomeTitular: nomeTitularConta, iban, telefoneMBWay },
            dataHora: new Date().toISOString(),
            aldeiaId: aldeiaTargetId,
          }
        }
      });
      notificacoes.push(notificacao);
    }

    const aldeiaInfo = await prisma.aldeia.findUnique({
      where: { id: aldeiaTargetId },
      select: { nome: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        carregamentoId: carregamento.id,
        valor,
        metodoPagamento: metodoCarregamento,
        estado: 'pendente_confirmacao',
        saldoAtual: user.saldo,
        vendedor: {
          nome: user.nome,
          email: user.email,
          telefone: user.telefone
        },
        conta: {
          nomeTitular: nomeTitularConta,
          iban: iban ? `****${iban.slice(-4)}` : null,
          telefoneMBWay
        },
        dataHora: carregamento.createdAt,
        aldeia: aldeiaInfo?.nome,
        evento: eventoInfo?.nome,
        adminNotificados: adminsDaAldeia.length,
      },
      message: 'Carregamento registado com sucesso! Todos os administradores foram notificados.'
    });

  } catch (error) {
    console.error('Erro ao carregar saldo:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const aldeiaIdParam = searchParams.get('aldeiaId');
    const eventoId = searchParams.get('eventoId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Prisma.TransacaoWhereInput = {
      tipo: 'carregamento_saldo',
    };

    if (user.role === 'user') {
      // Utilizador normal vê apenas os seus próprios carregamentos
      where.userId = user.id;
    } else if (user.role === 'aldeia_admin' || user.role === 'vendedor') {
      // Scoping por aldeia — nunca confiar no parâmetro para roles restritos
      const scopedAldeiaId = user.aldeiaId || aldeiaIdParam || undefined;
      (where as any).dadosAdicionais = {
        path: ['aldeiaId'],
        equals: scopedAldeiaId,
      };
    } else if (aldeiaIdParam) {
      // super_admin — pode filtrar por qualquer aldeia
      (where as any).dadosAdicionais = {
        path: ['aldeiaId'],
        equals: aldeiaIdParam,
      };
    }

    if (eventoId) {
      (where as any).dadosAdicionais = {
        path: ['eventoId'],
        equals: eventoId
      };
    }

    const [carregamentos, total] = await Promise.all([
      prisma.transacao.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { nome: true, email: true, telefone: true }
          }
        }
      }),
      prisma.transacao.count({ where })
    ]);

    return NextResponse.json({
      data: carregamentos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar carregamentos:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
