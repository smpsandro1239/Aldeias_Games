// Tipos partilhados do AdminDashboard
export interface Stats {
  totalEventos: number;
  eventosAtivos: number;
  totalJogos: number;
  jogosAtivos: number;
  totalParticipacoes: number;
  totalAngariado: number;
}

export interface Evento {
  id: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  estado: string;
  totalAngariado?: number;
  descricao?: string;
  publico?: boolean;
  // ... outros campos conforme API
}

export interface Jogo {
  id: string;
  nome: string;
  tipo: string;
  estado: string;
  preco: number;
  precoBase?: number;
  eventoId: string;
  evento?: {
    nome: string;
  };
  configuracao?: string;
  stockInicial?: number;
  // ... outros campos
}

export interface User {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: string;
  aldeiaId?: string;
  // ... outros campos
}

export interface Vencedor {
  id: string;
  jogo?: {
    nome: string;
  };
  nomeCliente?: string;
  telefoneCliente?: string;
  user?: {
    nome: string;
    telefone?: string;
  };
  premioEntregue: boolean;
  createdAt: string;
  // ... outros campos
}

export interface Aldeia {
  id: string;
  nome: string;
  tipoOrganizacao: string;
  email: string;
  slug?: string;
  logoUrl?: string;
  metodosPagamentoDefault?: string;
  // ... outros campos
}

export interface Transacao {
  id: string;
  tipo: string;
  descricao?: string;
  valor: number;
  estado?: string;
  metodoPagamento?: string;
  user?: {
    nome: string;
    email: string;
  };
  userId?: string;
  createdAt: string;
}

export interface Log {
  id: string;
  email: string;
  ip: string;
  userAgent: string;
  sucesso: boolean;
  motivo?: string;
  createdAt: string;
}

export interface VendedorStats {
  id: string;
  nome: string;
  totalVendas: number;
  // ... outros campos de estatísticas
}

