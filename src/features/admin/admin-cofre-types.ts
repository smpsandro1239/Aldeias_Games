export interface DepositoData {
  id: string;
  valor: number;
  descricao: string | null;
  estado: string;
  createdAt: string;
  confirmadoAt: string | null;
  vendedor: { id: string; nome: string };
  criadoPor: { id: string; nome: string };
  confirmadoPor: { id: string; nome: string } | null;
}

export interface VaultData {
  saldo: number;
}

export interface VaultTransacao {
  id: string;
  tipo: string;
  valor: number;
  descricao: string;
  estado: string;
  dataCriacao: string;
  criadoPor: { id: string; nome: string };
  aprovadoPor: { nome: string } | null;
  observacoes: string | null;
}

export interface Levantamento {
  id: string;
  valor: number;
  descricao: string;
  estado: string;
  dataCriacao: string;
  dataAprovacao: string | null;
  observacoes: string | null;
  criadoPor: { id: string; nome: string; email: string };
  aprovadoPor: { nome: string } | null;
}
