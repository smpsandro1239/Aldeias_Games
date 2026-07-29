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
    const aldeiaId = searchParams.get('aldeiaId') || user.aldeiaId;

    if (!aldeiaId && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Aldeia não encontrada' }, { status: 400 });
    }

    const whereAldeia = aldeiaId ? { aldeiaId } : {};

    // Fetch sellers with cashbox in this aldeia
    const vendedores = await prisma.user.findMany({
      where: {
        role: 'vendedor',
        aldeiaId: aldeiaId || undefined,
        deletedAt: null,
      },
      include: {
        cashbox: {
          include: {
            transacoes: {
              orderBy: { createdAt: 'desc' },
            }
          }
        }
      }
    });

    // Fetch vault for the aldeia
    const vault = aldeiaId
      ? await prisma.vault.findUnique({
          where: { aldeiaId },
          include: {
            transacoes: {
              where: { estado: 'confirmado' },
            }
          }
        })
      : null;

    // Fetch pending deposits
    const pendentes = await prisma.pedidoDepositoCofre.findMany({
      where: {
        ...whereAldeia,
        estado: 'pendente',
      },
      include: {
        vendedor: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all Aldeias for super_admin
    const todasAldeias = user.role === 'super_admin' && !aldeiaId
      ? await prisma.aldeia.findMany({
          where: { ativo: true },
          include: {
            vault: {
              include: {
                transacoes: { where: { estado: 'confirmado' } }
              }
            },
            _count: { select: { users: { where: { role: 'vendedor', deletedAt: null } } } }
          }
        })
      : null;

    // Build per-seller reconciliation
    const vendedoresData = vendedores.map((v: Prisma.UserGetPayload<{ include: { cashbox: { include: { transacoes: { orderBy: { createdAt: 'desc' } } } } } }>) => {
      const transacoes = v.cashbox?.transacoes || [];
      const totalRecebido = transacoes
        .filter((t: any) => t.tipo === 'RECEBIDO_DO_JOGADOR')
        .reduce((sum: number, t: any) => sum + t.valor, 0);
      const totalDepositado = transacoes
        .filter((t: any) => t.tipo === 'DEPOSITADO_NO_COFRE')
        .reduce((sum: number, t: any) => sum + t.valor, 0);
      const saldoEsperado = totalRecebido - totalDepositado;
      const saldoReal = v.cashbox?.saldo ?? 0;

      return {
        id: v.id,
        nome: v.nome,
        email: v.email,
        saldoCashbox: saldoReal,
        totalRecebido,
        totalDepositado,
        saldoEsperado,
        discrepancia: saldoReal - saldoEsperado,
        transacoes: transacoes.slice(0, 20),
      };
    });

    // Vault data
    const vaultData = vault ? {
      saldo: vault.saldo,
      totalDepositos: vault.transacoes.reduce((sum: number, t: any) => sum + t.valor, 0),
      numDepositos: vault.transacoes.length,
    } : null;

    // Aldeias data for super_admin
    const aldeiasData = todasAldeias?.map((a: Prisma.AldeiaGetPayload<{ include: { vault: { include: { transacoes: { where: { estado: 'confirmado' } } } }; _count: { select: { users: { where: { role: 'vendedor'; deletedAt: null } } } } } }>) => ({
      id: a.id,
      nome: a.nome,
      saldoCofre: a.vault?.saldo ?? 0,
      totalDepositado: a.vault?.transacoes.reduce((sum: number, t: any) => sum + t.valor, 0) ?? 0,
      numVendedores: a._count.users,
    })) ?? [];

    // General totals
    const totalRecebidoGeral = vendedoresData.reduce((sum: number, v: { totalRecebido: number }) => sum + v.totalRecebido, 0);
    const totalDepositadoGeral = vendedoresData.reduce((sum: number, v: { totalDepositado: number }) => sum + v.totalDepositado, 0);
    const saldoCashboxGeral = vendedoresData.reduce((sum: number, v: { saldoCashbox: number }) => sum + v.saldoCashbox, 0);
    const saldoEsperadoGeral = vendedoresData.reduce((sum: number, v: { saldoEsperado: number }) => sum + v.saldoEsperado, 0);
    const discrepancias = vendedoresData.filter((v: { discrepancia: number }) => Math.abs(v.discrepancia) > 0.01);

    return NextResponse.json({
      success: true,
      data: {
        aldeia: aldeiaId ? {
          id: aldeiaId,
          nome: user.aldeia?.nome || (await prisma.aldeia.findUnique({ where: { id: aldeiaId }, select: { nome: true } }))?.nome,
        } : null,
        resumo: {
          totalRecebido: totalRecebidoGeral,
          totalDepositadoVault: vaultData?.totalDepositos ?? 0,
          totalDepositadoCashbox: totalDepositadoGeral,
          saldoCashboxGeral,
          saldoEsperadoGeral,
          saldoVault: vaultData?.saldo ?? 0,
          pendentesValor: pendentes.reduce((sum: number, p: Prisma.PedidoDepositoCofreGetPayload<{ include: { vendedor: { select: { id: true; nome: true } } } }>) => sum + p.valor, 0),
          pendentesCount: pendentes.length,
        },
        discrepanciaGeral: saldoCashboxGeral - saldoEsperadoGeral,
        vendedoresComDiscrepancia: discrepancias.length,
        vendedores: vendedoresData,
        pendentes,
        vault: vaultData,
        aldeias: aldeiasData.length > 0 ? aldeiasData : undefined,
      }
    });
  } catch (error) {
    console.error('Error fetching reconciliation:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
