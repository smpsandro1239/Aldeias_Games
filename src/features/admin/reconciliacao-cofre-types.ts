export interface VendedorRec {
  id: string;
  nome: string;
  email: string;
  saldoCashbox: number;
  totalRecebido: number;
  totalDepositado: number;
  saldoEsperado: number;
  discrepancia: number;
  transacoes: Array<{
    id: string;
    tipo: string;
    valor: number;
    descricao: string;
    createdAt: string;
    referencia: string | null;
  }>;
}

export interface PendenteItem {
  id: string;
  valor: number;
  descricao: string | null;
  estado: string;
  createdAt: string;
  vendedor: { id: string; nome: string };
}

export interface AldeiaResumo {
  id: string;
  nome: string;
  saldoCofre: number;
  totalDepositado: number;
  numVendedores: number;
}
