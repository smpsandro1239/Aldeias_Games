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
  skipApiCall?: boolean; // Pula a chamada à API (usado pelo modal)
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
  const [percent, setPercent] = useState(0);
  const [revelado, setRevelado] = useState(false);
  const { playScratch } = useScratchSound();

  const maxPercentRef = useRef(0); // Track máximo de percentagem
  const isDraggingRef = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const isRevealingRef = useRef(false);
  const moveCountRef = useRef(0); // Para calcular percentagem menos vezes
  const soundThrottleRef = useRef(0); // Para throttle do som

  const W = 420;
  const H = 260;

  // Inicializa a textura prateada
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = W;
    canvas.height = H;

    // Textura prateada realista
    ctx.fillStyle = "#a8a8a8";
    ctx.fillRect(0, 0, W, H);
    
    // Ruído reduzido para melhor performance (4000 em vez de 12000)
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    for (let i = 0; i < 4000; i++) {
      ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
    }

    // Linhas de brilho metálico reduzidas
    ctx.strokeStyle = "rgba(180,180,180,0.6)";
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * W, Math.random() * H);
      ctx.lineTo(Math.random() * W, Math.random() * H);
      ctx.stroke();
    }

    // Texto "RASPE AQUI"
    ctx.fillStyle = "#ffe483";
    ctx.font = "bold 28px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✨ RASPE AQUI ✨", W / 2, H / 2 - 15);
    ctx.font = "16px system-ui";
    ctx.fillText("para revelar o seu prémio", W / 2, H / 2 + 20);

    // Reset do máximo
    maxPercentRef.current = 0;
  }, []);

  // Função de raspagem com spray otimizada
  const scratch = useCallback(
    (x: number, y: number) => {
      if (revelado) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.fill();

      // SPRAY otimizado (15 pontos em vez de 50)
      for (let i = 0; i < 15; i++) {
        const ox = (Math.random() - 0.5) * 50;
        const oy = (Math.random() - 0.5) * 50;
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, Math.random() * 8 + 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Throttle do som - só toca a cada 50ms
      const now = Date.now();
      if (now - soundThrottleRef.current > 50) {
        playScratch(0.5);
        soundThrottleRef.current = now;
      }
    },
    [revelado, playScratch]
  );

  // Calcula a percentagem raspada - COM REGISTO DO MÁXIMO
  const calcularPercent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, W, H).data;
    let transparent = 0;
    const totalPixels = W * H;
    
    // Amostragem para melhor performance (verifica 1 em cada 4 pixels)
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] === 0) transparent++;
    }
    
    const p = Math.round((transparent * 4 / totalPixels) * 100);
    
    // SÓ ATUALIZA SE FOR MAIOR QUE O MÁXIMO ANTERIOR
    if (p > maxPercentRef.current) {
      maxPercentRef.current = p;
      setPercent(p);
    }

    if (maxPercentRef.current >= 68 && !revelado && !isRevealingRef.current) {
      isRevealingRef.current = true;
      setRevelado(true);
      revealAll();
    }
  }, [revelado]);

  // Revela tudo
  const revealAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Se skipApiCall for true, não faz chamada à API
    if (skipApiCall) {
      onRevelado(true, finalPremio); // Assume ganhou (o modal tratará)
      return;
    }

    fetch("/api/jogos/revelar-raspadinha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jogoId, premioId: finalPremio.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        onRevelado(data.ganhou, finalPremio);
        if (data.ganhou) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      })
      .catch(() => {
        onRevelado(false, finalPremio);
      });
  }, [jogoId, finalPremio, onRevelado, skipApiCall]);

  // Inicialização
  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  // Event handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleStart = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = true;
      const rect = canvas.getBoundingClientRect();
      const x =
        "clientX" in e
          ? e.clientX - rect.left
          : e.touches[0].clientX - rect.left;
      const y =
        "clientY" in e
          ? e.clientY - rect.top
          : e.touches[0].clientY - rect.top;
      lastX.current = x;
      lastY.current = y;
      scratch(x, y);
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x =
        "clientX" in e
          ? e.clientX - rect.left
          : e.touches[0].clientX - rect.left;
      const y =
        "clientY" in e
          ? e.clientY - rect.top
          : e.touches[0].clientY - rect.top;

      // Linha entre pontos para suavidade
      const steps = 6; // Reduzido de 10 para 6
      for (let i = 0; i < steps; i++) {
        const ix = lastX.current + (x - lastX.current) * (i / steps);
        const iy = lastY.current + (y - lastY.current) * (i / steps);
        scratch(ix, iy);
      }
      lastX.current = x;
      lastY.current = y;

      // Só calcula percentagem a cada 5 movimentos
      moveCountRef.current++;
      if (moveCountRef.current % 5 === 0) {
        calcularPercent();
      }
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
      // Calcula no final também
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
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative mx-auto w-[420px] h-[260px] cursor-crosshair"
    >
      {/* Prémio por baixo */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 rounded-3xl flex flex-col items-center justify-center p-6 shadow-2xl overflow-hidden">
        {finalPremio.imagemUrl && (
          <img
            src={finalPremio.imagemUrl}
            alt={finalPremio.nome || "Prémio"}
            className="w-40 h-40 object-contain drop-shadow-2xl"
          />
        )}
        <h1 className="text-4xl font-black text-white text-center mt-2 tracking-tighter">
          {finalPremio.nome || "Prémio Especial"}
        </h1>
        <p className="text-white/90 text-xl mt-2">
          {finalPremio.descricao || "Prémio Especial"}
        </p>
        {finalPremio.valorDinheiroAlternative && (
          <p className="text-5xl font-bold text-white mt-4">
            €{finalPremio.valorDinheiroAlternative}
          </p>
        )}
      </div>

      {/* Canvas raspagem */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 rounded-3xl shadow-2xl touch-none"
        style={{ touchAction: "none" }}
      />

      {/* Percentagem - só mostra se > 10% */}
      {percent > 10 && !revelado && (
        <div className="absolute top-4 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full font-mono">
          {percent}%
        </div>
      )}

      {/* Resultado revelado */}
      {revelado && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-3xl"
        >
          <div className="text-center">
            <div className="text-6xl mb-3">🎉</div>
            <div
              className={`inline-flex items-center gap-2 px-4 py-1 rounded-full text-white text-sm font-bold bg-gradient-to-r ${getPrizeLevelColor(prizeLevel)}`}
            >
              {prizeLevel.toUpperCase()}
            </div>
            <p className="text-3xl font-black mt-3 text-white">{finalPremio.nome}</p>
            {finalPremio.valorDinheiroAlternative && (
              <p className="text-4xl font-bold text-white mt-2">
                €{finalPremio.valorDinheiroAlternative}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
