import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getFullUserFromRequest, hasRole } from '@/lib/auth'
import { executarSorteioSchema, commitSorteioSchema, revealSorteioSchema } from '@/lib/validations'
import { checkRateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit'
import crypto from 'crypto'

export async function PATCH(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request)
    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

    const rateLimit = checkRateLimit(user.id, rateLimitConfigs.sorteios);
    if (!rateLimit.allowed) return createRateLimitResponse(rateLimit.resetTime)

    const body = await request.json()
    if (body.action === 'commit') {
      const { jogoId } = body;
      const serverSeed = crypto.randomBytes(32).toString('hex');
      const hash = crypto.createHash('sha256').update(serverSeed).digest('hex');
      await prisma.jogo.update({ where: { id: jogoId }, data: { seedSorteio: serverSeed, hashSorteio: hash } });
      return NextResponse.json({ success: true, hash });
    }
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getFullUserFromRequest(request)
    if (!user || !hasRole(user.role, ['super_admin', 'aldeia_admin'])) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

    const rateLimit = checkRateLimit(user.id, rateLimitConfigs.sorteios);
    if (!rateLimit.allowed) return createRateLimitResponse(rateLimit.resetTime)

    const { jogoId } = await request.json()
    const jogo = await prisma.jogo.findUnique({
      where: { id: jogoId },
      include: { participacoes: { where: { estadoPagamento: 'concluido' } } }
    })
    if (!jogo || jogo.sorteado) return NextResponse.json({ error: 'Inválido' }, { status: 400 })
    if (jogo.participacoes.length === 0) return NextResponse.json({ error: 'Sem participações' }, { status: 400 })

    const randomIndex = crypto.randomInt(0, jogo.participacoes.length);
    const vencedor = jogo.participacoes[randomIndex];

    await prisma.participacao.update({ where: { id: vencedor.id }, data: { ganhador: true } });
    await prisma.jogo.update({ where: { id: jogoId }, data: { sorteado: vencedor.id, dataSorteio: new Date(), isFinalizado: true } });

    return NextResponse.json({ success: true, vencedorId: vencedor.id });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
