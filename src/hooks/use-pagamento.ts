"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface MbwayPaymentData {
  telefone: string;
  valor: number;
  descricao?: string;
  participacaoId?: string;
}

interface StripePaymentData {
  valor: number;
  descricao: string;
  metadata?: Record<string, string>;
}

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  reference?: string;
  sessionId?: string;
  url?: string;
  status?: string;
  error?: string;
}

export function usePagamento(token: string | null) {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const pagarComMBWay = useCallback(async (data: MbwayPaymentData): Promise<PaymentResponse> => {
    if (!token) return { success: false, error: "Não autenticado" };

    setLoading(true);

    try {
      const response = await fetch("/api/pagamentos/mbway", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao iniciar pagamento MBWay");
      }

      toast.success("Notificação MBWay enviada! Aceite no seu telemóvel.");
      setPaymentStatus("pending");
      return { success: true, ...responseData.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [token]);

  const pagarComStripe = useCallback(async (data: StripePaymentData): Promise<PaymentResponse> => {
    if (!token) return { success: false, error: "Não autenticado" };

    setLoading(true);

    try {
      const response = await fetch("/api/pagamentos/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao criar sessão de pagamento");
      }

      // Redirecionar para o checkout do Stripe
      if (responseData.data?.url) {
        window.location.href = responseData.data.url;
      }

      return { success: true, ...responseData.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [token]);

  const verificarEstadoMBWay = useCallback(async (transactionId: string): Promise<PaymentResponse> => {
    if (!token) return { success: false, error: "Não autenticado" };

    try {
      const response = await fetch(`/api/pagamentos/mbway?transactionId=${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao verificar pagamento");
      }

      setPaymentStatus(responseData.data?.status || null);
      return { success: true, ...responseData.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      return { success: false, error: message };
    }
  }, [token]);

  const verificarEstadoStripe = useCallback(async (sessionId: string): Promise<PaymentResponse> => {
    if (!token) return { success: false, error: "Não autenticado" };

    try {
      const response = await fetch(`/api/pagamentos/stripe?sessionId=${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao verificar pagamento");
      }

      setPaymentStatus(responseData.data?.status || null);
      return { success: true, ...responseData.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      return { success: false, error: message };
    }
  }, [token]);

  return {
    loading,
    paymentStatus,
    pagarComMBWay,
    pagarComStripe,
    verificarEstadoMBWay,
    verificarEstadoStripe,
  };
}
