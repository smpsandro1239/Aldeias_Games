import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// POST - Approve or reject a pending change
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; changeId: string }> }
) {
  try {
    const { id, changeId } = await context.params
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { acao, observacoes } = body

    if (!acao || !['aprovar', 'rejeitar'].includes(acao)) {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }

    // Check pending change exists
    const pendingChange = await prisma.pendingAldeiaChange.findUnique({
      where: { id: changeId },
      include: {
        aldeia: { include: { admins: { select: { id: true, nome: true } } } },
        requestedBy: { select: { id: true, nome: true } },
      },
    })

    if (!pendingChange) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    if (pendingChange.estado !== 'pendente') {
      return NextResponse.json({ error: 'Este pedido já foi processado' }, { status: 400 })
    }

    if (pendingChange.aldeiaId !== id) {
      return NextResponse.json({ error: 'ID da aldeia não corresponde' }, { status: 400 })
    }

    // Check permissions
    const isAdmin = pendingChange.aldeia.admins.some((a: any) => a.id === user.userId)
    const isSuperAdmin = user.role === 'super_admin'

    if (!isAdmin && !isSuperAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Cannot approve your own request (unless super admin)
    if (pendingChange.requestedById === user.userId && !isSuperAdmin) {
      return NextResponse.json({ error: 'Não pode aprovar o seu próprio pedido' }, { status: 403 })
    }

    if (acao === 'aprovar') {
      await prisma.$transaction(async (tx) => {
        // Apply the change
        await tx.aldeia.update({
          where: { id },
          data: { [pendingChange.campo]: pendingChange.valorDepois },
        })

        // Mark as approved
        await tx.pendingAldeiaChange.update({
          where: { id: changeId },
          data: {
            estado: 'aprovado',
            decidedById: user.userId,
            decidedAt: new Date(),
            observacoes,
          },
        })

        // Audit log
        await tx.auditLog.create({
          data: {
            userId: user.userId,
            aldeiaId: id,
            action: 'APPROVE_SENSITIVE_CHANGE',
            resource: 'PendingAldeiaChange',
            resourceId: changeId,
            metadata: {
              campo: pendingChange.campo,
              valorAntes: pendingChange.valorAntes ? '****' + pendingChange.valorAntes.slice(-4) : null,
              valorNovo: pendingChange.valorDepois ? '****' + pendingChange.valorDepois.slice(-4) : null,
              solicitadoPor: pendingChange.requestedBy.nome,
              aprovadoPor: user.userId,
            },
          },
        })
      })

      // Notify requester
      await any.create({
        data: {
          userId: pendingChange.requestedById,
          tipo: 'sistema' as const,
          titulo: 'Alteração aprovada',
          mensagem: `A sua alteração de ${pendingChange.campo === 'iban' ? 'IBAN' : 'titular da conta'} foi aprovada por ${user.userId === user.userId ? 'um super administrador' : 'outro administrador'}.`,
          lida: false,
        },
      })

      return NextResponse.json({ success: true, acao: 'aprovado' })
    } else {
      // Reject
      await prisma.pendingAldeiaChange.update({
        where: { id: changeId },
        data: {
          estado: 'rejeitado',
          decidedById: user.userId,
          decidedAt: new Date(),
          observacoes,
        },
      })

      // Notify requester
      await any.create({
        data: {
          userId: pendingChange.requestedById,
          tipo: 'sistema' as const,
          titulo: 'Alteração rejeitada',
          mensagem: `A sua alteração de ${pendingChange.campo === 'iban' ? 'IBAN' : 'titular da conta'} foi rejeitada.${observacoes ? ` Motivo: ${observacoes}` : ''}`,
          lida: false,
        },
      })

      return NextResponse.json({ success: true, acao: 'rejeitado' })
    }
  } catch (error) {
    console.error('Error processing pending change:', error)
    return NextResponse.json({ error: 'Erro ao processar pedido' }, { status: 500 })
  }
}
