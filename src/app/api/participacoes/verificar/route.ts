import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFullUserFromRequest } from '@/lib/auth';
import { requireAnyOfPermissions } from '@/lib/rbac/checkPermission';
import crypto from 'crypto';

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const WINDOW_MS = 60 * 1000;

// POST - Verificar hash de uma participação
export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request);
    
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const denied = await requireAnyOfPermissions(user.id, ['MANAGE_ALDEIA', 'EXECUTE_VENDA']);
    if (denied) return denied;

    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const key = `${clientIP}:${user.id}`;
    let entry = rateLimitMap.get(key);
    if (!entry || now > entry.resetTime) {
      entry = { count: 1, resetTime: now + WINDOW_MS };
    } else {
      entry.count++;
    }
    rateLimitMap.set(key, entry);
    if (entry.count > RATE_LIMIT) {
      return NextResponse.json({ error: 'Muitas tentativas de verificação. Tente novamente mais tarde.' }, { status: 429 });
    }

    const body = await request.json();
    const { hash } = body;

    if (!hash) {
      return NextResponse.json({ error: 'Hash é obrigatório' }, { status: 400 });
    }

    // Buscar participação com o hash
    const participacao = await prisma.participacao.findFirst({
      where: {
        OR: [
          { hashRaspe: hash },
          { hashParticipacao: hash },
        ],
      },
      include: {
        jogo: {
          include: {
            evento: {
              include: {
                aldeia: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    if (!participacao) {
      return NextResponse.json({ 
        valido: false, 
        mensagem: 'Hash não encontrado no sistema' 
      });
    }

    // Verificar se o hash corresponde aos dados
    let dadosVerificacao = null;
    let hashCorresponde = false;

    if (participacao.dadosVerificacao) {
      try {
        dadosVerificacao = JSON.parse(participacao.dadosVerificacao);

        // Recalcular hash para verificar
        const seed = dadosVerificacao.seed;
        const timestamp = dadosVerificacao.timestamp;
        const uniqueSalt = dadosVerificacao.uniqueSalt;

        if (dadosVerificacao.numeros) {
          const resultado = JSON.stringify(dadosVerificacao.numeros);
          const novoHash = crypto
            .createHash('sha256')
            .update(`${seed}:${resultado}:${uniqueSalt}:${timestamp}`)
            .digest('hex');
          hashCorresponde = novoHash === hash;
        } else if (dadosVerificacao.coordenadas) {
          const resultado = JSON.stringify(dadosVerificacao.coordenadas);
          const novoHash = crypto
            .createHash('sha256')
            .update(`${seed}:${resultado}:${uniqueSalt}:${timestamp}`)
            .digest('hex');
          hashCorresponde = novoHash === hash;
        }
      } catch (e) {
        console.error('Erro ao verificar dados:', e);
      }
    } else if (participacao.hashRaspe && participacao.seedRaspe) {
      // Verificar raspadinha
      try {
        const dadosParticipacao = JSON.parse(participacao.dadosParticipacao);
        const timestamp = dadosParticipacao.generatedAt;
        const uniqueSalt = dadosParticipacao.uniqueSalt;
        if (uniqueSalt) {
          const novoHash = crypto
            .createHash('sha256')
            .update(`${participacao.seedRaspe}:${participacao.resultadoRaspe}:${uniqueSalt}:${timestamp}`)
            .digest('hex');
          hashCorresponde = novoHash === hash;
        }
      } catch (e) {
        console.error('Erro ao verificar raspadinha:', e);
      }
    }

    // Log da tentativa de verificação
    console.log(`[AUDIT] Verificação de hash: ${hashCorresponde ? 'VÁLIDA' : 'INVÁLIDA'} - User: ${user.id} - IP: ${clientIP} - Participacao: ${participacao.id} - Tipo: ${participacao.jogo.tipo}`);
    if (!hashCorresponde) {
      console.warn(`[ALERT] Tentativa de verificação INVÁLIDA detectada - User: ${user.id} - Hash: ${hash}`);
    }

    return NextResponse.json({
      valido: hashCorresponde,
      participacao: {
        id: participacao.id,
        jogo: participacao.jogo.nome,
        tipoJogo: participacao.jogo.tipo,
        valorPago: participacao.valorPago,
        createdAt: participacao.createdAt,
        dadosVerificacao: dadosVerificacao,
        resultado: participacao.resultadoRaspe || (dadosVerificacao?.numeros || dadosVerificacao?.coordenadas),
        cliente: participacao.nomeCliente || participacao.user?.nome,
        telefone: participacao.telefoneCliente || participacao.user?.email,
        premioEntregue: participacao.premioEntregue,
        aldeia: participacao.jogo.evento.aldeia?.nome,
      },
      mensagem: hashCorresponde
        ? 'Hash válido - prémio pode ser entregue'
        : 'Hash inválido - não corresponde aos registros',
    });
  } catch (error) {
    console.error('Erro ao verificar hash:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
