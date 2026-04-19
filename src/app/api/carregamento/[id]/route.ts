import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest, hasRole } from '@/lib/auth';
import crypto from 'crypto';

function verifyQRData(qrData: string, pedidoId: string, expectedPassword: string) {
  try {
    const decoded = Buffer.from(qrData, 'base64').toString('utf-8');
    const data = JSON.parse(decoded);
    return data.pedidoId === pedidoId && data.hash === crypto.createHash('sha256').update(expectedPassword + pedidoId).digest('hex').substring(0, 8);
  } catch {
    return false;
  }
}

function getClientInfo(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] 
    || request.headers.get('x-real-ip') 
    || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return { ip, dispositivo: userAgent.substring(0, 100) };
}

// PUT - Confirmar ou autorizar carregamento
export async function PUT(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user || !hasRole(user.role, ['vendedor', 'aldeia_admin'])) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { pedidoId, password, qrCode, acao, motivo } = body;

    if (!pedidoId) {
      return NextResponse.json({ error: 'ID do pedido requerido' }, { status: 400 });
    }

    const { ip, dispositivo } = getClientInfo(request);
    const pedido = await prisma.pedidoCarregamento.findUnique({
      where: { id: pedidoId },
      include: { user: true }
    });

    if (!pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // AÇÃO: AUTORIZAR (Admin)
    if (acao === 'autorizar') {
      if (user.role !== 'aldeia_admin') {
        return NextResponse.json({ error: 'Apenas admin pode autorizar' }, { status: 403 });
      }

      if (pedido.autorizado) {
        return NextResponse.json({ error: 'Já autorizado' }, { status: 400 });
      }

      const updated = await prisma.pedidoCarregamento.update({
        where: { id: pedidoId },
        data: {
          autorizado: true,
          autorizadoPorId: user.id,
          autorizadoAt: new Date(),
          estado: 'pendente', // Agora pode ser processado
        }
      });

      return NextResponse.json({ success: true, message: 'Autorizado com sucesso' });
    }

    // AÇÃO: REJEITAR (Admin)
    if (acao === 'rejeitar') {
      if (user.role !== 'aldeia_admin') {
        return NextResponse.json({ error: 'Apenas admin pode rejeitar' }, { status: 403 });
      }

      await prisma.pedidoCarregamento.update({
        where: { id: pedidoId },
        data: {
          estado: 'cancelado',
          motivoRejeicao: motivo || 'Rejeitado pelo administrador',
        }
      });

      return NextResponse.json({ success: true, message: 'Rejeitado' });
    }

    // AÇÃO: CONFIRMAR (Vendedor)
    if (!password && !qrCode) {
      return NextResponse.json({ error: 'Código ou QR requerido' }, { status: 400 });
    }

    // Anti-fraude: verificar se já foi usado
    if (pedido.tentativaUsada) {
      return NextResponse.json({ error: 'Este código já foi utilizado' }, { status: 400 });
    }

    // Verificar expiração
    if (pedido.expiresAt && new Date() > pedido.expiresAt) {
      await prisma.pedidoCarregamento.update({
        where: { id: pedidoId },
        data: { estado: 'expirado', tentativaUsada: true }
      });
      return NextResponse.json({ error: 'Código expirado' }, { status: 400 });
    }

    // Validar código
    let validado = false;
    if (password) {
      validado = password === pedido.passwordOneTime;
    } else if (qrCode) {
      validado = verifyQRData(qrCode, pedidoId, pedido.passwordOneTime || '');
    }

    if (!validado) {
      // Registar tentativa falhada
      await prisma.pedidoCarregamento.update({
        where: { id: pedidoId },
        data: {
          tentativasErro: { increment: 1 },
          ultimoErroTimestamp: new Date(),
          ip,
        }
      });

      // Bloquear após 3 tentativas
      if ((pedido.tentativasErro || 0) >= 2) {
        await prisma.pedidoCarregamento.update({
          where: { id: pedidoId },
          data: { tentativasErro: { increment: 1 }, estado: 'cancelado' }
        });
        return NextResponse.json({ error: 'Código bloqueado após múltiplas tentativas' }, { status: 400 });
      }

      return NextResponse.json({ error: 'Código inválido' }, { status: 400 });
    }

    // Verificar se requer autorização admin
    if (pedido.requerAutorizacao && !pedido.autorizado) {
      return NextResponse.json({ 
        error: 'Este carregamento requer autorização do administrador',
        requiresAuthorization: true 
      }, { status: 403 });
    }

    // Confirmar pagamento
    const updated = await prisma.pedidoCarregamento.update({
      where: { id: pedidoId },
      data: {
        vendedorId: user.id,
        pagamentoConfirmado: true,
        metodoValidacao: qrCode ? 'qr_code' : 'password',
        estado: 'confirmado',
        confirmadoPorId: user.id,
        confirmadoAt: new Date(),
        tentativaUsada: true,
        ip,
        dispositivo,
        observacoes: 'Carregamento confirmado',
      }
    });

    // Credit saldo ao jogador
    await prisma.user.update({
      where: { id: pedido.userId },
      data: { saldo: { increment: pedido.valor } }
    });

    // Criar notificação para o jogador
    await prisma.notificacao.create({
      data: {
        userId: pedido.userId,
        tipo: 'sistema',
        titulo: 'Saldo Carregado',
        mensagem: `O teu saldo foi carregado com ${pedido.valor}€. Novo saldo disponível.`,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Carregamento confirmado',
      novoSaldo: pedido.valor,
      jogador: pedido.user.nome
    });

  } catch (error) {
    console.error('Error confirming carregamento:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}