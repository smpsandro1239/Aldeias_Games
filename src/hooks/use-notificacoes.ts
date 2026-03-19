"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface Notificacao {
  id: string;
  tipo: "sistema" | "pagamento" | "sorteio" | "premio" | "campanha" | "alerta";
  titulo: string;
  mensagem: string;
  dados?: Record<string, unknown>;
  lida: boolean;
  createdAt: string;
}

export function useNotificacoes(token: string | null) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotificacoes = useCallback(async (apenasNaoLidas = false) => {
    if (!token) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/notificacoes?naoLidas=${apenasNaoLidas}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar notificações");
      }

      const data = await response.json();
      setNotificacoes(data.data);
      setNaoLidas(data.naoLidas || 0);
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const marcarComoLida = useCallback(async (id: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/notificacoes/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setNotificacoes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
        );
        setNaoLidas((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Erro ao marcar notificação como lida:", err);
    }
  }, [token]);

  const marcarTodasComoLidas = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/notificacoes", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
        setNaoLidas(0);
        toast.success("Todas as notificações marcadas como lidas");
      }
    } catch (err) {
      console.error("Erro ao marcar notificações como lidas:", err);
    }
  }, [token]);

  const apagarNotificacao = useCallback(async (id: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/notificacoes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setNotificacoes((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error("Erro ao apagar notificação:", err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchNotificacoes();
    }
  }, [token, fetchNotificacoes]);

  return {
    notificacoes,
    naoLidas,
    loading,
    fetchNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas,
    apagarNotificacao,
  };
}
