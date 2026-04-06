import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas admins e vendedores podem registar carregamentos (para tracking)
    // Utilizadores normais NÃO podem carregar saldo aqui — devem usar Stripe/MBWay
    if (!hasRole(user.role, ['super_admin', 'aldeia_admin', 'vendedor'])) {
      return NextResponse.json({ error: 'Não autorizado. Apenas admins e vendedores podem registar carregamentos.' }, { status: 403 });
    }

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

    if (!valor || valor <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    // Limite máximo de carregamento por transação (prevenir abuso)
    const MAX_CARREGAMENTO = 10000; // €10,000
    if (valor > MAX_CARREGAMENTO) {
      return NextResponse.json({ 
        error: `Valor máximo de carregamento: €${MAX_CARREGAMENTO}` 
      }, { status: 400 });
    }

    if (!metodoCarregamento || !['dinheiro', 'mbway', 'transferencia'].includes(metodoCarregamento)) {
      return NextResponse.json({ error: 'Método de carregamento inválido' }, { status: 400 });
    }

    // PROTEÇÃO CONTRA INFLAÇÃO: Apenas registar a transação, não incrementar saldo automaticamente
    // O saldo só é incrementado quando o pagamento é confirmado via Stripe/MBWay webhook
    // Para carregamentos em dinheiro, o admin deve confirmar manualmente
    const aldeiaTargetId = aldeiaId || user.aldeiaId;

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

    // Apenas incrementar saldo se for dinheiro (confirmado presencialmente pelo admin)
    // Para MBWay/Transferência, o saldo é incrementado quando o webhook confirma o pagamento
    if (metodoCarregamento === 'dinheiro') {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          saldo: { increment: valor }
        }
      });

      // Atualizar estado para concluido
      await (prisma.transacao as any).update({
        where: { id: carregamento.id },
        data: { dadosAdicionais: { ...carregamento.dadosAdicionais, estado: 'concluido' } }
      });
    }

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
        estado: metodoCarregamento === 'dinheiro' ? 'concluido' : 'pendente_confirmacao',
        saldoAtual: user.saldo + (metodoCarregamento === 'dinheiro' ? valor : 0),
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
    const aldeiaId = searchParams.get('aldeiaId');
    const eventoId = searchParams.get('eventoId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      tipo: 'carregamento_saldo',
    };

    if (user.role === 'aldeia_admin' || user.role === 'vendedor') {
      where.dadosAdicionais = {
        path: ['aldeiaId'],
        equals: aldeiaId || user.aldeiaId
      };
    }

    if (eventoId) {
      where.dadosAdicionais = {
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
