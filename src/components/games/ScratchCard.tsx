"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useScratchSound } from "@/hooks/useScratchSound";

// Função utilitária para verificar suporte a Haptic Feedback
function isHapticSupported(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

// Vibração curta (tátil)
function hapticFeedback(duration: number = 10): void {
  if (isHapticSupported()) {
    try {
      navigator.vibrate?.(duration);
    } catch {
      // Ignorar se falhar
    }
  }
}

// Throttle com requestAnimationFrame para performance
function useThrottledCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef(0);
  const callbackRef = useRef(callback);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        callbackRef.current(...args);
      } else {
        // Agendar para o próximo frame se não passou o delay
        if (frameRef.current === null) {
          frameRef.current = requestAnimationFrame(() => {
            lastCall.current = Date.now();
            callbackRef.current(...args);
            frameRef.current = null;
          });
        }
      }
    }) as T,
    []
  );
}

interface ScratchCardProps {
  premio?: {
    id: string;
    nome: string;
    descricao?: string | null;
    imagemUrl?: string | null;
    valorDinheiroAlternative?: number | null;
  };
  jogoId: string;
  onRevelado: (ganhou: boolean, premio: NonNullable<ScratchCardProps["premio"]>) => void;
  skipApiCall?: boolean;
}

export function ScratchCard({ premio, jogoId, onRevelado, skipApiCall = false }: ScratchCardProps) {
  const defaultPremio = {
    id: "default",
    nome: "Prémio Especial",
    descricao: null,
    imagemUrl: null,
    valorDinheiroAlternative: null,
  };

  const finalPremio = premio || defaultPremio;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [percent, setPercent] = useState(0);
  const [revelado, setRevelado] = useState(false);
  const { playScratch } = useScratchSound();

  // Refs para controle
  const isMounted = useRef(true);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const hasRevealed = useRef(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const W = 420;
  const H = 260;

  // Inicialização do canvas - executa uma vez
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = W;
    canvas.height = H;

    // Desenhar camada prateada
    ctx.fillStyle = "#a8a8a8";
    ctx.fillRect(0, 0, W, H);

    // Ruído (estático)
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    for (let i = 0; i < 4000; i++) {
      ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
    }

    // Linhas de brilho
    ctx.strokeStyle = "rgba(180, 180, 180, 0.6)";
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * W, Math.random() * H);
      ctx.lineTo(Math.random() * W, Math.random() * H);
      ctx.stroke();
    }

    // Texto
    ctx.fillStyle = "#ffe483";
    ctx.font = "bold 28px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✨ RASPE AQUI ✨", W / 2, H / 2 - 15);
    ctx.font = "16px system-ui";
    ctx.fillText("para revelar o seu prémio", W / 2, H / 2 + 20);

    ctxRef.current = ctx;
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      ctxRef.current = null;
    };
  }, []);

  // Calcula percentagem raspada - otimizada com requestAnimationFrame
  const calcularPercent = useCallback(() => {
    if (!isMounted.current || revelado || !ctxRef.current) return;

    const ctx = ctxRef.current;
    const data = ctx.getImageData(0, 0, W, H).data;
    let transparent = 0;
    const totalPixels = W * H;

    // Sample a cada 16 pixels (4x4 blocos) para velocidade
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] === 0) transparent++;
    }

    const p = Math.round((transparent * 4 / totalPixels) * 100);
    setPercent((prev) => {
      const newMax = Math.max(prev, p);
      if (newMax >= 68 && !hasRevealed.current) {
        hasRevealed.current = true;
        setTimeout(() => {
          if (isMounted.current) {
            setRevelado(true);
            onRevelado(true, finalPremio);
          }
        }, 100);
      }
      return newMax;
    });
  }, [revelado, jogoId, finalPremio, onRevelado]);

  // Throttled version for performance
  const throttledCalc = useThrottledCallback(calcularPercent, 200);

  // Raspagem
  const scratch = useCallback((x: number, y: number) => {
    if (revelado || !isMounted.current || !ctxRef.current) return;

    const ctx = ctxRef.current;

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();

    // Spray (15 pontos)
    for (let i = 0; i < 15; i++) {
      const ox = (Math.random() - 0.5) * 50;
      const oy = (Math.random() - 0.5) * 50;
      ctx.beginPath();
      ctx.arc(x + ox, y + oy, Math.random() * 8 + 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Som throttleado
    playScratch(0.5);
    hapticFeedback?.(5);

    // Throttle do cálculo
    throttledCalc();
  }, [revelado, playScratch, throttledCalc]);

  // Revelar manualmente (para fallback)
  const forceReveal = useCallback(() => {
    if (hasRevealed.current) return;
    hasRevealed.current = true;
    setRevelado(true);
    onRevelado(true, finalPremio);
  }, [finalPremio, onRevelado]);

  // Event handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let rafId: number | null = null;

    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (!isMounted.current) return;
      isDragging.current = true;
      const rect = canvas.getBoundingClientRect();
      const x = "clientX" in e ? e.clientX - rect.left : (e as TouchEvent).touches[0].clientX - rect.left;
      const y = "clientY" in e ? e.clientY - rect.top : (e as TouchEvent).touches[0].clientY - rect.top;
      lastPos.current = { x, y };
      scratch(x, y);
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current || !isMounted.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = "clientX" in e ? e.clientX - rect.left : (e as TouchEvent).touches[0].clientX - rect.left;
      const y = "clientY" in e ? e.clientY - rect.top : (e as TouchEvent).touches[0].clientY - rect.top;

      // Interpolação linear
      const steps = 6;
      for (let i = 0; i < steps; i++) {
        const ix = lastPos.current.x + (x - lastPos.current.x) * (i / steps);
        const iy = lastPos.current.y + (y - lastPos.current.y) * (i / steps);
        scratch(ix, iy);
      }
      lastPos.current = { x, y };
    };

    const handleEnd = () => {
      isDragging.current = false;
      // Calcular no próximo frame
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(calcularPercent);
    };

    canvas.addEventListener("mousedown", handleStart);
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseup", handleEnd);
    canvas.addEventListener("mouseleave", handleEnd);
    canvas.addEventListener("touchstart", handleStart, { passive: false });
    canvas.addEventListener("touchmove", handleMove, { passive: false });
    canvas.addEventListener("touchend", handleEnd, { passive: false });

    // Expor forceReveal no elemento canvas para debug/fallback
    (canvas as any)._forceReveal = forceReveal;

    return () => {
      canvas.removeEventListener("mousedown", handleStart);
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseup", handleEnd);
      canvas.removeEventListener("mouseleave", handleEnd);
      canvas.removeEventListener("touchstart", handleStart);
      canvas.removeEventListener("touchmove", handleMove);
      canvas.removeEventListener("touchend", handleEnd);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [scratch, calcularPercent, forceReveal]);

  // Detectar quando o modal é fechado e limpar
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const getPrizeLevel = (prize: string | null | undefined): string => {
    if (!prize) return "bronze";
    const p = String(prize).toLowerCase();
    if (p.includes("500") || p.includes("mil") || p.includes("1000")) return "diamond";
    if (p.includes("100") || p.includes("cem")) return "platinum";
    if (p.includes("50")) return "gold";
    if (p.includes("20") || p.includes("10")) return "silver";
    return "bronze";
  };

  const getPrizeLevelColor = (level: string): string => {
    const colors: Record<string, string> = {
      diamond: "from-purple-500 to-pink-500",
      gold: "from-yellow-400 to-amber-500",
      silver: "from-gray-300 to-slate-400",
      bronze: "from-amber-700 to-orange-800",
    };
    return colors[level] || colors.bronze;
  };

  const prizeLevel = finalPremio?.valorDinheiroAlternative
    ? getPrizeLevel(String(finalPremio.valorDinheiroAlternative))
    : "bronze";

  return (
    <div
      ref={containerRef}
      className="relative mx-auto select-none"
      style={{ width: W, height: H }}
      role="img"
      aria-label="Cartão de raspadinha"
    >
      {/* Prémio por baixo */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 rounded-3xl flex flex-col items-center justify-center p-4 shadow-2xl overflow-hidden"
        aria-hidden="true"
      >
        {finalPremio.imagemUrl && (
          <img
            src={finalPremio.imagemUrl}
            alt={finalPremio.nome || "Prémio"}
            className="w-32 h-32 object-contain drop-shadow-2xl"
          />
        )}
        <h1 className="text-3xl font-black text-foreground text-center mt-2 tracking-tighter">
          {finalPremio.nome || "Prémio Especial"}
        </h1>
        <p className="text-foreground/90 text-lg mt-1">
          {finalPremio.descricao || "Prémio Especial"}
        </p>
        {finalPremio.valorDinheiroAlternative && (
          <p className="text-4xl font-bold text-foreground mt-2">
            €{finalPremio.valorDinheiroAlternative}
          </p>
        )}
      </div>

      {/* Canvas raspagem */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 rounded-3xl shadow-2xl touch-none cursor-crosshair"
        style={{ touchAction: "none" }}
        aria-label="Raspe a superfície para revelar o prémio"
        tabIndex={0}
      />

      {/* Percentagem (opcional) */}
      {percent > 10 && !revelado && (
        <div className="absolute top-4 right-4 bg-black/70 text-foreground text-xs px-3 py-1 rounded-full font-mono">
          {percent}%
        </div>
      )}

      {/* Resultado */}
      {revelado && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl"
          role="status"
          aria-live="polite"
        >
          <div className="text-center">
            <div className="text-5xl mb-2">🎉</div>
            <div
              className={`inline-flex items-center gap-2 px-4 py-1 rounded-full text-foreground text-sm font-bold bg-gradient-to-r ${getPrizeLevelColor(
                prizeLevel
              )}`}
            >
              {prizeLevel.toUpperCase()}
            </div>
            <p className="text-2xl font-black mt-2 text-foreground">{finalPremio.nome}</p>
            {finalPremio.valorDinheiroAlternative && (
              <p className="text-3xl font-bold text-foreground mt-1">
                €{finalPremio.valorDinheiroAlternative}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
