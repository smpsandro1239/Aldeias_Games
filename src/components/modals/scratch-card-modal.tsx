"use client";

import { useRef, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Coins, Gift, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScratchCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  premio: string | null;
  onReveal: () => Promise<void>;
  jaRevelado: boolean;
}

export function ScratchCardModal({
  open,
  onOpenChange,
  premio,
  onReveal,
  jaRevelado,
}: ScratchCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [revealed, setRevealed] = useState(jaRevelado);
  const [scratchedPercent, setScratchedPercent] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const isPremio = premio && premio !== "sem_premio";

  useEffect(() => {
    if (!open) {
      setRevealed(jaRevelado);
      setScratchedPercent(0);
      setShowCelebration(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 320;
    canvas.height = 200;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#6366f1");
    gradient.addColorStop(0.5, "#8b5cf6");
    gradient.addColorStop(1, "#ec4899");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    for (let i = 0; i < canvas.width; i += 30) {
      for (let j = 0; j < canvas.height; j += 30) {
        if ((i + j) % 60 === 0) {
          ctx.beginPath();
          ctx.arc(i, j, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("✨ RASPE AQUI ✨", canvas.width / 2, canvas.height / 2);

    const sparkleCtx = canvas.getContext("2d");
    if (sparkleCtx) {
      const time = Date.now();
      for (let i = 0; i < 5; i++) {
        const x = (Math.sin(time * 0.002 + i) + 1) * canvas.width / 2;
        const y = (Math.cos(time * 0.003 + i * 2) + 1) * canvas.height / 2;
        sparkleCtx.fillStyle = "rgba(255, 255, 255, 0.8)";
        sparkleCtx.beginPath();
        sparkleCtx.arc(x, y, 2, 0, Math.PI * 2);
        sparkleCtx.fill();
      }
    }
  }, [open, jaRevelado]);

  const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const scratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isScratching || revealed) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const pos = getMousePos(e);

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
    ctx.fill();

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
    }
    const percent = (transparent / (pixels.length / 4)) * 100;
    setScratchedPercent(percent);

    if (percent > 40 && !revealed) {
      setRevealed(true);
      setShowCelebration(!!isPremio);
      onReveal();
    }
  };

  const handleRevealAll = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setRevealed(true);
    setScratchedPercent(100);
    setShowCelebration(!!isPremio);
    await onReveal();
  };

  const getPremioIcon = () => {
    if (!premio) return <Gift className="w-16 h-16" />;
    if (premio.includes("€") || premio.includes("EUR")) return <Coins className="w-16 h-16" />;
    return <Gift className="w-16 h-16" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] overflow-hidden p-0">
        <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')] opacity-50" />

          <DialogHeader className="relative text-center text-white">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex justify-center mb-2"
            >
              <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
                <Sparkles className="w-8 h-8 text-yellow-400" />
              </div>
            </motion.div>
            <DialogTitle className="text-2xl font-black tracking-wide text-white drop-shadow-lg">
              RASPADINHA DA SORTE
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Raspe com o dedo para revelar o seu prémio!
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-6">
            <AnimatePresence>
              {showCelebration && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 z-10 flex items-center justify-center"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, -5, 5, 0],
                    }}
                    transition={{ repeat: 3, duration: 0.5 }}
                    className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]"
                  >
                    <Zap className="w-24 h-24" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={false}
              animate={{ opacity: revealed ? 0 : 1 }}
              className="relative rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.5)]"
            >
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center text-center p-4 transition-all duration-700",
                  revealed ? "opacity-100 scale-100" : "opacity-0 scale-95"
                )}
              >
                <motion.div
                  initial={revealed ? { scale: 0.5, opacity: 0 } : false}
                  animate={revealed ? { scale: 1, opacity: 1 } : false}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={cn(
                    "p-8 rounded-2xl",
                    isPremio
                      ? "bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 shadow-[0_0_30px_rgba(251,191,36,0.6)]"
                      : "bg-slate-800/80"
                  )}
                >
                  <motion.div
                    animate={isPremio ? { y: [0, -10, 0] } : {}}
                    transition={{ repeat: isPremio ? Infinity : 0, duration: 2 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className={cn("p-4 rounded-full", isPremio ? "bg-white/20" : "bg-slate-700")}>
                      {getPremioIcon()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/70 mb-1">
                        {isPremio ? "🎉 PARABÉNS! GANHOU!" : "😔 Sem prémio"}
                      </p>
                      <p className={cn(
                        "text-3xl font-black tracking-wider",
                        isPremio ? "text-white drop-shadow-lg" : "text-slate-400"
                      )}>
                        {premio || "Sem Prémio"}
                      </p>
                    </div>
                    {isPremio && (
                      <p className="text-xs text-white/80 mt-2">
                        Contacte a organização para receber
                      </p>
                    )}
                  </motion.div>
                </motion.div>
              </div>

              {!revealed && (
                <canvas
                  ref={canvasRef}
                  className="w-full h-[200px] cursor-crosshair touch-none rounded-2xl border-2 border-white/20"
                  onMouseDown={() => setIsScratching(true)}
                  onMouseUp={() => setIsScratching(false)}
                  onMouseLeave={() => setIsScratching(false)}
                  onMouseMove={scratch}
                  onTouchStart={() => setIsScratching(true)}
                  onTouchEnd={() => setIsScratching(false)}
                  onTouchMove={scratch}
                />
              )}
            </motion.div>

            {!revealed && (
              <div className="mt-4 space-y-3">
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500"
                    style={{ width: `${scratchedPercent}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${scratchedPercent}%` }}
                    transition={{ type: "spring", stiffness: 100 }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/50">
                  <span>Progresso</span>
                  <span className="font-mono">{Math.round(scratchedPercent)}%</span>
                </div>
              </div>
            )}
          </div>

          {!revealed && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={handleRevealAll}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <Star className="w-4 h-4 mr-2" />
                Revelar Tudo
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}