import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const aldeia = await prisma.aldeia.findUnique({
      where: { id },
      include: {
        admins: { select: { id: true } },
        userAldeiaRoles: {
          where: { userId: user.userId },
          include: { role: true },
        },
      },
    })

    if (!aldeia) {
      return NextResponse.json({ error: 'Aldeia não encontrada' }, { status: 404 })
    }

    const isLider = aldeia.admins.some((a: any) => a.id === user.userId)
    const isModerador = aldeia.userAldeiaRoles.some((r: any) => r.role.name === 'MODERADOR')
    const isSuperAdmin = user.role === 'super_admin'

    if (!isLider && !isModerador && !isSuperAdmin) {
      return NextResponse.json({ error: 'Não autorizado para procurar utilizadores' }, { status: 403 })
    }

    const url = new URL(request.url)
    const q = (url.searchParams.get('q') || '').trim()
    if (q.length < 2) {
      return NextResponse.json({ error: 'Pesquisa deve ter pelo menos 2 caracteres' }, { status: 400 })
    }
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 1), 20)

    const users = await prisma.user.findMany({
      where: {
        role: { not: 'super_admin' },
        NOT: { userAldeiaRoles: { some: { aldeiaId: id } } },
        OR: [
          { nome: { contains: q } },
          { email: { contains: q } },
        ],
      },
      select: { id: true, nome: true, email: true, role: true, telefone: true, aldeiaId: true },
      take: limit,
      orderBy: { nome: 'asc' },
    })

    const qLower = q.toLowerCase()
    const filtered = users.filter(
      (u) => u.nome.toLowerCase().includes(qLower) || u.email.toLowerCase().includes(qLower),
    )

    return NextResponse.json({ users: filtered })
  } catch (error) {
    console.error('Error searching members:', error)
    return NextResponse.json({ error: 'Erro na pesquisa' }, { status: 500 })
  }
}
