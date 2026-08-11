export type EliminacaoTipo = 'jogo' | 'evento' | 'aldeia';

export const ELIMINACAO_LABELS: Record<EliminacaoTipo, string> = {
  jogo: 'Jogo',
  evento: 'Evento',
  aldeia: 'Aldeia',
};

export const ELIMINACAO_TIPOS: EliminacaoTipo[] = ['jogo', 'evento', 'aldeia'];
