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

    const [vendasHoje, vendasTotal] = await Promise.all([
      prisma.venda.findMany({
        where: {
          vendedorId: user.id,
          createdAt: { gte: hoje, lt: amanha },
        },
        select: { valor: true, metodoPagamento: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.venda.findMany({
        where: { vendedorId: user.id },
        select: { valor: true, comissao: true },
      }),
    ]);

    const vendasHojeTotal = vendasHoje.reduce((acc, v) => acc + v.valor, 0);
    const valorTotal = vendasTotal.reduce((acc, v) => acc + v.valor, 0);
    const comissaoTotal = vendasTotal.reduce((acc, v) => acc + v.comissao, 0);

    const data = {
      vendasHoje: vendasHoje.length,
      valorHoje: vendasHojeTotal,
      vendasTotal: vendasTotal.length,
      valorTotal,
      comissaoTotal,
      ultimasVendas: vendasHoje.map((v, idx) => ({
        id: `venda-${idx}`,
        valor: v.valor,
        metodoPagamento: v.metodoPagamento,
        createdAt: v.createdAt.toISOString(),
      })),
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erro no dashboard vendedor:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}