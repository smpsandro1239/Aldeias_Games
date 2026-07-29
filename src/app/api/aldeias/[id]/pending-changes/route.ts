import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

const SENSITIVE_FIELDS = ['iban', 'nomeTitularConta']

// GET - List pending changes for an aldeia
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const pendingChanges = await prisma.pendingAldeiaChange.findMany({
      where: { aldeiaId: id },
      include: {
        requestedBy: { select: { id: true, nome: true, email: true } },
        decidedBy: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(pendingChanges)
  } catch (error) {
    console.error('Error fetching pending changes:', error)
    return NextResponse.json({ error: 'Erro ao buscar alterações pendentes' }, { status: 500 })
  }
}

// POST - Create a pending change request
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { campo, valorDepois } = body

    if (!campo || valorDepois === undefined) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    if (!SENSITIVE_FIELDS.includes(campo)) {
      return NextResponse.json({ error: 'Campo não é sensível' }, { status: 400 })
    }

    // Check if user is admin of this aldeia
    const aldeia = await prisma.aldeia.findUnique({
      where: { id },
      include: { admins: { select: { id: true } } },
    })

    if (!aldeia) return NextResponse.json({ error: 'Aldeia não encontrada' }, { status: 404 })

    const isAdmin = aldeia.admins.some((a: any) => a.id === user.userId)
    const isSuperAdmin = user.role === 'super_admin'

    if (!isAdmin && !isSuperAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    // Super admin can auto-approve
    if (isSuperAdmin) {
      const valorAntes = (aldeia as any)[campo] || null

      // Apply the change directly
      await prisma.aldeia.update({
        where: { id },
        data: { [campo]: valorDepois },
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.userId,
          aldeiaId: id,
          action: 'UPDATE_ALDEIA_SENSITIVE',
          resource: 'Aldeia',
          resourceId: id,
          metadata: {
            campo,
            valorAntes: valorAntes ? '****' + String(valorAntes).slice(-4) : null,
            valorNovo: valorDepois ? '****' + String(valorDepois).slice(-4) : null,
            aprovadoPor: 'super_admin',
          },
        },
      })

      return NextResponse.json({ success: true, autoApproved: true })
    }

    // Check for existing pending change on same field
    const existingPending = await prisma.pendingAldeiaChange.findFirst({
      where: {
        aldeiaId: id,
        campo,
        estado: 'pendente',
      },
    })

    if (existingPending) {
      return NextResponse.json({ error: 'Já existe um pedido pendente para este campo' }, { status: 409 })
    }

    const valorAntes = (aldeia as any)[campo] || null

    // Create pending change
    const pendingChange = await prisma.pendingAldeiaChange.create({
      data: {
        aldeiaId: id,
        requestedById: user.userId,
        campo,
        valorAntes,
        valorDepois,
      },
    })

    // Notify other admins
    const otherAdmins = aldeia.admins.filter((a: any) => a.id !== user.userId)
    if (otherAdmins.length > 0) {
      await any.createMany({
        data: otherAdmins.map((admin: any) => ({
          userId: admin.id,
          tipo: 'sistema' as const,
          titulo: 'Alteração de dados sensíveis pendente',
          mensagem: `Um administrador solicitou alteração de ${campo === 'iban' ? 'IBAN' : 'titular da conta'} na aldeia "${aldeia.nome}". Aprovação necessária.`,
          lida: false,
        })),
      })
    }

    // Also notify super admins
    const superAdmins = await prisma.user.findMany({
      where: { role: 'super_admin' },
      select: { id: true },
    })
    if (superAdmins.length > 0) {
      await any.createMany({
        data: superAdmins.map((sa) => ({
          userId: sa.id,
          tipo: 'sistema' as const,
          titulo: 'Alteração de dados sensíveis pendente',
          mensagem: `Alteração de ${campo === 'iban' ? 'IBAN' : 'titular da conta'} na aldeia "${aldeia.nome}" aguarda aprovação.`,
          lida: false,
        })),
      })
    }

    return NextResponse.json({ success: true, pendingChange })
  } catch (error) {
    console.error('Error creating pending change:', error)
    return NextResponse.json({ error: 'Erro ao criar pedido de alteração' }, { status: 500 })
  }
}
