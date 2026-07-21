"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  Star,
  Check,
  Phone,
  Mail,
  User,
  Euro,
  Ticket,
  Info,
  X,
  Hash,
  Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ParticipacaoConfirmacaoModal } from "@/components/modals/participacao-confirmacao-modal";
import { PlayerDataConfirmModal } from "@/components/modals/player-data-confirm-modal";
import { apiRequest } from "@/lib/api-client";
import { useGamePage } from "@/hooks/useGamePage";
import { GameDetailLayout } from "@/components/game-detail-layout";
import { GamePaymentDialog } from "@/components/game-payment-dialog";

interface JogoEuromilhoes {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  stockInicial: number;
  stockAtual: number;
  totalAngariado: number;
  totalParticipacoes: number;
  configuracao?: unknown;
  evento?: { nome: string; aldeia?: { nome: string } };
  premios?: Array<{ id: string; nome: string; descricao?: string }>;
}

interface Grelha {
  id: string;
  numero: number;
  estado: string;
  numerosOcupados: string;
  premioDescricao?: string;
  premioValor?: number;
  dataSorteio?: string;
  sorteioData?: string;
  bloqueioData?: string;
  createdAt: string;
}

const MAX_NUMEROS = 50;
const TOTAL_NUMEROS = 50;
const randomOptions = [1, 2, 3, 4, 5];

