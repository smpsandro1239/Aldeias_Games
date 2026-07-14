import { Prisma, Jogo, Evento } from '@prisma/client';

export type JogoWithEvento = Jogo & { evento: Evento };

export interface GameHandler {
  validate?(data: any, jogo: JogoWithEvento): void | Promise<void>;
  prepareData(data: any, jogo: JogoWithEvento, existing: any[]): Record<string, unknown>;
  postCreate?(tx: Prisma.TransactionClient, data: any, jogo: JogoWithEvento, participacoes: any[]): Promise<void>;
}
