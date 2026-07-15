import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas admins podem ver entregas
    if (!hasRole(user.role, ['aldeia_admin', 'super_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const aldeiaId = searchParams.get('aldeiaId');

    let where: Prisma.EntregaSaldoWhereInput = {};

    // Admin só vê entregas da sua aldeia, super_admin vê todas
    if (user.role === 'aldeia_admin' && user.aldeiaId) {
      where.aldeiaId = user.aldeiaId;
    }

    if (estado) {
      where.estado = estado;
    }

    if (aldeiaId && hasRole(user.role, ['super_admin'])) {
      where.aldeiaId = aldeiaId;
    }

    const entregas = await prisma.entregaSaldo.findMany({
      where,
      include: {
        vendedor: {
          select: { id: true, nome: true, email: true, telefone: true }
        },
        admin: {
          select: { id: true, nome: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Totais
    const pendentes = entregas.filter((e: Prisma.EntregaSaldo) => e.estado === 'solicitado');
    const confirmadas = entregas.filter((e: Prisma.EntregaSaldo) => e.estado === 'confirmado');
    const concluidas = entregas.filter((e: Prisma.EntregaSaldo) => e.estado === 'concluido');

    return NextResponse.json({
      data: entregas,
      resumo: {
        total: entregas.length,
        pendentes: pendentes.length,
        valorPendente: pendentes.reduce((acc: number, e: Prisma.EntregaSaldo) => acc + e.valor, 0),
        confirmadas: confirmadas.length,
        valorConfirmado: confirmadas.reduce((acc: number, e: Prisma.EntregaSaldo) => acc + e.valor, 0),
        concluidas: concluidas.length,
        valorConcluido: concluidas.reduce((acc: number, e: Prisma.EntregaSaldo) => acc + e.valor, 0)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar entregas:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request) as any;
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas admins podem confirmar/rejeitar
    if (!hasRole(user.role, ['aldeia_admin', 'super_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { entregaId, acao, observacoes } = body; // acao: 'confirmar' | 'rejeitar' | 'concluir'

    if (!entregaId || !acao) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Buscar entrega
    const entrega = await prisma.entregaSaldo.findUnique({
      where: { id: entregaId },
      include: {
        vendedor: true,
        admin: true
      }
    });

    if (!entrega) {
      return NextResponse.json({ error: 'Entrega não encontrada' }, { status: 404 });
    }

    // Verificar permissão (admin só mexe na sua aldeia)
    if (user.role === 'aldeia_admin' && user.aldeiaId !== entrega.aldeiaId) {
      return NextResponse.json({ error: 'Não autorizado para esta aldeia' }, { status: 403 });
    }

    let novoEstado = entrega.estado;

    if (acao === 'confirmar') {
      if (entrega.estado !== 'solicitado') {
        return NextResponse.json({ error: 'Apenas solicitações pendentes podem ser confirmadas' }, { status: 400 });
      }
      novoEstado = 'confirmado';

      // Transferir saldo do vendedor para admin
      try {
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
          // 1. Retirar saldo do vendedor
          await tx.user.update({
            where: { id: entrega.vendedorId },
            data: {
              saldo: { decrement: entrega.valor }
            }
          });

          // 2. Adicionar saldo ao admin
          await tx.user.update({
            where: { id: entrega.adminId },
            data: {
              saldo: { increment: entrega.valor }
            }
          });

          // 3. Criar transação de transferência para vendedor (saída)
          await tx.transacao.create({
            data: {
              userId: entrega.vendedorId,
              tipo: 'transferencia_vendedor_admin',
              valor: -entrega.valor,
              descricao: `Transferência para admin (${entrega.admin.nome}) - Entrega #${entrega.id.slice(0, 8)}`,
              estado: 'concluido',
              dadosAdicionais: {
                entregaId: entrega.id,
                adminId: entrega.adminId,
                adminNome: entrega.admin.nome,
                dataConfirmacao: new Date().toISOString()
              }
            }
          });

          // 4. Criar transação de recebimento para admin (entrada)
          await tx.transacao.create({
            data: {
              userId: entrega.adminId,
              tipo: 'recebimento_vendedor',
              valor: entrega.valor,
              descricao: `Recebimento de vendedor (${entrega.vendedor.nome}) - Entrega #${entrega.id.slice(0, 8)}`,
              estado: 'concluido',
              dadosAdicionais: {
                entregaId: entrega.id,
                vendedorId: entrega.vendedorId,
                vendedorNome: entrega.vendedor.nome,
                dataConfirmacao: new Date().toISOString()
              }
            }
          });
        });

      } catch (txError) {
        console.error('Erro na transação:', txError);
        throw txError;
      }

    } else if (acao === 'rejeitar') {
      if (entrega.estado !== 'solicitado') {
        return NextResponse.json({ error: 'Apenas solicitações pendentes podem ser rejeitadas' }, { status: 400 });
      }
      novoEstado = 'cancelado';

    } else if (acao === 'concluir') {
      // Admin marca como concluída (após ter recebido fisicamente)
      if (entrega.estado !== 'confirmado') {
        return NextResponse.json({ error: 'Apenas entregas confirmadas podem ser concluídas' }, { status: 400 });
      }
      novoEstado = 'concluido';
    } else {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    // Atualizar entrega
    const entregaAtualizada = await prisma.entregaSaldo.update({
      where: { id: entregaId },
      data: {
        estado: novoEstado,
        dataConfirmacao: acao === 'confirmar' ? new Date() : entrega.dataConfirmacao,
        dataConclusao: acao === 'concluir' ? new Date() : entrega.dataConclusao,
        observacoes: observacoes || entrega.observacoes
      },
      include: {
        vendedor: { select: { id: true, nome: true } },
        admin: { select: { id: true, nome: true } }
      }
    });

    return NextResponse.json({
      success: true,
      data: entregaAtualizada,
      message: acao === 'confirmar' ? 'Entrega confirmada e saldo transferido com sucesso!' :
               acao === 'rejeitar' ? 'Entrega rejeitada' :
               'Entrega marcada como concluída'
    });

  } catch (error) {
    console.error('Erro ao processar entrega:', error);
    const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: 'Erro interno', details: errMsg }, { status: 500 });
  }
}
