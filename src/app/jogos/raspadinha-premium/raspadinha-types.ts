"use client";

export interface Prize {
  id: string;
  nome: string;
  descricao?: string | null;
  valorDinheiroAlternative?: number | null;
  imagemUrl?: string | null;
  icon?: string;
  percentagem?: number;
}

export interface Jogo {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  stockAtual: number;
  stockInicial: number;
  totalAngariado: number;
  totalParticipacoes: number;
  estado: string;
  descricao?: string;
  configuracao: {
    titulo?: string;
    subtitulo?: string;
    premioMaximo?: number;
    premios?: Prize[];
    dataSorteio?: string;
    horaSorteio?: string;
    localSorteio?: string;
  };
  premios?: Prize[];
  evento?: {
    nome: string;
    aldeia?: { nome: string };
  };
}

export interface SlotState {
  id: number;
  revealed: boolean;
  prize: Prize | null;
  scratchPercent: number;
}

export type GamePhase = "not_paid" | "payment_loading" | "paid" | "all_revealed";

export interface SlotSummaryItem {
  nome: string;
  valor: number;
  count: number;
  ids: number[];
}

export interface SlotSummary {
  items: SlotSummaryItem[];
  closestPrize: SlotSummaryItem | null;
  hasWon: boolean;
  remaining: number;
}
