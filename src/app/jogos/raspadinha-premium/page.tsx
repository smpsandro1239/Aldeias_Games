"use client";
import { apiRequest } from '@/lib/api-client';

import { useState, useRef, useCallback, useEffect, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useScratchSound } from "@/hooks/useScratchSound";
import { ArrowLeft, Star, Sparkles, Gem, Trophy, Lock, Loader2, Ticket, HelpCircle, Info, Calculator, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ParticipacaoConfirmacaoModal } from "@/components/modals/participacao-confirmacao-modal";
import { PlayerDataConfirmModal } from "@/components/modals/player-data-confirm-modal";
import { ProvaJogoModal } from "@/components/modals/prova-jogo-modal";
import { useGamePage } from "@/hooks/useGamePage";
import { GamePaymentDialog } from "@/components/game-payment-dialog";
import { BottomNav } from "@/components/bottom-nav";
import { UserMenuButton } from "@/components/user-menu-button";

function RaspadinhaLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">A carregar jogo...</p>
      </div>
    </div>
  );
}

interface Prize {
  id: string;
  nome: string;
  descricao?: string | null;
  valorDinheiroAlternative?: number | null;
  imagemUrl?: string | null;
  icon?: string;
  percentagem?: number;
}

interface Jogo {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  stockAtual: number;
  stockInicial: number;
  totalAngariado: number;
  totalParticipacoes: number;
  estado: string;
  descricao?: string;
  configuracao: {
    titulo?: string;
    subtitulo?: string;
    organizacao?: string;
    premioMaximo?: number;
    premios?: Prize[];
    dataSorteio?: string;
    horaSorteio?: string;
    localSorteio?: string;
  };
  premios?: Prize[];
  evento?: {
    nome: string;
    aldeia?: { nome: string };
  };
}

interface SlotState {
  id: number;
  revealed: boolean;
  prize: Prize | null;
  scratchPercent: number;
}

type GamePhase = "not_paid" | "payment_loading" | "paid" | "all_revealed";

