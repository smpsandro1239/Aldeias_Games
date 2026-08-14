"use client";

import { useState, useEffect, useCallback } from "react";
import { useGamePage } from "@/hooks/useGamePage";
import { apiRequest } from '@/lib/api-client';
import { toast } from "sonner";
import type { JogoEuromilhoes, Grelha } from "./euromilhoes-types";
import { MAX_NUMEROS, TOTAL_NUMEROS } from "./euromilhoes-types";

export function useEuromilhoesGame(gamePage: ReturnType<typeof useGamePage<JogoEuromilhoes>>) {
  const {
    jogo, setJogo, loading, setLoading, jogoId,
    userRole, isNonRegularUser,
    participante, setParticipante,
    setPaymentModalOpen,
    setConfirmacaoModalOpen,
    setParticipacaoCriada, setParticipacaoConfirmada,
    refreshBalance,
    setPlayerDataConfirmOpen, playerDataModified,
  } = gamePage;

  const [grelha, setGrelha] = useState<Grelha | null>(null);
  const [numerosSelecionados, setNumerosSelecionados] = useState<number[]>([]);
  const [numerosOcupados, setNumerosOcupados] = useState<number[]>([]);
  const [submetendo, setSubmetendo] = useState(false);
  const [provaModalOpen, setProvaModalOpen] = useState(false);

  const maxNumeros =
    typeof jogo?.configuracao?.maxNumeros === "number" && (jogo.configuracao.maxNumeros as number) > 0
      ? Math.min(jogo.configuracao.maxNumeros as number, MAX_NUMEROS)
      : MAX_NUMEROS;

  useEffect(() => {
    if (grelha) {
      try {
        const ocupados = JSON.parse(grelha.numerosOcupados || "[]");
        setNumerosOcupados(ocupados.map(Number));
      } catch { setNumerosOcupados([]); }
    }
  }, [grelha]);

  const fetchData = useCallback(async () => {
    if (!jogoId) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/jogos/${jogoId}`);
      if (res.ok) {
        const data = await res.json();
        const jogoData = data.data;
        if (jogoData) {
          setJogo(jogoData as JogoEuromilhoes);
          const grelhasRes = await fetch(`/api/euromilhoes/grelhas?jogoId=${jogoData.id}`);
          const grelhasData = await grelhasRes.json();
          let openId: string | null = null;
          if (grelhasData.success && grelhasData.data) {
            const allGrelhas: Grelha[] = grelhasData.data;
            const open = allGrelhas.find((g) => g.estado === "aberta");
            openId = open?.id || null;
            setGrelha(open || allGrelhas[0] || null);
          }
          try {
            const ocupRes = await fetch(
              `/api/jogos/${jogoData.id}/numeros-ocupados${openId ? `?grelhaId=${openId}` : ""}`
            );
            if (ocupRes.ok) {
              const ocupData = await ocupRes.json();
              if (ocupData.numerosOcupados) setNumerosOcupados(ocupData.numerosOcupados.map(Number));
            }
          } catch {}
        }
      }
    } catch (error) {
      console.error("Erro ao carregar jogo:", error);
      toast.error("Erro ao carregar o jogo");
    } finally { setLoading(false); }
  }, [jogoId, setJogo, setLoading]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleNumero = useCallback((num: number) => {
    if (numerosOcupados.includes(num)) { toast.warning("Número já adquirido."); return; }
    if (numerosSelecionados.includes(num)) {
      setNumerosSelecionados((prev) => prev.filter((n) => n !== num));
    } else if (numerosSelecionados.length < maxNumeros) {
      setNumerosSelecionados((prev) => [...prev, num].sort((a, b) => a - b));
    } else {
      toast.warning(`Máximo de ${maxNumeros} números.`);
    }
  }, [numerosSelecionados, numerosOcupados, maxNumeros]);

  const selectRandomNumbers = useCallback((count: number) => {
    const available = Array.from({ length: TOTAL_NUMEROS }, (_, i) => i + 1).filter(
      (n) => !numerosSelecionados.includes(n) && !numerosOcupados.includes(n)
    );
    if (available.length === 0) { toast.warning("Sem números disponíveis"); return; }
    const shuffled = available.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, maxNumeros - numerosSelecionados.length));
    setNumerosSelecionados([...numerosSelecionados, ...selected]);
  }, [numerosSelecionados, numerosOcupados, maxNumeros]);

  const handleParticipar = () => {
    if (!participante.nome.trim()) { toast.error("Insira o seu nome."); return; }
    if (!participante.telefone.trim() && !participante.email.trim()) { toast.error("Insira telefone ou email."); return; }
    if (numerosSelecionados.length < 1) { toast.error("Selecione pelo menos 1 número."); return; }
    if (isNonRegularUser && !playerDataModified) {
      setPlayerDataConfirmOpen(true);
    } else {
      setPaymentModalOpen(true);
    }
  };

  const criarParticipacao = async (metodo: string) => {
    if (!jogo) return;
    setSubmetendo(true);
    const payload: Record<string, unknown> = {
      jogoId: jogo.id,
      dadosParticipacao: { numeros: numerosSelecionados },
      quantidade: numerosSelecionados.length,
      metodoPagamento: metodo,
      dadosCliente: { nome: participante.nome, telefone: participante.telefone || undefined, email: participante.email || undefined },
    };
    if (grelha) payload.grelhaId = grelha.id;

    try {
      const response = await apiRequest("/api/participacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = await response.json();
        setNumerosOcupados((prev) => [...new Set([...prev, ...numerosSelecionados])]);
        const participacao = Array.isArray(data.participacao)
          ? data.participacao[0]
          : data.participacao || data.data || data;
        setParticipacaoCriada(participacao);
        setConfirmacaoModalOpen(true);
        setPaymentModalOpen(false);
        setParticipacaoConfirmada(true);
        toast.success("Participação confirmada!");
        refreshBalance();
        try {
          const grelhasRes = await fetch(`/api/euromilhoes/grelhas?jogoId=${jogo.id}`);
          const grelhasData = await grelhasRes.json();
          if (grelhasData.success && grelhasData.data) {
            const open = grelhasData.data.find((g: Grelha) => g.estado === "aberta");
            if (open) setGrelha(open);
          }
        } catch {}
      } else {
        const err = await response.json().catch(() => null);
        toast.error(err?.error || "Erro ao participar.");
      }
    } catch (error) {
      console.error("Erro ao participar:", error);
      toast.error("Erro ao processar participação.");
    } finally { setSubmetendo(false); }
  };

  const processarPagamento = async (metodo: "dinheiro" | "saldo" | "mbway" | "stripe" | "transferencia") => {
    if (!jogo) return;
    if (metodo === "mbway" && !participante.telefone) { toast.error("Telefone obrigatório para MBWay."); return; }
    await criarParticipacao(metodo);
  };

  const handlePlayAgain = () => {
    setParticipacaoConfirmada(false);
    setNumerosSelecionados([]);
    fetchData();
  };

  const totalPago = (jogo?.preco || 0) * numerosSelecionados.length;

  return {
    grelha,
    numerosSelecionados, setNumerosSelecionados,
    numerosOcupados,
    submetendo,
    provaModalOpen, setProvaModalOpen,
    toggleNumero, selectRandomNumbers,
    handleParticipar, processarPagamento,
    handlePlayAgain,
    totalPago,
  };
}
