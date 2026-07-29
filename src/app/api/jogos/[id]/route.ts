import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { updateJogoSchema } from '@/lib/validations';
import { logCRUD as logAudit } from '@/lib/audit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const jogo = await prisma.jogo.findUnique({
      where: { id },
      include: {
        evento: { select: { id: true, nome: true, slug: true, aldeiaId: true, aldeia: { select: { id: true, nome: true, slug: true } } } },
        premios: { select: { id: true, nome: true, descricao: true, ordem: true, valorDinheiroAlternative: true } }
      }
    });
    if (!jogo) return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });

    const rawConfig = (jogo as any).configuracao;
    let safeConfig: Record<string, unknown> | null = null;
    if (rawConfig) {
      try {
        const parsed = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig;
        const { probabilidadeVitoria, odds, ...safeFields } = parsed;
        safeConfig = safeFields;
      } catch {
        safeConfig = null;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { configuracao, probabilidadeVitoria, odds, ...publicJogo } = jogo as any;
    return NextResponse.json({ data: { ...publicJogo, configuracao: safeConfig } });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const user = await getFullUserFromRequest(request);
    
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const jogo = await prisma.jogo.findUnique({ where: { id }, include: { evento: true } });
    if (!jogo) return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });

    if (user.role === 'aldeia_admin' && user.aldeiaId !== jogo.evento.aldeiaId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateJogoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.errors }, { status: 400 });
    }

    const { premios: premiosData, ...otherData } = validation.data;
    const updateData = { ...otherData } as Prisma.JogoUpdateInput;
    if (updateData.configuracao) updateData.configuracao = JSON.stringify(updateData.configuracao);

    if (updateData.estado === 'fechado' && jogo.estado !== 'fechado') {
      const participacoesAtivas = await prisma.participacao.count({
        where: { jogoId: id, estadoPagamento: 'concluido' },
      });
      if (participacoesAtivas > 0) {
        return NextResponse.json(
          { error: `Não é possível fechar o jogo: existem ${participacoesAtivas} participação(ões) confirmada(s). Remova ou cancele as participações primeiro.` },
          { status: 400 }
        );
      }
    }

     const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
       // Se vierem novos prémios, remover os antigos primeiro
       if (premiosData) {
         await tx.premio.deleteMany({
           where: { jogoId: id } as any
         });
       }

       return await tx.jogo.update({
         where: { id },
         data: {
           ...updateData,
           premios: premiosData ? {
              create: premiosData.map((p: any) => ({
               ...p,
               aldeiaId: jogo.evento.aldeiaId,
             }))
           } : undefined
         },
       });
     });

      // Audit log for game update
      await logAudit(
        user.id,
        'update',
        'jogo',
        id,
        { 
          old: { nome: jogo.nome, estado: jogo.estado, preco: jogo.preco, stockAtual: jogo.stockAtual },
          new: { nome: updated.nome, estado: updated.estado, preco: updated.preco, stockAtual: updated.stockAtual }
        },
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );

     return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
   try {
    const { id } = await context.params;
    const user = await getFullUserFromRequest(request);
    
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

    const jogo = await prisma.jogo.findUnique({ where: { id }, include: { evento: true } });
    if (!jogo) return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 });

    if (user.role === 'aldeia_admin' && user.aldeiaId !== jogo.evento.aldeiaId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

     await prisma.jogo.delete({ where: { id } });

      // Audit log
      await logAudit(
        user.id,
        'delete',
        'jogo',
        id,
        { nome: jogo.nome, tipo: jogo.tipo, eventoId: jogo.eventoId },
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );

     return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Erro ao eliminar' }, { status: 500 });
  }
}
