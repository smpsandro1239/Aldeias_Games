import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const denied = await requirePermission(user.id, 'EXECUTE_VENDA');
    if (denied) return denied;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    // Fetch Comissao config
    const comissaoConfig = await prisma.comissao.findFirst({
        where: { vendedorId: user.id }
    });
    const percentual = comissaoConfig?.percentual || 5; // Default 5%

    // Fetch Apostas (Poio da Vaca / Rifas Livro)
    const [apostasHoje, apostasTotais] = await Promise.all([
      prisma.aposta.findMany({
        where: { vendedorId: user.id, pago: true, createdAt: { gte: hoje, lt: amanha } },
        include: { jogo: { select: { nome: true, preco: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.aposta.findMany({
        where: { vendedorId: user.id, pago: true },
        include: { jogo: { select: { nome: true, preco: true } } }
      })
    ]);

    // Fetch Participacoes (Raspadinhas e Rifas Digitais POS)
    const [partHoje, partTotais] = await Promise.all([
        prisma.participacao.findMany({
            where: { vendedorId: user.id, estadoPagamento: 'concluido', createdAt: { gte: hoje, lt: amanha } },
            include: { jogo: { select: { nome: true } } },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.participacao.findMany({
            where: { vendedorId: user.id, estadoPagamento: 'concluido' }
        })
    ]);

    // Calculate Valor
    const valorAposta = (a: Prisma.ApostaGetPayload<{ include: { jogo: { select: { nome: true; preco: true } } } }>) => {
        try { return JSON.parse(a.numeros || "[]").length * (a.jogo.preco || 0); } catch { return 0; }
    };

    const valorHojeApostas = apostasHoje.reduce((acc: number, a: Prisma.ApostaGetPayload<{ include: { jogo: { select: { nome: true; preco: true } } } }>) => acc + valorAposta(a), 0);
    const valorTotalApostas = apostasTotais.reduce((acc: number, a: Prisma.ApostaGetPayload<{ include: { jogo: { select: { preco: true } } } }>) => acc + valorAposta(a), 0);

    const valorHojePart = partHoje.reduce((acc: number, p: Prisma.ParticipacaoGetPayload<{ include: { jogo: { select: { nome: true } } } }>) => acc + (p.valorPago || 0), 0);
    const valorTotalPart = partTotais.reduce((acc: number, p: any) => acc + (p.valorPago || 0), 0);

    const valorHoje = valorHojeApostas + valorHojePart;
    const valorTotal = valorTotalApostas + valorTotalPart;

    const vendasHoje = apostasHoje.length + partHoje.length;
    const vendasTotal = apostasTotais.length + partTotais.length;

    const comissaoTotal = (valorTotal * percentual) / 100;

    // The seller holds cash but some sales might be digital/Stripe/MBWay.
    // Let's filter cash sales only to calculate what they need to hand over explicitly.
    const dinheiroEmMaoApostas = apostasTotais.reduce((acc: number, a: Prisma.ApostaGetPayload<{ include: { jogo: { select: { preco: true } } } }>) => acc + valorAposta(a), 0); // Apostas are always physical cash in POS
    const dinheiroEmMaoPart = partTotais.filter((p: any) => p.metodoPagamento === 'dinheiro').reduce((acc: number, p: any) => acc + (p.valorPago || 0), 0);
    
    const totalDinheiroLivre = dinheiroEmMaoApostas + dinheiroEmMaoPart;
    const aEntregar = Math.max(0, totalDinheiroLivre - comissaoTotal);

    // Build History (Ultimas Vendas Hoje)
    const historicoApostas = apostasHoje.map((a: Prisma.ApostaGetPayload<{ include: { jogo: { select: { nome: true; preco: true } } } }>) => ({
        id: a.id,
        valor: valorAposta(a),
        metodoPagamento: 'dinheiro', // POS mostly uses cash initially
        createdAt: a.createdAt.toISOString(),
        jogo: { nome: a.jogo.nome },
        tipo: 'aposta' as const,
    }));

    const historicoPart = partHoje.map((p: Prisma.ParticipacaoGetPayload<{ include: { jogo: { select: { nome: true } } } }>) => ({
        id: p.id,
        valor: p.valorPago,
        metodoPagamento: p.metodoPagamento,
        createdAt: p.createdAt.toISOString(),
        jogo: { nome: p.jogo.nome },
        tipo: 'participacao' as const,
    }));

    const ultimasVendas = [...historicoApostas, ...historicoPart]
        .sort((a: { createdAt: string }, b: { createdAt: string }) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10); // top 10 do dia

    const data = {
      vendasHoje,
      valorHoje,
      vendasTotal,
      valorTotal,
      comissaoTotal,
      aEntregar,
      ultimasVendas,
    };

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Erro no dashboard vendedor:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}