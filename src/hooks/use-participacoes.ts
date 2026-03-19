"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface Participacao {
  id: string;
  dadosParticipacao: Record<string, unknown>;
  valorPago: number;
  metodoPagamento: string;
  estadoPagamento: string;
  referenciaPagamento?: string;
  dataPagamento?: string;
  seedRaspe?: string;
  hashRaspe?: string;
  resultadoRaspe?: string;
  revelado: boolean;
  dataRevelacao?: string;
  ganhador: boolean;
  premioEntregue: boolean;
  jogo?: {
    id: string;
    nome: string;
    tipo: string;
    preco: number;
    evento?: {
      id: string;
      nome: string;
      aldeia?: {
        id: string;
        nome: string;
      };
    };
  };
  user?: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
  };
}

interface CreateParticipacaoData {
  jogoId: string;
  dadosParticipacao: Record<string, unknown>;
  quantidade: number;
  metodoPagamento: "mbway" | "dinheiro" | "stripe" | "transferencia";
  dadosCliente?: {
    nome: string;
    telefone: string;
    email?: string;
  };
}

export function useParticipacoes(token: string | null) {
  const [participacoes, setParticipacoes] = useState<Participacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchParticipacoes = useCallback(async (params: { 
    page?: number; 
    limit?: number; 
    jogoId?: string;
    userId?: string;
  } = {}) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.jogoId) queryParams.append("jogoId", params.jogoId);
      if (params.userId) queryParams.append("userId", params.userId);

      const response = await fetch(`/api/participacoes?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar participações");
      }

      const data = await response.json();
      setParticipacoes(data.data);
      setPagination(data.pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createParticipacao = useCallback(async (data: CreateParticipacaoData) => {
    if (!token) return { success: false, error: "Não autenticado" };

    setLoading(true);

    try {
      const response = await fetch("/api/participacoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao criar participação");
      }

      toast.success("Participação registada com sucesso!");
      await fetchParticipacoes();
      return { success: true, data: responseData.data, valorTotal: responseData.valorTotal };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [token, fetchParticipacoes]);

  const revelarRaspadinha = useCallback(async (participacaoId: string) => {
    if (!token) return { success: false, error: "Não autenticado" };

    setLoading(true);

    try {
      const response = await fetch(`/api/participacoes/${participacaoId}/revelar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao revelar raspadinha");
      }

      toast.success(responseData.data.ganhou ? "Parabéns! Ganhou!" : "Não foi desta vez!");
      await fetchParticipacoes();
      return { success: true, data: responseData.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [token, fetchParticipacoes]);

  const verificarHash = useCallback(async (participacaoId: string) => {
    if (!token) return { success: false, error: "Não autenticado" };

    try {
      const response = await fetch(`/api/participacoes/${participacaoId}/revelar`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao verificar hash");
      }

      return { success: true, data: responseData.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      return { success: false, error: message };
    }
  }, [token]);

  return {
    participacoes,
    loading,
    error,
    pagination,
    fetchParticipacoes,
    createParticipacao,
    revelarRaspadinha,
    verificarHash,
  };
}
