import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requireAnyOfPermissions } from '@/lib/rbac/checkPermission';
import { getPaginationFromRequest, createPagination, createPaginatedResponse } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const denied = await requireAnyOfPermissions(user.id, ['EXECUTE_VENDA', 'MANAGE_ALDEIA']);
    if (denied) return denied;

    const url = new URL(request.url);
    const aldeiaId = url.searchParams.get('aldeiaId');
    const estado = url.searchParams.get('estado');
    const { page, limit } = getPaginationFromRequest(request);

    const where: Record<string, unknown> = {};

    if (user.role === 'super_admin') {
      // sem filtro
    } else if (user.role === 'vendedor') {
      where.vendedorId = user.id;
    } else if (user.role === 'aldeia_admin' && user.aldeiaId) {
      where.aldeiaId = user.aldeiaId;
    } else {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    if (estado) where.estado = estado as any;
    if (aldeiaId) where.aldeiaId = aldeiaId;

    const { skip, take } = createPagination(page, limit);

    const [pedidos, total] = await Promise.all([
      any.findMany({
        where,
        include: {
          user: { select: { id: true, nome: true, telefone: true } },
          vendedor: { select: { id: true, nome: true, telefone: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      any.count({ where }),
    ]);

    return NextResponse.json(createPaginatedResponse(pedidos, total, page, limit));
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request) as any;
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requireAnyOfPermissions(user.id, ['EXECUTE_VENDA', 'MANAGE_ALDEIA']);
    if (denied) return denied;

    const body = await request.json();
    const { pedidoId, acao } = body; // acao: 'confirmar' | 'rejeitar'

    if (!pedidoId || !acao) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const pedido = await any.findUnique({
      where: { id: pedidoId },
      include: { user: true, vendedor: true }
    });

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // Verificar permissão
    if (user.role === 'vendedor' && pedido.vendedorId !== user.id) {
      return NextResponse.json({ error: 'Não autorizado a confirmar este pedido' }, { status: 403 });
    }

    let novoEstado = pedido.estado;
    
    if (acao === 'confirmar') {
      novoEstado = 'confirmado';
    } else if (acao === 'rejeitar') {
      novoEstado = 'cancelado';
    }

    // Atualizar pedido
    const pedidoAtualizado = await any.update({
      where: { id: pedidoId },
      data: { 
        estado: novoEstado,
        pagamentoConfirmado: acao === 'confirmar'
      }
    });

     // Se confirmado, adicionar saldo ao utilizador (jogador) — APENAS o jogador recebe o crédito
     if (acao === 'confirmar' && pedido.valor > 0) {
       try {
         await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
           // Creditar apenas o jogador
           await tx.transacao.create({
             data: {
               userId: pedido.userId,
               tipo: 'carregamento_saldo',
               valor: pedido.valor,
               descricao: 'Carregamento via vendedor confirmado',
               estado: 'concluido',
               dadosAdicionais: { pedidoId: pedido.id, vendedorId: pedido.vendedorId }
             }
           });

           await tx.user.update({
             where: { id: pedido.userId },
             data: { saldo: { increment: pedido.valor } }
           });
         });

       } catch (transError) {
         console.error('Erro ao criar transação:', transError);
         throw transError;
       }
     }

    // TODO: Enviar notificações ao utilizador
    // Notificar utilizador sobre resultado do pedido
    try {
      await (any as any).create({
        data: {
          userId: pedido.userId,
          tipo: 'sistema',
          titulo: acao === 'confirmar' ? '✅ Carregamento Confirmado' : '❌ Carregamento Rejeitado',
          mensagem: acao === 'confirmar' 
            ? `O seu carregamento de €${pedido.valor.toFixed(2)} foi confirmado pelo vendedor ${pedido.vendedor?.nome || 'desconhecido'}. O saldo foi adicionado à sua conta.`
            : `O seu pedido de carregamento de €${pedido.valor.toFixed(2)} foi rejeitado pelo vendedor ${pedido.vendedor?.nome || 'desconhecido'}.`,
          estado: 'pendente',
          dadosAdicionais: {
            pedidoId: pedido.id,
            valor: pedido.valor,
            acao,
            vendedor: pedido.vendedor ? { 
              nome: pedido.vendedor.nome, 
              telefone: pedido.vendedor.telefone 
            } : null,
            user: {
              nome: pedido.user?.nome,
              telefone: pedido.user?.telefone
            }
          }
        }
      });
    } catch (error) {
      console.error('Erro ao criar notificação para utilizador:', error);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ 
      success: true, 
      data: pedidoAtualizado 
    });
  } catch (error) {
    console.error('Erro ao processar pedido:', error);
    const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: 'Erro interno do servidor', details: errMsg }, { status: 500 });
  }
}