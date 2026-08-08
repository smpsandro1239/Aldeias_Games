"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api-client";
import { toast } from "sonner";
import { AldeiaData, Estatisticas, Participacao, UserData, Vencedor, WonPrize } from "./vencedor-detail-types";

export function useUserData(userId: string | undefined, active: boolean) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !active) return;

    const fetchUserData = async () => {
      setLoading(true);
      try {
        const res = await apiRequest(`/api/users/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setUserData(data.data || null);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, active]);

  return { userData, loading };
}

export function useAldeiaData(aldeiaId: string | undefined) {
  const [aldeiaData, setAldeiaData] = useState<AldeiaData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!aldeiaId) {
      setAldeiaData(null);
      return;
    }

    const fetchAldeiaData = async () => {
      setLoading(true);
      try {
        const res = await apiRequest(`/api/aldeias/${aldeiaId}`);
        if (res.ok) {
          const data = await res.json();
          setAldeiaData(data.data || null);
        }
      } catch (error) {
        console.error("Erro ao buscar aldeia:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAldeiaData();
  }, [aldeiaId]);

  return { aldeiaData, loading };
}

export function useHistoricoParticipacoes(userId: string | undefined, active: boolean) {
  const [participacoes, setParticipacoes] = useState<Participacao[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !active || participacoes.length > 0) return;

    const fetchHistorico = async () => {
      setLoading(true);
      try {
        const res = await apiRequest(`/api/participacoes?userId=${userId}&page=1&limit=50`);
        if (res.ok) {
          const data = await res.json();
          setParticipacoes(data.data || []);
        }
      } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        toast.error("Erro ao carregar histórico");
      } finally {
        setLoading(false);
      }
    };

    fetchHistorico();
  }, [userId, active, participacoes.length]);

  return { participacoes, loading };
}

export function parseWinningPrize(v: Vencedor): WonPrize | null {
  let dp: Record<string, unknown> | null = null;
  try {
    dp = typeof v.dadosParticipacao === 'string' ? JSON.parse(v.dadosParticipacao) : (v.dadosParticipacao as unknown) as Record<string, unknown>;
  } catch {
    dp = null;
  }
  const winningPrize = (dp as Record<string, unknown>)?.winningPrize as Record<string, unknown> | null | undefined;
  if (winningPrize && typeof winningPrize.nome === 'string') {
    return { nome: winningPrize.nome, valor: Number(winningPrize.valorDinheiroAlternative) || 0 };
  }
  if ((dp as Record<string, unknown>)?.hasWin === true && Array.isArray((dp as Record<string, unknown>)?.grid)) {
    const counts = new Map<string, number>();
    for (const g of ((dp as Record<string, unknown>).grid as { nome?: string; valorDinheiroAlternative?: number }[])) {
      if (!g?.nome) continue;
      counts.set(g.nome, (counts.get(g.nome) || 0) + 1);
      if (counts.get(g.nome)! >= 3 && (Number(g.valorDinheiroAlternative) || 0) > 0) {
        return { nome: g.nome, valor: Number(g.valorDinheiroAlternative) || 0 };
      }
    }
  }
  if (v.resultadoRaspe && v.resultadoRaspe !== 'sem_premio') {
    const match = v.jogo?.premios?.find((p) => p.nome === v.resultadoRaspe);
    if (match) return { nome: match.nome || v.resultadoRaspe, valor: Number(match.valorDinheiroAlternative) || 0 };
    return { nome: v.resultadoRaspe, valor: 0 };
  }
  return null;
}

export function computeEstatisticas(participacoes: Participacao[]): Estatisticas {
  const total = participacoes.length;
  const vitorias = participacoes.filter((p) => p.ganhador).length;
  const investido = participacoes.reduce((sum, p) => sum + p.valorPago, 0);
  const percentual = total > 0 ? ((vitorias / total) * 100).toFixed(1) : "0.0";
  return { total, vitorias, investido, percentual };
}