"use client";

import { useState, useEffect, useCallback } from "react";

interface Jogo {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  descricao?: string;
  estado: string;
  dataInicio?: string;
  dataFim?: string;
  numeroMaximo?: number;
  premio?: number;
  percentualPremio?: number;
  valorTotalPremio?: number;
  imagemUrl?: string;
  resultado?: string;
  grelha?: unknown;
  evento?: {
    id: string;
    nome: string;
    aldeia?: {
      id: string;
      nome: string;
    };
  };
  _count?: {
    participacoes: number;
  };
}

interface UseGameJogoOptions {
  tipo: string;
  requireId?: boolean;
}

export function useGameJogo({ tipo, requireId = false }: UseGameJogoOptions) {
  const [jogo, setJogo] = useState<Jogo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJogo = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL(window.location.href);
      const jogoId = url.searchParams.get("id") || url.searchParams.get("jogoId");

      let apiUrl = `/api/jogos?ativos=true&tipo=${tipo}`;
      if (jogoId || requireId) {
        const id = jogoId || "";
        if (!id) {
          setError("ID do jogo não fornecido");
          setLoading(false);
          return;
        }
        apiUrl = `/api/jogos/${id}`;
      }

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error("Erro ao carregar jogo");
      }

      const data = await response.json();

      let jogoData: Jogo | null = null;

      if (Array.isArray(data)) {
        const activeGames = data.filter((g: Jogo) => g.estado === "ativo");
        jogoData = activeGames.length > 0 ? activeGames[0] : data[0] || null;
      } else if (data.data && Array.isArray(data.data)) {
        const activeGames = data.data.filter((g: Jogo) => g.estado === "ativo");
        jogoData = activeGames.length > 0 ? activeGames[0] : data.data[0] || null;
      } else if (data.data) {
        jogoData = data.data;
      } else {
        jogoData = data;
      }

      setJogo(jogoData);
    } catch (err) {
      console.error("Erro ao buscar jogo:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar jogo");
    } finally {
      setLoading(false);
    }
  }, [tipo, requireId]);

  useEffect(() => {
    fetchJogo();
  }, [fetchJogo]);

  return { jogo, loading, error, fetchJogo, setJogo };
}
