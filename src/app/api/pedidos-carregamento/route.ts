import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const aldeiaId = url.searchParams.get('aldeiaId');
    const estado = url.searchParams.get('estado');

    // Construir where clause
    let where: Record<string, unknown> = {};

    // Super admin pode ver tudo - sem filtro
    if (user.role === 'super_admin') {
      // continua sem filtro
    }
    // Se for vendedor, ver apenas os seus pedidos
    else if (user.role === 'vendedor') {
      where.vendedorId = user.id;
    } 
    // Se for aldeia_admin, ver pedidos da aldeia
    else if (user.role === 'aldeia_admin' && user.aldeiaId) {
      where.aldeiaId = user.aldeiaId;
    } 
    // Outros papéis não autorizados
    else {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    if (estado) {
      where.estado = estado;
    }

    if (aldeiaId) {
      where.aldeiaId = aldeiaId;
    }

    const pedidos = await prisma.pedidoCarregamento.findMany({
      where,
      include: {
        user: { select: { id: true, nome: true, telefone: true } },
        vendedor: { select: { id: true, nome: true, telefone: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ success: true, data: pedidos });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas vendedores e admins podem confirmar
    if (!hasRole(user.role, ['vendedor', 'aldeia_admin', 'super_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { pedidoId, acao } = body; // acao: 'confirmar' | 'rejeitar'

    if (!pedidoId || !acao) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const pedido = await prisma.pedidoCarregamento.findUnique({
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
    const pedidoAtualizado = await prisma.pedidoCarregamento.update({
      where: { id: pedidoId },
      data: { 
        estado: novoEstado,
        pagamentoConfirmado: acao === 'confirmar'
      }
    });

     // Se confirmado, adicionar saldo ao utilizador (jogador) e ao vendedor
     if (acao === 'confirmar' && pedido.valor > 0) {
       try {
         await prisma.$transaction(async (tx: any) => {
           // 1. Creditar jogador
           await tx.transacao.create({
             data: {
               userId: pedido.id,
               tipo: 'carregamento_saldo',
               valor: pedido.valor,
               descricao: 'Carregamento via vendedor confirmado',
               estado: 'concluido',
               dadosAdicionais: { pedidoId: pedido.id, vendedorId: pedido.vendedorId }
             }
           });

           await tx.user.update({
             where: { id: pedido.id },
             data: { saldo: { increment: pedido.valor } }
           });

           // 2. Creditar vendedor (se existir)
           if (pedido.vendedorId) {
             await tx.transacao.create({
               data: {
                 userId: pedido.vendedorId,
                 tipo: 'deposito',
                 valor: pedido.valor,
                 descricao: `Recebimento de carregamento do jogador ${pedido.user?.nome || 'unknown'}`,
                 estado: 'concluido',
                 dadosAdicionais: { pedidoId: pedido.id, userId: pedido.id }
               }
             });

             await tx.user.update({
               where: { id: pedido.vendedorId },
               data: { saldo: { increment: pedido.valor } }
             });
           }
         });

       } catch (transError) {
         console.error('Erro ao criar transação:', transError);
         throw transError;
       }
     }

    // TODO: Enviar notificações ao utilizador
    // Notificar utilizador sobre resultado do pedido
    try {
      await (prisma.notificacao as any).create({
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