// @ts-ignore
import { Prisma, Jogo, Evento } from '@prisma/client';

export type JogoWithEvento = Jogo & { evento: Evento };

export interface ParticipacaoRequestData {
  numeros?: number[];
  valor?: number;
  quantidade?: number;
  dadosParticipacao?: Record<string, unknown>;
  numerosSelecionados?: number[];
  grelhaId?: string;
  jogoId?: string;
  [key: string]: unknown;
}

export interface GameHandler {
  validate?(data: ParticipacaoRequestData, jogo: JogoWithEvento): void | Promise<void>;
  validateInTransaction?(tx: Prisma.TransactionClient, data: ParticipacaoRequestData, jogo: JogoWithEvento): Promise<void>;
  prepareData(data: ParticipacaoRequestData, jogo: JogoWithEvento, existing: any[]): Record<string, unknown>;
  postCreate?(tx: Prisma.TransactionClient, data: ParticipacaoRequestData, jogo: JogoWithEvento, participacoes: any[]): Promise<void>;
}
