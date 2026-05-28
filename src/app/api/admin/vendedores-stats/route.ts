import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const aldeiaIdParam = searchParams.get('aldeiaId');
    
    // Determine the aldeia context
    let targetAldeiaId = null;
    if (user.role === 'aldeia_admin') {
      targetAldeiaId = user.aldeiaId;
    } else if (user.role === 'super_admin' && aldeiaIdParam) {
      targetAldeiaId = aldeiaIdParam;
    }
    
    if (!targetAldeiaId && user.role !== 'super_admin') {
        return NextResponse.json({ error: 'Nenhuma aldeia associada' }, { status: 400 });
    }

    // Fetch sellers
    const where: any = { role: 'vendedor' };
    if (targetAldeiaId) {
        where.aldeiaId = targetAldeiaId;
    }

    const vendedores = await prisma.user.findMany({
      where,
      select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          aldeiaId: true,
      }
    });

    // Fetch their comissões settings
    const comissoesConfig = await prisma.comissao.findMany({
        where: { vendedorId: { in: vendedores.map(v => v.id) } }
    });

    // Fetch their apostas (physical POS)
    const apostas = await prisma.aposta.findMany({
        where: { vendedorId: { in: vendedores.map(v => v.id) }, pago: true },
        include: { jogo: { select: { preco: true } } }
    });

    // Fetch their participacoes (digital POS)
    const participacoes = await prisma.participacao.findMany({
        where: { vendedorId: { in: vendedores.map(v => v.id) }, estadoPagamento: 'concluido' }
    });
    
    // Fetch transacoes (cashouts already made to them)
    const payouts = await prisma.transacao.findMany({
        where: { userId: { in: vendedores.map(v => v.id) }, tipo: 'comissao' }
    });

    // Aggregate data
    const statsResult = vendedores.map(v => {
        const config = comissoesConfig.find(c => c.vendedorId === v.id);
        const percentual = config?.percentual || 5; // Default 5%
        
        const sellerApostas = apostas.filter(a => a.vendedorId === v.id);
        const volumeApostas = sellerApostas.reduce((acc, a) => {
            let numCount = 1;
            try { numCount = JSON.parse(a.numeros || "[]").length; } catch(e){}
            return acc + (numCount * (a.jogo.preco || 0));
        }, 0);

        const sellerParticipacoes = participacoes.filter(p => p.vendedorId === v.id);
        const volumeParticipacoes = sellerParticipacoes.reduce((acc, p) => acc + (p.valorPago || 0), 0);

        const volumeTotal = volumeApostas + volumeParticipacoes;
        const totalVendas = sellerApostas.length + sellerParticipacoes.length;
        
        const comissaoGanhas = (volumeTotal * percentual) / 100;
        
        const sellerPayouts = payouts.filter(p => p.id === v.id);
        const jaPago = sellerPayouts.reduce((acc, p) => acc + p.valor, 0);

        return {
            ...v,
            comissaoPercentual: percentual,
            metaVendas: config?.metaVendas || 0,
            volumeTotal,
            totalVendas,
            comissaoGanhas,
            jaPago,
            saldoAberto: comissaoGanhas - jaPago
        };
    });

    // Sort by sales volume
    statsResult.sort((a, b) => b.volumeTotal - a.volumeTotal);

    return NextResponse.json({
      success: true,
      data: statsResult
    });
  } catch (error) {
    console.error('Erro ao calcular estatísticas de vendedores:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
