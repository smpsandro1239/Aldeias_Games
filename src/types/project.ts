/**
 * Tipos centralizados do projeto Aldeias Games
 */

// ============================================
// TIPOS DE UTILIZADOR
// ============================================

export type UserRole = 'super_admin' | 'aldeia_admin' | 'vendedor' | 'user';

export interface User {
  id: string;
  email: string;
  nome: string;
  telefone?: string;
  role: UserRole;
  emailVerificado: boolean;
  notificacoesEmail: boolean;
  ultimoLogin?: Date;
  aldeiaId?: string;
  aldeia?: Aldeia;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithStats extends User {
  totalParticipacoes: number;
  totalGasto: number;
  totalGanho: number;
}

// ============================================
// TIPOS DE ALDEIA/ORGANIZAÇÃO
// ============================================

export type TipoOrganizacao = 'aldeia' | 'escola' | 'associacao_pais' | 'clube';
export type NivelEnsino = 'pre_escolar' | 'primeiro_ciclo' | 'segundo_ciclo' | 'terceiro_ciclo' | 'secundario' | 'superior';

export interface Aldeia {
  id: string;
  nome: string;
  slug: string;
  tipoOrganizacao: TipoOrganizacao;
  descricao?: string;
  logoUrl?: string;
  logoBase64?: string;
  
  // Campos de escola
  nomeEscola?: string;
  codigoEscola?: string;
  nivelEnsino?: NivelEnsino;
  
  // Contactos
  responsavel?: string;
  telefone?: string;
  email?: string;
  morada?: string;
  codigoPostal?: string;
  localidade?: string;
  
  // Conformidade legal
  autorizacaoCM: boolean;
  numeroAlvara?: string;
  documentosVerificados: boolean;
  
  // Estado
  ativo: boolean;
  verificado: boolean;
  dataVerificacao?: Date;
  
  // Plano SaaS
  planoId?: string;
  plano?: Plano;
  dataInicioPlano?: Date;
  dataFimPlano?: Date;
  
  // Relações
  eventos?: Evento[];
  premios?: Premio[];
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// TIPOS DE PLANO (SaaS)
// ============================================

export interface Plano {
  id: string;
  nome: string;
  descricao?: string;
  precoMensal: number;
  maxEventos: number;
  maxJogos: number;
  maxParticipacoes: number;
  maxVendedores: number;
  recursos?: Record<string, unknown>;
  stripePriceId?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// TIPOS DE EVENTO
// ============================================

export type EstadoEvento = 'rascunho' | 'ativo' | 'pausado' | 'finalizado' | 'cancelado';

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

// ============================================
// TIPOS DE JOGO
// ============================================

export type TipoJogo = 'poio_da_vaca' | 'rifa' | 'tombola' | 'raspadinha';
export type EstadoJogo = 'rascunho' | 'aberto' | 'pausado' | 'fechado' | 'finalizado';

export interface Jogo {
  id: string;
  nome: string;
  tipo: TipoJogo;
  descricao?: string;
  configuracao: Record<string, unknown>;
  
  preco: number;
  stockInicial: number;
  stockAtual: number;
  limitePorUsuario: number;
  
  estado: EstadoJogo;
  dataAbertura?: Date;
  dataFecho?: Date;
  
  // Estatísticas
  totalParticipacoes: number;
  totalAngariado: number;
  
  // Sorteio
  sorteado: boolean;
  dataSorteio?: Date;
  
  // Relações
  eventoId: string;
  evento?: Evento;
  premioId?: string;
  premio?: Premio;
  participacoes?: Participacao[];
  
  createdAt: Date;
  updatedAt: Date;
}

// Configurações específicas por tipo de jogo
export interface ConfigPoioDaVaca {
  letras: string[];
  numerosPorLetra: number;
  precos: {
    individual: number;
    cartao: number;
  };
}

export interface ConfigRifa {
  numeroInicial: number;
  numeroFinal: number;
}

export interface ConfigRaspadinha {
  premios: {
    nome: string;
    tipo: 'dinheiro' | 'fisico';
    percentagem: number;
    valor: number;
  }[];
  semPremioPercentagem: number;
}

// ============================================
// TIPOS DE PRÉMIO
// ============================================

export type TipoPremio = 'dinheiro' | 'fisico' | 'experiencia';

export interface Premio {
  id: string;
  nome: string;
  descricao?: string;
  imagemUrl?: string;
  valorEstimado?: number;
  tipo: TipoPremio;
  percentagem?: number;
  quantidade?: number;
  
