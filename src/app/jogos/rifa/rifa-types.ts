"use client";

export interface JogoRifa {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  stockInicial: number;
  stockAtual: number;
  totalAngariado: number;
  totalParticipacoes: number;
  estado: string;
  configuracao: Record<string, unknown>;
  premio?: { id: string; nome: string; descricao?: string; imagemUrl?: string };
  premios?: Array<{ id: string; nome: string; descricao?: string; valorDinheiroAlternative?: number }>;
  evento?: { nome: string; aldeia?: { nome: string } };
}

export interface RifaConfig {
  numeroInicial: number;
  numeroFinal: number;
  dataSorteio?: string;
  horaSorteio?: string;
  localSorteio?: string;
  numeroBlocos: number;
  permitirStripe: boolean;
  valorPremios: number | null;
}

export const DEFAULT_CONFIG: RifaConfig = {
  numeroInicial: 1,
  numeroFinal: 1000,
  numeroBlocos: 1,
  permitirStripe: false,
  valorPremios: null,
};
