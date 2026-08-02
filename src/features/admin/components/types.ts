// Tipos partilhados do AdminDashboard
export interface Stats {
  totalEventos: number;
  eventosAtivos: number;
  totalJogos: number;
  jogosAtivos: number;
  totalParticipacoes: number;
  totalAngariado: number;
}

export type EstadoEvento = 'rascunho' | 'ativo' | 'pausado' | 'finalizado' | 'cancelado';

export type Recorrencia = 'semanal' | 'quinzenal' | 'mensal';

export interface Evento {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  imagemUrl?: string;
  imagemBase64?: string;
  
  dataInicio: Date;
  dataFim: Date;
  
  objectivoAngariacao?: number;
  estado: EstadoEvento;
  publico: boolean;
  
  // Template / Recorrência
  isTemplate?: boolean;
  templateNome?: string;
  frequenciaRecorrencia?: Recorrencia;
  diaSemanaRecorrencia?: number; // 0=Domingo, 1=Segunda, etc
  proximaData?: Date;
  
  // Estatísticas
  totalAngariado: number;
  totalParticipacoes: number;
  
  // Relações
  aldeiaId: string;
  aldeia?: Aldeia;
  jogos?: Jogo[];
  
  createdAt: Date;
  updatedAt: Date;
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
    id?: string;
    nome: string;
    aldeia?: {
      id?: string;
      nome: string;
      slug?: string;
    };
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
  vaultPinEnabled?: boolean;
  comissaoAtiva?: boolean;
  // ... outros campos
}

export interface Vencedor {
  id: string;
  jogo?: {
    id?: string;
    nome?: string;
    tipo?: string;
    preco?: number;
    evento?: {
      id?: string;
      nome?: string;
      aldeia?: {
        id?: string;
        nome?: string;
      };
    };
    premios?: {
      id?: string;
      nome?: string;
      ordem?: number;
      valorDinheiroAlternative?: number | null;
    }[];
  };
  nomeCliente?: string;
  telefoneCliente?: string;
  emailCliente?: string;
  user?: {
    id?: string;
    nome?: string;
    email?: string;
    telefone?: string;
    saldo?: number;
  };
  participacaoId?: string;
  createdAt: string;
  premioEntregue: boolean;
  ganhador?: boolean;
  valorPago?: number;
  metodoPagamento?: string;
  estadoPagamento?: string;
  resultadoRaspe?: string | null;
  dadosParticipacao?: string | null;
  alteracoes?: {
    id?: string;
    tipoAlteracao?: string;
    motivo?: string | null;
    dadosAnteriores?: string | null;
    createdAt?: string;
    user?: {
      id?: string;
      nome?: string;
      email?: string;
    };
  }[];
  dadosVencedor?: {
    userId?: string;
    userNome?: string;
    userEmail?: string;
    userTelefone?: string;
    letra?: number;
    numero?: number;
  };
}

export interface Aldeia {
  id: string;
  nome: string;
  tipoOrganizacao: string;
  email?: string;
  slug?: string;
  logoUrl?: string;
  metodosPagamentoDefault?: string;
  metodosPagamentoAceites?: string;
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
  tipo: 'acesso' | 'audit';
  action?: string;
  resource?: string;
  resourceId?: string;
  metadata?: unknown;
  user?: { nome: string; role: string } | null;
}

export interface VendedorStats {
  id: string;
  nome: string;
  totalVendas: number;
  // ... outros campos de estatísticas
}

export interface Premio {
  id: string;
  nome: string;
  descricao?: string;
  imagemUrl?: string;
  valorDinheiroAlternative?: number;
  percentagem?: number;
  ordem?: number;
  createdAt: Date;
  updatedAt: Date;
  aldeiaId: string;
  jogoId?: string;
  aldeia?: Aldeia;
  jogo?: Jogo;
}