  // Relações
  aldeiaId: string;
  aldeia?: Aldeia;
  jogos?: Jogo[];
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// TIPOS DE PARTICIPAÇÃO
// ============================================

export type MetodoPagamento = 'mbway' | 'dinheiro' | 'stripe' | 'transferencia' | 'saldo';
export type EstadoPagamento = 'pendente' | 'processando' | 'concluido' | 'falhou' | 'reembolsado';

export interface Participacao {
  id: string;
  dadosParticipacao: {
    numero?: number;
    letra?: string;
    coordenadas?: { letra: string; numero: number }[];
  };
  
  // Pagamento
  valorPago: number;
  metodoPagamento: MetodoPagamento;
  estadoPagamento: EstadoPagamento;
  referenciaPagamento?: string;
  dataPagamento?: Date;
  
  // Raspadinha
  seedRaspe?: string;
  hashRaspe?: string;
  resultadoRaspe?: string;
  revelado: boolean;
  dataRevelacao?: Date;
  
  // Vendedor
  vendedorId?: string;
  vendedor?: User;
  
  // Sorteio
  ganhador: boolean;
  premioEntregue: boolean;
  
  // Relações
  jogoId: string;
  jogo?: Jogo;
  userId: string;
  user?: User;
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// TIPOS DE SORTEIO
// ============================================

export interface Sorteio {
  id: string;
  seed: string;
  hash: string;
  resultado: Record<string, unknown>;
  observacoes?: string;
  
  // Relações
  jogoId: string;
  jogo?: Jogo;
  vencedores?: VencedorSorteio[];
  
  createdAt: Date;
}

export interface VencedorSorteio {
  id: string;
  posicao: number;
  dadosVencedor: Record<string, unknown>;
  premioEntregue: boolean;
  
  // Relações
  sorteioId: string;
  sorteio?: Sorteio;
  
  createdAt: Date;
}

// ============================================
// TIPOS DE NOTIFICAÇÃO
// ============================================

export type TipoNotificacao = 'sistema' | 'pagamento' | 'sorteio' | 'premio' | 'campanha' | 'alerta';

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  dados?: Record<string, unknown>;
  lida: boolean;
  
  // Relações
  userId: string;
  user?: User;
  
  createdAt: Date;
}

// ============================================
// TIPOS DE VENDA
// ============================================

export interface Venda {
  id: string;
  valor: number;
  comissao: number;
  metodoPagamento: MetodoPagamento;
  dadosCliente?: {
    nome: string;
    telefone: string;
    email?: string;
  };
  
  // Relações
  vendedorId: string;
  vendedor?: User;
  
  createdAt: Date;
}

// ============================================
// TIPOS DE LOG
// ============================================

export interface LogAcesso {
  id: string;
  userId?: string;
  email: string;
  sucesso: boolean;
  ip: string;
  userAgent: string;
  motivo?: string;
  
  // Relações
  user?: User;
  
  createdAt: Date;
}

// ============================================
// TIPOS DE DASHBOARD/ESTATÍSTICAS
// ============================================

export interface DashboardStats {
  // Gerais
  totalEventos: number;
  eventosAtivos: number;
  totalJogos: number;
  jogosAtivos: number;
  totalParticipacoes: number;
  totalAngariado: number;
  
  // Evolução mensal
  evolucaoMensal: {
    mes: string;
    valor: number;
    participacoes: number;
  }[];
  
  // Top vendedores
  topVendedores: {
    id: string;
    nome: string;
    totalVendas: number;
    valorTotal: number;
  }[];
  
  // Por evento
  porEvento: {
    eventoId: string;
    eventoNome: string;
    participacoes: number;
    angariado: number;
  }[];
}

export interface VendedorStats {
  vendasHoje: number;
  valorHoje: number;
  vendasTotal: number;
  valorTotal: number;
  comissaoTotal: number;
  ultimasVendas: Venda[];
}

// ============================================
// TIPOS DE PAGAMENTO
// ============================================

export interface MbwayPaymentResponse {
  success: boolean;
  transactionId?: string;
  reference?: string;
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  message?: string;
  errorCode?: string;
}

export interface StripePaymentResponse {
  success: boolean;
  sessionId?: string;
  clientSecret?: string;
  url?: string;
  message?: string;
}

// ============================================
// TIPOS DE EXPORTAÇÃO
// ============================================

export type TipoExportacao = 'participacoes' | 'vendedores' | 'eventos' | 'jogos';

// ============================================
// TIPOS DE API RESPONSE
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// ============================================
// TIPOS DE UI/FORMULÁRIOS
// ============================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TabItem {
  value: string;
  label: string;
  icon?: string;
  badge?: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface NotificationToast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}
