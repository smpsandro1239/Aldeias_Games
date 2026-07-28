"use client";

export interface JogoEuromilhoes {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  stockInicial: number;
  stockAtual: number;
  totalAngariado: number;
  totalParticipacoes: number;
  configuracao?: unknown;
  evento?: { nome: string; aldeia?: { nome: string } };
  premios?: Array<{ id: string; nome: string; descricao?: string }>;
}

export interface Grelha {
  id: string;
  numero: number;
  estado: string;
  numerosOcupados: string;
  premioDescricao?: string;
  premioValor?: number;
  dataSorteio?: string;
  sorteioData?: string;
  bloqueioData?: string;
  createdAt: string;
}

export const MAX_NUMEROS = 50;
export const TOTAL_NUMEROS = 50;
export const RANDOM_OPTIONS = [1, 2, 3, 4, 5];
