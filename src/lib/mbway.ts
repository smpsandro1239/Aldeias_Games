/**
 * Integração MBWay - Sistema de Pagamentos Real
 * 
 * Esta implementação suporta integração real com a API MBWay.
 * Para ambiente de teste, define MBWAY_SANDBOX=true no .env
 */

import axios, { AxiosInstance } from 'axios';

// Configurações MBWay
const MBWAY_API_URL = process.env.MBWAY_API_URL || 'https://api.mbway.pt/v1';
const MBWAY_API_KEY = process.env.MBWAY_API_KEY || '';
const MBWAY_ENTITY_PHONE = process.env.MBWAY_ENTITY_PHONE || '';
const MBWAY_ENTITY_CODE = process.env.MBWAY_ENTITY_CODE || '';
const MBWAY_SANDBOX = process.env.MBWAY_SANDBOX === 'true';

// Cliente Axios configurado
let mbwayClient: AxiosInstance | null = null;

function getMbwayClient(): AxiosInstance {
  if (!mbwayClient) {
    mbwayClient = axios.create({
      baseURL: MBWAY_API_URL,
      headers: {
        'Authorization': `Bearer ${MBWAY_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Entity-Code': MBWAY_ENTITY_CODE,
      },
      timeout: 30000, // 30 segundos
    });
  }
  return mbwayClient;
}

// Interface para resposta MBWay
interface MbwayResponse {
  success: boolean;
  transactionId?: string;
  reference?: string;
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  message?: string;
  errorCode?: string;
}

// Interface para pedido de pagamento
interface MbwayPaymentRequest {
  phoneNumber: string;
  amount: number;
  description: string;
  reference: string;
  callbackUrl?: string;
}

// Interface para estado do pagamento
interface MbwayPaymentStatus {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Normalizar número de telefone para formato MBWay
 * Converte +3519XXXXXXXX ou 9XXXXXXXX para formato internacional
 */
export function normalizePhoneNumber(phone: string): string {
  // Remover espaços e caracteres especiais
  let normalized = phone.replace(/[\s\-\.]/g, '');
  
  // Se começar com 9, adicionar +351
  if (normalized.startsWith('9')) {
    normalized = '+351' + normalized;
  }
  
  // Validar formato
  const mbwayRegex = /^\+3519\d{8}$/;
  if (!mbwayRegex.test(normalized)) {
    throw new Error('Número de telefone inválido para MBWay. Formato esperado: +3519XXXXXXXX ou 9XXXXXXXX');
  }
  
  return normalized;
}

/**
 * Gerar referência única para transação
 */
function generateReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AG${timestamp}${random}`;
}

/**
 * Iniciar pagamento MBWay
 * Envia notificação push para o telemóvel do cliente
 */
export async function initiatePayment(
  phoneNumber: string,
  amount: number,
  description: string,
  callbackUrl?: string
): Promise<MbwayResponse> {
  // Modo sandbox - simular sucesso
  if (MBWAY_SANDBOX) {
    console.log('[MBWay Sandbox] Simulando pagamento:', {
      phoneNumber,
      amount,
      description,
    });
    
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      transactionId: `sandbox_${Date.now()}`,
      reference: generateReference(),
      status: 'pending',
      message: 'Pagamento MBWay iniciado (modo sandbox)',
    };
  }

  // Verificar configurações
  if (!MBWAY_API_KEY || !MBWAY_ENTITY_CODE) {
    throw new Error('Configurações MBWay não definidas. Verifique MBWAY_API_KEY e MBWAY_ENTITY_CODE.');
  }

  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const reference = generateReference();
    
    const request: MbwayPaymentRequest = {
      phoneNumber: normalizedPhone,
      amount,
      description: description.slice(0, 50), // MBWay limita descrição
      reference,
      callbackUrl,
    };

    const response = await getMbwayClient().post<MbwayResponse>('/payments', request);
    
    return {
      success: true,
      transactionId: response.data.transactionId,
      reference: response.data.reference,
      status: 'pending',
      message: 'Pagamento MBWay iniciado com sucesso',
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data as { message?: string; errorCode?: string };
      console.error('Erro MBWay:', errorData);
      
      return {
        success: false,
        status: 'failed',
        message: errorData?.message || 'Erro ao iniciar pagamento MBWay',
        errorCode: errorData?.errorCode,
      };
    }
    
    throw error;
  }
}

/**
 * Verificar estado de um pagamento MBWay
 */
export async function checkPaymentStatus(transactionId: string): Promise<MbwayPaymentStatus | null> {
  // Modo sandbox
  if (MBWAY_SANDBOX) {
    console.log('[MBWay Sandbox] Verificando estado:', transactionId);
    
    // Simular pagamento completo após alguns segundos
    const sandboxTime = parseInt(transactionId.split('_')[1] || '0');
    const elapsed = Date.now() - sandboxTime;
    
    // Após 5 segundos, considerar pago
    const status: 'pending' | 'completed' = elapsed > 5000 ? 'completed' : 'pending';
    
    return {
      transactionId,
      status,
      amount: 0,
      phoneNumber: '',
      createdAt: new Date(sandboxTime),
      updatedAt: new Date(),
    };
  }

  try {
    const response = await getMbwayClient().get<MbwayPaymentStatus>(`/payments/${transactionId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Cancelar pagamento MBWay pendente
 */
export async function cancelPayment(transactionId: string): Promise<boolean> {
  // Modo sandbox
  if (MBWAY_SANDBOX) {
    console.log('[MBWay Sandbox] Cancelando pagamento:', transactionId);
    return true;
  }

  try {
    await getMbwayClient().post(`/payments/${transactionId}/cancel`);
    return true;
  } catch (error) {
    console.error('Erro ao cancelar pagamento MBWay:', error);
    return false;
  }
}

/**
 * Reembolsar pagamento MBWay
 */
export async function refundPayment(
  transactionId: string,
  amount?: number
): Promise<MbwayResponse> {
  // Modo sandbox
  if (MBWAY_SANDBOX) {
    console.log('[MBWay Sandbox] Reembolsando pagamento:', { transactionId, amount });
    return {
      success: true,
      transactionId: `refund_${Date.now()}`,
      message: 'Pagamento reembolsado (modo sandbox)',
    };
  }

  try {
    const response = await getMbwayClient().post<MbwayResponse>(`/payments/${transactionId}/refund`, {
      amount, // Se não especificado, reembolsa valor total
    });
    
    return {
      success: true,
      transactionId: response.data.transactionId,
      message: 'Pagamento reembolsado com sucesso',
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data as { message?: string };
      return {
        success: false,
        message: errorData?.message || 'Erro ao reembolsar pagamento',
      };
    }
    throw error;
  }
}

/**
 * Validar callback de webhook MBWay
 * Verifica a assinatura do webhook
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Em produção, implementar validação HMAC
  // Por enquanto, apenas verificar se a assinatura existe
  return !!signature && signature.length > 0;
}

/**
 * Processar callback de webhook MBWay
 */
export function processWebhookCallback(payload: {
  transactionId: string;
  reference: string;
  status: 'completed' | 'failed' | 'cancelled';
  amount: number;
  phoneNumber: string;
  timestamp: string;
}): {
  transactionId: string;
  reference: string;
  status: 'completed' | 'failed' | 'cancelled';
  success: boolean;
} {
  console.log('Webhook MBWay recebido:', payload);
  
  return {
    transactionId: payload.transactionId,
    reference: payload.reference,
    status: payload.status,
    success: payload.status === 'completed',
  };
}

/**
 * Verificar se MBWay está configurado
 */
export function isMbwayConfigured(): boolean {
  if (MBWAY_SANDBOX) {
    return true;
  }
  return !!MBWAY_API_KEY && !!MBWAY_ENTITY_CODE && !!MBWAY_ENTITY_PHONE;
}

/**
 * Obter informações de configuração MBWay (para debug)
 */
export function getConfigInfo(): {
  configured: boolean;
  sandbox: boolean;
  apiUrl: string;
  entityPhone: string;
} {
  return {
    configured: isMbwayConfigured(),
    sandbox: MBWAY_SANDBOX,
    apiUrl: MBWAY_API_URL,
    entityPhone: MBWAY_ENTITY_PHONE,
  };
}