export default function EuromilhoesPage() {
  const {
    jogo, setJogo, loading, setLoading, jogoId,
    userRole, isNonRegularUser,
    participante, setParticipante, userOriginalData,
    paymentModalOpen, setPaymentModalOpen,
    confirmacaoModalOpen, setConfirmacaoModalOpen,
    participacaoCriada, setParticipacaoCriada,
    participacaoConfirmada, setParticipacaoConfirmada,
    playerDataConfirmOpen, setPlayerDataConfirmOpen,
    playerDataModified, setPlayerDataModified,
    refreshBalance,
    handlePlayerConfirmOwnData,
    handlePlayerConfirmNewData,
    processarPagamento: baseProcessarPagamento,
  } = useGamePage<JogoEuromilhoes>();

  const [grelha, setGrelha] = useState<Grelha | null>(null);
  const [numerosSelecionados, setNumerosSelecionados] = useState<number[]>([]);
  const [numerosOcupados, setNumerosOcupados] = useState<number[]>([]);
  const [submetendo, setSubmetendo] = useState(false);

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
          if (grelhasData.success && grelhasData.data) {
            const allGrelhas: Grelha[] = grelhasData.data;
            const open = allGrelhas.find((g) => g.estado === "aberta");
            setGrelha(open || allGrelhas[0] || null);
          }
          try {
            const ocupRes = await fetch(`/api/jogos/${jogoData.id}/numeros-ocupados`);
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
    } else if (numerosSelecionados.length < MAX_NUMEROS) {
      setNumerosSelecionados((prev) => [...prev, num].sort((a, b) => a - b));
    } else {
      toast.warning(`Máximo de ${MAX_NUMEROS} números.`);
    }
  }, [numerosSelecionados, numerosOcupados]);

  const selectRandomNumbers = useCallback((count: number) => {
    const available = Array.from({ length: TOTAL_NUMEROS }, (_, i) => i + 1).filter(
      (n) => !numerosSelecionados.includes(n) && !numerosOcupados.includes(n)
    );
    if (available.length === 0) { toast.warning("Sem números disponíveis"); return; }
    const shuffled = available.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, MAX_NUMEROS - numerosSelecionados.length));
    setNumerosSelecionados([...numerosSelecionados, ...selected]);
  }, [numerosSelecionados, numerosOcupados]);

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
      quantidade: 1,
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
        setParticipacaoCriada(data.participacao || data.data || data);
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

  const totalPago = (jogo?.preco || 0) * numerosSelecionados.length;

  if (loading) {
    return <GameDetailLayout title="Euromilhões" loading><></></GameDetailLayout>;
  }

  if (participacaoConfirmada) {
    return (
      <GameDetailLayout title="Confirmação" userRole={userRole}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-serif text-2xl text-accent font-bold">Participação Confirmada!</h2>
          <p className="text-muted-foreground mt-2">Obrigado pela sua participação no Euromilhões</p>
        </div>
        <div className="bg-surface-container rounded-3xl overflow-hidden mb-6">
          <div className="p-6 md:p-8 space-y-6">
            <div className="text-center border-b border-outline-variant/15 pb-6">
              <p className="text-sm text-secondary font-semibold tracking-widest uppercase mb-2">Os Teus Números</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {numerosSelecionados.map((num) => (
                  <span key={num} className="bg-primary text-primary-foreground w-12 h-12 rounded-xl text-xl font-bold flex items-center justify-center">{num}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-high rounded-xl p-4 text-center">
                <p className="text-[10px] text-on-surface/50 uppercase">Total Pago</p>
                <p className="text-xl font-bold text-green-400">{totalPago.toFixed(2)}€</p>
              </div>
              <div className="bg-surface-container-high rounded-xl p-4 text-center">
                <p className="text-[10px] text-on-surface/50 uppercase">Números</p>
                <p className="text-xl font-bold text-primary">{numerosSelecionados.length}</p>
              </div>
            </div>
            {grelha && (
              <div className="bg-surface-container-high rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-on-surface/60">Grelha nº:</span>
                  <span className="text-lg font-bold text-primary">{grelha.numero}</span>
                </div>
                {grelha.premioDescricao && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-on-surface/60">Prémio:</span>
                    <span className="text-sm font-bold text-green-400">{grelha.premioDescricao}</span>
                  </div>
                )}
              </div>
            )}
            <div className="bg-surface-container-high rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface/60">Participações:</span>
                <span className="text-lg font-bold text-primary">{jogo?.totalParticipacoes || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface/60">Total angariado:</span>
                <span className="text-lg font-bold text-green-400">{jogo?.totalAngariado?.toFixed(2) || "0.00"}€</span>
              </div>
            </div>
            <div className="bg-surface-container-highest/50 rounded-2xl p-4 text-center">
              <p className="text-xs text-on-surface/40">Guarde os seus números. O sorteio será realizado na data indicada.</p>
            </div>
          </div>
        </div>
        <Button onClick={() => { setParticipacaoConfirmada(false); setNumerosSelecionados([]); fetchData(); }}
          className="w-full py-6 bg-primary text-primary-foreground font-bold rounded-xl">
          Participar Novamente
        </Button>
      </GameDetailLayout>
    );
  }

  return (
    <GameDetailLayout title="Euromilhões" userRole={userRole}
      headerRight={grelha ? (
        <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
          <Hash className="w-3 h-3 text-primary" />
          <span className="text-xs font-bold text-primary">Grelha {grelha.numero}</span>
        </div>
      ) : undefined}>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-container to-[#2d1a0f] p-1">
        <div className="bg-surface-container-highest/90 backdrop-blur-md rounded-[1.9rem] p-6 md:p-8">
          <div className="mb-4 inline-block bg-secondary-container/10 border border-secondary-container/20 px-3 py-1 rounded-full">
            <span className="text-secondary text-xs font-bold tracking-widest uppercase">{jogo?.evento?.aldeia?.nome || "EUROMILHÕES"}</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface">{jogo?.nome || "Euromilhões"}</h2>
          </div>
          <p className="text-primary text-lg font-medium">Escolhe 1 a 50 números de 1 a 50</p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-surface-container rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-secondary text-sm font-semibold tracking-widest uppercase mb-1">Preço por Número</p>
            <div className="flex items-center gap-2">
              <Euro className="w-5 h-5 text-primary" />
              <span className="text-2xl font-headline font-bold text-on-surface">{jogo?.preco?.toFixed(2) || "2.00"}€</span>
            </div>
          </div>
          {grelha?.premioDescricao && (
            <div className="bg-primary-container text-on-primary-container px-4 py-2 rounded-2xl flex items-center gap-2">
              <Star className="w-4 h-4" /><span className="text-sm font-bold">{grelha.premioDescricao}</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-container-high rounded-xl p-3 text-center">
            <p className="text-[10px] text-on-surface/50 uppercase">Total</p>
            <p className="text-lg font-bold">{TOTAL_NUMEROS}</p>
          </div>
          <div className="bg-surface-container-high rounded-xl p-3 text-center">
            <p className="text-[10px] text-on-surface/50 uppercase">Disponíveis</p>
            <p className="text-lg font-bold text-green-400">{TOTAL_NUMEROS - numerosOcupados.length}</p>
          </div>
          <div className="bg-surface-container-high rounded-xl p-3 text-center">
            <p className="text-[10px] text-on-surface/50 uppercase">Vendidos</p>
            <p className="text-lg font-bold text-primary">{numerosOcupados.length}</p>
          </div>
        </div>
      </div>

      {/* Sorteio info */}
      {grelha?.sorteioData && (
        <div className="bg-surface-container rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Próximo Sorteio</p>
            <p>{new Date(grelha.sorteioData).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
            {grelha.bloqueioData && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Participações encerram em {new Date(grelha.bloqueioData).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Number grid */}
      <div className="bg-surface-container rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-4">
          <Hash className="w-5 h-5 text-secondary" />
          <h4 className="text-xl font-headline font-bold">Escolha os seus números</h4>
        </div>
        <div className="bg-surface-container-high rounded-xl p-3">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-surface-container-highest border border-outline-variant" /><span className="text-muted-foreground">Disponível</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-secondary" /><span className="text-muted-foreground">Selecionado</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-900/40 border-2 border-red-800/60" /><span className="text-muted-foreground">Indisponível</span></div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-muted-foreground">{numerosSelecionados.length}/{MAX_NUMEROS} selecionados</p>
            <div className="flex items-center gap-1">
              {numerosSelecionados.length > 0 && (
                <button onClick={() => setNumerosSelecionados([])} className="px-3 py-1 rounded-lg text-xs font-medium bg-destructive/20 text-red-400 hover:bg-destructive/30 flex items-center gap-1">
                  <X className="w-3 h-3" /> Limpar
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Aleatório:</span>
            {randomOptions.map((count) => (
              <button key={count} onClick={() => selectRandomNumbers(count)} disabled={numerosSelecionados.length >= MAX_NUMEROS}
                className="px-2 py-1 rounded-lg text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50 flex items-center gap-1">
                <Shuffle className="w-3 h-3" /> {count}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-10 gap-2">
          {Array.from({ length: TOTAL_NUMEROS }, (_, i) => i + 1).map((num) => {
            const sel = numerosSelecionados.includes(num);
            const ocup = numerosOcupados.includes(num);
            return (
              <button key={num} onClick={() => toggleNumero(num)} disabled={ocup}
                className={`aspect-square rounded-xl text-sm font-bold transition-all ${
                  sel ? "bg-secondary text-primary-foreground scale-110 shadow-lg shadow-secondary/30 ring-2 ring-secondary ring-offset-2 ring-offset-background"
                  : ocup ? "bg-red-900/30 text-red-400/60 cursor-not-allowed border border-red-800/40"
                  : "bg-surface-container-highest text-on-surface hover:bg-muted/50 hover:scale-105 active:scale-95"
                }`}>
                {num}
              </button>
            );
          })}
        </div>
        {numerosSelecionados.length > 0 && (
          <div className="bg-secondary-container/10 border border-secondary-container/20 rounded-xl p-4">
            <p className="text-xs text-secondary mb-3 font-medium">Números selecionados:</p>
            <div className="flex flex-wrap gap-2">
              {numerosSelecionados.map((num) => (
                <span key={num} onClick={() => toggleNumero(num)}
                  className="bg-secondary text-primary-foreground w-10 h-10 rounded-xl text-sm font-bold flex items-center justify-center cursor-pointer hover:opacity-80">
                  {num}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Customer form */}
      <div className="bg-surface-container rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-4">
          <User className="w-5 h-5 text-secondary" />
          <h4 className="text-xl font-headline font-bold">Dados do Cliente</h4>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wider">Nome Completo *</label>
          <div className="flex items-center gap-3 bg-surface-container-high rounded-xl px-4 py-3">
            <User className="w-5 h-5 text-primary" />
            <input type="text" value={participante.nome} onChange={(e) => setParticipante((p) => ({ ...p, nome: e.target.value }))}
              className="flex-1 bg-transparent outline-none text-foreground" placeholder="O seu nome" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Telemóvel *</label>
            <div className="flex items-center gap-3 bg-surface-container-high rounded-xl px-4 py-3">
              <Phone className="w-5 h-5 text-primary" />
              <input type="tel" value={participante.telefone} onChange={(e) => setParticipante((p) => ({ ...p, telefone: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-foreground" placeholder="+351 000 000 000" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Email (opcional)</label>
            <div className="flex items-center gap-3 bg-surface-container-high rounded-xl px-4 py-3">
              <Mail className="w-5 h-5 text-primary" />
              <input type="email" value={participante.email} onChange={(e) => setParticipante((p) => ({ ...p, email: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-foreground" placeholder="email@exemplo.com" />
            </div>
          </div>
        </div>
      </div>

      <Button onClick={handleParticipar} disabled={numerosSelecionados.length < 1 || !participante.nome.trim() || submetendo}
        className="w-full py-6 bg-primary text-primary-foreground font-bold rounded-full text-lg hover:shadow-[0_0_20px_rgba(255,115,75,0.4)]">
        <Ticket className="w-5 h-5 mr-2" /> Participar — {totalPago.toFixed(2)}€
      </Button>

      <p className="text-center text-on-surface/40 text-xs">Ao participar, concorda com os termos do jogo. Escolha 1 a 50 números de 1 a 50.</p>

      <div className="bg-surface-container-high rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-secondary mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Como funciona o Euromilhões</p>
          <p>Selecione entre 1 a 50 números. O sorteio será realizado na data indicada pelo organizador. Todos os lucros revertem para a associação cultural.</p>
        </div>
      </div>

      <GamePaymentDialog
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        amount={jogo?.preco || 0}
        gameName="Euromilhões"
        onSelect={processarPagamento}
        description={`${numerosSelecionados.length} número${numerosSelecionados.length > 1 ? "s" : ""} selecionado${numerosSelecionados.length > 1 ? "s" : ""} — Total: ${totalPago.toFixed(2)}€`}
      />

      <ParticipacaoConfirmacaoModal open={confirmacaoModalOpen} onOpenChange={setConfirmacaoModalOpen} participacao={participacaoCriada} />

      <PlayerDataConfirmModal
        open={playerDataConfirmOpen}
        onOpenChange={setPlayerDataConfirmOpen}
        userName={userOriginalData.nome}
        userPhone={userOriginalData.telefone}
        userEmail={userOriginalData.email}
        onConfirmWithOwnData={handlePlayerConfirmOwnData}
        onConfirmWithNewData={handlePlayerConfirmNewData}
      />
    </GameDetailLayout>
  );
}
