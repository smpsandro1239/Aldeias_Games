import { z } from 'zod';

// Constants for validation
const TELEFONE_REGEX = /^(?:(?:\+|00)351)?[2-9][0-9]{8}$/;

function normalizePhone(value: string): string {
  if (!value) return '';
  return value
    .replace(/\s+/g, '')
    .replace(/[-().]/g, '')
    .replace(/^00/, '+')
    .trim();
}
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{12,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const passwordSchema = z.string()
  .min(12, 'Password deve ter pelo menos 12 caracteres')
  .regex(PASSWORD_REGEX, 'Password deve conter pelo menos: 1 maiúscula, 1 minúscula, 1 número e 1 carácter especial');

export const telefoneSchema = z.string()
  .transform((value) => normalizePhone(value))
  .refine((value) => !value || TELEFONE_REGEX.test(value), {
    message: 'Número de telefone inválido (deve ser um número português válido)',
  })
  .optional()
  .or(z.literal(''));

// ============================================
// VALIDAÇÕES DE UTILIZADOR
// ============================================

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Password é obrigatória'),
  totpCode: z.string().length(6, 'Código 2FA deve ter 6 dígitos').optional(),
});

export const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: passwordSchema,
  telefone: telefoneSchema,
  role: z.enum(['user', 'vendedor', 'aldeia_admin']).default('user'),
  tipoOrganizacao: z.enum(['aldeia', 'escola', 'associacao_pais', 'clube']).optional(),
  aldeiaId: z.string().optional(),
});

export const updateProfileSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  telefone: telefoneSchema,
  notificacoesEmail: z.boolean().optional(),
  aldeiaId: z.string().optional(),
  aldeiasPermitidas: z.array(z.object({
    id: z.string(),
    nome: z.string(),
  })).optional(),
});

export const createUserSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: passwordSchema,
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
  
  // Configurações de Pagamento
  permitirStripe: z.boolean().optional(),
  permitirMBWay: z.boolean().optional(),
  iban: z.string().optional(),
  nomeTitularConta: z.string().optional(),
  avisoPagamentosEnviado: z.boolean().optional(),
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
  // Recorrência
  isRecurring: z.boolean().optional().default(false),
  recurrenceFrequency: z.enum(['semanal', 'quinzenal', 'mensal']).optional(),
  recurrenceDayOfWeek: z.number().min(0).max(6).optional(),
  recurrenceTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  maxOccurrences: z.number().min(1).optional(),
});

export const updateEventoSchema = createEventoSchema.partial().omit({ aldeiaId: true });

// ============================================
// VALIDAÇÕES DE JOGO
// ============================================

const baseJogoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  tipo: z.enum(['poio_da_vaca', 'rifa', 'raspadinha', 'euromilhoes']),
  descricao: z.string().optional(),
  configuracao: z.record(z.any()),
  preco: z.number().min(0.5, 'Preço mínimo é 0.50€'),
  stockInicial: z.number().int().min(1, 'Stock deve ser pelo menos 1'),
  limitePorUsuario: z.number().int().min(1).default(10),
  eventoId: z.string(),
  estado: z.enum(['aberto', 'fechado', 'suspenso']).default('aberto'),
  modoSorteio: z.enum(['app', 'externo']).default('app'),
  detalhesSorteioExterno: z.string().optional(),
  premios: z.array(z.object({
    nome: z.string().min(2),
    descricao: z.string().optional(),
    valorDinheiroAlternative: z.number().optional(),
    percentagem: z.number().min(0).max(100).optional(),
    ordem: z.number().int().default(0),
  })).optional(),
  custoQuadrado: z.number().optional(),
  valorMercadoVaca: z.number().optional(),
  valorCompraVaca: z.number().optional(),
  dimensoesCampo: z.string().optional(),
  valorPremioVaca: z.number().optional(),
  custoPremioDinheiro: z.number().optional(),
  premioId: z.string().optional(),
});

export const createJogoSchema = baseJogoSchema
  .refine((data) => {
    // Validação específica para raspadinha: soma das percentagens <= 100%
    if (data.tipo === 'raspadinha' && data.premios && data.premios.length > 0) {
      const totalPercentagem = data.premios.reduce((sum, p) => sum + (p.percentagem || 0), 0);
      if (totalPercentagem > 100) {
        return false;
      }
    }
    return true;
  }, {
    message: 'A soma das percentagens dos prémios não pode exceder 100%',
    path: ['premios'],
  })
  .refine((data) => {
    // Validação específica para rifa: intervalo numérico válido
    if (data.tipo === 'rifa') {
      const config = data.configuracao as any;
      const numeroInicial = config?.numeroInicial;
      const numeroFinal = config?.numeroFinal;
      if (typeof numeroInicial === 'number' && typeof numeroFinal === 'number') {
        if (numeroFinal <= numeroInicial) {
          return false;
        }
        const intervalo = numeroFinal - numeroInicial + 1;
        if (intervalo < data.stockInicial) {
          return false;
        }
      }
    }
    return true;
  }, {
    message: 'Para rifa: número final deve ser maior que inicial e o stock deve caber no intervalo',
    path: ['configuracao'],
  });

export const updateJogoSchema = baseJogoSchema.partial().omit({ eventoId: true });

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
  grelhaId: z.string().optional(),
  numerosSelecionados: z.array(z.number().int().min(1).max(50)).min(1).max(50).optional(),
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

export const commitSorteioSchema = z.object({
  jogoId: z.string(),
});

export const revealSorteioSchema = z.object({
  jogoId: z.string(),
  seedRevelada: z.string(), // A seed que o admin revelou
});

// ============================================
// VALIDAÇÕES DE NOTIFICAÇÃO
// ============================================

export const createNotificacaoSchema = z.object({
  tipo: z.enum(['sistema', 'pagamento', 'sorteio', 'premio', 'campanha', 'alerta', 'deposito_criado', 'deposito_confirmado', 'deposito_rejeitado']),
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
