"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface DashboardStats {
  totalEventos: number;
  eventosAtivos: number;
  totalJogos: number;
  jogosAtivos: number;
  totalParticipacoes: number;
  totalAngariado: number;
  evolucaoMensal: {
    mes: string;
    valor: number;
    participacoes: number;
  }[];
  topVendedores: {
    id: string;
    nome: string;
    totalVendas: number;
    valorTotal: number;
  }[];
}

interface VendedorStats {
  vendasHoje: number;
  valorHoje: number;
  vendasTotal: number;
  valorTotal: number;
  comissaoTotal: number;
  ultimasVendas: {
    id: string;
    valor: number;
    metodoPagamento: string;
    createdAt: string;
  }[];
}

interface UseDashboardOptions {
  aldeiaId?: string;
  eventoId?: string;
}

export function useDashboard(token: string | null, options: UseDashboardOptions = {}) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [vendedorStats, setVendedorStats] = useState<VendedorStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.aldeiaId) params.append("aldeiaId", options.aldeiaId);
      if (options.eventoId) params.append("eventoId", options.eventoId);

      const response = await fetch(`/api/dashboard/stats?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar estatísticas");
      }

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [token, options.aldeiaId, options.eventoId]);

  const fetchVendedorStats = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/dashboard/vendedor", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar estatísticas do vendedor");
      }

      const data = await response.json();
      setVendedorStats(data.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const refresh = useCallback(() => {
    fetchStats();
    fetchVendedorStats();
  }, [fetchStats, fetchVendedorStats]);

  useEffect(() => {
    if (token) {
      fetchStats();
      fetchVendedorStats();
    }
  }, [token, fetchStats, fetchVendedorStats]);

  return {
    stats,
    vendedorStats,
    loading,
    error,
    refresh,
    fetchStats,
    fetchVendedorStats,
  };
}
