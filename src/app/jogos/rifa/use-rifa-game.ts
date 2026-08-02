"use client";

import { useState, useEffect, useCallback } from "react";
import { useGamePage } from "@/hooks/useGamePage";
import { apiRequest } from '@/lib/api-client';
import { toast } from "sonner";
import type { JogoRifa, RifaConfig } from "./rifa-types";
import { DEFAULT_CONFIG } from "./rifa-types";

interface NumeroInfoData {
  numero: number;
  jogoNome: string;
  participacoes: Array<{
    id: string;
    nomeCliente: string;
    telefoneCliente: string | null;
    vendedor: string | null;
    data: string;
    valorPago: number;
    metodoPagamento: string;
    estadoPagamento: string;
    ganhador: boolean;
    premioEntregue: boolean;
    hash: string | null;
  }>;
  totalParticipacoes: number;
}

export function useRifaGame(gamePage: ReturnType<typeof useGamePage<JogoRifa>>) {
  const {
    jogo, setJogo, loading, setLoading, jogoId,
    userRole, isAdmin, isNonRegularUser,
    participante, setParticipante, userOriginalData,
    setPaymentModalOpen, setParticipacaoCriada, setParticipacaoConfirmada,
    refreshBalance,
    processarPagamento: baseProcessarPagamento,
    setPlayerDataConfirmOpen, playerDataModified,
  } = gamePage;

  const [config, setConfig] = useState<RifaConfig>(DEFAULT_CONFIG);
  const [numerosSelecionados, setNumerosSelecionados] = useState<number[]>([]);
  const [numerosDisponiveis, setNumerosDisponiveis] = useState<number[]>([]);
  const [blocoSelecionado, setBlocoSelecionado] = useState(1);
  const [numeroSorte, setNumeroSorte] = useState<string>("");
  const [numerosOcupados, setNumerosOcupados] = useState<number[]>([]);
  const [numerosJogados, setNumerosJogados] = useState<number[]>([]);
  const [provaModalOpen, setProvaModalOpen] = useState(false);
  const [numeroInfoOpen, setNumeroInfoOpen] = useState(false);
  const [numeroInfoData, setNumeroInfoData] = useState<NumeroInfoData | null>(null);
  const [numeroInfoLoading, setNumeroInfoLoading] = useState(false);

  const randomOptions = [1, 2, 3, 5, 10, 20];

  const fetchNumerosOcupados = useCallback(async () => {
    if (!jogo?.id) return;
    try {
      const userStr = localStorage.getItem("user");
      const userId = userStr ? JSON.parse(userStr).id : null;
      const headers: Record<string, string> = {};
      if (userId) headers["x-user-id"] = userId;

      const response = await fetch(`/api/jogos/${jogo.id}/numeros-ocupados`, { headers });
      if (!response.ok) return;

      const data = await response.json();
      if (data.numerosOcupados) {
        setNumerosOcupados([...new Set((data.numerosOcupados as number[]).map((n: number) => Number(n)))]);
        setNumerosJogados(
          data.numerosDoUtilizador
            ? [...new Set((data.numerosDoUtilizador as number[]).map((n: number) => Number(n)))]
            : []
        );
      }
    } catch (error) {
      console.error("Erro ao buscar números ocupados:", error);
    }
  }, [jogo?.id]);

  const fetchJogo = useCallback(async () => {
    if (!jogoId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/jogos/${jogoId}`);
      if (res.ok) {
        const data = await res.json();
        const jogoData = data.data;
        if (jogoData) {
          setJogo(jogoData as JogoRifa);

          let configData: Record<string, unknown> = {};
          if (jogoData.configuracao) {
            configData =
              typeof jogoData.configuracao === "string"
                ? JSON.parse(jogoData.configuracao)
                : jogoData.configuracao;
          }
          const blocos = (configData.numeroBlocos as number) || 1;
          const nInicial = (configData.numeroInicial as number) || 1;
          const nFinal = (configData.numeroFinal as number) || 1000;
          setConfig({
            numeroInicial: nInicial,
            numeroFinal: nFinal,
            dataSorteio: configData.dataSorteio as string | undefined,
            horaSorteio: configData.horaSorteio as string | undefined,
            localSorteio: configData.localSorteio as string | undefined,
            numeroBlocos: blocos,
            permitirStripe: (configData.permitirStripe as boolean) || false,
            valorPremios: (configData.valorPremios as number) || null,
          });

          const numsPerBlock = Math.ceil((nFinal - nInicial + 1) / blocos);
          const nums: number[] = [];
          for (let i = nInicial; i <= Math.min(nInicial + numsPerBlock - 1, nFinal); i++) nums.push(i);
          setNumerosDisponiveis(nums);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar jogo:", error);
      toast.error("Erro ao carregar o jogo");
    } finally {
      setLoading(false);
    }
  }, [jogoId, setJogo, setLoading]);

  useEffect(() => { fetchJogo(); }, [fetchJogo]);
  useEffect(() => { if (jogo?.id) fetchNumerosOcupados(); }, [jogo?.id, fetchNumerosOcupados]);

  useEffect(() => {
    if (jogo && config.numeroInicial && config.numeroFinal && config.numeroBlocos) {
      const numsPerBlock = Math.ceil((config.numeroFinal - config.numeroInicial + 1) / config.numeroBlocos);
      const nums: number[] = [];
      const start = config.numeroInicial + (blocoSelecionado - 1) * numsPerBlock;
      const end = Math.min(start + numsPerBlock - 1, config.numeroFinal);
      for (let i = start; i <= end; i++) nums.push(i);
      setNumerosDisponiveis(nums);
    }
  }, [blocoSelecionado, jogo, config]);

  const fetchNumeroInfo = useCallback(
    async (num: number) => {
      if (!jogo?.id) return;
      setNumeroInfoLoading(true);
      setNumeroInfoData(null);
      setNumeroInfoOpen(true);
      try {
        const res = await fetch(`/api/jogos/${jogo.id}/numeros/${num}`);
        if (res.ok) {
          const data = await res.json();
          setNumeroInfoData(data as NumeroInfoData);
        } else {
          const err = await res.json().catch(() => null);
          setNumeroInfoData(null);
          setNumeroInfoOpen(false);
          toast.error(err?.error || "Erro ao carregar informação do número");
        }
      } catch (error) {
        console.error("Erro ao carregar informação do número:", error);
        setNumeroInfoData(null);
        setNumeroInfoOpen(false);
        toast.error("Erro ao carregar informação do número");
      } finally {
        setNumeroInfoLoading(false);
      }
    },
    [jogo?.id]
  );

  const toggleNumero = (num: number) => {
    if (numerosSelecionados.includes(num)) {
      setNumerosSelecionados(numerosSelecionados.filter((n) => n !== num));
    } else if (numerosOcupados.includes(num)) {
      if (!jogo?.id) return;
      try {
        const userStr = localStorage.getItem("user");
        const userId = userStr ? JSON.parse(userStr).id : null;
        if (userId) {
          fetchNumeroInfo(num);
        } else {
          toast.info("Inicie sessão para ver quem jogou este número.");
        }
      } catch {
        toast.info("Inicie sessão para ver quem jogou este número.");
      }
    } else if (numerosSelecionados.length < 20) {
      setNumerosSelecionados([...numerosSelecionados, num]);
    } else {
      toast.warning("Máximo de 20 números por participação");
    }
  };

  const selectRandomNumbers = (count: number) => {
    const available = numerosDisponiveis.filter(
      (n) => !numerosSelecionados.includes(n) && !numerosOcupados.includes(n)
    );
    if (available.length === 0) { toast.warning("Não há números disponíveis"); return; }
    const shuffled = available.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, 20 - numerosSelecionados.length));
    if (selected.length < count) toast.warning(`Apenas ${selected.length} disponível(is)`);
    setNumerosSelecionados([...numerosSelecionados, ...selected]);
  };

  const handleParticipar = () => {
    if (!participante.nome.trim()) { toast.error("Insira o seu nome!"); return; }
    if (numerosSelecionados.length === 0) { toast.error("Selecione pelo menos um número!"); return; }
    if (isNonRegularUser && !playerDataModified) {
      setPlayerDataConfirmOpen(true);
    } else {
      setPaymentModalOpen(true);
    }
  };

  const criarParticipacao = async (metodo: "dinheiro" | "saldo" | "mbway") => {
    if (!jogo) return;
    const payload: Record<string, unknown> = {
      jogoId: jogo.id,
      dadosParticipacao: { numeros: numerosSelecionados },
      quantidade: numerosSelecionados.length,
      metodoPagamento: metodo,
    };
    if (participante.nome && (participante.telefone || participante.email)) {
      payload.dadosCliente = {
        nome: participante.nome,
        telefone: participante.telefone || undefined,
        email: participante.email || undefined,
      };
    }

    try {
      const response = await apiRequest("/api/participacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = await response.json();
        const p = data.participacao || data.data;
        const novos = numerosSelecionados.filter((n) => !numerosOcupados.includes(n));
        if (novos.length > 0) {
          setNumerosOcupados((prev) => [...new Set([...prev, ...novos])]);
          setNumerosJogados((prev) => [...new Set([...prev, ...novos])]);
        }
        setNumeroSorte(p?.numero || numerosSelecionados[0].toString().padStart(5, "0"));
        setPaymentModalOpen(false);
        setParticipacaoCriada(p);
        await fetchNumerosOcupados();
        await fetchJogo();
        setParticipacaoConfirmada(true);

        if (participante.notificacao === "whatsapp" && participante.telefone) {
          const tel = participante.telefone.replace(/\D/g, "");
          const hash = data.data?.hashParticipacao || data.data?.hashRaspe;
          const msg = encodeURIComponent(
            `🎉 Participação Confirmada!\n\nRifa: ${jogo.nome}\nNúmeros: ${numerosSelecionados.join(", ")}\n\nCódigo: ${hash ? hash.substring(0, 16) + "..." : "Consulte o seu perfil"}\n\nObrigado por apoiar!`
          );
          window.open(`https://wa.me/351${tel}?text=${msg}`, "_blank");
        } else if (participante.notificacao === "email" && participante.email) {
          const hash = data.data?.hashParticipacao || data.data?.hashRaspe;
          const subject = encodeURIComponent(`Confirmação - ${jogo.nome}`);
          const body = encodeURIComponent(`Números: ${numerosSelecionados.join(", ")}\nCódigo: ${hash || "Consulte o seu perfil"}`);
          window.open(`mailto:${participante.email}?subject=${subject}&body=${body}`);
        }
        toast.success("Participação confirmada!");
        refreshBalance();
      } else {
        const err = await response.json().catch(() => null);
        toast.error(err?.error || "Erro ao participar");
      }
    } catch (error) {
      console.error("Erro ao participar:", error);
      toast.error("Erro ao participar");
    }
  };

  const processarPagamento = async (metodo: "dinheiro" | "saldo" | "mbway" | "stripe" | "transferencia") => {
    if (!jogo) return;
    await baseProcessarPagamento(metodo, criarParticipacao as any);
  };

  const handlePlayAgain = () => {
    setParticipacaoConfirmada(false);
    setNumerosSelecionados([]);
    fetchNumerosOcupados();
  };

  const precoNumero = jogo?.preco || 5;

  return {
    config,
    numerosSelecionados, setNumerosSelecionados,
    numerosDisponiveis,
    blocoSelecionado, setBlocoSelecionado,
    numerosOcupados, numerosJogados,
    provaModalOpen, setProvaModalOpen,
    numeroInfoOpen, setNumeroInfoOpen,
    numeroInfoData, numeroInfoLoading,
    fetchNumerosOcupados, fetchNumeroInfo,
    toggleNumero, selectRandomNumbers,
    handleParticipar, processarPagamento,
    precoNumero, randomOptions, handlePlayAgain,
  };
}
