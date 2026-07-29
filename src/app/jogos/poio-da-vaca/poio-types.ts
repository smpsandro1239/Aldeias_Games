"use client";

import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

export interface ApostaConfirmada {
  id: string;
  numeros: number[];
  labels: string;
  pago: boolean;
  nome: string;
}

export interface Jogo {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  stockInicial: number;
  stockAtual: number;
  estado: string;
  descricao?: string;
  configuracao: Record<string, unknown>;
  dimensoesCampo: string | null;
  custoQuadrado: number | null;
  valorPremioVaca: number | null;
  custoPremioDinheiro: number | null;
  valorCompraVaca: number | null;
  valorMercadoVaca: number | null;
  rentabilidadePercentual: number | null;
  totalAngariado: number;
  totalParticipacoes: number;
}

export interface Aposta {
  id?: string;
  jogoId: string;
  numeros: number[];
  jogadorNome?: string | null;
  jogadorTelefone?: string | null;
  jogadorEmail?: string | null;
  jogador?: {
    nome: string;
    telefone?: string;
    email?: string;
  };
  vendedorId?: string | null;
  data?: string;
  createdAt?: string;
  pago: boolean;
  isPropria?: boolean;
}

export interface Dimensoes {
  x: number;
  y: number;
  total: number;
}

export interface JogadorForm {
  nome: string;
  telefone: string;
  email: string;
  notificacao: "whatsapp" | "email" | "nenhum";
}

export function calcularRentabilidade(
  custoQuadrado: number,
  valorMercadoVaca: number,
  valorCompraVaca: number,
  totalQuadrados: number
): number {
  if (custoQuadrado <= 0 || totalQuadrados <= 0) return 0;
  const receitaTotal = custoQuadrado * totalQuadrados;
  const custoPremio = valorCompraVaca > 0 ? valorCompraVaca : valorMercadoVaca;
  if (receitaTotal === 0) return 0;
  const lucro = receitaTotal - custoPremio;
  return Math.round((lucro / receitaTotal) * 10000) / 100;
}

export function getRentabilidadeStatus(rentabilidade: number): {
  label: string;
  cor: string;
  icon: typeof TrendingUp;
  descricao: string;
} {
  if (rentabilidade >= 50) return { label: "Excelente", cor: "text-green-400", icon: TrendingUp, descricao: "Rentabilidade muito elevada - ótimo negócio!" };
  if (rentabilidade >= 30) return { label: "Bom", cor: "text-green-300", icon: TrendingUp, descricao: "Rentabilidade boa - negócio rentável" };
  if (rentabilidade >= 10) return { label: "Aceitável", cor: "text-primary", icon: TrendingUp, descricao: "Rentabilidade moderada" };
  if (rentabilidade >= 0) return { label: "Baixo", cor: "text-orange-400", icon: AlertTriangle, descricao: "Rentabilidade baixa - margem reduzida" };
  return { label: "Negativo", cor: "text-red-400", icon: TrendingDown, descricao: "Prejuízo garantido - ajuste preços!" };
}
