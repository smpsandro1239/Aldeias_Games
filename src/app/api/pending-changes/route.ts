import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const isSuperAdmin = user.role === 'super_admin'
    const isAdmin = user.role === 'aldeia_admin'

    if (!isSuperAdmin && !isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const aldeiaId = searchParams.get('aldeiaId')
    const estado = searchParams.get('estado') || 'pendente'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (estado && estado !== 'all') {
      where.estado = estado
    }

    if (isSuperAdmin) {
      // Super admin sees all — optionally filter by aldeia
      if (aldeiaId) {
        where.aldeiaId = aldeiaId
      }
    } else if (isAdmin) {
      // Admin sees only their aldeia's changes
      if (!user.aldeiaId) {
        return NextResponse.json({ pendingChanges: [], total: 0 })
      }
      where.aldeiaId = user.aldeiaId
    }

    const [pendingChanges, total] = await Promise.all([
      prisma.pendingAldeiaChange.findMany({
        where,
        include: {
          aldeia: { select: { id: true, nome: true, slug: true } },
          requestedBy: { select: { id: true, nome: true, email: true } },
          decidedBy: { select: { id: true, nome: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pendingAldeiaChange.count({ where }),
    ])

    return NextResponse.json({
      pendingChanges,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching global pending changes:', error)
    return NextResponse.json({ error: 'Erro ao buscar alterações pendentes' }, { status: 500 })
  }
}
