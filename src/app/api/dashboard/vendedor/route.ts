import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user || user.role !== 'vendedor') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

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
        include: { jogo: { select: { preco: true } } }
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
    const valorAposta = (a: any) => {
        try { return JSON.parse(a.numeros || "[]").length * (a.jogo.preco || 0); } catch { return 0; }
    };

    const valorHojeApostas = apostasHoje.reduce((acc, a) => acc + valorAposta(a), 0);
    const valorTotalApostas = apostasTotais.reduce((acc, a) => acc + valorAposta(a), 0);

    const valorHojePart = partHoje.reduce((acc, p) => acc + (p.valorPago || 0), 0);
    const valorTotalPart = partTotais.reduce((acc, p) => acc + (p.valorPago || 0), 0);

    const valorHoje = valorHojeApostas + valorHojePart;
    const valorTotal = valorTotalApostas + valorTotalPart;

    const vendasHoje = apostasHoje.length + partHoje.length;
    const vendasTotal = apostasTotais.length + partTotais.length;

    const comissaoTotal = (valorTotal * percentual) / 100;

    // The seller holds cash but some sales might be digital/Stripe/MBWay.
    // Let's filter cash sales only to calculate what they need to hand over explicitly.
    const dinheiroEmMaoApostas = apostasTotais.reduce((acc, a) => acc + valorAposta(a), 0); // Apostas are always physical cash in POS
    const dinheiroEmMaoPart = partTotais.filter(p => p.metodoPagamento === 'dinheiro').reduce((acc, p) => acc + (p.valorPago || 0), 0);
    
    const totalDinheiroLivre = dinheiroEmMaoApostas + dinheiroEmMaoPart;
    const aEntregar = Math.max(0, totalDinheiroLivre - comissaoTotal);

    // Build History (Ultimas Vendas Hoje)
    const historicoApostas = apostasHoje.map(a => ({
        id: a.id,
        valor: valorAposta(a),
        metodoPagamento: 'dinheiro', // POS mostly uses cash initially
        createdAt: a.createdAt.toISOString(),
        jogo: { nome: a.jogo.nome }
    }));

    const historicoPart = partHoje.map(p => ({
        id: p.id,
        valor: p.valorPago,
        metodoPagamento: p.metodoPagamento,
        createdAt: p.createdAt.toISOString(),
        jogo: { nome: p.jogo.nome }
    }));

    const ultimasVendas = [...historicoApostas, ...historicoPart]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
  } catch (error) {
    console.error('Erro no dashboard vendedor:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}