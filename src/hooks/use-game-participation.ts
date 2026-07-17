"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "./use-auth";
import { apiRequest } from "@/lib/api-client";

interface ParticipanteForm {
  nome: string;
  telefone: string;
  email: string;
  notificacao: "whatsapp" | "email" | "nenhum";
}

interface UseGameParticipationOptions {
  jogoId: string | undefined;
  buildDadosParticipacao: () => Record<string, unknown>;
  calcularCustoTotal: () => number;
  buildExtraPayload?: () => Record<string, unknown>;
  onSuccess?: (data: any) => void;
  gameNome?: string;
}

export function useGameParticipation({
  jogoId,
  buildDadosParticipacao,
  calcularCustoTotal,
  buildExtraPayload,
  onSuccess,
  gameNome,
}: UseGameParticipationOptions) {
  const { user } = useAuth();

  const [saldo, setSaldo] = useState(0);
  const [participante, setParticipante] = useState<ParticipanteForm>({
    nome: "",
    telefone: "",
    email: "",
    notificacao: "whatsapp",
  });
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [confirmacaoModalOpen, setConfirmacaoModalOpen] = useState(false);
  const [participacaoCriada, setParticipacaoCriada] = useState<any>(null);
  const [participacaoConfirmada, setParticipacaoConfirmada] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const isAdmin = user?.role === "super_admin" || user?.role === "aldeia_admin";
  const canUseDinheiro = ["vendedor", "aldeia_admin", "super_admin"].includes(user?.role || "");

  useEffect(() => {
    if (user) {
      setParticipante((prev) => ({
        ...prev,
        nome: prev.nome || user.nome || "",
        telefone: prev.telefone || user.telefone || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const fetchSaldo = useCallback(async () => {
    try {
      const res = await apiRequest("/api/wallet");
      const data = await res.json();
      if (data.saldo !== undefined) {
        setSaldo(data.saldo);
      }
    } catch (e) {
      console.error("Erro ao buscar saldo:", e);
    }
  }, []);

  useEffect(() => {
    fetchSaldo();
  }, [fetchSaldo]);

  const criarParticipacao = useCallback(
    async (metodo: string) => {
      if (!jogoId) return;

      setProcessingPayment(true);
      try {
        const payload: Record<string, unknown> = {
          jogoId,
          dadosParticipacao: buildDadosParticipacao(),
          quantidade: 1,
          metodoPagamento: metodo,
          dadosCliente: {
            nome: participante.nome,
            telefone: participante.telefone || undefined,
            email: participante.email || undefined,
          },
        };

        if (buildExtraPayload) {
          Object.assign(payload, buildExtraPayload());
        }

        const response = await apiRequest("/api/participacoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          setParticipacaoCriada(data.data || data);
          setConfirmacaoModalOpen(true);
          setPaymentModalOpen(false);
          fetchSaldo();

          sendNotification(gameNome || "Jogo");

          if (onSuccess) {
            onSuccess(data);
          }
        } else {
          const errorData = await response.json().catch(() => null);
          toast.error(errorData?.error || "Erro ao participar");
        }
      } catch (error) {
        console.error("Erro ao participar:", error);
        toast.error("Erro ao participar");
      } finally {
        setProcessingPayment(false);
      }
    },
    [jogoId, buildDadosParticipacao, buildExtraPayload, participante, fetchSaldo, onSuccess, gameNome]
  );

  const processarPagamento = useCallback(
    async (metodo: "dinheiro" | "saldo" | "mbway" | "stripe" | "transferencia") => {
      if (!jogoId) return;

      if (metodo === "dinheiro" && !canUseDinheiro) {
        toast.error("Apenas vendedores e administradores podem pagar em dinheiro");
        return;
      }

      if (metodo === "saldo" && saldo < calcularCustoTotal()) {
        toast.error("Saldo insuficiente");
        return;
      }

      if (metodo === "mbway" && !participante.telefone) {
        toast.error("Telefone obrigatório para MBWay");
        return;
      }

      try {
        setProcessingPayment(true);

        if (metodo === "mbway") {
          const mbRes = await fetch("/api/pagamentos/mbway", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              telefone: participante.telefone,
              valor: calcularCustoTotal(),
              descricao: `Participação - ${gameNome || "Jogo"}`,
            }),
          });
          const mbData = await mbRes.json();
          if (!mbRes.ok) throw new Error(mbData.error || "Erro ao iniciar pagamento MBWay");
          toast.success("Notificação MBWay enviada! Aceite no seu telemóvel.");
          await criarParticipacao("mbway");
        } else if (metodo === "stripe") {
          const stRes = await fetch("/api/pagamentos/stripe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              valor: calcularCustoTotal(),
              descricao: `Participação - ${gameNome || "Jogo"}`,
              metadata: { jogoId: jogoId || "", participante: participante.nome },
            }),
          });
          const stData = await stRes.json();
          if (!stRes.ok) throw new Error(stData.error || "Erro ao criar sessão de pagamento");
          if (stData.data?.url) {
            window.location.href = stData.data.url;
            return;
          }
          await criarParticipacao("stripe");
        } else {
          await criarParticipacao(metodo);
        }
      } catch (error) {
        console.error("Erro no pagamento:", error);
        toast.error(error instanceof Error ? error.message : "Erro ao processar pagamento");
      } finally {
        setProcessingPayment(false);
      }
    },
    [jogoId, canUseDinheiro, saldo, calcularCustoTotal, participante, criarParticipacao, gameNome]
  );

  const sendNotification = useCallback(
    (jogoNome: string) => {
      if (participante.notificacao === "whatsapp" && participante.telefone) {
        const telLimpo = participante.telefone.replace(/\D/g, "");
        const hash = participacaoCriada?.hashParticipacao || participacaoCriada?.hashRaspe;
        const msg = encodeURIComponent(
          `Olá! Participou no sorteio "${jogoNome}".` +
            (hash ? `\nHash: ${hash}` : "") +
            `\nBotta de sorte! 🍀`
        );
        window.open(`https://wa.me/351${telLimpo}?text=${msg}`, "_blank");
      } else if (participante.notificacao === "email" && participante.email) {
        const subject = encodeURIComponent(`Participação - ${jogoNome}`);
        const body = encodeURIComponent(
          `Participou no sorteio "${jogoNome}".` +
            `\nBotta de sorte! 🍀`
        );
        window.open(`mailto:${participante.email}?subject=${subject}&body=${body}`, "_blank");
      }
    },
    [participante, participacaoCriada]
  );

  const handleParticipar = useCallback(
    (validations?: { hasSelection?: boolean; minSelection?: number; customError?: string }) => {
      if (!participante.nome.trim()) {
        toast.error("Nome é obrigatório");
        return;
      }
      if (validations?.hasSelection === false) {
        toast.error(validations.customError || "Selecione pelo menos uma opção");
        return;
      }
      if (validations?.minSelection && validations.minSelection > 0) {
        // Caller should handle min selection check externally
      }
      setPaymentModalOpen(true);
    },
    [participante.nome]
  );

  return {
    saldo,
    participante,
    setParticipante,
    paymentModalOpen,
    setPaymentModalOpen,
    confirmacaoModalOpen,
    setConfirmacaoModalOpen,
    participacaoCriada,
    setParticipacaoCriada,
    participacaoConfirmada,
    setParticipacaoConfirmada,
    processingPayment,
    user,
    isAdmin,
    canUseDinheiro,
    fetchSaldo,
    processarPagamento,
    criarParticipacao,
    handleParticipar,
    sendNotification,
  };
}
