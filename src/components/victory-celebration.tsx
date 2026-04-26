"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Trophy, Share2, X, ChevronRight, Sparkles, Gift, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VictoryCelebrationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  premio: {
    nome: string;
    descricao?: string | null;
    imagemUrl?: string | null;
    valorDinheiroAlternative?: number | null;
  };
  jogoNome: string;
  tipoJogo: "raspadinha" | "rifa" | "tombola" | "poio_da_vaca";
  onShare?: () => void;
}

export function VictoryCelebration({
  open,
  onOpenChange,
  premio,
  jogoNome,
  tipoJogo,
  onShare,
}: VictoryCelebrationProps) {
  const hasCelebrated = useRef(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (open && !hasCelebrated.current) {
      hasCelebrated.current = true;
      
      // Confetti burst
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['#ff734b', '#9cefff', '#ffcc00', '#ff4488'];

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();

      // Big center burst
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 },
        colors: colors,
      });

      // Show content after a short delay
      setTimeout(() => setShowContent(true), 500);
    }

    if (!open) {
      hasCelebrated.current = false;
      setShowContent(false);
    }
  }, [open]);

  const handleShare = async () => {
    const shareText = `🏆 Ganhei ${premio.nome} no ${jogoNome}! Aldeias Games - Participate também!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Ganhei no Aldeias Games!",
          text: shareText,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
    }
    
    onShare?.();
  };

  const handleConvertToBalance = () => {
    // Emit event for parent to handle
    window.dispatchEvent(new CustomEvent('convertPremioToBalance', { 
      detail: { premio } 
    }));
  };

  const getJogoIcon = () => {
    switch (tipoJogo) {
      case "raspadinha":
        return <Sparkles className="w-8 h-8" />;
      case "poio_da_vaca":
        return <Trophy className="w-8 h-8" />;
      case "rifa":
      case "tombola":
        return <Gift className="w-8 h-8" />;
      default:
        return <Trophy className="w-8 h-8" />;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => onOpenChange(false)}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-gradient-to-b from-surface-container to-background rounded-3xl overflow-hidden border border-primary/30 shadow-2xl shadow-glow"
          >
            {/* Glow effect */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/20 rounded-full blur-[60px]" />
            
            {/* Close button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 p-2 rounded-full bg-foreground/10 hover:bg-foreground/20 transition-colors z-10"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-foreground/70" />
            </button>

            <div className="relative p-8 text-center">
              {/* Trophy Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", damping: 10 }}
                className="relative mx-auto w-24 h-24 mb-6"
              >
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
                <div className="relative w-full h-full bg-gradient-to-br from-primary to-destructive rounded-full flex items-center justify-center">
                  {getJogoIcon()}
                </div>
              </motion.div>

              {/* Celebration Text */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-3xl font-bold text-foreground mb-2 font-serif italic">
                  Parabéns!
                </h2>
                <p className="text-accent text-lg mb-6">
                  Ganaste um prémio!
                </p>
              </motion.div>

              {/* Prize Card */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-surface-container-low rounded-2xl p-5 mb-6 border border-outline-variant/30"
              >
                {premio.imagemUrl && (
                  <img
                    src={premio.imagemUrl}
                    alt={premio.nome}
                    className="w-full h-32 object-cover rounded-xl mb-4"
                  />
                )}
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {premio.nome}
                </h3>
                {premio.descricao && (
                  <p className="text-muted-foreground text-sm mb-3">
                    {premio.descricao}
                  </p>
                )}
                {premio.valorDinheiroAlternative && (
                  <div className="flex items-center justify-center gap-2 text-accent">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-2xl font-bold">
                      €{premio.valorDinheiroAlternative.toFixed(2)}
                    </span>
                  </div>
                )}
              </motion.div>

              {/* Game info */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-xs text-muted-foreground/60 mb-6"
              >
                Jogo: {jogoNome}
              </motion.p>

              {/* Actions */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                className="space-y-3"
              >
                {premio.valorDinheiroAlternative && (
                  <Button
                    onClick={handleConvertToBalance}
                    variant="outline"
                    className="w-full bg-surface-container-low border-primary/30 text-secondary hover:bg-secondary/10 hover:border-secondary/50"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Converter em Saldo
                  </Button>
                )}
                
                <Button
                  onClick={handleShare}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Partilhar com Amigos
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>

              {/* Sparkle decorations */}
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1],
                }}
                transition={{ 
                  rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity }
                }}
                className="absolute top-10 left-4 text-accent/30"
              >
                ✨
              </motion.div>
              <motion.div
                animate={{ 
                  rotate: -360,
                  scale: [1, 1.2, 1],
                }}
                transition={{ 
                  rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2.5, repeat: Infinity }
                }}
                className="absolute bottom-20 right-4 text-destructive/30"
              >
                ✨
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
