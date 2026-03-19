import { z } from 'zod';

// ============================================
// VALIDAÇÕES DE UTILIZADOR
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Password deve ter pelo menos 8 caracteres'),
});

export const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Password deve ter pelo menos 8 caracteres'),
  telefone: z.string().optional(),
  role: z.enum(['user', 'vendedor', 'aldeia_admin']).default('user'),
  tipoOrganizacao: z.enum(['aldeia', 'escola', 'associacao_pais', 'clube']).optional(),
});

export const updateProfileSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  telefone: z.string().optional(),
  notificacoesEmail: z.boolean().optional(),
});

export const createUserSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Password deve ter pelo menos 8 caracteres'),
  telefone: z.string().optional(),
  role: z.enum(['super_admin', 'aldeia_admin', 'vendedor', 'user']),
  aldeiaId: z.string().optional(),
});

// ============================================
// VALIDAÇÕES DE ALDEIA/ORGANIZAÇÃO
// ============================================

export const createAldeiaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  tipoOrganizacao: z.enum(['aldeia', 'escola', 'associacao_pais', 'clube']).default('aldeia'),
  descricao: z.string().optional(),
  logoBase64: z.string().optional(),
  
  // Campos de escola
  nomeEscola: z.string().optional(),
  codigoEscola: z.string().optional(),
  nivelEnsino: z.enum(['pre_escolar', 'primeiro_ciclo', 'segundo_ciclo', 'terceiro_ciclo', 'secundario', 'superior']).optional(),
  
  // Contactos
  responsavel: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  morada: z.string().optional(),
  codigoPostal: z.string().optional(),
  localidade: z.string().optional(),
  
  // Conformidade legal
  autorizacaoCM: z.boolean().default(false),
  numeroAlvara: z.string().optional(),
});

export const updateAldeiaSchema = createAldeiaSchema.partial();

// ============================================
// VALIDAÇÕES DE EVENTO
// ============================================

export const createEventoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
  imagemBase64: z.string().optional(),
  dataInicio: z.string().or(z.date()),
  dataFim: z.string().or(z.date()),
  objectivoAngariacao: z.number().min(0).optional(),
  estado: z.enum(['rascunho', 'ativo', 'pausado', 'finalizado', 'cancelado']).default('rascunho'),
  publico: z.boolean().default(false),
  aldeiaId: z.string(),
});

export const updateEventoSchema = createEventoSchema.partial().omit({ aldeiaId: true });

// ============================================
// VALIDAÇÕES DE JOGO
// ============================================

export const createJogoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  tipo: z.enum(['poio_da_vaca', 'rifa', 'tombola', 'raspadinha']),
  descricao: z.string().optional(),
  configuracao: z.record(z.any()),
  preco: z.number().min(0.5, 'Preço mínimo é 0.50€'),
  stockInicial: z.number().int().min(1, 'Stock deve ser pelo menos 1'),
  limitePorUsuario: z.number().int().min(1).default(10),
  eventoId: z.string(),
  premioId: z.string().optional(),
});

export const updateJogoSchema = createJogoSchema.partial().omit({ eventoId: true });

// ============================================
// VALIDAÇÕES DE PRÉMIO
// ============================================

export const createPremioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
  imagemUrl: z.string().optional(),
  valorEstimado: z.number().min(0).optional(),
  tipo: z.enum(['dinheiro', 'fisico', 'experiencia']).default('fisico'),
  percentagem: z.number().min(0).max(1).optional(),
  quantidade: z.number().int().min(0).optional(),
  aldeiaId: z.string(),
});

export const updatePremioSchema = createPremioSchema.partial().omit({ aldeiaId: true });

// ============================================
// VALIDAÇÕES DE PARTICIPAÇÃO
// ============================================

export const createParticipacaoSchema = z.object({
  jogoId: z.string(),
  dadosParticipacao: z.record(z.any()),
  quantidade: z.number().int().min(1).default(1),
  metodoPagamento: z.enum(['mbway', 'dinheiro', 'stripe', 'transferencia']),
  dadosCliente: z.object({
    nome: z.string(),
    telefone: z.string(),
    email: z.string().email().optional(),
  }).optional(),
});

export const revelarRaspadinhaSchema = z.object({
  participacaoId: z.string(),
});

// ============================================
// VALIDAÇÕES DE SORTEIO
// ============================================

export const executarSorteioSchema = z.object({
  jogoId: z.string(),
  observacoes: z.string().optional(),
});

// ============================================
// VALIDAÇÕES DE NOTIFICAÇÃO
// ============================================

export const createNotificacaoSchema = z.object({
  tipo: z.enum(['sistema', 'pagamento', 'sorteio', 'premio', 'campanha', 'alerta']),
  titulo: z.string().min(1, 'Título é obrigatório'),
  mensagem: z.string().min(1, 'Mensagem é obrigatória'),
  dados: z.record(z.any()).optional(),
  userId: z.string(),
});

// ============================================
// VALIDAÇÕES DE PAGAMENTO
// ============================================

export const mbwayPaymentSchema = z.object({
  telefone: z.string().regex(/^\+3519\d{8}$/, 'Número de telefone inválido (formato: +3519XXXXXXXX)'),
  valor: z.number().min(0.5),
  descricao: z.string().optional(),
});

export const stripePaymentSchema = z.object({
  valor: z.number().min(0.5),
  descricao: z.string(),
  metadata: z.record(z.string()).optional(),
});

// ============================================
// VALIDAÇÕES DE BACKUP
// ============================================

export const restoreBackupSchema = z.object({
  filename: z.string(),
});

// ============================================
// TIPOS INFERIDOS
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateAldeiaInput = z.infer<typeof createAldeiaSchema>;
export type CreateEventoInput = z.infer<typeof createEventoSchema>;
export type CreateJogoInput = z.infer<typeof createJogoSchema>;
export type CreatePremioInput = z.infer<typeof createPremioSchema>;
export type CreateParticipacaoInput = z.infer<typeof createParticipacaoSchema>;
export type MbwayPaymentInput = z.infer<typeof mbwayPaymentSchema>;
export type StripePaymentInput = z.infer<typeof stripePaymentSchema>;
