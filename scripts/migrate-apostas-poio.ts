/**
 * Migração pontual: converte Aposta (poio legacy) em Participacao (fluxo único).
 *
 * - 1 aposta com N números → N participações unitárias (1 quadrado cada)
 * - Só migra apostas de jogos do tipo `poio_da_vaca` com `pago: true`
 * - Idempotente: guarda o id da aposta em `dadosVerificacao.migradaDeAposta`
 * - Não apaga a Aposta (preservada para histórico/regressão)
 *
 * Uso:
 *   DATABASE_URL="file:./dev.db" npx tsx scripts/migrate-apostas-poio.ts
 *   DATABASE_URL="file:./dev.db" npx tsx scripts/migrate-apostas-poio.ts --dry-run
 */
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

function generateHash(seed: string, resultado: string, salt: string, timestamp: string): string {
  return crypto.createHash('sha256').update(`${seed}:${resultado}:${salt}:${timestamp}`).digest('hex');
}

async function main() {
  const apostas = await prisma.aposta.findMany({
    where: { pago: true },
    include: { jogo: { select: { id: true, tipo: true, nome: true, configuracao: true, dimensoesCampo: true, custoQuadrado: true, preco: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const poio = apostas.filter((a) => a.jogo.tipo === 'poio_da_vaca');
  console.log(`Apostas pagas: ${apostas.length} (poio: ${poio.length})`);

  if (DRY_RUN) console.log('DRY RUN — nada será gravado.');

  let criadas = 0;
  let jogosAtualizados = new Map<string, { participacoes: number; angariado: number }>();

  for (const aposta of poio) {
    let numeros: number[] = [];
    try {
      const parsed = JSON.parse(aposta.numeros || '[]');
      numeros = Array.isArray(parsed) ? parsed : [];
    } catch {
      console.warn(`  Aposta ${aposta.id}: numeros inválidos, a ignorar.`);
      continue;
    }
    if (numeros.length === 0) continue;

    const cfg = JSON.parse(aposta.jogo.configuracao || '{}');
    let x = 10;
    let y = 10;
    if (aposta.jogo.dimensoesCampo) {
      try {
        const dims = JSON.parse(aposta.jogo.dimensoesCampo);
        if (dims?.x && dims?.y) { x = dims.x; y = dims.y; }
      } catch { /* ignore */ }
    }
    const letras = Array.isArray(cfg.letras) && cfg.letras.length > 0
      ? cfg.letras.map(String)
      : Array.from({ length: x }, (_, i) => String.fromCharCode(65 + i));
    const numerosPorLetra = typeof cfg.numerosPorLetra === 'number' ? cfg.numerosPorLetra : y;
    const precoQuadrado = aposta.jogo.custoQuadrado || aposta.jogo.preco || 5;

    // Verificar que a aposta ainda não foi migrada
    const jaMigrada = await prisma.participacao.count({
      where: {
        jogoId: aposta.jogoId,
        dadosVerificacao: { contains: `"migradaDeAposta":"${aposta.id}"` },
      },
    });
    if (jaMigrada > 0) {
      console.log(`  Aposta ${aposta.id}: já migrada (${jaMigrada} participações), a ignorar.`);
      continue;
    }

    for (const num of numeros) {
      const col = (num - 1) % x;
      const row = Math.floor((num - 1) / x);
      const coord = { letra: letras[col], numero: row + 1 };
      const resultado = JSON.stringify([coord]);
      const uniqueSalt = crypto.randomBytes(32).toString('hex');
      const timestamp = new Date().toISOString();
      const seed = crypto.randomBytes(32).toString('hex');
      const hash = generateHash(seed, resultado, uniqueSalt, timestamp);

      if (!DRY_RUN) {
        await prisma.participacao.create({
          data: {
            jogoId: aposta.jogoId,
            dadosParticipacao: JSON.stringify({ coordenadas: [coord] }),
            dadosVerificacao: JSON.stringify({ seed, timestamp, coordenadas: [coord], uniqueSalt, hash, migradaDeAposta: aposta.id }),
            hashParticipacao: hash,
            valorPago: precoQuadrado,
            metodoPagamento: 'dinheiro',
            estadoPagamento: 'concluido',
            nomeCliente: aposta.jogadorNome || null,
            telefoneCliente: aposta.jogadorTelefone || null,
            emailCliente: aposta.jogadorEmail || null,
            vendedorId: aposta.vendedorId || null,
            createdAt: aposta.createdAt,
          },
        });
      }
      criadas++;
    }

    const agg = jogosAtualizados.get(aposta.jogoId) || { participacoes: 0, angariado: 0 };
    agg.participacoes += numeros.length;
    agg.angariado += numeros.length * precoQuadrado;
    jogosAtualizados.set(aposta.jogoId, agg);

    console.log(`  Aposta ${aposta.id} → ${numeros.length} participações (${numeros.map((n) => {
      const c = (n - 1) % x;
      const r = Math.floor((n - 1) / x);
      return `${letras[c]}${r + 1}`;
    }).join(', ')})`);
  }

  if (!DRY_RUN) {
    for (const [jogoId, agg] of jogosAtualizados) {
      await prisma.jogo.update({
        where: { id: jogoId },
        data: {
          stockAtual: { decrement: agg.participacoes },
          totalParticipacoes: { increment: agg.participacoes },
          totalAngariado: { increment: agg.angariado },
        },
      });
    }
  }

  console.log(`\nResumo: ${criadas} participações criadas${DRY_RUN ? ' (dry-run)' : ''}.`);
  console.log('Apostas NÃO removidas (histórico preservado).');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
