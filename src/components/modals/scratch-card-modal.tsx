"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star } from "lucide-react";
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
  titulo = "RASPADINHA DA SORTE",
  subtitulo = "Raspe com o dedo para revelar o seu prémio!",
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

    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, "#94a3b8");
    gradient.addColorStop(0.3, "#cbd5e1");
    gradient.addColorStop(0.5, "#e2e8f0");
    gradient.addColorStop(0.7, "#cbd5e1");
    gradient.addColorStop(1, "#94a3b8");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    for (let i = 0; i < rect.width; i += 4) {
      for (let j = 0; j < rect.height; j += 4) {
        if (Math.random() > 0.85) {
          ctx.fillRect(i, j, 1, 1);
        }
      }
    }

    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 14px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    const text = "✨ RASPE AQUI ✨";
    const textWidth = ctx.measureText(text).width;
    ctx.fillStyle = "rgba(30, 41, 59, 0.7)";
    ctx.fillRect((rect.width - textWidth - 40) / 2, (rect.height - 30) / 2, textWidth + 40, 40);
    ctx.fillStyle = "#f8fafc";
    ctx.fillText(text, rect.width / 2, rect.height / 2);

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

    ctx.beginPath();
    ctx.arc(x, y, 35, 0, Math.PI * 2);
    ctx.fill();

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
    }
    const percent = (transparent / (pixels.length / 4)) * 100;
    setScratchedPercent(percent);

    if (percent > 50 && !revealed) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] overflow-hidden p-0">
        <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMDUiLz48L3N2Zz4=')] opacity-30" />

          <div className="relative z-10">
            <div className="text-center mb-8">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex justify-center mb-4"
              >
                <div className="p-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full shadow-lg shadow-yellow-500/30">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </motion.div>
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-3xl font-black text-white tracking-wider drop-shadow-lg"
              >
                {titulo}
              </motion.h2>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white/70 mt-2"
              >
                {subtitulo}
              </motion.p>
              {organizacao && (
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-yellow-400 font-semibold mt-3"
                >
                  {organizacao}
                </motion.p>
              )}
            </div>

            <AnimatePresence>
              {showCelebration && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
                >
                  {[...Array(30)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        x: 300, 
                        y: 400,
                        scale: 0,
                        rotate: 0
                      }}
                      animate={{ 
                        y: -100,
                        x: Math.random() * 600,
                        rotate: Math.random() * 360,
                        scale: [0, 1, 1, 0]
                      }}
                      transition={{ 
                        duration: 2 + Math.random(),
                        delay: Math.random() * 0.5,
                        ease: "easeOut"
                      }}
                      className="absolute text-3xl"
                    >
                      {["🎉", "🎊", "⭐", "✨", "💫", "🌟", "🏆", "🎁"][Math.floor(Math.random() * 8)]}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div 
                className={cn(
                  "rounded-3xl overflow-hidden shadow-2xl",
                  revealed ? "bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500" : "bg-slate-800/50 border border-slate-700"
                )}
              >
                <AnimatePresence mode="wait">
                  {revealed ? (
                    <motion.div
                      key="revealed"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="p-12 text-center"
                    >
                      <motion.div
                        animate={isPremio ? { 
                          y: [0, -15, 0],
                          rotate: [0, -5, 5, 0]
                        } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="mb-6"
                      >
                        <div className="text-8xl mb-4">
                          {getPremioEmoji()}
                        </div>
                        {isPremio ? (
                          <>
                            <div className="text-white text-xl font-bold mb-2">
                              🎉 PARABÉNS! GANHOU! 🎉
                            </div>
                            <div className="text-white text-5xl font-black tracking-wider drop-shadow-md">
                              {premio}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-slate-700 text-xl font-bold mb-2">
                              😔 Sem prémio desta vez
                            </div>
                            <div className="text-slate-600 text-2xl font-semibold">
                              Mas obrigado pela participação!
                            </div>
                          </>
                        )}
                      </motion.div>
                      {isPremio && (
                        <div className="mt-6 inline-block bg-white/20 text-white px-6 py-2 rounded-full text-sm">
                          Contacte a organização para receber
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="scratch"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-2"
                    >
                      <div className="relative rounded-2xl overflow-hidden">
                        <div className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 p-8 text-center">
                          <div className="text-white text-5xl font-black tracking-widest drop-shadow-md">
                            {premio || "???"}
                          </div>
                          <p className="text-white/80 text-sm mt-2">
                            {isPremio ? "Prémio escondido!" : "Tente a sua sorte!"}
                          </p>
                        </div>
                        
                        <canvas
                          ref={canvasRef}
                          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {!revealed && (
                <div className="mt-6 space-y-4">
                  <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${scratchedPercent}%` }}
                      transition={{ type: "spring", stiffness: 100 }}
                    />
                  </div>
                  <div className="flex justify-between text-white/60 text-sm px-2">
                    <span>Arraste para raspar</span>
                    <span className="font-mono">{Math.round(scratchedPercent)}%</span>
                  </div>

                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      onClick={handleRevealAll}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Revelar Tudo
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}