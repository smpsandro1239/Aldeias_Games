import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { criarLevantamentoSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user || !hasRole(user.role, ['aldeia_admin', 'super_admin'])) {
      return NextResponse.json({ error: 'Apenas administradores e super administradores podem solicitar levantamentos do cofre' }, { status: 403 });
    }

    const body = await request.json();
    const validation = criarLevantamentoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { valor, descricao, destino, observacoes, aldeiaId: bodyAldeiaId } = validation.data;

    const aldeiaId = bodyAldeiaId || user.aldeiaId;
    if (!aldeiaId) {
      return NextResponse.json({ error: 'Aldeia não especificada' }, { status: 400 });
    }

    const vault = await prisma.vault.findUnique({
      where: { aldeiaId }
    });

    if (!vault || vault.saldo < valor) {
      return NextResponse.json({
        error: `Saldo insuficiente no cofre. Disponível: ${(vault?.saldo || 0).toFixed(2)}€`
      }, { status: 400 });
    }

    const vaultTransaction = await prisma.vaultTransaction.create({
      data: {
        vaultId: vault.id,
        tipo: 'levantamento',
        valor,
        descricao: `Levantamento: ${descricao}`,
        estado: 'pendente',
        criadoPorId: user.id,
        observacoes: [
          `Destino: ${destino}`,
          observacoes || null,
        ].filter(Boolean).join('\n'),
      }
    });

    const ip = request.headers.get('x-forwarded-for') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;
    logAudit({
      userId: user.id,
      aldeiaId,
      action: 'levantamento.solicitado',
      resource: 'cofre-levantamento',
      resourceId: vaultTransaction.id,
      metadata: { valor, descricao, destino },
      ip,
      userAgent,
    });

    const admins = await prisma.user.findMany({
      where: { aldeiaId, role: 'aldeia_admin', deletedAt: null, id: { not: user.id } },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notificacao.createMany({
        data: admins.map((admin: any) => ({
          userId: admin.id,
          tipo: 'sistema',
          titulo: 'Levantamento do cofre solicitado',
          mensagem: `${user.nome} solicitou um levantamento de ${valor.toFixed(2)}€ do cofre. Destino: ${destino}`,
          lida: false,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: vaultTransaction.id,
        valor,
        descricao,
        destino,
        estado: 'pendente',
      }
    });
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user || !hasRole(user.role, ['aldeia_admin', 'super_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const url = new URL(request.url);
    const aldeiaId = url.searchParams.get('aldeiaId') || user.aldeiaId;
    const estado = url.searchParams.get('estado');

    if (!aldeiaId) {
      return NextResponse.json({ error: 'Aldeia não especificada' }, { status: 400 });
    }

    const vault = await prisma.vault.findUnique({
      where: { aldeiaId },
      select: { id: true },
    });

    if (!vault) {
      return NextResponse.json({ success: true, data: [] });
    }

    const where: Prisma.VaultTransactionWhereInput = {
      vaultId: vault.id,
      tipo: 'levantamento',
    };

    if (estado) where.estado = estado;

    const levantamentos = await prisma.vaultTransaction.findMany({
      where,
      include: {
        criadoPor: { select: { id: true, nome: true, email: true } },
        aprovadoPor: { select: { id: true, nome: true } },
      },
      orderBy: { dataCriacao: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, data: levantamentos });
  } catch (error) {
    console.error('Error listing withdrawals:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
