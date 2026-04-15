export type MetodoPagamento = 'mbway' | 'dinheiro' | 'stripe' | 'transferencia' | 'saldo';

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
};

export interface AldeiaSettings {
  permitirStripe?: boolean;
  permitirMBWay?: boolean;
}

export function getAvailableMethods(
  userRole: string | null | undefined, 
  aldeiaSettings?: AldeiaSettings
): MetodoPagamento[] {
  // Regular users (players) can only use saldo, mbway, stripe - NOT dinheiro
  // Only vendedor, aldeia_admin, and super_admin can use dinheiro (for door-to-door sales)
  if (userRole === 'super_admin') {
    return ['dinheiro', 'saldo', 'mbway', 'stripe'];
  }
  
  if (userRole === 'aldeia_admin' && aldeiaSettings) {
    const methods = ['dinheiro', 'saldo'];
    if (aldeiaSettings.permitirMBWay) methods.push('mbway');
    if (aldeiaSettings.permitirStripe) methods.push('stripe');
    return methods;
  }
  
  if (userRole === 'vendedor') {
    return ['dinheiro', 'saldo', 'mbway', 'stripe'];
  }
  
  // For regular users and any other roles: only saldo, mbway, stripe (NO dinheiro)
  const methods = ['saldo'];
  if (aldeiaSettings?.permitirMBWay !== false) methods.push('mbway'); // MBWay allowed by default unless explicitly disabled
  if (aldeiaSettings?.permitirStripe !== false) methods.push('stripe'); // Stripe allowed by default unless explicitly disabled
  return methods;
}

export function formatCommission(method: MetodoPagamento): string {
  return PAYMENT_COMMISSIONS[method].label;
}

export function hasCommission(method: MetodoPagamento): boolean {
  return PAYMENT_COMMISSIONS[method].percent > 0;
}

export function calculateCommission(amount: number, method: MetodoPagamento): number {
  const commission = PAYMENT_COMMISSIONS[method];
  return (amount * commission.percent / 100) + commission.fixed;
}
