import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import crypto from 'crypto';

function generatePassword(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(crypto.randomInt(chars.length));
  }
  return result;
}

function generateQRData(pedidoId: string, userId: string, valor: number, password: string) {
  // Generate encrypted QR data
  const data = JSON.stringify({
    pedidoId,
    userId,
    valor,
    timestamp: Date.now(),
    hash: crypto.createHash('sha256').update(password + pedidoId).digest('hex').substring(0, 8)
  });
  return Buffer.from(data).toString('base64');
}

function getClientInfo(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] 
    || request.headers.get('x-real-ip') 
    || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return { ip, dispositivo: userAgent.substring(0, 100) };
}

// POST - Criar novo pedido de carregamento
export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { valor, aldeiaId } = body;

    if (!valor || valor <= 0 || valor > 500) {
      return NextResponse.json({ error: 'Valor inválido (máx 500€)' }, { status: 400 });
    }

    if (!aldeiaId) {
      return NextResponse.json({ error: 'Aldeia requerida' }, { status: 400 });
    }

    // Check if aldeia requires authorization
    const { ip, dispositivo } = getClientInfo(request);
    const passwordOneTime = generatePassword(8);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Verificar tentativas recentes (anti-fraude)
    const recentAttempts = await prisma.pedidoCarregamento.count({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }, // últimos 15 min
        estado: 'pendente',
      }
    });

    if (recentAttempts >= 3) {
      return NextResponse.json({ 
        error: 'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.' 
      }, { status: 429 });
    }

    const pedido = await prisma.pedidoCarregamento.create({
      data: {
        userId: user.id,
        aldeiaId,
        valor,
        metodoPagamento: 'dinheiro',
        passwordOneTime,
        expiresAt,
        qrCodeData: generateQRData('', user.id, valor, passwordOneTime),
        estado: 'pendente',
        requerAutorizacao: false,
        ipOrigem: ip,
        dispositivo,
      },
    });

    // Update QR with correct ID after creation
    const qrData = generateQRData(pedido.id, user.id, valor, passwordOneTime);
    await prisma.pedidoCarregamento.update({
      where: { id: pedido.id },
      data: { qrCodeData: qrData }
    });

    return NextResponse.json({
      success: true,
      data: {
        pedidoId: pedido.id,
        password: passwordOneTime,
        qrCode: qrData,
        expiresAt: expiresAt.toISOString(),
        requerAutorizacao: pedido.requerAutorizacao,
        valor,
        nomeJogador: user.nome,
      }
    });
  } catch (error) {
    console.error('Error creating carregamento:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// GET - Listar pedidos (conforme role)
export async function GET(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo'); 
    const estado = searchParams.get('estado');

    let where: Prisma.PedidoCarregamentoWhereInput = {};

    // Jogador: ver os seus pedidos
    if (user.role === 'user') {
      where = { userId: user.id };
    }
    // Vendedor: ver pedidos pendentes da sua aldeia
    else if (user.role === 'vendedor') {
      where = { aldeiaId: user.aldeiaId, estado: 'pendente' };
    }
    // Admin: ver todos ou os que precisam de aprovação
    else if (user.role === 'aldeia_admin' || user.role === 'super_admin') {
      where = { aldeiaId: user.aldeiaId };
      if (tipo === 'aprovacao') {
        where = { ...where, requerAutorizacao: true, autorizado: false, estado: 'pendente' };
      }
    }

    if (estado) {
      where = { ...where, estado };
    }

    const pedidos = await prisma.pedidoCarregamento.findMany({
      where,
      include: {
        user: { select: { id: true, nome: true, email: true, telefone: true } },
        vendedor: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ data: pedidos });
  } catch (error) {
    console.error('Error fetching carregamentos:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}