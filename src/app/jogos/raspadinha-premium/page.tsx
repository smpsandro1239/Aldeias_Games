"use client";
import { apiRequest } from '@/lib/api-client';

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useScratchSound } from "@/hooks/useScratchSound";
import { ArrowLeft, Star, Sparkles, Gem, Coins, Heart, Trophy, LucideIcon, Home, Gamepad2, User, House, Lock, Loader2, Ticket, Phone, Mail, MessageCircle, Bell, Euro, HelpCircle, Info, TrendingUp, Calculator } from "lucide-react";
import { UserMenuButton } from "@/components/user-menu-button";
import { BottomNav } from "@/components/bottom-nav";
import { PaymentSelector } from "@/components/payment";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ParticipacaoConfirmacaoModal } from "@/components/modals/participacao-confirmacao-modal";

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
  const [participacaoConfirmada, setParticipacaoConfirmada] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [saldo, setSaldo] = useState(0);
  const { playScratch } = useScratchSound();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [confirmacaoModalOpen, setConfirmacaoModalOpen] = useState(false);
  const [participacaoCriada, setParticipacaoCriada] = useState<any>(null);
  const [pagamentoPendente, setPagamentoPendente] = useState<any>(null);
  const [participante, setParticipante] = useState({
    nome: "",
    telefone: "",
    email: "",
    notificacao: "whatsapp" as "whatsapp" | "email" | "nenhum"
  });
  
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const isDraggingRef = useRef<Map<number, boolean>>(new Map());
  const lastSoundTimeRef = useRef<Map<number, number>>(new Map());
  const lastPosRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const scratchGridRef = useRef<Map<number, Set<string>>>(new Map());
  const SLOT_SIZE = 120;
  const CELL_SIZE = 6;
  const initializedRef = useRef(false);

  const isAdmin = userRole === "super_admin" || userRole === "admin" || userRole === "aldeia_admin";

  useEffect(() => {
    // Always clear old session data - force fresh payment
    if (jogoId) {
      sessionStorage.removeItem(`raspadinha_${jogoId}`);
      fetchJogo();
    } else {
      setLoading(false);
    }
  }, [jogoId]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.role) setUserRole(userData.role);
        if (userData.nome) {
          setParticipante(prev => ({
            ...prev,
            nome: userData.nome,
            telefone: userData.telefone || "",
            email: userData.email || ""
          }));
        }
      } catch {}
    }
  }, []);

  const fetchJogo = async () => {
    if (!jogoId) return;
    
    try {
      const res = await fetch(`/api/jogos/${jogoId}`);
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

  const fetchSaldo = async () => {
    try {
      const res = await apiRequest("/api/wallet");
      const data = await res.json();
      if (data.saldo !== undefined) {
        setSaldo(data.saldo);
      }
    } catch (e) {
      console.error("Erro ao buscar saldo:", e);
    }
  };

  useEffect(() => {
    fetchSaldo();
  }, []);

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

  const handleJogar = () => {
    if (!jogoId) return;
    setPaymentModalOpen(true);
  };

   const processarPagamento = async (metodo: "dinheiro" | "saldo" | "mbway" | "stripe" | "transferencia") => {
     if (!jogo) return;

     // Check if user is allowed to use dinheiro method
     const user = JSON.parse(localStorage.getItem("user") || "{}");
     const userRole = user.role;
     
     // Only vendedor, aldeia_admin, and super_admin can use dinheiro
     const canUseDinheiro = ['vendedor', 'aldeia_admin', 'super_admin'].includes(userRole);
     
     if (metodo === "dinheiro" && !canUseDinheiro) {
       toast.error("Apenas vendedores e administradores podem pagar em dinheiro");
       return;
     }

     try {
        if (metodo === "dinheiro") {
         await criarParticipacao("dinheiro");
       } else if (metodo === "saldo") {
         await criarParticipacao("saldo");
       } else if (metodo === "mbway") {
         if (!participante.telefone) {
           toast.error("Telefone obrigatório para MBWay");
           return;
         }
         const res = await apiRequest("/api/pagamentos/mbway", {
           method: "POST",
           headers: { 
             "Content-Type": "application/json",
           },
           body: JSON.stringify({
             telefone: participante.telefone,
             valor: jogo.preco,
             descricao: `Raspadinha: ${jogo.nome}`
           })
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
            headers: { 
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              valor: jogo.preco,
              descricao: `Raspadinha: ${jogo.nome}`,
              metadata: { jogoId: jogo.id }
            })
          });
          const data = await res.json();
          if (!res.ok) {
            toast.error(data.error || "Erro ao processar pagamento");
            return;
          }
          // Redirect to Stripe checkout
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
          setConfirmacaoModalOpen(true);

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
          fetchSaldo();
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

  const claimPremio = useCallback(async (pId: string) => {
    if (!pId || premioClaimed) return;
    
    try {
      const res = await apiRequest(`/api/participacoes/${pId}/claim-premio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
  };

  if (loading) {
    return <RaspadinhaLoading />;
  }

  if (participacaoConfirmada) {
    return (
      <div className="min-h-screen bg-background text-foreground font-body pb-32">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-primary/10 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-surface-container-low rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-primary" />
            </button>
            <h1 className="font-serif text-xl tracking-wide text-accent font-bold italic">Confirmação</h1>
          </div>
        </header>
        <main className="px-4 pt-6 text-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-serif text-2xl text-accent font-bold">Raspadinha Registada!</h2>
          <p className="text-muted-foreground mt-2">Boa sorte!</p>
          <button
            onClick={() => {
              setParticipacaoConfirmada(false);
              handleJogar();
            }}
            className="mt-6 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl"
          >
            Tentar Novamente
          </button>
        </main>
        <BottomNav />
      </div>
    );
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
                    className="relative aspect-square rounded-2xl overflow-hidden bg-surface-container-highest"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowWin(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-surface-container rounded-3xl p-8 mx-4 max-w-sm w-full text-center border border-primary/30 shadow-2xl shadow-glow"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="text-6xl mb-4"
              >
                <Trophy className="text-primary w-16 h-16 mx-auto" />
              </motion.div>

              <h2 className="font-serif text-3xl font-bold text-primary mb-2">
                PARABÉNS!
              </h2>
              <p className="text-muted-foreground mb-4">
                Ganhou: {winningPrize.nome}!
              </p>
              <p className="text-5xl font-bold text-secondary mb-2">
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
                <p className="text-sm text-muted-foreground/60 mb-6">
                  A processar o seu prémio...
                </p>
              )}

              <button
                onClick={() => setShowWin(false)}
                className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl active:scale-[0.98] transition-all"
              >
                {premioClaimed ? "Fechar" : "Receber Prémio"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />

        <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg bg-surface-container border border-outline-variant/10 p-4 overflow-hidden">
           <DialogHeader className="p-4 pb-2">
             <DialogTitle className="font-headline text-xl flex items-center gap-2">
               <Euro className="w-5 h-5 text-primary" />
               Pagamento - Raspadinha
             </DialogTitle>
           </DialogHeader>
           <div className="px-4 pb-4 space-y-4">
             <div className="bg-surface-container-high rounded-xl p-4 text-center">
               <p className="text-xs text-on-surface-variant">Total a pagar</p>
               <p className="font-headline text-3xl text-primary">{preco}€</p>
             </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Nome</label>
              <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
                <User className="w-5 h-5 text-primary" />
                <input
                  type="text"
                  value={participante.nome}
                  onChange={(e) => setParticipante({ ...participante, nome: e.target.value })}
                  className="flex-1 bg-transparent outline-none text-foreground"
                  placeholder="O seu nome"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Telemóvel</label>
              <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
                <Phone className="w-5 h-5 text-primary" />
                <input
                  type="tel"
                  value={participante.telefone}
                  onChange={(e) => setParticipante({ ...participante, telefone: e.target.value })}
                  className="flex-1 bg-transparent outline-none text-foreground"
                  placeholder="912 345 678"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Receber Notificação</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setParticipante({ ...participante, notificacao: "whatsapp" })}
                  className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    participante.notificacao === "whatsapp" 
                      ? "bg-[#25D366] text-foreground" 
                      : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setParticipante({ ...participante, notificacao: "email" })}
                  className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    participante.notificacao === "email" 
                      ? "bg-primary text-foreground" 
                      : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-xs font-medium">Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => setParticipante({ ...participante, notificacao: "nenhum" })}
                  className={`p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    participante.notificacao === "nenhum" 
                      ? "bg-[#666] text-foreground" 
                      : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span className="text-xs font-medium">Nenhum</span>
                </button>
              </div>
            </div>

            <PaymentSelector
              amount={preco}
              onSelect={processarPagamento}
            />
          </div>
        </DialogContent>
      </Dialog>

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
