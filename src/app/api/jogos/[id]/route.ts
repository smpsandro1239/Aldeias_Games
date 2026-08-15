import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';
import { updateJogoSchema } from '@/lib/validations';
import { logCRUD as logAudit } from '@/lib/audit';
import { notifyJogoEditado, notifyPoolRedefinido } from '@/lib/jogo-audit-notify';
import { buildRaspadinhaPool } from '@/app/api/participacoes/_lib/raspadinha';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Compara os prémios enviados com os existentes na BD. Devolve true apenas
// quando há alterações relevantes (nome, percentagem, valor, ordem) ou
// mudança no número de prémios. Se nenhuma lista for enviada, assume
// "sem alteração".
function premiosMudaram(
  novos: Array<{ nome: string; percentagem?: number; valorDinheiroAlternative?: number; ordem?: number }> | undefined,
  atuais: Array<{ nome: string; percentagem?: number | null; valorDinheiroAlternative?: number | null; ordem?: number }> | undefined
): boolean {
  if (!novos) return false;
  const atuaisArr = atuais || [];
  if (novos.length !== atuaisArr.length) return true;

  const normalizar = (p: { nome: string; percentagem?: number | null; valorDinheiroAlternative?: number | null; ordem?: number }) =>
    `${p.ordem ?? 0}|${p.nome ?? ''}|${p.percentagem ?? 0}|${p.valorDinheiroAlternative ?? 0}`;
  const a = novos.map(normalizar).sort().join(';;');
  const b = atuaisArr.map(normalizar).sort().join(';;');
  return a !== b;
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
        // Campos sensíveis que nunca saem na API pública:
        // probabilidadeVitoria/odds (manipulação de odds) e pool
        // (raspadinha — revelaria exatamente que prémios ainda faltam sair).
        const { probabilidadeVitoria, odds, pool, ...safeFields } = parsed;
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

    const jogo = await prisma.jogo.findUnique({
      where: { id },
      include: {
        evento: true,
        premios: { select: { id: true, nome: true, percentagem: true, valorDinheiroAlternative: true, ordem: true } },
      },
    });
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

    // ---- Raspadinha: preservar/regenerar o pool de prémios ----
    // A API pública já não devolve `configuracao.pool` (M5) — se o admin
    // editar o jogo sem alterar prémios, o pool existente tem de ser
    // preservado, senão o jogo deixa de sortear prémios.
    if (jogo.tipo === 'raspadinha') {
      const configAtual = (() => {
        try { return JSON.parse(jogo.configuracao || '{}'); } catch { return {}; }
      })() as Record<string, any>;
      const poolAtual = Array.isArray(configAtual.pool) ? (configAtual.pool as string[]) : null;

      const bodyConfig = (validation.data.configuracao || {}) as Record<string, any>;
      const premiosNovos = (premiosData && premiosData.length > 0
        ? premiosData
        : Array.isArray(bodyConfig.premios)
          ? (bodyConfig.premios as Array<{ nome: string; percentagem?: number; valorDinheiroAlternative?: number; ordem?: number }>)
          : undefined) as Array<{ nome: string; percentagem?: number; valorDinheiroAlternative?: number; ordem?: number }> | undefined;

      let pool: string[] | null = poolAtual;
      let poolMudou = false;

      if (Array.isArray(bodyConfig.pool)) {
        // Caso 3 — pool enviado explicitamente: respeitar a decisão do admin
        pool = bodyConfig.pool as string[];
        poolMudou = true;
      } else if (premiosMudaram(premiosNovos, jogo.premios)) {
        // Caso 2 — prémios alterados: regenerar o pool a partir dos novos
        const stock = typeof validation.data.stockInicial === 'number'
          ? validation.data.stockInicial
          : jogo.stockInicial;
        pool = buildRaspadinhaPool((premiosNovos || []) as Array<{ nome: string; percentagem?: number }>, stock);
        poolMudou = true;
        try {
          await notifyPoolRedefinido({
            jogoNome: jogo.nome,
            aldeiaId: jogo.evento.aldeiaId,
            autorNome: user.nome || 'Administrador',
          });
        } catch (notifyError) {
          console.error('[jogos/PUT] Erro ao notificar pool redefinido:', notifyError);
        }
      }
      // Caso 1 — sem alterações: poolAtual é preservado

      if (poolMudou || validation.data.configuracao !== undefined) {
        const configNova = { ...configAtual, ...bodyConfig, pool };
        updateData.configuracao = JSON.stringify(configNova);
      }
    } else if (updateData.configuracao) {
      updateData.configuracao = JSON.stringify(updateData.configuracao);
    }

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

      // Transparência: notificar admins da aldeia sobre edição
      if (jogo.estado !== updated.estado || jogo.nome !== updated.nome || jogo.preco !== updated.preco) {
        const campos: string[] = [];
        if (jogo.nome !== updated.nome) campos.push('nome');
        if (jogo.preco !== updated.preco) campos.push('preço');
        if (jogo.estado !== updated.estado) campos.push('estado');
        await notifyJogoEditado({
          jogoNome: updated.nome,
          aldeiaId: jogo.evento.aldeiaId,
          autorNome: user.nome || 'Administrador',
          campos,
        });
      }

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

    // Hard-delete só é permitido se não existirem participações (histórico preservado).
    // Com participações, a eliminação é feita via pedido de eliminação (soft-delete,
    // aprovação de 2 pessoas, exceto super admin que auto-aprova).
    const totalParticipacoes = await prisma.participacao.count({ where: { jogoId: id } });
    if (totalParticipacoes > 0) {
      return NextResponse.json(
        { error: 'Este jogo já tem participações. Use o pedido de eliminação (soft-delete) para o arquivar, ou o super administrador pode eliminar diretamente.' },
        { status: 400 }
      );
    }

     await prisma.jogo.delete({ where: { id } });

      // Audit log
      await logAudit(
        user.id,
        'delete',
        'jogo',
        id,
        { nome: jogo.nome, tipo: jogo.tipo, eventoId: jogo.eventoId, modo: 'hard' },
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );

     return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Erro ao eliminar' }, { status: 500 });
  }
}
