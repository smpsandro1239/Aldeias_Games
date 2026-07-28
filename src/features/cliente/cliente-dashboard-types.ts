"use client";

export interface Participacao {
  id: string;
  dadosParticipacao: string;
  valorPago: number;
  estadoPagamento: string;
  revelado: boolean;
  resultadoRaspe?: string;
  hashRaspe?: string;
  seedRaspe?: string;
  hashParticipacao?: string;
  ganhador: boolean;
  createdAt: string;
  jogo?: {
    id: string;
    nome: string;
    tipo: string;
    preco: number;
    sorteado: boolean;
    dataSorteio?: string;
    premioId?: string;
    configuracao?: Record<string, unknown>;
    evento?: {
      nome: string;
      aldeia?: { nome: string };
    };
    premios?: Array<{
      id: string;
      nome: string;
      ordem: number;
    }>;
  };
  premio?: {
    id: string;
    nome: string;
  };
}

export interface Jogo {
  id: string;
  nome: string;
  tipo: "poio_da_vaca" | "rifa" | "euromilhoes" | "raspadinha";
  descricao?: string;
  preco: number;
  stockAtual: number;
  configuracao: Record<string, unknown>;
  evento?: {
    nome: string;
    aldeia?: { nome: string };
  };
  premio?: { nome: string };
}

export interface UserProfile {
  role: string;
  aldeiaId?: string;
  aldeia?: { nome: string };
  nome?: string;
  email?: string;
  telefone?: string;
}
