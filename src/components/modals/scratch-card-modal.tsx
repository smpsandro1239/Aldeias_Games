"use client";

import { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ScratchCard } from "@/components/games/ScratchCard";
import { Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface ScratchCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo?: string;
  organizacao?: string;
  // Props novas (opcional)
  premio?: {
    id: string;
    nome: string;
    descricao?: string | null;
    imagemUrl?: string | null;
    valorDinheiroAlternative?: number | null;
  };
  jogoId?: string;
  // Props antigas (compatibilidade - opcional)
  participacaoId?: string;
  hashRaspe?: string;
  seedRaspe?: string;
  resultadoRaspe?: string | null;
  onReveal?: (participacaoId: string) => Promise<void>;
  jaRevelado?: boolean;
}

export function ScratchCardModal({
  open,
  onOpenChange,
  titulo = "RASPADINHA PREMIUM",
  organizacao = "",
  premio,
  jogoId,
  participacaoId,
  hashRaspe,
  seedRaspe,
  resultadoRaspe,
  onReveal,
  jaRevelado = false,
}: ScratchCardModalProps) {
  const isNewProps = premio !== undefined;
  
  const [revealed, setRevealed] = useState(isNewProps ? false : jaRevelado);
  const [result, setResult] = useState<{ ganhou: boolean; premio: ScratchCardModalProps["premio"] } | null>(null);
  const hasRevealedRef = useRef(false);
  const isProcessingRef = useRef(false);

  const handleReveal = useCallback(async (ganhou: boolean, premioResult: NonNullable<ScratchCardModalProps["premio"]>) => {
    // Previne chamadas múltiplas
    if (hasRevealedRef.current || isProcessingRef.current) return;
    isProcessingRef.current = true;

    setRevealed(true);
    setResult({ ganhou, premio: premioResult });

    // Confetti APENAS se ganhou
    if (ganhou) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
    
    // Chama onReveal apenas uma vez (para props antigas)
    // E ignora erro "Já revelada"
    if (!isNewProps && onReveal && participacaoId && !jaRevelado) {
      try {
        await onReveal(participacaoId);
      } catch (error) {
        // Ignora erro "Já revelada" - pode acontecer se já foi revelado
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes("Já revelada")) {
          console.error("Erro ao revelar:", error);
        }
      }
    }

    hasRevealedRef.current = true;
    isProcessingRef.current = false;
  }, [isNewProps, onReveal, participacaoId, jaRevelado]);

  const handleClose = useCallback(() => {
    setRevealed(false);
    setResult(null);
    hasRevealedRef.current = false;
    isProcessingRef.current = false;
    onOpenChange(false);
  }, [onOpenChange]);

  // Prémio padrão para quando não temos os dados completos
  const defaultPremio = {
    id: participacaoId || "default",
    nome: resultadoRaspe || "Prémio",
    descricao: null,
    imagemUrl: null,
    valorDinheiroAlternative: null,
  };

  const finalPremio = premio || defaultPremio;
  const finalJogoId = participacaoId || jogoId || "legacy-game";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 border-none bg-transparent overflow-hidden bottom-0 sm:top-0">
        <DialogTitle className="sr-only">{titulo}</DialogTitle>
        <DialogDescription className="sr-only">
          Raspadinha interativa - Deslize o dedo para revelar o seu prémio
        </DialogDescription>

        <div className="relative bg-surface-container rounded-3xl overflow-hidden shadow-2xl border border-outline/10">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary via-primaryContainer to-surfaceContainer p-6 text-center relative">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block mb-2"
            >
              <Sparkles className="w-8 h-8 text-foreground" />
            </motion.div>
            <h2 className="text-4xl font-black text-foreground font-headline tracking-wider">{titulo}</h2>
            {organizacao && <p className="text-tertiary mt-1 font-semibold">{organizacao}</p>}
          </div>

          {/* Área da raspadinha */}
          <div className="p-6 relative">
            {!revealed && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="bg-surface/80 backdrop-blur-sm px-6 py-3 rounded-xl border border-primary/30">
                  <p className="text-tertiary font-semibold flex items-center gap-2">
                    Arraste o dedo para raspar
                  </p>
                </div>
              </div>
            )}

            <ScratchCard
              key={finalJogoId}
              premio={finalPremio}
              jogoId={finalJogoId}
              onRevelado={handleReveal}
              skipApiCall={!isNewProps}
            />
          </div>

          {/* Resultado Revelado */}
          {revealed && result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 border-t border-outline/10"
            >
              <div className="text-center">
                <div className="text-7xl mb-4">
                  {result.ganhou ? "🎉" : "😢"}
                </div>

                <p className="text-4xl font-black mt-4 text-on-surface">
                  {result.ganhou ? result.premio?.nome || "Prémio" : "Sem prémio"}
                </p>

                {result.ganhou && result.premio?.valorDinheiroAlternative && (
                  <p className="text-5xl font-bold text-foreground mt-4">
                    €{result.premio.valorDinheiroAlternative}
                  </p>
                )}

                <Button
                  onClick={handleClose}
                  className="mt-6 w-full bg-gradient-to-r from-primary to-primaryContainer"
                >
                  {result.ganhou ? "Guardar Prémio" : "Fechar"}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
