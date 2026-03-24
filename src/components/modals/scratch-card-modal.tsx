"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star, Gift, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScratchCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  premio: string | null;
  onReveal: () => Promise<void>;
  jaRevelado: boolean;
  titulo?: string;
  subtitulo?: string;
  organizacao?: string;
}

export function ScratchCardModal({
  open,
  onOpenChange,
  premio,
  onReveal,
  jaRevelado,
  titulo = "RASPADINHA",
  subtitulo = "Raspe para descobrir o seu prémio!",
  organizacao = "",
}: ScratchCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [revealed, setRevealed] = useState(jaRevelado);
  const [scratchedPercent, setScratchedPercent] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const isPremio = premio && premio !== "sem_premio";

  const drawScratchLayer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.globalCompositeOperation = "source-over";

    // Silver metallic gradient
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, "#d1d5db");
    gradient.addColorStop(0.25, "#f3f4f6");
    gradient.addColorStop(0.5, "#e5e7eb");
    gradient.addColorStop(0.75, "#d1d5db");
    gradient.addColorStop(1, "#9ca3af");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Metallic texture dots
    for (let i = 0; i < rect.width; i += 3) {
      for (let j = 0; j < rect.height; j += 3) {
        if (Math.random() > 0.9) {
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
          ctx.fillRect(i, j, 1, 1);
        } else if (Math.random() > 0.9) {
          ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.1})`;
          ctx.fillRect(i, j, 1, 1);
        }
      }
    }

    // Diagonal lines pattern
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    for (let i = -rect.height; i < rect.width; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + rect.height, rect.height);
      ctx.stroke();
    }

    // "RASPE" text with shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.font = "bold 24px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("RASPE", rect.width / 2 + 2, rect.height / 2 - 10);
    ctx.fillText("AQUI", rect.width / 2 + 2, rect.height / 2 + 12);

    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 24px system-ui";
    ctx.fillText("RASPE", rect.width / 2, rect.height / 2 - 10);
    ctx.fillText("AQUI", rect.width / 2, rect.height / 2 + 12);

    // Set composite for scratching
    ctx.globalCompositeOperation = "destination-out";
  }, []);

  useEffect(() => {
    if (!open) {
      setRevealed(jaRevelado);
      setScratchedPercent(0);
      setShowCelebration(false);
      return;
    }

    drawScratchLayer();
  }, [open, jaRevelado, drawScratchLayer]);

  const scratch = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (revealed) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Draw scratch circle with some randomness for realism
    ctx.beginPath();
    ctx.arc(x, y, 30 + Math.random() * 5, 0, Math.PI * 2);
    ctx.fill();

    // Add some random scratches around
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 20;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, 10 + Math.random() * 10, 0, Math.PI * 2);
      ctx.fill();
    }

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
  }, [revealed, isPremio, onReveal]);

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

  const getPremioEmoji = () => {
    if (!premio) return "😢";
    const prizeLower = premio.toLowerCase();
    if (prizeLower.includes("100") || prizeLower.includes("cem")) return "💰";
    if (prizeLower.includes("50") || prizeLower.includes("cinquenta")) return "🎁";
    if (prizeLower.includes("20") || prizeLower.includes("vinte")) return "🎫";
    if (prizeLower.includes("10")) return "🎟️";
    return "🎉";
  };

  const getPremioIcon = () => {
    if (!premio) return <Gift className="w-16 h-16" />;
    const prizeLower = premio.toLowerCase();
    if (prizeLower.includes("€") || prizeLower.includes("euro")) return <Coins className="w-16 h-16" />;
    return <Gift className="w-16 h-16" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0">
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6">
          {/* Celebration confetti */}
          <AnimatePresence>
            {showCelebration && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none overflow-hidden z-20"
              >
                {[...Array(40)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: Math.random() * 400 + 50, 
                      y: -30,
                      rotate: 0,
                      scale: 0
                    }}
                    animate={{ 
                      y: 500,
                      x: Math.random() * 500,
                      rotate: Math.random() * 720,
                      scale: [0, 1, 1, 0]
                    }}
                    transition={{ 
                      duration: 2 + Math.random() * 2,
                      delay: Math.random() * 0.8,
                      ease: "easeOut"
                    }}
                    className="absolute text-2xl"
                    style={{ left: `${Math.random() * 90}%` }}
                  >
                    {["🎉", "🎊", "⭐", "✨", "💫", "🌟", "🏆", "🎁", "💰"][Math.floor(Math.random() * 9)]}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-3"
            >
              <Sparkles className="w-8 h-8 text-yellow-300" />
            </motion.div>
            
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-black text-white tracking-widest drop-shadow-lg"
            >
              {titulo}
            </motion.h2>
            
            {organizacao && (
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-yellow-300 font-semibold mt-2"
              >
                {organizacao}
              </motion.p>
            )}
          </div>

          {/* Prize Card */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Card header with prize */}
              <div 
                className={cn(
                  "p-6 text-center",
                  isPremio 
                    ? "bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500" 
                    : "bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600"
                )}
              >
                <AnimatePresence mode="wait">
                  {revealed ? (
                    <motion.div
                      key="revealed"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="py-4"
                    >
                      <motion.div
                        animate={isPremio ? { 
                          y: [0, -10, 0],
                          scale: [1, 1.1, 1]
                        } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="mb-4"
                      >
                        <div className="text-7xl mb-2">{getPremioEmoji()}</div>
                      </motion.div>
                      
                      <div className="text-white">
                        <p className="text-lg font-bold mb-1">
                          {isPremio ? "🎉 GANHOU! 🎉" : "Sem prémio"}
                        </p>
                        <p className="text-4xl font-black tracking-wider drop-shadow-md">
                          {premio || "Tente novamente"}
                        </p>
                      </div>

                      {isPremio && (
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="text-white/80 text-sm mt-4"
                        >
                          Contacte a organização para receber o prémio
                        </motion.p>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative"
                    >
                      {/* Prize hidden underneath - blurred effect */}
                      <div className="blur-sm opacity-50">
                        <p className="text-white/60 text-sm font-medium mb-1">O SEU PRÉMIO</p>
                        <p className="text-white text-3xl font-black tracking-wider">
                          {premio || "???€"}
                        </p>
                      </div>

                      {/* Scratch overlay */}
                      <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full cursor-crosshair touch-none rounded-xl"
                        onMouseDown={(e) => {
                          setIsScratching(true);
                          scratch(e);
                        }}
                        onMouseUp={() => setIsScratching(false)}
                        onMouseLeave={() => setIsScratching(false)}
                        onMouseMove={(e) => {
                          if (e.buttons === 1) scratch(e);
                        }}
                        onTouchStart={(e) => {
                          setIsScratching(true);
                          scratch(e);
                        }}
                        onTouchEnd={() => setIsScratching(false)}
                        onTouchMove={(e) => {
                          if (isScratching) scratch(e);
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Card footer */}
              <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Resultado válido</span>
                </div>
                
                {!revealed && (
                  <div className="text-xs text-slate-400">
                    {Math.round(scratchedPercent)}% raspado
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {!revealed && (
              <div className="mt-4 space-y-2">
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-yellow-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${scratchedPercent}%` }}
                    transition={{ type: "spring", stiffness: 100 }}
                  />
                </div>

                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRevealAll}
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-xs"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Revelar
                  </Button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Instructions */}
          {!revealed && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center text-white/70 text-sm mt-4"
            >
              {subtitulo}
            </motion.p>
          )}

          {/* Close button when revealed */}
          {revealed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center mt-6"
            >
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-white text-purple-600 hover:bg-slate-100 font-bold px-8"
              >
                Fechar
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
