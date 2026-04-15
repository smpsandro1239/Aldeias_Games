"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface Evento {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  imagemUrl?: string;
  dataInicio: string;
  dataFim: string;
  objectivoAngariacao?: number;
  estado: string;
  publico: boolean;
  totalAngariado: number;
  totalParticipacoes: number;
  aldeia?: {
    id: string;
    nome: string;
    slug: string;
  };
  _count?: {
    jogos: number;
  };
}

interface CreateEventoData {
  nome: string;
  descricao?: string;
  imagemBase64?: string;
  dataInicio: string;
  dataFim: string;
  objectivoAngariacao?: number;
  estado?: string;
  publico?: boolean;
  aldeiaId: string;
}

interface UpdateEventoData extends Partial<CreateEventoData> {}

export function useEventos(token: string | null) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchEventos = useCallback(async (params: { page?: number; limit?: number; publico?: boolean; aldeiaId?: string } = {}) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.publico) queryParams.append("publico", "true");
      if (params.aldeiaId) queryParams.append("aldeiaId", params.aldeiaId);

      const response = await fetch(`/api/eventos?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar eventos");
      }

      const data = await response.json();
      setEventos(data.data);
      setPagination(data.pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createEvento = useCallback(async (data: CreateEventoData) => {
    if (!token) return { success: false, error: "Não autenticado" };

    setLoading(true);

    try {
      const response = await fetch("/api/eventos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao criar evento");
      }

      toast.success("Evento criado com sucesso!");
      await fetchEventos();
      return { success: true, data: responseData.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [token, fetchEventos]);

  const updateEvento = useCallback(async (id: string, data: UpdateEventoData) => {
    if (!token) return { success: false, error: "Não autenticado" };

    setLoading(true);

    try {
      const response = await fetch(`/api/eventos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao atualizar evento");
      }

      toast.success("Evento atualizado com sucesso!");
      await fetchEventos();
      return { success: true, data: responseData.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [token, fetchEventos]);

  const deleteEvento = useCallback(async (id: string) => {
    if (!token) return { success: false, error: "Não autenticado" };

    setLoading(true);

    try {
      const response = await fetch(`/api/eventos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao eliminar evento");
      }

      toast.success("Evento eliminado com sucesso!");
      await fetchEventos();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [token, fetchEventos]);

  return {
    eventos,
    loading,
    error,
    pagination,
    fetchEventos,
    createEvento,
    updateEvento,
    deleteEvento,
  };
}
