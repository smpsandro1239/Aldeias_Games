import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

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
    const jogoId = searchParams.get('jogoId');
    const eventoId = searchParams.get('eventoId');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const formato = searchParams.get('formato') || 'csv';

    const where: any = {};
    if (jogoId) where.jogoId = jogoId;
    if (eventoId) where.eventoId = eventoId;
    if (dataInicio) where.createdAt = { gte: new Date(dataInicio) };
    if (dataFim) {
      if (!where.createdAt) where.createdAt = {};
      where.createdAt.lte = new Date(dataFim);
    }

    const participacoes = await prisma.participacao.findMany({
      where,
      include: {
        jogo: {
          select: {
            nome: true,
            tipo: true,
            evento: {
              select: {
                nome: true,
                aldeia: {
                  select: { nome: true }
                }
              }
            }
          }
        },
        user: {
          select: { nome: true, email: true, telefone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const participacoesData = participacoes.map((p: any) => ({
      id: p.id,
      dadosParticipacao: p.dadosParticipacao,
      nomeCliente: p.nomeCliente || p.user?.nome,
      telefoneCliente: p.telefoneCliente || p.user?.telefone,
      emailCliente: p.emailCliente || p.user?.email,
      valorPago: p.valorPago,
      createdAt: p.createdAt.toISOString(),
      estadoPagamento: p.estadoPagamento,
      jogo: p.jogo ? { nome: p.jogo.nome, tipo: p.jogo.tipo } : undefined,
      evento: p.jogo?.evento ? { nome: p.jogo.evento.nome, aldeia: p.jogo.evento.aldeia ? { nome: p.jogo.evento.aldeia.nome } : undefined } : undefined
    }));

    const titulo = `Relatório de Participações${jogoId ? ` - Jogo #${jogoId}` : ''}${eventoId ? ` - Evento #${eventoId}` : ''}`;
    
    const csvRows = [
      ['#', 'Jogo', 'Número', 'Cliente', 'Telefone', 'Email', 'Valor', 'Data', 'Estado'].join(','),
      ...participacoesData.map((p: any, index: number) => {
        const dados = JSON.parse(p.dadosParticipacao);
        return [
          index + 1,
          p.jogo?.nome || '-',
          dados.numero || dados.letra + dados.numero || '-',
          p.nomeCliente || 'Anónimo',
          p.telefoneCliente || '-',
          p.emailCliente || '-',
          p.valorPago.toFixed(2),
          new Date(p.createdAt).toLocaleDateString('pt-PT'),
          p.estadoPagamento || 'concluido'
        ].join(',');
      })
    ];

    const total = participacoesData.reduce((acc: number, p: any) => acc + p.valorPago, 0);
    csvRows.push('');
    csvRows.push(`Total de participantes,${participacoesData.length}`);
    csvRows.push(`Valor total angariado,${total.toFixed(2)}€`);

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8;',
        'Content-Disposition': `attachment; filename="${titulo.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.csv"`
      }
    });
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
