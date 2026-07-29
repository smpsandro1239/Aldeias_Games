"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { apiRequest } from '@/lib/api-client';
import type { Prize, Jogo, SlotState, GamePhase, SlotSummary } from "./raspadinha-types";

const SLOT_SIZE = 120;
const CELL_SIZE = 6;

export function useRaspadinhaGame(
  jogo: Jogo | null,
  jogoId: string | null,
  participante: { nome: string; telefone: string; email: string; notificacao: string },
  setParticipante: (value: { nome: string; telefone: string; email: string; notificacao: string } | ((prev: { nome: string; telefone: string; email: string; notificacao: string }) => { nome: string; telefone: string; email: string; notificacao: string })) => void,
  userOriginalData: { nome: string; telefone: string; email: string },
  isNonRegularUser: boolean,
  refreshBalance: () => void,
  setPaymentModalOpen: (open: boolean) => void,
  setParticipacaoCriada: (data: unknown) => void,
) {
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
  const lastPosRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const scratchGridRef = useRef<Map<number, Set<string>>>(new Map());
  const initializedRef = useRef(false);

  const slotSummary: SlotSummary | null = useMemo(() => {
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

  const premiosDisplay = useMemo(() => {
    const configPremios = jogo?.configuracao?.premios as Array<{ nome: string; valorDinheiroAlternative?: number; percentagem?: number }> | undefined;
    if (configPremios && configPremios.length > 0) {
      return configPremios.map((p, i) => ({
        id: `config-${i}`,
        nome: p.nome,
        valorDinheiroAlternative: p.valorDinheiroAlternative ?? null,
        percentagem: p.percentagem ?? null,
      }));
    }
    if (jogo?.premios && jogo.premios.length > 0) {
      return jogo.premios.map((p) => ({
        id: p.id,
        nome: p.nome,
        valorDinheiroAlternative: p.valorDinheiroAlternative ?? null,
        percentagem: null,
      }));
    }
    return [] as Array<{ id: string; nome: string; valorDinheiroAlternative: number | null; percentagem: number | null }>;
  }, [jogo]);

  const titulo = jogo?.configuracao?.titulo || jogo?.nome || "RASPADINHA PREMIUM";
  const subtitulo = jogo?.configuracao?.subtitulo || "Raspe com o dedo para revelar o seu prémio!";
  const organizacao = jogo?.configuracao?.organizacao || jogo?.evento?.aldeia?.nome || "Aldeias Games";
  const premioMaximo = jogo?.configuracao?.premioMaximo || 5000;
  const preco = jogo?.preco || 2;

  const checkForWin = useCallback((newSlots: SlotState[]) => {
    const prizeCounts = new Map<string, { count: number; prize: Prize }>();
    newSlots.filter(s => s.revealed).forEach((s) => {
      if (s.prize) {
        const key = `${s.prize.id || s.prize.nome}`;
        const existing = prizeCounts.get(key);
        if (existing) existing.count++;
        else prizeCounts.set(key, { count: 1, prize: s.prize });
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
  }, []);

  const initSlotsFromGrid = useCallback((grid: Prize[]) => {
    setSlots(grid.map((prize, i) => ({
      id: i,
      revealed: false,
      prize,
      scratchPercent: 0,
    })));
    initializedRef.current = false;
    setCanvasesInitialized(false);
  }, []);

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

  const scratchSlot = useCallback(
    (slotId: number, x: number, y: number) => {
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
          checkForWin(newSlots);
          if (revealedSlots.length === 9) setGamePhase("all_revealed");
          return newSlots;
        });
      }
    },
    [slots, checkForWin]
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

  const handlePointerUp = useCallback((slotId: number, _e: React.PointerEvent) => {
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
      checkForWin(newSlots);
      setTotalRevealed(9);
      setGamePhase("all_revealed");
      return newSlots;
    });
  }, [slots, checkForWin]);

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

  const criarParticipacao = useCallback(async (metodo: "dinheiro" | "saldo" | "pendente") => {
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
            const msg = encodeURIComponent(`Raspadinha registada!\n\nJogo: ${jogo.nome}\nPreço: ${jogo.preco}€\n\nCódigo de Verificação: ${hash ? hash.substring(0, 16) + '...' : 'Consulte seu perfil'}\n\nObrigado por participar!`);
            window.open(`https://wa.me/351${telLimpo}?text=${msg}`, "_blank");
          } else if (participante.notificacao === "email" && participante.email) {
            const hash = participacao.hashRaspe || participacao.hashParticipacao;
            const subject = encodeURIComponent(`Raspadinha Registada - ${jogo.nome}`);
            const body = encodeURIComponent(`Raspadinha registada!\n\nJogo: ${jogo.nome}\nPreço: ${jogo.preco}€\n\nCódigo de Verificação: ${hash || 'Consulte seu perfil'}\n\nObrigado por participar!\n\nAldeias Games`);
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
  }, [jogo, jogoId, participante, initSlotsFromGrid, setPaymentModalOpen, setParticipacaoCriada, refreshBalance]);

  const claimPremio = useCallback(async (pId: string, claimType: "carteira" | "cofre" | "jogar_novamente" | "pagar_cliente" = "carteira") => {
    if (!pId || premioClaimed || claiming) return;
    setClaiming(true);

    try {
      const res = await apiRequest(`/api/participacoes/${pId}/claim-premio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        toast.error(data.error || "Erro ao receber prémio");
      }
    } catch (error) {
      console.error("Erro ao reclamar prémio:", error);
      toast.error("Erro ao reclamar prémio");
    } finally {
      setClaiming(false);
    }
  }, [premioClaimed, claiming, refreshBalance]);

  const handleComprarNova = useCallback(() => {
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
      setParticipante(() => ({
        nome: userOriginalData.nome,
        telefone: userOriginalData.telefone,
        email: userOriginalData.email,
        notificacao: "nenhum" as const,
      }));
    }
  }, [isNonRegularUser, userOriginalData, setParticipante]);

  return {
    slots, showWin, winningPrize, winningSlotIds, totalRevealed,
    participacaoId, gamePhase, premioClaimed, creditedAmount, claiming,
    showPurchaseAnimation, howItWorksOpen, setHowItWorksOpen,
    provaModalOpen, setProvaModalOpen,
    slotSummary, premiosDisplay,
    titulo, subtitulo, organizacao, premioMaximo, preco,
    initSlotCanvas, handlePointerDown, handlePointerMove, handlePointerUp,
    scratchAll, claimPremio, criarParticipacao, handleComprarNova,
    setShowWin, initSlotsFromGrid,
  };
}
