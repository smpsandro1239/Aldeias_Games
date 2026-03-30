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
  const baseMethods: MetodoPagamento[] = ['dinheiro', 'saldo'];
  
  if (userRole === 'super_admin') {
    return [...baseMethods, 'mbway', 'stripe'];
  }
  
  if (userRole === 'aldeia_admin' && aldeiaSettings) {
    if (aldeiaSettings.permitirMBWay) baseMethods.push('mbway');
    if (aldeiaSettings.permitirStripe) baseMethods.push('stripe');
    return baseMethods;
  }
  
  return baseMethods;
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
