import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac/checkPermission';

export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const denied = await requirePermission(user.id, 'VIEW_VENDAS');
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const jogoId = searchParams.get('jogoId');
    const eventoId = searchParams.get('eventoId');
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const formato = searchParams.get('formato') || 'csv';

    const where: Prisma.ParticipacaoWhereInput = {};
    if (jogoId) where.jogoId = jogoId;
    if (eventoId) (where as any).jogo = { eventoId };
    if (dataInicio || dataFim) {
      (where as any).createdAt = {};
      if (dataInicio) (where as any).createdAt.gte = new Date(dataInicio);
      if (dataFim) (where as any).createdAt.lte = new Date(dataFim);
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

    const participacoesData = participacoes.map((p: Prisma.ParticipacaoGetPayload<{ include: { jogo: true, user: true } }>) => ({
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
      ...participacoesData.map((p: (typeof participacoesData)[number], index: number) => {
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

    const total = participacoesData.reduce((acc: number, p: (typeof participacoesData)[number]) => acc + p.valorPago, 0);
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
