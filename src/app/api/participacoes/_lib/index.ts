import { GameHandler } from './types';
import { raspadinhaHandler } from './raspadinha';
import { rifaHandler } from './rifa';
import { poioHandler } from './poio';
import { euromilhoesHandler } from './euromilhoes';

const handlers: Record<string, GameHandler> = {
  raspadinha: raspadinhaHandler,
  rifa: rifaHandler,
  poio_da_vaca: poioHandler,
  euromilhoes: euromilhoesHandler,
};

export function getGameHandler(tipo: string): GameHandler | null {
  return handlers[tipo] || null;
}
