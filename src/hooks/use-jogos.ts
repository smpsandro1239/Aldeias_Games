"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface Jogo {
  id: string;
  nome: string;
  tipo: "poio_da_vaca" | "rifa" | "tombola" | "raspadinha";
  descricao?: string;
  configuracao: Record<string, unknown>;
  preco: number;
  stockInicial: number;
  stockAtual: number;
  limitePorUsuario: number;
  estado: string;
  dataAbertura?: string;
  dataFecho?: string;
  totalParticipacoes: number;
  totalAngariado: number;
  sorteado: boolean;
  evento?: {
    id: string;
    nome: string;
    aldeia?: {
      id: string;
      nome: string;
    };
  };
  premio?: {
    id: string;
    nome: string;
    imagemUrl?: string;
  };
}

interface CreateJogoData {
  nome: string;
  tipo: "poio_da_vaca" | "rifa" | "tombola" | "raspadinha";
  descricao?: string;
  configuracao: Record<string, unknown>;
  preco: number;
  stockInicial: number;
  limitePorUsuario?: number;
  eventoId: string;
  premioId?: string;
  estado?: string;
}

export function useJogos(token: string | null) {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchJogos = useCallback(async (params: { 
    page?: number; 
    limit?: number; 
    eventoId?: string; 
    tipo?: string;
    ativos?: boolean;
  } = {}) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.eventoId) queryParams.append("eventoId", params.eventoId);
      if (params.tipo) queryParams.append("tipo", params.tipo);
      if (params.ativos) queryParams.append("ativos", "true");

      const response = await fetch(`/api/jogos?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar jogos");
      }

      const data = await response.json();
      setJogos(data.data);
      setPagination(data.pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createJogo = useCallback(async (data: CreateJogoData) => {
    if (!token) return { success: false, error: "Não autenticado" };

    setLoading(true);

    try {
      const response = await fetch("/api/jogos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao criar jogo");
      }

      toast.success("Jogo criado com sucesso!");
      await fetchJogos();
      return { success: true, data: responseData.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [token, fetchJogos]);

  const updateJogo = useCallback(async (id: string, data: Partial<CreateJogoData>) => {
    if (!token) return { success: false, error: "Não autenticado" };

    setLoading(true);

    try {
      const response = await fetch(`/api/jogos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao atualizar jogo");
      }

      toast.success("Jogo atualizado com sucesso!");
      await fetchJogos();
      return { success: true, data: responseData.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [token, fetchJogos]);

  const deleteJogo = useCallback(async (id: string) => {
    if (!token) return { success: false, error: "Não autenticado" };

    setLoading(true);

    try {
      const response = await fetch(`/api/jogos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao eliminar jogo");
      }

      toast.success("Jogo eliminado com sucesso!");
      await fetchJogos();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [token, fetchJogos]);

  const abrirJogo = useCallback(async (id: string) => {
    return updateJogo(id, { estado: "aberto" });
  }, [updateJogo]);

  const fecharJogo = useCallback(async (id: string) => {
    return updateJogo(id, { estado: "fechado" });
  }, [updateJogo]);

  return {
    jogos,
    loading,
    error,
    pagination,
    fetchJogos,
    createJogo,
    updateJogo,
    deleteJogo,
    abrirJogo,
    fecharJogo,
  };
}
