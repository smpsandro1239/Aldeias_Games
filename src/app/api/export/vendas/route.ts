import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { exportVendasExcel } from '@/lib/export';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const denied = await requirePermission(user.id, 'VIEW_VENDAS');
    if (denied) return denied;

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { aldeia: true }
    });

    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const vendedorId = searchParams.get('vendedorId');
    const formato = searchParams.get('formato') || 'csv'; // csv ou xlsx (por enquanto só suportamos CSV)

    // Construir filtro de busca
    const where: Prisma.VendaWhereInput = {};
    if (dataInicio) where.createdAt = { gte: new Date(dataInicio) };
    if (dataFim) {
      if (!where.createdAt) where.createdAt = {};
      where.createdAt.lte = new Date(dataFim);
    }
    if (vendedorId) where.vendedorId = vendedorId;

    // Buscar vendas com dados relacionados
    const vendas = await prisma.venda.findMany({
      where,
      include: {
        vendedor: {
          select: {
            nome: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Formatar dados para exportação
    const vendasData = vendas.map((v: Prisma.VendaGetPayload<{ include: { vendedor: true } }>) => ({
      id: v.id,
      valor: v.valor,
      comissao: v.comissao,
      metodoPagamento: v.metodoPagamento,
      dadosCliente: v.dadosCliente,
      createdAt: v.createdAt.toISOString(),
      vendedor: v.vendedor ? { nome: v.vendedor.nome } : undefined
    }));

    // Definir opções de exportação
    const exportOptions: any = {
      titulo: `Relatório de Vendas${vendedorId ? ` - Vendedor #${vendedorId}` : ''}`,
      subtitulo: `Período: ${dataInicio || 'Início'} a ${dataFim || 'Presente'}`,
      aldeia: fullUser?.aldeia?.nome || undefined
    };

    // Exportar conforme o formato solicitado
    if (formato === 'csv') {
      // CSV (padrão)
      const csvContent = [
        ['#', 'Vendedor', 'Cliente', 'Valor', 'Comissão', 'Método', 'Data'].join(','),
        ...vendasData.map((v: (typeof vendasData)[number], index: number) => {
          const dados = v.dadosCliente ? JSON.parse(v.dadosCliente) : {};
          return [
            index + 1,
            v.vendedor?.nome || '-',
            dados.nome || '-',
            v.valor.toFixed(2),
            v.comissao.toFixed(2),
            v.metodoPagamento,
            new Date(v.createdAt).toLocaleString('pt-PT')
          ].join(',')
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      return new NextResponse(blob, {
        headers: {
          'Content-Type': 'text/csv;charset=utf-8;',
          'Content-Disposition': `attachment; filename="${exportOptions.titulo.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.csv"`
        }
      });
    } else {
      // Para outros formatos, por enquanto retornamos erro
      return NextResponse.json(
        { error: 'Formato não suportado. Use formato=csv' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Erro ao exportar relatório de vendas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}