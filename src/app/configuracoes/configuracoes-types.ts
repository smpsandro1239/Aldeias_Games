"use client";

export interface Aldeia {
  id: string;
  nome: string;
  slug: string;
  telefone?: string;
  email?: string;
  permitirStripe: boolean;
  permitirMBWay: boolean;
  metodosPagamentoDefault?: string;
  metodosPagamentoAceites?: string;
  iban?: string;
  nomeTitularConta?: string;
  avisoPagamentosEnviado: boolean;
}

export interface MetodoPagamentoDefault {
  saldo: boolean;
  dinheiro: boolean;
  mbway: boolean;
  stripe: boolean;
  transferencia: boolean;
}

export interface MetodosAceitesState {
  dinheiro: boolean;
  saldo: boolean;
  mbway: boolean;
  stripe: boolean;
  transferencia: boolean;
  vendedor: boolean;
}
