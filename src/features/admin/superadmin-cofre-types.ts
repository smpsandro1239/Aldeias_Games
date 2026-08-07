export interface AldeiaResumo {
  id: string;
  nome: string;
  slug: string;
  saldoCofre: number;
  numVendedores: number;
  totalAngariado: number;
  movimentosRecentes: Array<{
    id: string;
    tipo: string;
    valor: number;
    descricao: string;
    dataCriacao: string;
    criadoPor: { nome: string };
  }>;
}

export interface PendenteItem {
  id: string;
  valor: number;
  descricao: string | null;
  estado: string;
  createdAt: string;
  vendedor: { id: string; nome: string };
  aldeia: { id: string; nome: string };
}
