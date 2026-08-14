import crypto from 'crypto';
import { GameHandler, JogoWithEvento, ParticipacaoRequestData } from './types';
// @ts-ignore - @prisma/client types generated at build time
import { Prisma } from '@prisma/client';

function generateSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateHash(seed: string, resultado: string, salt: string, timestamp?: string): string {
  const data = timestamp
    ? `${seed}:${resultado}:${salt}:${timestamp}`
    : `${seed}:${resultado}:${salt}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

export const rifaHandler: GameHandler = {
  async validate(data: ParticipacaoRequestData, _jogo: JogoWithEvento) {
    const numeros = data.dadosParticipacao?.numeros;
    if (!Array.isArray(numeros) || numeros.length !== data.quantidade) {
      throw new Error('Quantidade deve corresponder ao número de números selecionados');
    }
    if (new Set(numeros).size !== numeros.length) {
      throw new Error('Números duplicados na seleção');
    }
  },

  // Verificação atómica de unicidade DENTRO da transação, após o lock de stock
  // (updateMany no route). A leitura de NumeroVendido é serializada pela linha
  // do jogo locked — vendas concorrentes do mesmo número não passam. O
  // constraint @@unique([jogoId, numero]) é o backstop final (P2002).
  async validateInTransaction(
    tx: Prisma.TransactionClient,
    data: ParticipacaoRequestData,
    jogo: JogoWithEvento
  ) {
    const numeros = (data.dadosParticipacao?.numeros as number[] | undefined) || [];
    if (numeros.length === 0) return;

    const vendidos = await tx.numeroVendido.findMany({
      where: { jogoId: jogo.id, numero: { in: numeros } },
      select: { numero: true },
    });
    const ocupados = new Set(vendidos.map((v) => v.numero));
    for (const num of numeros) {
      if (ocupados.has(num)) {
        throw new Error(`O número ${num} já foi vendido`);
      }
    }
  },

  // 1 participação = 1 número. O route chama prepareData uma vez por
  // participação; `existing.length` dá o índice do número desta participação.
  // Cada participação fica com o SEU número, hash e dadosVerificacao próprios —
  // todos os números comprados têm chance de ganhar (odds corretas).
  prepareData(data: ParticipacaoRequestData, _jogo: JogoWithEvento, existing: any[] = []) {
    const numerosSelecionados = (data.dadosParticipacao?.numeros as number[] | undefined) || [];
    const index = existing.length;
    const numero = numerosSelecionados[index];
    if (numero === undefined) {
      throw new Error('Número inválido na seleção');
    }

    const resultado = JSON.stringify([numero]);
    const uniqueSalt = crypto.randomBytes(32).toString('hex');
    const timestamp = new Date().toISOString();
    const seed = generateSeed();
    const hash = generateHash(seed, resultado, uniqueSalt, timestamp);

    return {
      hashParticipacao: hash,
      dadosParticipacao: JSON.stringify({ numero }),
      dadosVerificacao: JSON.stringify({ seed, timestamp, numero, uniqueSalt, hash }),
    };
  },

  async postCreate(
    tx: Prisma.TransactionClient,
    data: ParticipacaoRequestData,
    _jogo: JogoWithEvento,
    participacoes: any[]
  ) {
    const numeros = (data.dadosParticipacao?.numeros as number[] | undefined) || [];
    if (numeros.length === 0 || participacoes.length === 0) return;

    // Liga cada participação ao seu número; @@unique([jogoId, numero]) garante
    // que um número só é vendido uma vez (falha a transação inteira se houver
    // conflito de corrida — o stock e o saldo debitados revertem).
    await tx.numeroVendido.createMany({
      data: participacoes.map((p, i) => ({
        jogoId: data.jogoId!,
        numero: numeros[i],
        participacaoId: p.id,
      })),
    });
  },
};
