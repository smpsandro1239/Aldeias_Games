"use client";
import { apiRequest } from '@/lib/api-client';

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Check,
  User,
  CreditCard,
  QrCode,
  MessageCircle,
  Shuffle,
  Euro,
  LayoutGrid,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ParticipacaoConfirmacaoModal } from "@/components/modals/participacao-confirmacao-modal";
import { PlayerDataConfirmModal } from "@/components/modals/player-data-confirm-modal";
import { useGamePage } from "@/hooks/useGamePage";
import { GameDetailLayout } from "@/components/game-detail-layout";
import { GamePaymentDialog } from "@/components/game-payment-dialog";
import { RentabilityAnalysis } from "@/components/rentability-analysis";

interface JogoRifa {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  stockInicial: number;
  stockAtual: number;
  totalAngariado: number;
  totalParticipacoes: number;
  estado: string;
  configuracao: Record<string, unknown>;
  premio?: { id: string; nome: string; descricao?: string; imagemUrl?: string };
  premios?: Array<{ id: string; nome: string; descricao?: string; valorDinheiroAlternative?: number }>;
  evento?: { nome: string; aldeia?: { nome: string } };
}

interface RifaConfig {
  numeroInicial: number;
  numeroFinal: number;
  dataSorteio?: string;
  horaSorteio?: string;
  localSorteio?: string;
  numeroBlocos: number;
  permitirStripe: boolean;
  valorPremios: number | null;
}

const DEFAULT_CONFIG: RifaConfig = {
  numeroInicial: 1,
  numeroFinal: 1000,
  numeroBlocos: 1,
  permitirStripe: false,
  valorPremios: null,
};

