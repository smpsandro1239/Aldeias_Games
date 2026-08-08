export interface Jogo {
  id: string;
  nome: string;
  tipo: string;
  estado: string;
}

export interface Grelha {
  id: string;
  jogoId: string;
  numero: number;
  estado: "aberta" | "preenchida" | "sorteada";
  numerosOcupados: string;
  premioDescricao: string | null;
  premioValor: number | null;
  dataFecho: string | null;
  dataSorteio: string | null;
  sorteioData: string | null;
  bloqueioData: string | null;
  numeroSorteado: number | null;
  vencedorId: string | null;
  createdAt: string;
}

export interface GrelhaWithVencedor extends Grelha {
  vencedor?: { id: string; nome: string } | null;
}

export const POLL_INTERVAL = 10000;
