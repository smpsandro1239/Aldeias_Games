import { z } from 'zod';

// Regex para números de telefone portugueses (9 dígitos starting with 9 or mobile, or landline)
const telefoneRegex = /^(?:(?:\+|00)351)?[2-9][0-9]{8}$/;

export const telefoneSchema = z.string()
  .regex(telefoneRegex, 'Número de telefone inválido (deve ser um número português válido)')
  .optional()
  .or(z.literal(''));

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
  telefone: telefoneSchema,
  role: z.enum(['user', 'vendedor', 'aldeia_admin']).default('user'),
  tipoOrganizacao: z.enum(['aldeia', 'escola', 'associacao_pais', 'clube']).optional(),
});

export const updateProfileSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  telefone: telefoneSchema,
  notificacoesEmail: z.boolean().optional(),
});

export const createUserSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Password deve ter pelo menos 8 caracteres'),
  telefone: telefoneSchema,
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
  telefone: telefoneSchema,
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
  // Novos campos para rifas e sorteio
  modoSorteio: z.enum(['app', 'externo']).default('app'),
  detalhesSorteioExterno: z.string().optional(),
  premios: z.array(z.object({
    nome: z.string().min(2),
    descricao: z.string().optional(),
    valorDinheiroAlternative: z.number().optional(),
    ordem: z.number().int().default(0),
  })).optional(),
});

export const updateJogoSchema = createJogoSchema.partial().omit({ eventoId: true });

// ============================================
// VALIDAÇÕES DE PRÉMIO
// ============================================

export const createPremioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
  imagemUrl: z.string().optional(),
  valorDinheiroAlternative: z.number().min(0).optional(),
  ordem: z.number().int().default(0),
  aldeiaId: z.string(),
  jogoId: z.string().optional(),
});

export const updatePremioSchema = createPremioSchema.partial().omit({ aldeiaId: true });

// ============================================
// VALIDAÇÕES DE PARTICIPAÇÃO
// ============================================

export const createParticipacaoSchema = z.object({
  jogoId: z.string(),
  dadosParticipacao: z.record(z.any()),
  quantidade: z.number().int().min(1).default(1),
  metodoPagamento: z.enum(['mbway', 'dinheiro', 'stripe', 'transferencia', 'saldo']),
  dadosCliente: z.object({
    nome: z.string().min(2, 'Nome é obrigatório'),
    telefone: telefoneSchema,
    email: z.string().email('Email inválido').optional().or(z.literal('')),
  }).refine(data => data.telefone || data.email, {
    message: "Deve fornecer pelo menos um telefone ou email",
    path: ["telefone"],
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
  telefone: telefoneSchema,
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
