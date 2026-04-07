"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useScratchSound } from "@/hooks/useScratchSound";
import { ArrowLeft, Star, Sparkles, Gem, Coins, Heart, Trophy, LucideIcon, Home, Gamepad2, User, House, Lock, Loader2 } from "lucide-react";
import { UserMenuButton } from "@/components/user-menu-button";
import { toast } from "sonner";

function RaspadinhaLoading() {
  return (
    <div className="min-h-screen bg-[#110d0c] text-[#eae0de] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 text-[#ff734b] animate-spin" />
        <p className="text-sm text-[#e0bfb7]">A carregar jogo...</p>
      </div>
    </div>
  );
}

const iconMap: Record<string, LucideIcon> = {
  military_tech: Trophy,
  stars: Star,
  diamond: Gem,
  coins: Coins,
  favorite: Heart,
  home: Home,
  sports_esports: Gamepad2,
  person: User,
  trophy: Trophy,
  star: Star,
  coin: Coins,
  heart: Heart,
};

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
  estado: string;
  descricao?: string;
  configuracao: {
    titulo?: string;
    subtitulo?: string;
    organizacao?: string;
    premioMaximo?: number;
    premios?: Prize[];
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
  const searchParams = useSearchParams();
  const jogoId = searchParams.get("id");
  
  const [jogo, setJogo] = useState<Jogo | null>(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<SlotState[]>([]);
  const [showWin, setShowWin] = useState(false);
  const [winningPrize, setWinningPrize] = useState<Prize | null>(null);
  const [totalRevealed, setTotalRevealed] = useState(0);
  const [participacaoId, setParticipacaoId] = useState<string | null>(null);
  const [canvasesInitialized, setCanvasesInitialized] = useState(false);
  const [gamePhase, setGamePhase] = useState<GamePhase>("not_paid");
  const [premioClaimed, setPremioClaimed] = useState(false);
  const [creditedAmount, setCreditedAmount] = useState<number | null>(null);
  const [showPurchaseAnimation, setShowPurchaseAnimation] = useState(false);
  const { playScratch } = useScratchSound();

  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const isDraggingRef = useRef<Map<number, boolean>>(new Map());
  const lastSoundTimeRef = useRef<Map<number, number>>(new Map());
  const lastPosRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const scratchGridRef = useRef<Map<number, Set<string>>>(new Map());
  const SLOT_SIZE = 120;
  const CELL_SIZE = 6;
  const initializedRef = useRef(false);

  useEffect(() => {
    if (jogoId) {
      fetchJogo();
    } else {
      setLoading(false);
    }
  }, [jogoId]);

  useEffect(() => {
    const stored = sessionStorage.getItem(`raspadinha_${jogoId}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.participacaoId && data.grid && data.jogoId === jogoId) {
          setParticipacaoId(data.participacaoId);
          initSlotsFromGrid(data.grid);
          setGamePhase("paid");
        }
      } catch {
        sessionStorage.removeItem(`raspadinha_${jogoId}`);
      }
    }
  }, [jogoId]);

  const fetchJogo = async () => {
    if (!jogoId) return;
    
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      
      const res = await fetch(`/api/jogos/${jogoId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setJogo(data.data);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar jogo:", error);
      toast.error("Erro ao carregar o jogo");
    } finally {
      setLoading(false);
    }
  };

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

  const handleJogar = async () => {
    if (!jogoId) return;
    
    setGamePhase("payment_loading");
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Faça login para jogar");
        setGamePhase("not_paid");
        return;
      }

      const res = await fetch("/api/participacoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jogoId,
          dadosParticipacao: {},
          quantidade: 1,
          metodoPagamento: "dinheiro",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erro ao processar pagamento");
        setGamePhase("not_paid");
        return;
      }

      const data = await res.json();
      const participacao = data.participacao;
      
      if (participacao?.id && participacao?.grid) {
        setParticipacaoId(participacao.id);
        initSlotsFromGrid(participacao.grid);
        
        sessionStorage.setItem(`raspadinha_${jogoId}`, JSON.stringify({
          participacaoId: participacao.id,
          grid: participacao.grid,
          jogoId,
        }));

        setShowPurchaseAnimation(true);
        setTimeout(() => {
          setShowPurchaseAnimation(false);
          setGamePhase("paid");
        }, 600);
      } else {
        toast.error("Erro ao iniciar jogo");
        setGamePhase("not_paid");
      }
    } catch (error) {
      console.error("Erro ao criar participação:", error);
      toast.error("Erro ao conectar com o servidor");
      setGamePhase("not_paid");
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

    ctx.fillStyle = "#393432";
    ctx.fillRect(0, 0, SLOT_SIZE * 2, SLOT_SIZE * 2);

    ctx.fillStyle = "rgba(255, 115, 75, 0.15)";
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

    ctx.fillStyle = "#ff734b";
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

  const claimPremio = useCallback(async (pId: string) => {
    if (!pId || premioClaimed) return;
    
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`/api/participacoes/${pId}/claim-premio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      
      if (data.success) {
        setCreditedAmount(data.creditedAmount);
        setPremioClaimed(true);
      } else if (data.alreadyClaimed) {
        setCreditedAmount(data.creditedAmount);
        setPremioClaimed(true);
      } else {
        console.error("Claim failed:", data.error || data.reason);
        toast.error(data.error || "Erro ao receber prémio");
      }
    } catch (error) {
      console.error("Erro ao reclamar prémio:", error);
    }
  }, [premioClaimed]);

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
              
              if (participacaoId && !premioClaimed) {
                claimPremio(participacaoId);
              }
            }
          });

          if (revealedSlots.length === 9) {
            setGamePhase("all_revealed");
          }

          return newSlots;
        });
      }
    },
    [slots, playScratch, jogoId, participacaoId, premioClaimed, claimPremio]
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
          
          if (participacaoId && !premioClaimed) {
            claimPremio(participacaoId);
          }
        }
      });

      setTotalRevealed(9);
      setGamePhase("all_revealed");
      return newSlots;
    });
  }, [slots, participacaoId, premioClaimed, claimPremio]);

  const handleComprarNova = () => {
    setGamePhase("not_paid");
    setSlots([]);
    setTotalRevealed(0);
    setParticipacaoId(null);
    setWinningPrize(null);
    setShowWin(false);
    setPremioClaimed(false);
    setCreditedAmount(null);
    initializedRef.current = false;
    setCanvasesInitialized(false);
    scratchGridRef.current.clear();
    lastPosRef.current.clear();
    canvasRefs.current.clear();
    if (jogoId) {
      sessionStorage.removeItem(`raspadinha_${jogoId}`);
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
    <div className="min-h-screen bg-[#110d0c] text-[#eae0de] font-body pb-32">
      <header className="sticky top-0 z-50 bg-[#110d0c]/95 backdrop-blur-xl border-b border-[#ff734b]/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="font-serif italic text-[#ff734b] text-lg font-bold">
              {organizacao}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif font-bold text-lg text-[#ffb5a0]">
              {titulo}
            </h1>
            <button 
              onClick={() => router.back()}
              className="p-2 rounded-full text-[#ff734b] hover:bg-[#2e2928] active:scale-95 transition-all"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9cefff]">
            {subtitulo}
          </p>
          <h2 className="font-serif text-3xl font-bold tracking-tight">
            Ganha até{" "}
            <span className="text-[#ff734b]">{premioMaximo.toLocaleString("pt-PT")}€</span>
          </h2>
        </motion.section>

        {gamePhase === "not_paid" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-tr from-[#ff734b]/20 to-[#9cefff]/20 rounded-[24px] blur-xl" />
            <div className="relative bg-[#1f1b19] rounded-[24px] p-8 shadow-2xl flex flex-col items-center gap-4">
              <Lock className="w-12 h-12 text-[#ff734b]/60" />
              <p className="text-center text-[#e0bfb7] text-sm">
                Compre a sua raspadinha para começar a jogar
              </p>
              <p className="text-4xl font-bold text-[#9cefff]">
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
            <div className="absolute -inset-1 bg-gradient-to-tr from-[#ff734b]/20 to-[#9cefff]/20 rounded-[24px] blur-xl" />
            <div className="relative bg-[#1f1b19] rounded-[24px] p-8 shadow-2xl flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-[#ff734b] animate-spin" />
              <p className="text-center text-[#e0bfb7] text-sm">
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
            <div className="absolute -inset-1 bg-gradient-to-tr from-[#ff734b]/30 to-[#9cefff]/30 rounded-[24px] blur-xl" />
            <div className="relative bg-[#1f1b19] rounded-[24px] p-8 shadow-2xl flex flex-col items-center gap-4">
              <Sparkles className="w-12 h-12 text-[#9cefff] animate-pulse" />
              <p className="text-center text-[#e0bfb7] text-lg font-bold">
                Cartela comprada!
              </p>
              <p className="text-center text-[#e0bfb7]/60 text-xs">
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
            <div className="absolute -inset-1 bg-gradient-to-tr from-[#ff734b]/20 to-[#9cefff]/20 rounded-[24px] blur-xl" />

            <div className="relative bg-[#1f1b19] rounded-[24px] p-4 shadow-2xl">
              <div className="grid grid-cols-3 gap-3">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="relative aspect-square rounded-2xl overflow-hidden bg-[#393432]"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Trophy className="text-4xl text-[#ff734b]" />
                        <p className="text-[10px] font-bold text-[#e0bfb7] mt-0.5">
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
                      <div className="absolute top-1 right-1 bg-black/60 text-[8px] text-white px-1.5 py-0.5 rounded-full font-mono">
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
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#2e2928] rounded-full">
                    <Sparkles className="text-[#9cefff] text-sm animate-pulse" />
                    <span className="text-[10px] uppercase font-bold tracking-tighter text-[#e0bfb7]">
                      Raspe para revelar
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
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
              className="w-full py-4 bg-[#ff734b] text-[#110d0c] font-bold rounded-2xl shadow-xl shadow-[#ff734b]/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span className="text-lg">Jogar por</span>
              <span className="px-2 py-0.5 bg-black/10 rounded-lg text-sm">
                {preco}€
              </span>
            </button>
          )}

          {gamePhase === "payment_loading" && (
            <button
              disabled
              className="w-full py-4 bg-[#ff734b]/50 text-[#110d0c] font-bold rounded-2xl flex items-center justify-center gap-2"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>A processar...</span>
            </button>
          )}

          {(gamePhase === "paid" || gamePhase === "all_revealed") && totalRevealed < 9 && (
            <button
              onClick={scratchAll}
              className="w-full py-4 bg-[#2e2928] text-[#e0bfb7] font-semibold rounded-2xl border border-[#58413b]/20 active:scale-[0.98] transition-all duration-200"
            >
              Raspar Tudo
            </button>
          )}

          {gamePhase === "all_revealed" && (
            <button
              onClick={handleComprarNova}
              className="w-full py-4 bg-[#ff734b] text-[#110d0c] font-bold rounded-2xl shadow-xl shadow-[#ff734b]/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
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
          className="bg-[#2e2928]/60 backdrop-blur-xl rounded-3xl p-5 space-y-3 border border-[#58413b]/10"
        >
          <h3 className="font-serif text-lg text-[#ffb5a0]">
            Prémios
          </h3>
          <div className="space-y-2">
            {jogo?.premios?.map((premio, i) => (
              <div
                key={premio.id || i}
                className="flex items-center justify-between p-3 bg-[#393432]/40 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="text-[#ff734b]" />
                  <span className="text-sm font-medium text-[#e0bfb7]">
                    {premio.nome}
                  </span>
                </div>
                <span className="font-bold text-[#9cefff]">
                  {premio.valorDinheiroAlternative ? `${premio.valorDinheiroAlternative}€` : "-"}
                </span>
              </div>
            ))}
            {!jogo?.premios?.length && (
              <>
                <div className="flex items-center justify-between p-3 bg-[#393432]/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Trophy className="text-[#ff734b]" />
                    <span className="text-sm font-medium text-[#e0bfb7]">3x Troféu de Ouro</span>
                  </div>
                  <span className="font-bold text-[#9cefff]">5.000€</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#393432]/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Star className="text-[#ffb5a0]" />
                    <span className="text-sm font-medium text-[#e0bfb7]">3x Estrela d'Aldeia</span>
                  </div>
                  <span className="font-bold text-[#9cefff]">100€</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#393432]/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Gem className="text-[#e0bfb7]" />
                    <span className="text-sm font-medium text-[#e0bfb7]">3x Cristal</span>
                  </div>
                  <span className="font-bold text-[#9cefff]">10€</span>
                </div>
              </>
            )}
          </div>
        </motion.section>
      </main>

      <AnimatePresence>
        {showWin && winningPrize && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowWin(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-[#1f1b19] rounded-3xl p-8 mx-4 max-w-sm w-full text-center border border-[#ff734b]/30 shadow-2xl shadow-[#ff734b]/20"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="text-6xl mb-4"
              >
                <Trophy className="text-[#ff734b] w-16 h-16 mx-auto" />
              </motion.div>

              <h2 className="font-serif text-3xl font-bold text-[#ff734b] mb-2">
                PARABÉNS!
              </h2>
              <p className="text-[#e0bfb7] mb-4">
                Ganhou: {winningPrize.nome}!
              </p>
              <p className="text-5xl font-bold text-[#9cefff] mb-2">
                {winningPrize.valorDinheiroAlternative}€
              </p>
              
              {premioClaimed && creditedAmount !== null && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-green-400 mb-6 font-medium"
                >
                  ✓ {creditedAmount}€ creditado na sua carteira!
                </motion.p>
              )}
              
              {!premioClaimed && (
                <p className="text-sm text-[#e0bfb7]/60 mb-6">
                  A processar o seu prémio...
                </p>
              )}

              <button
                onClick={() => setShowWin(false)}
                className="w-full py-4 bg-[#ff734b] text-[#110d0c] font-bold rounded-2xl active:scale-[0.98] transition-all"
              >
                {premioClaimed ? "Fechar" : "Receber Prémio"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 w-full z-40">
        <div className="bg-[#110d0c]/90 backdrop-blur-xl border-t border-[#ff734b]/10 rounded-t-2xl shadow-[0_-8px_32px_rgba(17,13,12,0.5)]">
          <div className="flex justify-around items-center px-4 py-3">
            {[
              { icon: Home, label: "Início", active: false, route: "/" },
              { icon: Gamepad2, label: "Jogos", active: true, route: "/jogos" },
              { icon: Trophy, label: "Prémios", active: false, route: "/premios" },
              { icon: User, label: "Perfil", active: false, route: "/perfil" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => router.push(item.route)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-90 ${
                  item.active
                    ? "bg-[#ff734b] text-[#110d0c]"
                    : "text-[#ffb5a0]/70"
                }`}
              >
                <item.icon className="text-xl" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>
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
