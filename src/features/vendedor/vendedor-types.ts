export interface VendedorSales {
  id: string;
  valor: number;
  metodoPagamento: string;
  createdAt: string;
  jogo?: { nome: string };
  tipo?: 'aposta' | 'participacao';
}

export interface VendedorStats {
  vendasHoje: number;
  valorHoje: number;
  vendasTotal: number;
  valorTotal: number;
  comissaoTotal: number;
  aEntregar: number;
  ultimasVendas: VendedorSales[];
}

export interface SaldoAngariado {
  totalAngariado: number;
  totalEntregue: number;
  totalSolicitado: number;
  saldoAEntregar: number;
  historicoPedidos?: any[];
  historicoEntregas?: {
    id: string;
    valor: number;
    estado: string;
    dataSolicitacao: string;
    dataConclusao?: string | null;
    admin?: { nome: string } | null;
  }[];
}