export default function RifaPage() {
  const router = useRouter();
  const {
    jogo, setJogo, loading, setLoading, jogoId,
    userRole, isAdmin, isNonRegularUser,
    participante, setParticipante, userOriginalData,
    paymentModalOpen, setPaymentModalOpen,
    confirmacaoModalOpen, setConfirmacaoModalOpen,
    participacaoCriada, setParticipacaoCriada,
    participacaoConfirmada, setParticipacaoConfirmada,
    playerDataConfirmOpen, setPlayerDataConfirmOpen,
    playerDataModified, setPlayerDataModified,
    saldo, refreshBalance,
    fetchJogo: baseFetchJogo,
    handlePlayerConfirmOwnData,
    handlePlayerConfirmNewData,
    processarPagamento: baseProcessarPagamento,
  } = useGamePage<JogoRifa>();

  const [config, setConfig] = useState<RifaConfig>(DEFAULT_CONFIG);
  const [numerosSelecionados, setNumerosSelecionados] = useState<number[]>([]);
  const [numerosDisponiveis, setNumerosDisponiveis] = useState<number[]>([]);
  const [blocoSelecionado, setBlocoSelecionado] = useState(1);
  const [numeroSorte, setNumeroSorte] = useState<string>("");
  const [numerosOcupados, setNumerosOcupados] = useState<number[]>([]);
  const [numerosJogados, setNumerosJogados] = useState<number[]>([]);

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
        setNumerosOcupados([...new Set(data.numerosOcupados.map((n: number) => Number(n)))]);
        setNumerosJogados(
          data.numerosDoUtilizador
            ? [...new Set(data.numerosDoUtilizador.map((n: number) => Number(n)))]
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

  const toggleNumero = (num: number) => {
    if (numerosSelecionados.includes(num)) {
      setNumerosSelecionados(numerosSelecionados.filter((n) => n !== num));
    } else if (numerosOcupados.includes(num)) {
      toast.warning("Este número já foi adquirido.");
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
        const novos = numerosSelecionados.filter((n) => !numerosOcupados.includes(n));
        if (novos.length > 0) {
          setNumerosOcupados((prev) => [...new Set([...prev, ...novos])]);
          setNumerosJogados((prev) => [...new Set([...prev, ...novos])]);
        }
        setNumeroSorte(data.data?.numero || numerosSelecionados[0].toString().padStart(5, "0"));
        setParticipacaoConfirmada(true);
        setPaymentModalOpen(false);
        setParticipacaoCriada(data.data);
        setConfirmacaoModalOpen(true);
        await fetchNumerosOcupados();

        if (participante.notificacao === "whatsapp" && participante.telefone) {
          const tel = participante.telefone.replace(/\D/g, "");
          const hash = data.data?.hashParticipacao || data.data?.hashRaspe;
          const msg = encodeURIComponent(
            `🎉 Participação Confirmada!\n\nRifa: ${jogo.nome}\nNúmeros: ${numerosSelecionados.join(", ")}\n\nCódigo: ${hash ? hash.substring(0, 16) + "..." : "Consulte seu perfil"}\n\nObrigado por apoiar!`
          );
          window.open(`https://wa.me/351${tel}?text=${msg}`, "_blank");
        } else if (participante.notificacao === "email" && participante.email) {
          const hash = data.data?.hashParticipacao || data.data?.hashRaspe;
          const subject = encodeURIComponent(`Confirmação - ${jogo.nome}`);
          const body = encodeURIComponent(`Números: ${numerosSelecionados.join(", ")}\nCódigo: ${hash || "Consulte seu perfil"}`);
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
    const custoTotal = numerosSelecionados.length * (jogo.preco || 5);
    await baseProcessarPagamento(metodo, criarParticipacao as any);
  };

  if (loading) {
    return (
      <GameDetailLayout title="Rifa" loading>
        <></>
      </GameDetailLayout>
    );
  }

  if (participacaoConfirmada) {
    const numerosVendidos = (jogo?.stockInicial || 0) - (jogo?.stockAtual || 0);
    const totalGasto = numerosSelecionados.length * (jogo?.preco || 5);
    return (
      <GameDetailLayout title="Confirmação" userRole={userRole}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-serif text-2xl text-accent font-bold">Participação Confirmada!</h2>
          <p className="text-muted-foreground mt-2">Obrigado pela sua participação</p>
        </div>
        <div className="bg-surface-container rounded-3xl overflow-hidden mb-6">
          <div className="p-6 md:p-8 space-y-6">
            <div className="text-center border-b border-outline-variant/15 pb-6">
              <p className="text-sm text-secondary font-semibold tracking-widest uppercase mb-2">Seus Números</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {numerosSelecionados.map((num) => (
                  <span key={num} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xl font-bold">
                    {num.toString().padStart(3, "0")}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-high rounded-xl p-4 text-center">
                <p className="text-[10px] text-on-surface/50 uppercase">Total Gasto</p>
                <p className="text-xl font-bold text-green-400">{totalGasto.toFixed(2)}€</p>
              </div>
              <div className="bg-surface-container-high rounded-xl p-4 text-center">
                <p className="text-[10px] text-on-surface/50 uppercase">Números Jogados</p>
                <p className="text-xl font-bold text-primary">{numerosSelecionados.length}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface-container-high rounded-xl p-3 text-center">
                <p className="text-[10px] text-on-surface/50 uppercase">Total</p>
                <p className="text-lg font-bold">{jogo?.stockInicial || 0}</p>
              </div>
              <div className="bg-surface-container-high rounded-xl p-3 text-center">
                <p className="text-[10px] text-on-surface/50 uppercase">Vendidos</p>
                <p className="text-lg font-bold text-primary">{numerosVendidos}</p>
              </div>
              <div className="bg-surface-container-high rounded-xl p-3 text-center">
                <p className="text-[10px] text-on-surface/50 uppercase">Disponíveis</p>
                <p className="text-lg font-bold text-green-400">{jogo?.stockAtual || 0}</p>
              </div>
            </div>
            <div className="bg-surface-container-high rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface/60">Angariado:</span>
                <span className="text-lg font-bold text-green-400">{jogo?.totalAngariado?.toFixed(2) || 0}€</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface/60">Participações:</span>
                <span className="text-lg font-bold text-primary">{jogo?.totalParticipacoes || 0}</span>
              </div>
            </div>
            <div className="space-y-3 text-center border-t border-outline-variant/15 pt-6">
              <p className="text-on-surface/60 text-sm flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" />
                Sorteio: {config.dataSorteio ? `${config.dataSorteio}${config.horaSorteio ? ` às ${config.horaSorteio}` : ""}` : "A definir"}
              </p>
              <p className="text-on-surface/60 text-sm flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4" />{config.localSorteio || "A definir"}
              </p>
            </div>
            <div className="bg-surface-container-highest/50 rounded-2xl p-4">
              <div className="flex justify-center mb-4">
                <div className="w-32 h-32 bg-foreground rounded-xl p-2">
                  <div className="w-full h-full bg-[#111] rounded-lg flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-foreground" />
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-on-surface/40">Guarde este código para o sorteio</p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => { setParticipacaoConfirmada(false); setNumerosSelecionados([]); fetchNumerosOcupados(); }}
          className="w-full py-6 bg-primary text-primary-foreground font-bold rounded-xl"
        >
          Participar Novamente
        </Button>
      </GameDetailLayout>
    );
  }

  const precoNumero = jogo?.preco || 5;

  return (
    <GameDetailLayout title="A Tua Rifa" userRole={userRole}>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-container to-[#3d1f1a] p-1">
        <div className="bg-surface-container-highest/90 backdrop-blur-md rounded-[1.9rem] p-6 md:p-8">
          <div className="mb-4 inline-block bg-secondary-container/10 border border-secondary-container/20 px-3 py-1 rounded-full">
            <span className="text-secondary text-xs font-bold tracking-widest uppercase">
              {jogo?.evento?.aldeia?.nome || "ASSOCIAÇÃO CULTURAL"}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface mb-2">
            {jogo?.nome || "RIFA DE ANGARIAÇÃO"}
          </h2>
          <p className="text-primary text-lg font-medium">PARTICIPE E AJUDE A NOSSA CAUSA</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-surface-container rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-secondary text-sm font-semibold tracking-widest uppercase mb-1">Grande Prémio</p>
            <h3 className="text-2xl font-headline font-bold text-on-surface">{jogo?.premio?.nome || "Prémio"}</h3>
          </div>
          <div className="bg-primary-container text-on-primary-container px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg">
            <CreditCard className="w-5 h-5 font-bold" />
            <span className="text-2xl font-extrabold">{precoNumero}€</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Calendar, label: "Data", value: config.dataSorteio || "--/--/----" },
            { icon: Clock, label: "Hora", value: config.horaSorteio || "--:--" },
            { icon: MapPin, label: "Local", value: config.localSorteio || "A definir" },
          ].map((item) => (
            <div key={item.label} className="bg-surface-container-high rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/10 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-[10px] text-on-surface/50 uppercase">{item.label}</p>
                <p className="font-bold">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rentability */}
      {isAdmin && config.valorPremios && config.valorPremios > 0 && (
        <RentabilityAnalysis
          stockInicial={jogo?.stockInicial || 0}
          stockAtual={jogo?.stockAtual || 0}
          totalAngariado={jogo?.totalAngariado || 0}
          custoPremios={config.valorPremios}
          labels={{ total: "Total Números", vendidos: "Números Vendidos", premios: "Valor Prémios" }}
        />
      )}

      {/* Number selection */}
      <div className="bg-surface-container rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-outline-variant/15 pb-4">
          <User className="w-5 h-5 text-secondary" />
          <h4 className="text-xl font-headline font-bold">Escolha os seus números</h4>
        </div>

        {config.numeroBlocos > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <LayoutGrid className="w-4 h-4 text-primary shrink-0" />
            {Array.from({ length: config.numeroBlocos }, (_, i) => i + 1).map((bloco) => (
              <button
                key={bloco}
                onClick={() => { setBlocoSelecionado(bloco); setNumerosSelecionados([]); }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  blocoSelecionado === bloco
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-container-high text-muted-foreground hover:bg-surface-container-highest"
                }`}
              >
                Bloco {bloco}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <div className="bg-surface-container-high rounded-xl p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Legenda</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-surface-container-highest border border-outline-variant" /><span className="text-muted-foreground">Disponível</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-secondary" /><span className="text-muted-foreground">Selecionado</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-orange-500/70 border-2 border-orange-400" /><span className="text-muted-foreground">Seus números</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-900/40 border-2 border-red-800/60" /><span className="text-muted-foreground">Indisponível</span></div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Selecionados: {numerosSelecionados.length}/20</p>
            <div className="flex gap-1">
              {numerosSelecionados.length > 0 && (
                <button onClick={() => setNumerosSelecionados([])} className="px-2 py-1 rounded-lg text-xs font-medium bg-destructive/20 text-red-400 hover:bg-destructive/30 flex items-center gap-1">
                  <X className="w-3 h-3" /> Limpar
                </button>
              )}
              {randomOptions.map((count) => (
                <button key={count} onClick={() => selectRandomNumbers(count)} disabled={numerosSelecionados.length >= 20}
                  className="px-2 py-1 rounded-lg text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50 flex items-center gap-1">
                  <Shuffle className="w-3 h-3" /> {count}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-5 md:grid-cols-10 gap-2 max-h-48 overflow-y-auto p-2 bg-surface-container-high rounded-xl">
            {numerosDisponiveis.map((num) => {
              const sel = numerosSelecionados.includes(num);
              const ocup = numerosOcupados.includes(num);
              const jog = numerosJogados.includes(num);
              return (
                <button key={num} onClick={() => toggleNumero(num)} disabled={ocup}
                  className={`py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                    sel ? "bg-secondary text-primary-foreground"
                    : jog ? "bg-orange-500/70 text-foreground border-2 border-orange-400 cursor-not-allowed"
                    : ocup ? "bg-red-900/40 text-red-400 cursor-not-allowed border-2 border-red-800/60"
                    : "bg-surface-container-highest text-on-surface hover:bg-muted/30"
                  }`}>
                  {num}
                </button>
              );
            })}
          </div>
        </div>

        {numerosSelecionados.length > 0 && (
          <div className="bg-secondary-container/10 border border-secondary-container/20 rounded-xl p-4">
            <p className="text-xs text-secondary mb-2">Números selecionados:</p>
            <div className="flex flex-wrap gap-2">
              {numerosSelecionados.map((num) => (
                <span key={num} className="bg-secondary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
                  {num.toString().padStart(3, "0")}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Nome Completo</label>
            <div className="flex items-center gap-3 bg-surface-container-high rounded-xl px-4 py-3">
              <User className="w-5 h-5 text-primary" />
              <input type="text" value={participante.nome} onChange={(e) => setParticipante((p) => ({ ...p, nome: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-foreground" placeholder="O seu nome" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Telemóvel</label>
            <div className="flex items-center gap-3 bg-surface-container-high rounded-xl px-4 py-3">
              <User className="w-5 h-5 text-primary" />
              <input type="tel" value={participante.telefone} onChange={(e) => setParticipante((p) => ({ ...p, telefone: e.target.value }))}
                className="flex-1 bg-transparent outline-none text-foreground" placeholder="+351 000 000 000" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wider">Notificação</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: "whatsapp" as const, icon: MessageCircle, label: "WhatsApp", color: "#25D366" },
              { value: "email" as const, icon: Check, label: "Email", color: undefined },
              { value: "nenhum" as const, icon: Check, label: "Nenhum", color: "#666" },
            ]).map((opt) => (
              <button key={opt.value} type="button" onClick={() => setParticipante((p) => ({ ...p, notificacao: opt.value }))}
                className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  participante.notificacao === opt.value
                    ? "text-foreground" : "bg-surface-container-high text-muted-foreground hover:bg-surface-container-highest"
                }`}
                style={participante.notificacao === opt.value && opt.color ? { backgroundColor: opt.color } : participante.notificacao === opt.value ? { backgroundColor: "hsl(var(--primary))" } : undefined}>
                <opt.icon className="w-4 h-4" />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleParticipar} disabled={numerosSelecionados.length === 0 || !participante.nome}
          className="w-full py-6 bg-primary text-primary-foreground font-bold rounded-full text-lg hover:shadow-[0_0_20px_rgba(255,115,75,0.4)]">
          <Ticket className="w-5 h-5 mr-2" /> Confirmar Participação
        </Button>
      </div>

      <p className="text-center text-on-surface/40 text-xs">Apoie a cultura local. Todos os lucros revertem para a associação.</p>

      <ParticipacaoConfirmacaoModal open={confirmacaoModalOpen} onOpenChange={setConfirmacaoModalOpen} participacao={participacaoCriada} />

      <GamePaymentDialog
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        amount={numerosSelecionados.length * precoNumero}
        gameName="Rifa"
        onSelect={processarPagamento}
        description={`${numerosSelecionados.length} número${numerosSelecionados.length > 1 ? "s" : ""} selecionado${numerosSelecionados.length > 1 ? "s" : ""}`}
      />

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
