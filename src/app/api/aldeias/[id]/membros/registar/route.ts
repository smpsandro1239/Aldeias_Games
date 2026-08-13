import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest, hashPassword } from '@/lib/auth'
import { passwordSchema } from '@/lib/validations'
import { z } from 'zod'

const registrarSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: passwordSchema,
  role: z.enum(['ALDEIA_ADMIN', 'MODERADOR', 'COLABORADOR', 'MEMBRO']).default('MEMBRO'),
})

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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
      return NextResponse.json({ error: 'Não autorizado para registar membros nesta aldeia' }, { status: 403 })
    }

    const body = await request.json()
    const result = registrarSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: result.error.format() }, { status: 400 })
    }

    const { nome, email, password, role } = result.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email já registado' }, { status: 409 })
    }

    const roleRecord = await prisma.role.findUnique({ where: { name: role } })
    if (!roleRecord) {
      return NextResponse.json({ error: 'Função inválida' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const novoUser = await prisma.user.create({
      data: { nome, email, password: hashedPassword, role: 'user', aldeiaId: id, saldo: 0 },
    })

    const userAldeiaRole = await prisma.userAldeiaRole.create({
      data: { userId: novoUser.id, aldeiaId: id, roleId: roleRecord.id },
      include: { role: true },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        aldeiaId: id,
        action: 'CRIAR_MEMBRO_ALDEIA',
        resource: 'User',
        resourceId: novoUser.id,
        metadata: {
          targetUserId: novoUser.id,
          targetUserNome: novoUser.nome,
          addedRole: role,
        },
      },
    })

    return NextResponse.json(
      { user: { id: novoUser.id, nome: novoUser.nome, email: novoUser.email, role: novoUser.role }, userAldeiaRole },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error registering member:', error)
    return NextResponse.json({ error: 'Erro ao registar membro' }, { status: 500 })
  }
}
