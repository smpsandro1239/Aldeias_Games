"use client";

export interface SetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export interface AldeiaData {
  nome: string;
  tipoOrganizacao: string;
  telefone: string;
  email: string;
  morada: string;
}

export interface EventoData {
  nome: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  objectivoAngariacao: number;
}

export interface JogoData {
  nome: string;
  tipo: string;
  descricao: string;
  preco: number;
  premioNome: string;
  premioValor: number;
  stockInicial: number;
}

export const TIPOS_ORGANIZACAO = [
  { id: "aldeia", label: "Aldeia/Freguesia" },
  { id: "escola", label: "Escola" },
  { id: "associacao_pais", label: "Associação de Pais" },
  { id: "clube", label: "Clube/Associação" },
];

export const TIPOS_JOGO = [
  { id: "rifa", label: "Rifa", desc: "Sorteio de números" },
  { id: "euromilhoes", label: "Euromilhões", desc: "Múltiplos prémios" },
  { id: "poio_da_vaca", label: "Poio da Vaca", desc: "Tabuleiro tradicional" },
  { id: "raspadinha", label: "Raspadinha", desc: "Cartões instantâneos" },
];
