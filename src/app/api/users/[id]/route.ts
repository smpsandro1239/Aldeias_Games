import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { logCRUD as logAudit } from '@/lib/audit';

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const adminUser = await getFullUserFromRequest(request);
    
    if (!adminUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(adminUser.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, nome: true, email: true, telefone: true, role: true, aldeiaId: true }
    });

    if (!targetUser) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    if (adminUser.role === 'aldeia_admin' && adminUser.aldeiaId !== targetUser.aldeiaId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    return NextResponse.json({ data: targetUser });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const adminUser = await getFullUserFromRequest(request);
    
    if (!adminUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(adminUser.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    if (adminUser.role === 'aldeia_admin' && adminUser.aldeiaId !== targetUser.aldeiaId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Prisma.UserUpdateInput = {};
    if (body.nome) updateData.nome = body.nome;
    if (body.telefone !== undefined) updateData.telefone = body.telefone;
    if (body.role) {
       if (adminUser.role === 'aldeia_admin' && body.role === 'super_admin') {
         return NextResponse.json({ error: 'Proibido' }, { status: 403 });
       }
       updateData.role = body.role;
    }
    if (body.aldeiaId !== undefined && adminUser.role === 'super_admin') {
       const newAldeiaId = body.aldeiaId === "" ? null : body.aldeiaId;
       const finalRole = body.role || targetUser.role;
       
       if (finalRole !== 'super_admin' && !newAldeiaId) {
         return NextResponse.json(
           { error: 'Utilizadores não-super_admin devem ter uma aldeia vinculada' },
           { status: 400 }
         );
       }
       updateData.aldeiaId = newAldeiaId;
    }
    if (body.comissaoAtiva !== undefined) {
       updateData.comissaoAtiva = body.comissaoAtiva;
    }

     const updated = await prisma.user.update({
       where: { id },
       data: updateData,
       select: { id: true, nome: true, email: true, role: true, aldeiaId: true }
     });

      // Audit log for user update
      await logAudit(
        adminUser.id,
        'update',
        'user',
        id,
        {
          old: { nome: targetUser.nome, role: targetUser.role, aldeiaId: targetUser.aldeiaId },
          new: { nome: updated.nome, role: updated.role, aldeiaId: updated.aldeiaId }
        },
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );

     return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const adminUser = await getFullUserFromRequest(request);
    
    if (!adminUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(adminUser.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    if (adminUser.role === 'aldeia_admin' && adminUser.aldeiaId !== targetUser.aldeiaId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }
    
    if (adminUser.id === id) {
      return NextResponse.json({ error: 'Não pode eliminar o próprio utilizador' }, { status: 400 });
    }

     // Clean up all user-related records to avoid FK errors
     // First, find and delete vendedor cashbox transactions (requires nested lookup)
     const cashbox = await prisma.vendedorCashbox.findUnique({ where: { userId: id }, select: { id: true } });
     if (cashbox) {
       await prisma.vendedorCashboxTransaction.deleteMany({ where: { cashboxId: cashbox.id } });
       await prisma.vendedorCashbox.deleteMany({ where: { userId: id } });
     }

     // Also delete cashbox transactions where this user was the creator
     await prisma.vendedorCashboxTransaction.deleteMany({ where: { criadoPorId: id } });

     // Delete all other user-related records in a transaction
     await prisma.$transaction([
       prisma.pushSubscription.deleteMany({ where: { userId: id } }),
       prisma.notificacao.deleteMany({ where: { userId: id } }),
       prisma.consentimento.deleteMany({ where: { userId: id } }),
       prisma.direitoEsquecimento.deleteMany({ where: { userId: id } }),
       prisma.passwordReset.deleteMany({ where: { userId: id } }),
       prisma.twoFactorAuth.deleteMany({ where: { userId: id } }),
       prisma.userBadge.deleteMany({ where: { userId: id } }),
       prisma.userLevel.deleteMany({ where: { userId: id } }),
       prisma.userPermission.deleteMany({ where: { userId: id } }),
       prisma.logAcesso.deleteMany({ where: { userId: id } }),
       prisma.transacao.deleteMany({ where: { userId: id } }),
       prisma.participacao.deleteMany({ where: { userId: id } }),
       prisma.pedidoCarregamento.deleteMany({ where: { OR: [{ userId: id }, { vendedorId: id }] } }),
       prisma.venda.deleteMany({ where: { vendedorId: id } }),
       prisma.comissao.deleteMany({ where: { vendedorId: id } }),
       prisma.entregaSaldo.deleteMany({ where: { vendedorId: id } }),
       prisma.pedidoDepositoCofre.deleteMany({ where: { vendedorId: id } }),
     ]);

     await prisma.user.delete({ where: { id } });

      // Audit log
      await logAudit(
        adminUser.id,
        'delete',
        'user',
        id,
        { nome: targetUser.nome, email: targetUser.email, role: targetUser.role },
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );

     return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
