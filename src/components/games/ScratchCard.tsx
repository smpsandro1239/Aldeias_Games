"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useScratchSound } from "@/hooks/useScratchSound";

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

  const maxPercentRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const isRevealingRef = useRef(false);
  const moveCountRef = useRef(0);
  const soundThrottleRef = useRef(0);
  const mountedRef = useRef(false);
  const revealedCalledRef = useRef(false); // Previne chamada dupla do onRevelado

  const W = 420;
  const H = 260;

  // Inicializa a textura prateada - SÓ UMA VEZ
  useEffect(() => {
    if (mountedRef.current) return; // Previne dupla montagem
    mountedRef.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = W;
    canvas.height = H;

    // Textura prateada
    ctx.fillStyle = "#a8a8a8";
    ctx.fillRect(0, 0, W, H);
    
    // Ruído
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    for (let i = 0; i < 4000; i++) {
      ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
    }

    // Linhas de brilho
    ctx.strokeStyle = "rgba(180,180,180,0.6)";
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

    maxPercentRef.current = 0;

    // Cleanup ao desmontar
    return () => {
      mountedRef.current = false;
    };
  }, []); // Array vazio - só executa uma vez

  // Função de raspagem
  const scratch = useCallback((x: number, y: number) => {
    if (revelado || !mountedRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();

    // SPRAY (15 pontos)
    for (let i = 0; i < 15; i++) {
      const ox = (Math.random() - 0.5) * 50;
      const oy = (Math.random() - 0.5) * 50;
      ctx.beginPath();
      ctx.arc(x + ox, y + oy, Math.random() * 8 + 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Throttle do som
    const now = Date.now();
    if (now - soundThrottleRef.current > 50) {
      playScratch(0.5);
      soundThrottleRef.current = now;
    }
  }, [revelado, playScratch]);

  // Calcula percentagem
  const calcularPercent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || revelado) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, W, H).data;
    let transparent = 0;
    const totalPixels = W * H;
    
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] === 0) transparent++;
    }
    
    const p = Math.round((transparent * 4 / totalPixels) * 100);
    
    if (p > maxPercentRef.current) {
      maxPercentRef.current = p;
      setPercent(p);
    }

    if (maxPercentRef.current >= 68 && !revelado && !isRevealingRef.current && !revealedCalledRef.current) {
      isRevealingRef.current = true;
      revealedCalledRef.current = true;
      setRevelado(true);
      
      // Revela canvas
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // Chama callback SÓ UMA VEZ — API handling is done by parent
      onRevelado(true, finalPremio);
    }
  }, [revelado, jogoId, finalPremio, onRevelado, skipApiCall]);

  // Event handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (!mountedRef.current) return;
      isDraggingRef.current = true;
      const rect = canvas.getBoundingClientRect();
      const x = "clientX" in e ? e.clientX - rect.left : e.touches[0].clientX - rect.left;
      const y = "clientY" in e ? e.clientY - rect.top : e.touches[0].clientY - rect.top;
      lastX.current = x;
      lastY.current = y;
      scratch(x, y);
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current || !mountedRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = "clientX" in e ? e.clientX - rect.left : e.touches[0].clientX - rect.left;
      const y = "clientY" in e ? e.clientY - rect.top : e.touches[0].clientY - rect.top;

      const steps = 6;
      for (let i = 0; i < steps; i++) {
        const ix = lastX.current + (x - lastX.current) * (i / steps);
        const iy = lastY.current + (y - lastY.current) * (i / steps);
        scratch(ix, iy);
      }
      lastX.current = x;
      lastY.current = y;

      moveCountRef.current++;
      if (moveCountRef.current % 5 === 0) {
        calcularPercent();
      }
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
      calcularPercent();
    };

    canvas.addEventListener("mousedown", handleStart);
    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseup", handleEnd);
    canvas.addEventListener("mouseleave", handleEnd);
    canvas.addEventListener("touchstart", handleStart, { passive: false });
    canvas.addEventListener("touchmove", handleMove, { passive: false });
    canvas.addEventListener("touchend", handleEnd, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", handleStart);
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseup", handleEnd);
      canvas.removeEventListener("mouseleave", handleEnd);
      canvas.removeEventListener("touchstart", handleStart);
      canvas.removeEventListener("touchmove", handleMove);
      canvas.removeEventListener("touchend", handleEnd);
    };
  }, [scratch, calcularPercent]);

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
    <div ref={containerRef} className="relative mx-auto" style={{ width: W, height: H }}>
      {/* Prémio por baixo */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 rounded-3xl flex flex-col items-center justify-center p-4 shadow-2xl overflow-hidden">
        {finalPremio.imagemUrl && (
          <img
            src={finalPremio.imagemUrl}
            alt={finalPremio.nome || "Prémio"}
            className="w-32 h-32 object-contain drop-shadow-2xl"
          />
        )}
        <h1 className="text-3xl font-black text-white text-center mt-2 tracking-tighter">
          {finalPremio.nome || "Prémio Especial"}
        </h1>
        <p className="text-white/90 text-lg mt-1">
          {finalPremio.descricao || "Prémio Especial"}
        </p>
        {finalPremio.valorDinheiroAlternative && (
          <p className="text-4xl font-bold text-white mt-2">
            €{finalPremio.valorDinheiroAlternative}
          </p>
        )}
      </div>

      {/* Canvas raspagem */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 rounded-3xl shadow-2xl touch-none cursor-crosshair"
        style={{ touchAction: "none" }}
      />

      {/* Percentagem */}
      {percent > 10 && !revelado && (
        <div className="absolute top-4 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full font-mono">
          {percent}%
        </div>
      )}

      {/* Resultado */}
      {revelado && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl"
        >
          <div className="text-center">
            <div className="text-5xl mb-2">🎉</div>
            <div className={`inline-flex items-center gap-2 px-4 py-1 rounded-full text-white text-sm font-bold bg-gradient-to-r ${getPrizeLevelColor(prizeLevel)}`}>
              {prizeLevel.toUpperCase()}
            </div>
            <p className="text-2xl font-black mt-2 text-white">{finalPremio.nome}</p>
            {finalPremio.valorDinheiroAlternative && (
              <p className="text-3xl font-bold text-white mt-1">
                €{finalPremio.valorDinheiroAlternative}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