function RaspadinhaPremiumContent() {
  const router = useRouter();
  const {
    jogo, loading, jogoId,
    userRole, isAdmin, isNonRegularUser,
    participante, setParticipante,
    userOriginalData,
    paymentModalOpen, setPaymentModalOpen,
    confirmacaoModalOpen, setConfirmacaoModalOpen,
    participacaoCriada, setParticipacaoCriada,
    playerDataConfirmOpen, setPlayerDataConfirmOpen,
    playerDataModified, setPlayerDataModified,
    refreshBalance,
    fetchJogo,
    handlePlayerConfirmOwnData,
    handlePlayerConfirmNewData,
    processarPagamento,
  } = useGamePage<Jogo>();

  const [slots, setSlots] = useState<SlotState[]>([]);
  const [showWin, setShowWin] = useState(false);
  const [winningPrize, setWinningPrize] = useState<Prize | null>(null);
  const [totalRevealed, setTotalRevealed] = useState(0);
  const [participacaoId, setParticipacaoId] = useState<string | null>(null);
  const [canvasesInitialized, setCanvasesInitialized] = useState(false);
  const [gamePhase, setGamePhase] = useState<GamePhase>("not_paid");
  const [premioClaimed, setPremioClaimed] = useState(false);
  const [creditedAmount, setCreditedAmount] = useState<number | null>(null);
  const [winningSlotIds, setWinningSlotIds] = useState<number[]>([]);
  const [showPurchaseAnimation, setShowPurchaseAnimation] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [provaModalOpen, setProvaModalOpen] = useState(false);

  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const isDraggingRef = useRef<Map<number, boolean>>(new Map());
  const lastSoundTimeRef = useRef<Map<number, number>>(new Map());
  const lastPosRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const scratchGridRef = useRef<Map<number, Set<string>>>(new Map());
  const SLOT_SIZE = 120;
  const CELL_SIZE = 6;
  const initializedRef = useRef(false);

  const slotSummary = useMemo(() => {
    if (gamePhase !== "all_revealed" || slots.length === 0) return null;

    const counts = new Map<string, { nome: string; valor: number; count: number; ids: number[] }>();
    slots.forEach((s) => {
      if (!s.prize) return;
      const key = s.prize.id || s.prize.nome || "unknown";
      const existing = counts.get(key);
      if (existing) {
        existing.count++;
        existing.ids.push(s.id);
      } else {
        counts.set(key, {
          nome: s.prize.nome,
          valor: s.prize.valorDinheiroAlternative || 0,
          count: 1,
          ids: [s.id],
        });
      }
    });

    const items = Array.from(counts.values()).sort((a, b) => b.count - a.count || b.valor - a.valor);

    const winningPrizes = items.filter((i) => i.valor > 0);
    const closestPrize = winningPrizes.reduce(
      (best, curr) => (curr.count > (best?.count ?? 0) ? curr : best),
      null as typeof items[0] | null
    );

    const hasWon = items.some((i) => i.count >= 3 && i.valor > 0);
    const remaining = closestPrize ? 3 - closestPrize.count : 3;

    return { items, closestPrize, hasWon, remaining };
  }, [slots, gamePhase]);

  useEffect(() => {
    if (jogoId) {
      sessionStorage.removeItem(`raspadinha_${jogoId}`);
      fetchJogo();
    }
  }, [jogoId, fetchJogo]);

  const initSlotsFromGrid = (grid: Prize[]) => {
    setSlots(grid.map((prize, i) => ({
      id: i,
      revealed: false,
      prize,
      scratchPercent: 0,
    })));
    initializedRef.current = false;
    setCanvasesInitialized(false);
  };

  const processarPagamentoLocal = async (metodo: "dinheiro" | "saldo" | "mbway" | "stripe" | "transferencia") => {
    await processarPagamento(metodo, criarParticipacao);
  };

  const criarParticipacao = async (metodo: "dinheiro" | "saldo" | "pendente") => {
    if (!jogo) return;

    const payload: Record<string, unknown> = {
      jogoId: jogo.id,
      dadosParticipacao: {},
      quantidade: 1,
      metodoPagamento: metodo === "pendente" ? "mbway" : metodo
    };

    if (participante.nome && (participante.telefone || participante.email)) {
      payload.dadosCliente = {
        nome: participante.nome,
        telefone: participante.telefone || undefined,
        email: participante.email || undefined
      };
    }

    try {
      const response = await apiRequest("/api/participacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

        if (response.ok) {
        const data = await response.json();
        const participacao = data.participacao;

        if (participacao?.id && participacao?.grid) {
          setParticipacaoId(participacao.id);
          initSlotsFromGrid(participacao.grid);

          sessionStorage.setItem(`raspadinha_${jogoId}`, JSON.stringify({
            participacaoId: participacao.id,
            grid: participacao.grid,
            jogoId,
          }));

          // Definir a participação criada para mostrar no modal
          setParticipacaoCriada({
            ...participacao,
            jogo: jogo,
            valorPago: jogo.preco,
            hashRaspe: participacao.hashRaspe || participacao.hashParticipacao
          });
          setPaymentModalOpen(false);
          setShowPurchaseAnimation(true);
          setTimeout(() => {
            setShowPurchaseAnimation(false);
            setGamePhase("paid");
          }, 600);

          if (participante.notificacao === "whatsapp" && participante.telefone) {
            const telLimpo = participante.telefone.replace(/\D/g, "");
            const hash = participacao.hashRaspe || participacao.hashParticipacao;
            const msg = encodeURIComponent(`🎉 Raspadinha registada!\n\nJogo: ${jogo.nome}\nPreço: ${jogo.preco}€\n\nCódigo de Verificação: ${hash ? hash.substring(0, 16) + '...' : 'Consulte seu perfil'}\n\nObrigado por participar!`);
            const whatsappUrl = `https://wa.me/351${telLimpo}?text=${msg}`;
            window.open(whatsappUrl, "_blank");
          } else if (participante.notificacao === "email" && participante.email) {
            const hash = participacao.hashRaspe || participacao.hashParticipacao;
            const subject = encodeURIComponent(`Raspadinha Registada - ${jogo.nome}`);
            const body = encodeURIComponent(`🎉 Raspadinha registada!\n\nJogo: ${jogo.nome}\nPreço: ${jogo.preco}€\n\nCódigo de Verificação: ${hash || 'Consulte seu perfil'}\n\nObrigado por participar!\n\nAldeias Games`);
            window.open(`mailto:${participante.email}?subject=${subject}&body=${body}`);
          }
          
          toast.success("Raspadinha registada com sucesso!");
          refreshBalance();
        } else {
          toast.error("Erro ao iniciar jogo");
        }
      } else {
        const errorData = await response.json().catch(() => null);
        toast.error(errorData?.error || "Erro ao participar");
      }
    } catch (error) {
      console.error("Erro ao participar:", error);
      toast.error("Erro ao participar");
    }
  };

  const initSlotCanvas = useCallback((canvas: HTMLCanvasElement | null, slotId: number) => {
    if (!canvas) return;
    
    canvasRefs.current.set(slotId, canvas);
    
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = SLOT_SIZE * 2;
    canvas.height = SLOT_SIZE * 2;
    canvas.style.width = `${SLOT_SIZE}px`;
    canvas.style.height = `${SLOT_SIZE}px`;

    const rootStyles = getComputedStyle(document.documentElement);
    ctx.fillStyle = `hsl(${rootStyles.getPropertyValue('--surface-container-highest')})`;
    ctx.fillRect(0, 0, SLOT_SIZE * 2, SLOT_SIZE * 2);

    ctx.fillStyle = `hsl(${rootStyles.getPropertyValue('--primary')} / 0.15)`;
    for (let i = 0; i < 200; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * SLOT_SIZE * 2,
        Math.random() * SLOT_SIZE * 2,
        Math.random() * 3 + 1,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.fillStyle = `hsl(${rootStyles.getPropertyValue('--primary')})`;
    ctx.font = "bold 48px Material Symbols Rounded";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.4;
    ctx.fillText("star", SLOT_SIZE, SLOT_SIZE);
    ctx.globalAlpha = 1;
  }, []);

  useEffect(() => {
    if (slots.length > 0 && !initializedRef.current && gamePhase === "paid") {
      const timer = setTimeout(() => {
        canvasRefs.current.forEach((canvas, slotId) => {
          initSlotCanvas(canvas, slotId);
        });
        setCanvasesInitialized(true);
        initializedRef.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [slots, initSlotCanvas, gamePhase]);

  const claimPremio = useCallback(async (pId: string, claimType: "carteira" | "cofre" | "jogar_novamente" | "pagar_cliente" = "carteira") => {
    if (!pId || premioClaimed || claiming) return;
    setClaiming(true);
    
    try {
      const res = await apiRequest(`/api/participacoes/${pId}/claim-premio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ claimType }),
      });

      const data = await res.json();
      
      if (data.success) {
        setCreditedAmount(data.creditedAmount);
        setPremioClaimed(true);
        refreshBalance();
        if (claimType === "cofre") {
          toast.success("Prémio entregue ao cofre com sucesso!");
        } else if (claimType === "jogar_novamente") {
          toast.success("Prémio convertido em crédito para jogar novamente!");
        } else {
          toast.success("Prémio creditado na sua carteira!");
        }
      } else if (data.alreadyClaimed) {
        setCreditedAmount(data.creditedAmount);
        setPremioClaimed(true);
      } else {
        console.error("Claim failed:", data.error || data.reason);
        toast.error(data.error || "Erro ao receber prémio");
      }
    } catch (error) {
      console.error("Erro ao reclamar prémio:", error);
      toast.error("Erro ao reclamar prémio");
    } finally {
      setClaiming(false);
    }
  }, [premioClaimed, claiming, refreshBalance]);

  const scratchSlot = useCallback(
    async (slotId: number, x: number, y: number) => {
      const slot = slots.find((s) => s.id === slotId);
      if (!slot || slot.revealed) return;

      const canvas = canvasRefs.current.get(slotId);
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const canvasX = (x - rect.left) * scaleX;
      const canvasY = (y - rect.top) * scaleY;

      const lastPos = lastPosRef.current.get(slotId);
      if (lastPos) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.moveTo(lastPos.x * scaleX, lastPos.y * scaleY);
        ctx.lineTo(canvasX, canvasY);
        ctx.lineWidth = 50;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 25, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 5; i++) {
        const ox = (Math.random() - 0.5) * 20;
        const oy = (Math.random() - 0.5) * 20;
        ctx.beginPath();
        ctx.arc(canvasX + ox, canvasY + oy, Math.random() * 6 + 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      lastPosRef.current.set(slotId, { x: x - rect.left, y: y - rect.top });

      if (!scratchGridRef.current.has(slotId)) {
        scratchGridRef.current.set(slotId, new Set());
      }
      const grid = scratchGridRef.current.get(slotId)!;
      const gridX = Math.floor((x - rect.left) / CELL_SIZE);
      const gridY = Math.floor((y - rect.top) / CELL_SIZE);
      const radius = Math.ceil(25 / CELL_SIZE);
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius) {
            grid.add(`${gridX + dx},${gridY + dy}`);
          }
        }
      }

      const totalCells = Math.ceil(SLOT_SIZE / CELL_SIZE) * Math.ceil(SLOT_SIZE / CELL_SIZE);
      const percent = Math.min(100, Math.round((grid.size / totalCells) * 100));

      setSlots((prev) =>
        prev.map((s) =>
          s.id === slotId ? { ...s, scratchPercent: Math.max(s.scratchPercent, percent) } : s
        )
      );

      if (percent >= 60 && !slot.revealed) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        setSlots((prev) => {
          const newSlots = prev.map((s) =>
            s.id === slotId ? { ...s, revealed: true, scratchPercent: 100 } : s
          );

          const revealedSlots = newSlots.filter((s) => s.revealed);
          setTotalRevealed(revealedSlots.length);

          const prizeCounts = new Map<string, { count: number; prize: Prize }>();
          revealedSlots.forEach((s) => {
            if (s.prize) {
              const key = `${s.prize.id || s.prize.nome}`;
              const existing = prizeCounts.get(key);
              if (existing) {
                existing.count++;
              } else {
                prizeCounts.set(key, { count: 1, prize: s.prize });
              }
            }
          });

          prizeCounts.forEach(({ count, prize }) => {
            if (count >= 3 && (prize.valorDinheiroAlternative || 0) > 0) {
              setWinningPrize(prize);
              setShowWin(true);
              confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
              const winningIds = newSlots.filter(s => s.prize?.id === prize.id).map(s => s.id);
              setWinningSlotIds(winningIds.slice(0, 3));
            }
          });

          if (revealedSlots.length === 9) {
            setGamePhase("all_revealed");
          }

          return newSlots;
        });
      }
    },
    [slots, jogoId]
  );

  const handlePointerDown = useCallback(
    (slotId: number, e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      isDraggingRef.current.set(slotId, true);
      lastPosRef.current.delete(slotId);
      scratchSlot(slotId, e.clientX, e.clientY);
    },
    [scratchSlot]
  );

  const handlePointerMove = useCallback(
    (slotId: number, e: React.PointerEvent) => {
      if (!isDraggingRef.current.get(slotId)) return;
      scratchSlot(slotId, e.clientX, e.clientY);
    },
    [scratchSlot]
  );

  const handlePointerUp = useCallback((slotId: number, e: React.PointerEvent) => {
    isDraggingRef.current.set(slotId, false);
    lastPosRef.current.delete(slotId);
  }, []);

  const scratchAll = useCallback(() => {
    slots.forEach((slot) => {
      if (!slot.revealed) {
        const canvas = canvasRefs.current.get(slot.id);
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.save();
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
          }
        }
      }
    });

    setSlots((prev) => {
      const newSlots = prev.map((s) => ({ ...s, revealed: true, scratchPercent: 100 }));

      const prizeCounts = new Map<string, { count: number; prize: Prize }>();
      newSlots.forEach((s) => {
        if (s.prize) {
          const key = `${s.prize.id || s.prize.nome}`;
          const existing = prizeCounts.get(key);
          if (existing) {
            existing.count++;
          } else {
            prizeCounts.set(key, { count: 1, prize: s.prize });
          }
        }
      });

      prizeCounts.forEach(({ count, prize }) => {
        if (count >= 3 && (prize.valorDinheiroAlternative || 0) > 0) {
          setWinningPrize(prize);
          setShowWin(true);
          confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
          const winningIds = newSlots.filter(s => s.prize?.id === prize.id).map(s => s.id);
          setWinningSlotIds(winningIds.slice(0, 3));
        }
      });

      setTotalRevealed(9);
      setGamePhase("all_revealed");
      return newSlots;
    });
  }, [slots]);

  const handleJogar = () => {
    if (isNonRegularUser && !playerDataModified) {
      setPlayerDataConfirmOpen(true);
    } else {
      setPaymentModalOpen(true);
    }
  };

  const handleComprarNova = () => {
    setGamePhase("not_paid");
    setSlots([]);
    setTotalRevealed(0);
    setParticipacaoId(null);
    setWinningPrize(null);
    setWinningSlotIds([]);
    setShowWin(false);
    setPremioClaimed(false);
    setCreditedAmount(null);
    setClaiming(false);
    initializedRef.current = false;
    setCanvasesInitialized(false);
    scratchGridRef.current.clear();
    lastPosRef.current.clear();
    canvasRefs.current.clear();

    if (isNonRegularUser) {
      setPlayerDataModified(false);
      setParticipante(prev => ({
        ...prev,
        nome: userOriginalData.nome,
        telefone: userOriginalData.telefone,
        email: userOriginalData.email,
      }));
    }
  };

  if (loading) {
    return <RaspadinhaLoading />;
  }

  const titulo = jogo?.configuracao?.titulo || jogo?.nome || "RASPADINHA PREMIUM";
  const subtitulo = jogo?.configuracao?.subtitulo || "Raspe com o dedo para revelar o seu prémio!";
  const organizacao = jogo?.configuracao?.organizacao || jogo?.evento?.aldeia?.nome || "Aldeias Games";
  const premioMaximo = jogo?.configuracao?.premioMaximo || 5000;
  const preco = jogo?.preco || 2;

  return (
    <div className="min-h-screen bg-background text-foreground font-body pb-32">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-primary/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-surface-container-low rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-primary" />
            </button>
            <span className="font-serif italic text-primary text-lg font-bold">
              {organizacao}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif font-bold text-lg text-accent">
              {titulo}
            </h1>
          </div>
          <UserMenuButton />
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-1"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            {subtitulo}
          </p>
          <h2 className="font-serif text-3xl font-bold tracking-tight">
            Ganha até{" "}
            <span className="text-primary">{premioMaximo.toLocaleString("pt-PT")}€</span>
          </h2>
        </motion.section>
        
        <button
          onClick={() => setHowItWorksOpen(true)}
          className="mx-auto flex items-center gap-2 px-4 py-2 bg-surface-container/50 border border-primary/30 rounded-full text-sm text-primary hover:bg-surface-container hover:border-primary/50 transition-all"
        >
          <HelpCircle className="w-4 h-4" />
          Como Funciona
        </button>

        {gamePhase === "not_paid" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[24px] blur-xl" />
            <div className="relative bg-surface-container rounded-[24px] p-8 shadow-2xl flex flex-col items-center gap-4">
              <Lock className="w-12 h-12 text-primary/60" />
              <p className="text-center text-muted-foreground text-sm">
                Adquire a tua raspadinha e tenta a tua sorte
              </p>
              <p className="text-4xl font-bold text-secondary">
                {preco}€
              </p>
            </div>
          </motion.div>
        )}

        {gamePhase === "payment_loading" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[24px] blur-xl" />
            <div className="relative bg-surface-container rounded-[24px] p-8 shadow-2xl flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-center text-muted-foreground text-sm">
                A processar pagamento...
              </p>
            </div>
          </motion.div>
        )}

        {showPurchaseAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary/30 to-secondary/30 rounded-[24px] blur-xl" />
            <div className="relative bg-surface-container rounded-[24px] p-8 shadow-2xl flex flex-col items-center gap-4">
              <Sparkles className="w-12 h-12 text-secondary animate-pulse" />
              <p className="text-center text-muted-foreground text-lg font-bold">
                Cartela comprada!
              </p>
              <p className="text-center text-muted-foreground/60 text-xs">
                Raspe para revelar o seu prémio
              </p>
            </div>
          </motion.div>
        )}

        {(gamePhase === "paid" || gamePhase === "all_revealed") && slots.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[24px] blur-xl" />

            <div className="relative bg-surface-container rounded-[24px] p-4 shadow-2xl">
              <div className="grid grid-cols-3 gap-3">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`relative aspect-square rounded-2xl overflow-hidden bg-surface-container-highest transition-all duration-500 ${
                      slot.revealed && winningSlotIds.includes(slot.id)
                        ? "ring-2 ring-primary shadow-[0_0_12px_rgba(255,215,0,0.6)]"
                        : ""
                    }`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Trophy className="text-4xl text-primary" />
                        <p className="text-[10px] font-bold text-muted-foreground mt-0.5">
                          {slot.prize?.valorDinheiroAlternative 
                            ? `${slot.prize.valorDinheiroAlternative}€`
                            : slot.prize?.nome || "?"}
                        </p>
                      </div>
                    </div>

                    {!slot.revealed && (
                      <canvas
                        ref={(el) => {
                          if (el) {
                            canvasRefs.current.set(slot.id, el);
                            setTimeout(() => initSlotCanvas(el, slot.id), 50);
                          }
                        }}
                        className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
                        style={{ touchAction: "none" }}
                        onPointerDown={(e) => handlePointerDown(slot.id, e)}
                        onPointerMove={(e) => handlePointerMove(slot.id, e)}
                        onPointerUp={(e) => handlePointerUp(slot.id, e)}
                        onPointerLeave={(e) => handlePointerUp(slot.id, e)}
                      />
                    )}

                    {slot.scratchPercent > 10 && !slot.revealed && (
                      <div className="absolute top-1 right-1 bg-black/60 text-[8px] text-foreground px-1.5 py-0.5 rounded-full font-mono">
                        {slot.scratchPercent}%
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {totalRevealed < 9 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 flex justify-center"
                >
                  <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-full">
                    <Sparkles className="text-secondary text-sm animate-pulse" />
                    <span className="text-[10px] uppercase font-bold tracking-tighter text-muted-foreground">
                      Raspe para revelar
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {gamePhase === "all_revealed" && slotSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface-container-low/60 backdrop-blur-xl rounded-3xl p-5 space-y-3 border border-outline-variant/10"
          >
            {slotSummary.hasWon ? (
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="font-serif text-lg font-bold text-accent">Ganhaste!</h3>
              </div>
            ) : slotSummary.closestPrize && slotSummary.remaining <= 2 ? (
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-serif text-lg font-bold text-accent">
                  Por pouco! {slotSummary.remaining === 1 ? `Faltou só 1` : `Faltaram ${slotSummary.remaining}`} para ganhares {slotSummary.closestPrize.valor}€
                </h3>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg">🍀</span>
                <h3 className="font-serif text-lg font-bold text-accent">Resumo da Raspadinha</h3>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {slotSummary.items.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-2.5 rounded-xl ${
                    item.count >= 3 && item.valor > 0
                      ? "bg-yellow-500/10 ring-1 ring-yellow-500/30"
                      : "bg-surface-container-highest/40"
                  }`}
                >
                  <span className="text-sm font-medium text-muted-foreground">
                    {item.nome || "Nada"}
                  </span>
                  <span className={`text-sm font-bold ${item.count >= 3 && item.valor > 0 ? "text-yellow-500" : "text-foreground"}`}>
                    {item.count}x{item.valor > 0 ? ` ${item.valor}€` : ""}
                  </span>
                </div>
              ))}
            </div>

            {!slotSummary.hasWon && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                Tenta novamente, a próxima pode ser a boa!
              </p>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col gap-3"
        >
          {gamePhase === "not_paid" && (
            <button
              onClick={handleJogar}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-glow active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Ticket className="w-5 h-5" />
              <span className="text-lg">Participar por</span>
              <span className="px-2 py-0.5 bg-black/10 rounded-lg text-sm">
                {preco}€
              </span>
            </button>
          )}

          {gamePhase === "payment_loading" && (
            <button
              disabled
              className="w-full py-4 bg-primary/50 text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>A processar...</span>
            </button>
          )}

          {(gamePhase === "paid" || gamePhase === "all_revealed") && totalRevealed < 9 && (
            <button
              onClick={scratchAll}
              className="w-full py-4 bg-surface-container-low text-muted-foreground font-semibold rounded-2xl border border-outline-variant/20 active:scale-[0.98] transition-all duration-200"
            >
              Raspar Tudo
            </button>
          )}

          {gamePhase === "all_revealed" && winningPrize && !premioClaimed && (!isNonRegularUser || !playerDataModified) && (
            <button
              disabled={claiming}
              onClick={() => {
                if (participacaoId) claimPremio(participacaoId, "carteira");
              }}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-glow active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Trophy className="w-5 h-5" />
              <span className="text-lg">Reclamar Prémio - {winningPrize.valorDinheiroAlternative}€</span>
            </button>
          )}

          {gamePhase === "all_revealed" && winningPrize && !premioClaimed && isNonRegularUser && playerDataModified && (
            <div className="flex flex-col gap-2">
              <button
                disabled={claiming}
                onClick={() => {
                  if (participacaoId) claimPremio(participacaoId, "pagar_cliente");
                }}
                className="w-full py-3 bg-green-600 text-white font-bold rounded-2xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trophy className="w-5 h-5" />
                <span>Pagar ao Cliente - {winningPrize.valorDinheiroAlternative}€</span>
              </button>
              <button
                disabled={claiming}
                onClick={() => {
                  if (participacaoId) claimPremio(participacaoId, "cofre");
                }}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-2xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trophy className="w-5 h-5" />
                <span>Entregar ao Cofre - {winningPrize.valorDinheiroAlternative}€</span>
              </button>
              <button
                disabled={claiming}
                onClick={() => {
                  if (participacaoId) claimPremio(participacaoId, "jogar_novamente");
                }}
                className="w-full py-3 bg-surface-container-low text-muted-foreground font-semibold rounded-2xl border border-outline-variant/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
              >
                Usar para Jogar Novamente
              </button>
            </div>
          )}

          {gamePhase === "all_revealed" && (
            <button
              onClick={handleComprarNova}
              className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl shadow-glow active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Ticket className="w-5 h-5" />
              <span className="text-lg">Comprar Nova</span>
              <span className="px-2 py-0.5 bg-black/10 rounded-lg text-sm">
                {preco}€
              </span>
            </button>
          )}
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface-container-low/60 backdrop-blur-xl rounded-3xl p-5 space-y-3 border border-outline-variant/10"
        >
          <h3 className="font-serif text-lg text-accent">
            Prémios
          </h3>
          <div className="space-y-2">
            {jogo?.premios?.map((premio, i) => (
              <div
                key={premio.id || i}
                className="flex items-center justify-between p-3 bg-surface-container-highest/40 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {premio.nome}
                  </span>
                </div>
                <span className="font-bold text-secondary">
                  {premio.valorDinheiroAlternative ? `${premio.valorDinheiroAlternative}€` : "-"}
                </span>
              </div>
            ))}
            {!jogo?.premios?.length && (
              <>
                <div className="flex items-center justify-between p-3 bg-surface-container-highest/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Trophy className="text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">3x Troféu de Ouro</span>
                  </div>
                  <span className="font-bold text-secondary">5.000€</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-container-highest/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Star className="text-accent" />
                    <span className="text-sm font-medium text-muted-foreground">3x Estrela d'Aldeia</span>
                  </div>
                  <span className="font-bold text-secondary">100€</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-surface-container-highest/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Gem className="text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">3x Cristal</span>
                  </div>
                  <span className="font-bold text-secondary">10€</span>
                </div>
              </>
            )}
          </div>
        </motion.section>

        <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/10">
          <h3 className="font-serif text-accent font-bold mb-3">Como Funciona?</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Ticket className="w-4 h-4 text-primary mt-0.5" />
              <span>Compre a sua raspadinha e escolha o método de pagamento</span>
            </li>
            <li className="flex items-start gap-2">
              <Star className="w-4 h-4 text-primary mt-0.5" />
              <span>Raspe os 9 quadrados para revelar os seus prémios</span>
            </li>
            <li className="flex items-start gap-2">
              <Trophy className="w-4 h-4 text-primary mt-0.5" />
              <span>Encontre 3 símbolos iguais para ganhar o prémio correspondente</span>
            </li>
          </ul>
        </div>
      </main>

      <AnimatePresence>
        {showWin && winningPrize && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={premioClaimed ? () => setShowWin(false) : undefined}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-surface-container rounded-3xl p-5 sm:p-8 max-w-[90vw] sm:max-w-sm w-full text-center border border-primary/30 shadow-2xl shadow-glow"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="mb-3 sm:mb-4"
              >
                <Trophy className="text-primary w-12 h-12 sm:w-16 sm:h-16 mx-auto" />
              </motion.div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-primary mb-2">
                PARABÉNS!
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-3">
                Ganhou: {winningPrize.nome}!
              </p>
              <p className="text-4xl sm:text-5xl font-bold text-secondary mb-4">
                {winningPrize.valorDinheiroAlternative}€
              </p>

              {premioClaimed && creditedAmount !== null && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-green-400 mb-5 font-medium"
                >
                  ✓ {creditedAmount > 0 ? `${creditedAmount}€ creditado na sua carteira!` : "Prémio processado!"}
                </motion.p>
              )}

              {!premioClaimed && (!isNonRegularUser || !playerDataModified) && (
                <div className="mb-5 space-y-3">
                  <button
                    disabled={claiming}
                    onClick={() => {
                      if (participacaoId) claimPremio(participacaoId, "carteira");
                    }}
                    className="w-full py-3.5 sm:py-4 bg-primary text-primary-foreground font-bold rounded-2xl active:scale-[0.98] transition-all shadow-xl shadow-glow disabled:opacity-50"
                  >
                    {claiming ? "A processar..." : "Reclamar Prémio"}
                  </button>
                  <button
                    onClick={() => setShowWin(false)}
                    className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Reclamar mais tarde
                  </button>
                </div>
              )}

              {!premioClaimed && isNonRegularUser && playerDataModified && (
                <div className="mb-5 space-y-2">
                  <p className="text-xs text-muted-foreground/60 mb-2">
                    Como administrador/vendedor, escolha como处理 o prémio:
                  </p>
                  <button
                    disabled={claiming}
                    onClick={() => {
                      if (participacaoId) claimPremio(participacaoId, "pagar_cliente");
                    }}
                    className="w-full py-3 bg-green-600 text-white font-bold rounded-2xl active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {claiming ? "A processar..." : `Pagar ao Cliente - ${winningPrize.valorDinheiroAlternative}€`}
                  </button>
                  <button
                    disabled={claiming}
                    onClick={() => {
                      if (participacaoId) claimPremio(participacaoId, "cofre");
                    }}
                    className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-2xl active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {claiming ? "A processar..." : "Entregar ao Cofre"}
                  </button>
                  <button
                    disabled={claiming}
                    onClick={() => {
                      if (participacaoId) claimPremio(participacaoId, "jogar_novamente");
                    }}
                    className="w-full py-3 bg-surface-container-low text-muted-foreground font-semibold rounded-2xl border border-outline-variant/20 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    Usar para Jogar Novamente
                  </button>
                  <button
                    onClick={() => setShowWin(false)}
                    className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Reclamar mais tarde
                  </button>
                </div>
              )}

              {premioClaimed && (
                <div className="space-y-2">
                  <button
                    onClick={() => setProvaModalOpen(true)}
                    className="w-full py-3 bg-surface-container-low text-primary font-semibold rounded-2xl border border-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="h-4 w-4" /> Ver Prova de Jogo
                  </button>
                  <button
                    onClick={() => setShowWin(false)}
                    className="w-full py-3.5 sm:py-4 bg-primary text-primary-foreground font-bold rounded-2xl active:scale-[0.98] transition-all"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />

      <GamePaymentDialog
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        amount={preco}
        gameName="Raspadinha"
        showCustomerForm={true}
        participante={participante}
        setParticipante={setParticipante}
        onSelect={processarPagamentoLocal}
        description={`Raspadinha: ${jogo?.nome || ''}`}
      />

      <Dialog open={howItWorksOpen} onOpenChange={setHowItWorksOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md bg-surface-container border border-outline-variant/10 p-4 overflow-hidden max-h-[85vh] overflow-y-auto">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="font-headline text-xl flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Como Funciona a Raspadinha
            </DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-4 space-y-4">
            <div className="bg-surface-container-high rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-primary flex items-center gap-2">
                <Info className="w-4 h-4" />
                Lógica de Vitória
              </h3>
              <p className="text-sm text-muted-foreground">
                Cada raspadinha usa um sistema <strong>aleatório e justo</strong>. 
                Quando compras, é gerado um número aleatório (0-9999) que determina se ganhas e qual prémio.
              </p>
              <p className="text-sm text-muted-foreground">
                As probabilidades são definidas pelos organizadores e cada prémio tem uma percentagem de sair.
              </p>
            </div>

            {(jogo?.premios || jogo?.configuracao?.premios) && (
              <div className="bg-surface-container-high rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-primary flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Prémios e Probabilidades
                </h3>
                <div className="space-y-2">
                  {(jogo?.premios || jogo?.configuracao?.premios || []).map((premio: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-outline-variant/10 last:border-0">
                      <div>
                        <p className="font-medium text-sm">{premio.nome}</p>
                        {premio.valorDinheiroAlternative > 0 && (
                          <p className="text-xs text-secondary">{premio.valorDinheiroAlternative}€</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{premio.percentagem || 0}%</p>
                        <p className="text-xs text-muted-foreground/60">chance</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/60 mt-2 pt-2 border-t border-outline-variant/10">
                  Soma das percentagens: {(jogo?.premios || jogo?.configuracao?.premios || []).reduce((acc: number, p: any) => acc + (p.percentagem || 0), 0)}%
                </p>
              </div>
            )}

            <div className="bg-surface-container-high rounded-xl p-4 space-y-3">
              <h3 className="font-semibold text-primary flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Como Ganhar
              </h3>
              <p className="text-sm text-muted-foreground">
                Para ganhar, precisas de encontrar <strong>3 símbolos iguais</strong> entre as 9 células.
              </p>
              <p className="text-sm text-muted-foreground">
                Arranca com o dedo para revelar as células. Se encontrares 3 iguais, ganhas o prémio correspondente!
              </p>
            </div>

            {premioMaximo > 0 && (
              <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl p-4">
                <p className="text-sm text-center">
                  <span className="text-muted-foreground">Prémio máximo: </span>
                  <span className="font-bold text-primary">{premioMaximo.toLocaleString("pt-PT")}€</span>
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Participação */}
      <ParticipacaoConfirmacaoModal
        open={confirmacaoModalOpen}
        onOpenChange={setConfirmacaoModalOpen}
        participacao={participacaoCriada}
      />

      {/* Modal de Confirmação de Dados do Jogador */}
      <PlayerDataConfirmModal
        open={playerDataConfirmOpen}
        onOpenChange={setPlayerDataConfirmOpen}
        userName={userOriginalData.nome}
        userPhone={userOriginalData.telefone}
        userEmail={userOriginalData.email}
        onConfirmWithOwnData={handlePlayerConfirmOwnData}
        onConfirmWithNewData={handlePlayerConfirmNewData}
      />

      {/* Modal de Prova de Jogo */}
      <ProvaJogoModal
        open={provaModalOpen}
        onOpenChange={setProvaModalOpen}
        participacaoId={participacaoId || undefined}
      />

    </div>
  );
}

export default function RaspadinhaPremiumPage() {
  return (
    <Suspense fallback={<RaspadinhaLoading />}>
      <RaspadinhaPremiumContent />
    </Suspense>
  );
}
