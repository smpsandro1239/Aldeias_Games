import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);

    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requirePermission(user.id, 'MANAGE_ALDEIA');
    if (denied) return denied;

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
    const where: Prisma.UserWhereInput = { role: 'vendedor' };
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
    const comissoesConfig = await any.findMany({
        where: { vendedorId: { in: vendedores.map((v) => v.id) } }
    });

    // Fetch their apostas (physical POS)
    const apostas = await any.findMany({
        where: { vendedorId: { in: vendedores.map((v) => v.id) }, pago: true },
        include: { jogo: { select: { preco: true } } }
    });

    // Fetch their participacoes (digital POS)
    const participacoes = await any.findMany({
        where: { vendedorId: { in: vendedores.map((v) => v.id) }, estadoPagamento: 'concluido' }
    });
    
    // Fetch transacoes (cashouts already made to them)
    const payouts = await any.findMany({
        where: { userId: { in: vendedores.map((v) => v.id) }, tipo: 'comissao' }
    });

    // Aggregate data
    const statsResult = vendedores.map((v) => {
        const config = comissoesConfig.find((c: any) => c.vendedorId === v.id);
        const percentual = config?.percentual || 5; // Default 5%
        
        const sellerApostas = apostas.filter((a: Prisma.ApostaGetPayload<{ include: { jogo: { select: { preco: true } } } }>) => a.vendedorId === v.id);
        const volumeApostas = sellerApostas.reduce((acc: number, a: Prisma.ApostaGetPayload<{ include: { jogo: { select: { preco: true } } } }>) => {
            let numCount = 1;
            try { numCount = JSON.parse(a.numeros || "[]").length; } catch(e){}
            return acc + (numCount * (a.jogo.preco || 0));
        }, 0);

        const sellerParticipacoes = participacoes.filter((p: any) => p.vendedorId === v.id);
        const volumeParticipacoes = sellerParticipacoes.reduce((acc: number, p: any) => acc + (p.valorPago || 0), 0);

        const volumeTotal = volumeApostas + volumeParticipacoes;
        const totalVendas = sellerApostas.length + sellerParticipacoes.length;
        
        const comissaoGanhas = (volumeTotal * percentual) / 100;
        
        const sellerPayouts = payouts.filter((p: any) => p.userId === v.id);
        const jaPago = sellerPayouts.reduce((acc: number, p: any) => acc + p.valor, 0);

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
    statsResult.sort((a: { volumeTotal: number }, b: { volumeTotal: number }) => b.volumeTotal - a.volumeTotal);

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
