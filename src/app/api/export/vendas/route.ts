import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { exportVendasExcel } from '@/lib/export';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o usuário tem permissão (admin ou organizador)
    const user = await prisma.user.findUnique({
      where: { id: userData.userId },
      include: { aldeia: true }
    });

    const isAdmin = user?.role === 'super_admin' || user?.role === 'aldeia_admin';
    const isOrganizador = user?.aldeiaId !== null;

    if (!isAdmin && !isOrganizador) {
      return NextResponse.json({ error: 'Sem permissão para exportar relatórios' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const vendedorId = searchParams.get('vendedorId');
    const formato = searchParams.get('formato') || 'csv'; // csv ou xlsx (por enquanto só suportamos CSV)

    // Construir filtro de busca
    const where: any = {};
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
    const vendasData = vendas.map((v: any) => ({
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
      aldeia: user?.aldeia?.nome || undefined
    };

    // Exportar conforme o formato solicitado
    if (formato === 'csv') {
      // CSV (padrão)
      const csvContent = [
        ['#', 'Vendedor', 'Cliente', 'Valor', 'Comissão', 'Método', 'Data'].join(','),
        ...vendasData.map((v: any, index: number) => {
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