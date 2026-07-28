"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiRequest } from '@/lib/api-client';
import { Gamepad2, Sparkles, Ticket } from "lucide-react";
import type { Participacao, Jogo, UserProfile } from "./cliente-dashboard-types";

const itemsPerPage = 10;

export function useClienteDashboard() {
  const router = useRouter();

  const [participacoes, setParticipacoes] = useState<Participacao[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("jogos");
  const [saldo, setSaldo] = useState(0);
  const [walletStats, setWalletStats] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [numberSelectorOpen, setNumberSelectorOpen] = useState(false);
  const [poioDaVacaOpen, setPoioDaVacaOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedJogo, setSelectedJogo] = useState<Jogo | null>(null);
  const [selectedParticipacao, setSelectedParticipacao] = useState<Participacao | null>(null);
  const [numerosSelecionados, setNumerosSelecionados] = useState<number[]>([]);
  const [selecaoPoioDaVaca, setSelecaoPoioDaVaca] = useState<{ letra: string; numero: number }[]>([]);
  const [numerosOcupadosPoio, setNumerosOcupadosPoio] = useState<{ letra: string; numero: number }[]>([]);
  const [numerosOcupadosRifa, setNumerosOcupadosRifa] = useState<number[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAldeia, setConfirmAldeia] = useState<{ jogo: Jogo; nome: string } | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [victoryOpen, setVictoryOpen] = useState(false);
  const [victoryPremio, setVictoryPremio] = useState<any>(null);
  const [detalhesParticipacaoOpen, setDetalhesParticipacaoOpen] = useState(false);
  const [participacaoDetalhes, setParticipacaoDetalhes] = useState<any>(null);
  const [provaModalOpen, setProvaModalOpen] = useState(false);
  const [provaParticipacaoId, setProvaParticipacaoId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [jogosPage, setJogosPage] = useState(1);
  const [participacoesPage, setParticipacoesPage] = useState(1);
  const [extratoPage, setExtratoPage] = useState(1);
  const [rankingPage, setRankingPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [partRes, jogosRes, walletRes, perfilRes] = await Promise.all([
        apiRequest("/api/participacoes"),
        apiRequest("/api/jogos?ativos=true"),
        apiRequest("/api/wallet"),
        apiRequest("/api/users/perfil"),
      ]);

      if (partRes.ok) { const d = await partRes.json(); setParticipacoes(d.data); }
      if (jogosRes.ok) { const d = await jogosRes.json(); setJogos(d.data); }
      if (walletRes.ok) {
        const d = await walletRes.json();
        setSaldo(d.saldo);
        setWalletStats(d);
      }
      if (perfilRes.ok) {
        const d = await perfilRes.json();
        const profile = d.data;
        setUserProfile(profile);
        if (profile?.role !== 'super_admin' && !profile?.aldeiaId) setWizardOpen(true);
      }
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    setJogosPage(1);
    setParticipacoesPage(1);
    setExtratoPage(1);
    setRankingPage(1);
  }, [searchQuery]);

  const proceedToJogo = useCallback((jogo: Jogo) => {
    const tipoRoute: Record<string, string> = {
      rifa: "/jogos/rifa",
      raspadinha: "/jogos/raspadinha-premium",
      euromilhoes: "/jogos/euromilhoes",
      poio_da_vaca: "/jogos/poio-da-vaca",
    };
    router.push(`${tipoRoute[jogo.tipo] || "/jogos"}?jogoId=${jogo.id}`);
  }, [router]);

  const handleJogar = useCallback((jogo: Jogo) => {
    const aldeiaDoJogo = jogo.evento?.aldeia?.nome;
    const minhaAldeiaNome = userProfile?.aldeia?.nome;
    if (userProfile?.role !== 'super_admin' && minhaAldeiaNome && aldeiaDoJogo && aldeiaDoJogo !== minhaAldeiaNome) {
      setConfirmAldeia({ jogo, nome: aldeiaDoJogo });
      setConfirmOpen(true);
      return;
    }
    proceedToJogo(jogo);
  }, [userProfile, proceedToJogo]);

  const filteredJogos = useMemo(() => {
    if (!searchQuery) return jogos;
    const q = searchQuery.toLowerCase();
    return jogos.filter(j =>
      j.nome.toLowerCase().includes(q) ||
      j.tipo.toLowerCase().includes(q) ||
      j.evento?.nome?.toLowerCase().includes(q) ||
      j.evento?.aldeia?.nome?.toLowerCase().includes(q)
    );
  }, [jogos, searchQuery]);

  const filteredParticipacoes = useMemo(() => {
    if (!searchQuery) return participacoes;
    const q = searchQuery.toLowerCase();
    return participacoes.filter(p =>
      p.jogo?.nome?.toLowerCase().includes(q) ||
      p.jogo?.tipo?.toLowerCase().includes(q) ||
      p.jogo?.evento?.aldeia?.nome?.toLowerCase().includes(q)
    );
  }, [participacoes, searchQuery]);

  const paginatedJogos = filteredJogos.slice((jogosPage - 1) * itemsPerPage, jogosPage * itemsPerPage);
  const paginatedParticipacoes = filteredParticipacoes.slice((participacoesPage - 1) * itemsPerPage, participacoesPage * itemsPerPage);
  const extratoItems = walletStats?.transacoes || [];
  const paginatedExtrato = extratoItems.slice((extratoPage - 1) * itemsPerPage, extratoPage * itemsPerPage);

  const handleRevelarRaspadinha = useCallback((participacao: Participacao) => {
    setSelectedParticipacao(participacao);
    router.push(`/jogos/raspadinha-premium?participacaoId=${participacao.id}`);
  }, [router]);

  const handleVerVitoria = useCallback((participacao: Participacao) => {
    if (participacao.ganhador && participacao.jogo?.premios && participacao.jogo.premios.length > 0) {
      setVictoryPremio({
        premio: participacao.jogo.premios[0],
        jogoNome: participacao.jogo.nome,
        tipoJogo: participacao.jogo.tipo,
      });
      setVictoryOpen(true);
    }
  }, []);

  const handleConfirmarPagamento = useCallback(async (metodo: string = "mbway") => {
    if (!selectedJogo) return;
    let dadosParticipacao: Record<string, unknown> = {};
    if (selectedJogo.tipo === "rifa" || selectedJogo.tipo === "euromilhoes") dadosParticipacao = { numeros: numerosSelecionados };
    else if (selectedJogo.tipo === "poio_da_vaca") dadosParticipacao = { coordenadas: selecaoPoioDaVaca };

    const response = await apiRequest("/api/participacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jogoId: selectedJogo.id,
        dadosParticipacao,
        quantidade: numerosSelecionados.length || selecaoPoioDaVaca.length || 1,
        metodoPagamento: metodo,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      toast.success("Participação registada!");
      setPaymentOpen(false);
      setNumberSelectorOpen(false);
      setPoioDaVacaOpen(false);
      setNumerosSelecionados([]);
      setSelecaoPoioDaVaca([]);
      if (selectedJogo.tipo === "raspadinha" && data.participacao) {
        router.push(`/jogos/raspadinha-premium?participacaoId=${data.participacao.id}`);
      }
      fetchData();
    } else {
      const error = await response.json();
      toast.error(error.error || "Erro ao registar participação");
    }
  }, [selectedJogo, numerosSelecionados, selecaoPoioDaVaca, router, fetchData]);

  const handleRevelar = useCallback(async (participacaoId?: string) => {
    const id = participacaoId || selectedParticipacao?.id;
    if (!id) return;
    const response = await fetch(`/api/participacoes/${id}/revelar`, { method: "POST" });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Erro ao revelar");
    }
    fetchData();
  }, [selectedParticipacao, fetchData]);

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "raspadinha": return <Sparkles className="h-5 w-5" />;
      case "poio_da_vaca": return <Gamepad2 className="h-5 w-5" />;
      default: return <Ticket className="h-5 w-5" />;
    }
  };

  const stats = useMemo(() => [
    { icon: Ticket, label: "Participações", value: participacoes.length, bgClass: "bg-secondary/20", textClass: "text-secondary" },
    { icon: Ticket, label: "Total Investido", value: participacoes.reduce((sum, p) => sum + p.valorPago, 0), bgClass: "bg-primary/20", textClass: "text-primary", isCurrency: true },
    { icon: Ticket, label: "Prémios Ganhos", value: walletStats?.historicoPremios?.total || 0, bgClass: "bg-amber-500/20", textClass: "text-amber-500", isCurrency: true },
    { icon: Ticket, label: "Cashback", value: walletStats?.transacoes?.filter((t: any) => t.tipo === 'cashback').reduce((acc: number, t: any) => acc + t.valor, 0) || 0, bgClass: "bg-green-500/20", textClass: "text-green-500", isCurrency: true },
  ], [participacoes, walletStats]);

  return {
    router, fetchData, getTipoIcon,
    participacoes, jogos, loading, activeTab, setActiveTab,
    saldo, walletStats, userProfile,
    numberSelectorOpen, setNumberSelectorOpen,
    poioDaVacaOpen, setPoioDaVacaOpen,
    paymentOpen, setPaymentOpen,
    selectedJogo, setSelectedJogo,
    selectedParticipacao, setSelectedParticipacao,
    numerosSelecionados, setNumerosSelecionados,
    selecaoPoioDaVaca, setSelecaoPoioDaVaca,
    numerosOcupadosPoio, setNumerosOcupadosPoio,
    numerosOcupadosRifa, setNumerosOcupadosRifa,
    confirmOpen, setConfirmOpen, confirmAldeia, setConfirmAldeia,
    wizardOpen, setWizardOpen,
    victoryOpen, setVictoryOpen, victoryPremio, setVictoryPremio,
    detalhesParticipacaoOpen, setDetalhesParticipacaoOpen,
    participacaoDetalhes, setParticipacaoDetalhes,
    provaModalOpen, setProvaModalOpen,
    provaParticipacaoId, setProvaParticipacaoId,
    searchQuery, setSearchQuery,
    jogosPage, setJogosPage, participacoesPage, setParticipacoesPage,
    extratoPage, setExtratoPage, rankingPage, setRankingPage,
    itemsPerPage,
    handleJogar, proceedToJogo,
    handleRevelarRaspadinha, handleVerVitoria,
    handleConfirmarPagamento, handleRevelar,
    filteredJogos, filteredParticipacoes,
    paginatedJogos, paginatedParticipacoes,
    extratoItems, paginatedExtrato,
    stats,
  };
}
