"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useWallet } from "@/components/providers/wallet-provider";
import { apiRequest } from "@/lib/api-client";
import { toast } from "sonner";

export interface Participante {
  nome: string;
  telefone: string;
  email: string;
  notificacao: "whatsapp" | "email" | "nenhum";
}

export interface JogoBase {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  stockInicial: number;
  stockAtual: number;
  totalAngariado: number;
  totalParticipacoes: number;
  estado: string;
  descricao?: string;
  configuracao: Record<string, unknown>;
  premios?: Array<{
    id: string;
    nome: string;
    descricao?: string | null;
    valorDinheiroAlternative?: number | null;
    imagemUrl?: string | null;
    icon?: string;
    percentagem?: number;
  }>;
  evento?: {
    nome: string;
    aldeia?: { nome: string };
  };
}

export function useGamePage<T extends JogoBase = JogoBase>() {
  const searchParams = useSearchParams();
  const jogoId = searchParams.get("id");

  const [jogo, setJogo] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userOriginalData, setUserOriginalData] = useState({ nome: "", telefone: "", email: "" });
  const [participante, setParticipante] = useState<Participante>({
    nome: "",
    telefone: "",
    email: "",
    notificacao: "whatsapp",
  });

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [confirmacaoModalOpen, setConfirmacaoModalOpen] = useState(false);
  const [participacaoCriada, setParticipacaoCriada] = useState<unknown>(null);
  const [participacaoConfirmada, setParticipacaoConfirmada] = useState(false);

  const [playerDataConfirmOpen, setPlayerDataConfirmOpen] = useState(false);
  const [playerDataModified, setPlayerDataModified] = useState(false);

  const { saldo, refreshBalance } = useWallet();

  const isAdmin = ["super_admin", "admin", "aldeia_admin"].includes(userRole ?? "");
  const isNonRegularUser = ["vendedor", "aldeia_admin", "super_admin"].includes(userRole ?? "");

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.role) setUserRole(userData.role);
        if (userData.nome) {
          const originalData = {
            nome: userData.nome || "",
            telefone: userData.telefone || "",
            email: userData.email || "",
          };
          setUserOriginalData(originalData);
          setParticipante((prev) => ({ ...prev, ...originalData }));
        }
      } catch {}
    }
  }, []);

  const fetchJogo = useCallback(async (fallbackUrl?: string) => {
    if (!jogoId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/jogos/${jogoId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setJogo(data.data as T);
          return;
        }
      }
      // Fallback
      if (fallbackUrl) {
        const fallbackRes = await fetch(fallbackUrl);
        const fallbackData = await fallbackRes.json();
        if (fallbackData.data?.length > 0) {
          setJogo(fallbackData.data[0] as T);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar jogo:", error);
      toast.error("Erro ao carregar o jogo");
    } finally {
      setLoading(false);
    }
  }, [jogoId]);

  const handlePlayerConfirmOwnData = useCallback(() => {
    setPlayerDataConfirmOpen(false);
    setPlayerDataModified(false);
    setPaymentModalOpen(true);
  }, []);

  const handlePlayerConfirmNewData = useCallback(
    (data: { nome: string; telefone: string; email: string }) => {
      setParticipante((prev) => ({
        ...prev,
        nome: data.nome,
        telefone: data.telefone,
        email: data.email,
      }));
      setPlayerDataModified(true);
      setPlayerDataConfirmOpen(false);
      setPaymentModalOpen(true);
    },
    []
  );

  const handleJogar = useCallback(() => {
    if (!jogoId) return;
    if (isNonRegularUser && !playerDataModified) {
      setPlayerDataConfirmOpen(true);
    } else {
      setPaymentModalOpen(true);
    }
  }, [jogoId, isNonRegularUser, playerDataModified]);

  const processarPagamento = useCallback(
    async (
      metodo: "dinheiro" | "saldo" | "mbway" | "stripe" | "transferencia",
      criarParticipacao: (metodo: "dinheiro" | "saldo" | "pendente") => Promise<void>
    ) => {
      if (!jogo) return;

      const canUseDinheiro = ["vendedor", "aldeia_admin", "super_admin"].includes(userRole ?? "");
      if (metodo === "dinheiro" && !canUseDinheiro) {
        toast.error("Apenas vendedores e administradores podem pagar em dinheiro");
        return;
      }

      try {
        if (metodo === "dinheiro" || metodo === "saldo" || metodo === "transferencia") {
          await criarParticipacao(metodo === "transferencia" ? "saldo" : metodo);
        } else if (metodo === "mbway") {
          if (!participante.telefone) {
            toast.error("Telefone obrigatório para MBWay");
            return;
          }
          const res = await apiRequest("/api/pagamentos/mbway", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              telefone: participante.telefone,
              valor: jogo.preco,
              descricao: `${jogo.nome}`,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            toast.error(data.error || "Erro ao iniciar pagamento MBWay");
            return;
          }
          toast.success("Pagamento MBWay enviado! Confirme no seu telemóvel.");
          await criarParticipacao("pendente");
        } else if (metodo === "stripe") {
          const res = await apiRequest("/api/pagamentos/stripe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              valor: jogo.preco,
              descricao: `${jogo.nome}`,
              metadata: { jogoId: jogo.id },
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            toast.error(data.error || "Erro ao processar pagamento");
            return;
          }
          if (data.data?.url) {
            window.location.href = data.data.url;
          } else {
            toast.error("Erro: URL de pagamento não disponível");
          }
        }
      } catch (error) {
        console.error("Erro no pagamento:", error);
        toast.error("Erro ao processar pagamento");
      }
    },
    [jogo, userRole, participante.telefone]
  );

  return {
    // State
    jogo,
    setJogo,
    loading,
    setLoading,
    jogoId,
    userRole,
    isAdmin,
    isNonRegularUser,
    participante,
    setParticipante,
    userOriginalData,

    // Modals
    paymentModalOpen,
    setPaymentModalOpen,
    confirmacaoModalOpen,
    setConfirmacaoModalOpen,
    participacaoCriada,
    setParticipacaoCriada,
    participacaoConfirmada,
    setParticipacaoConfirmada,
    playerDataConfirmOpen,
    setPlayerDataConfirmOpen,
    playerDataModified,
    setPlayerDataModified,

    // Wallet
    saldo,
    refreshBalance,

    // Handlers
    fetchJogo,
    handleJogar,
    handlePlayerConfirmOwnData,
    handlePlayerConfirmNewData,
    processarPagamento,
  };
}
