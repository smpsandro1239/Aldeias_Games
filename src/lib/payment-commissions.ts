export type MetodoPagamento = 'mbway' | 'dinheiro' | 'stripe' | 'transferencia' | 'saldo' | 'vendedor';

export const ALL_PAYMENT_METHODS: MetodoPagamento[] = ['dinheiro', 'saldo', 'mbway', 'stripe', 'transferencia', 'vendedor'];

export interface PaymentCommission {
  percent: number;
  fixed: number;
  label: string;
  description: string;
}

export const PAYMENT_COMMISSIONS: Record<MetodoPagamento, PaymentCommission> = {
  dinheiro: { 
    percent: 0, 
    fixed: 0, 
    label: 'Sem comissão',
    description: 'Pagamento em numerário, sem custos adicionais'
  },
  saldo: { 
    percent: 0, 
    fixed: 0, 
    label: 'Sem comissão',
    description: 'Usa o saldo da carteira Aldeias'
  },
  transferencia: { 
    percent: 0, 
    fixed: 0, 
    label: 'Sem comissão',
    description: 'Transferência bancária'
  },
  mbway: { 
    percent: 1.5, 
    fixed: 0.25, 
    label: '~1.5% + €0.25',
    description: 'Comissão aplicada pela rede MBWay'
  },
  stripe: { 
    percent: 2.9, 
    fixed: 0.30, 
    label: '~2.9% + €0.30',
    description: 'Comissão aplicada pela Stripe'
  },
  vendedor: { 
    percent: 0, 
    fixed: 0, 
    label: 'Sem comissão',
    description: 'Carregamento presencial com vendedor'
  },
};

export interface AldeiaSettings {
  permitirStripe?: boolean;
  permitirMBWay?: boolean;
  metodosPagamentoAceites?: string | null;
}

export function parseMetodosPagamentoAceites(metodosPagamentoAceites?: string | null): MetodoPagamento[] {
  if (!metodosPagamentoAceites) return [...ALL_PAYMENT_METHODS];
  try {
    const parsed = JSON.parse(metodosPagamentoAceites);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.filter((m: string) => ALL_PAYMENT_METHODS.includes(m as MetodoPagamento)) as MetodoPagamento[];
    }
  } catch {}
  return [...ALL_PAYMENT_METHODS];
}

export function isMethodAllowed(method: string, metodosPagamentoAceites?: string | null): boolean {
  const allowed = parseMetodosPagamentoAceites(metodosPagamentoAceites);
  return allowed.includes(method as MetodoPagamento);
}

export function getAvailableMethods(
  userRole: string | null | undefined, 
  aldeiaSettings?: AldeiaSettings
): MetodoPagamento[] {
  const aceites = parseMetodosPagamentoAceites(aldeiaSettings?.metodosPagamentoAceites);
  
  // Regular users (players) can only use saldo, mbway, stripe - NOT dinheiro or vendedor
  if (userRole === 'super_admin') {
    return aceites.filter(m => m !== 'vendedor');
  }
  
  if (userRole === 'aldeia_admin') {
    return aceites.filter(m => m !== 'vendedor');
  }
  
  if (userRole === 'vendedor') {
    return aceites.filter(m => m !== 'vendedor');
  }
  
  // For regular users and any other roles: only saldo, mbway, stripe (NO dinheiro, NO vendedor)
  return aceites.filter(m => m !== 'dinheiro' && m !== 'vendedor');
}

export function formatCommission(method: MetodoPagamento): string {
  return PAYMENT_COMMISSIONS[method].label;
}

export function hasCommission(method: MetodoPagamento): boolean {
  return PAYMENT_COMMISSIONS[method].percent > 0;
}

export function calculateCommission(amount: number, method: MetodoPagamento): number {
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }
  const commission = PAYMENT_COMMISSIONS[method];
  return (amount * commission.percent / 100) + commission.fixed;
}
