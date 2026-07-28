"use client";

import { Trophy, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Prize } from "./raspadinha-types";

interface RaspadinhaWinOverlayProps {
  showWin: boolean;
  winningPrize: Prize | null;
  premioClaimed: boolean;
  creditedAmount: number | null;
  claiming: boolean;
  isNonRegularUser: boolean;
  playerDataModified: boolean;
  playerDataConfirmed: boolean;
  participacaoId: string | null;
  onClaim: (claimType: "carteira" | "cofre" | "jogar_novamente" | "pagar_cliente") => void;
  onClose: () => void;
  onViewProva: () => void;
}

export function RaspadinhaWinOverlay({
  showWin,
  winningPrize,
  premioClaimed,
  creditedAmount,
  claiming,
  isNonRegularUser,
  playerDataModified,
  playerDataConfirmed,
  participacaoId,
  onClaim,
  onClose,
  onViewProva,
}: RaspadinhaWinOverlayProps) {
  if (!winningPrize) return null;

  return (
    <AnimatePresence>
      {showWin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={premioClaimed ? onClose : undefined}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="bg-surface-container rounded-3xl p-5 sm:p-8 max-w-[90vw] sm:max-w-sm w-full text-center border border-primary/30 shadow-2xl shadow-glow"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: 3 }}
              className="mb-3 sm:mb-4"
            >
              <Trophy className="text-primary w-12 h-12 sm:w-16 sm:h-16 mx-auto" />
            </motion.div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-primary mb-2">
              PARABÉNS!
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-3">
              Ganhou: {winningPrize.nome}!
            </p>
            <p className="text-4xl sm:text-5xl font-bold text-secondary mb-4">
              {winningPrize.valorDinheiroAlternative}€
            </p>

            {premioClaimed && creditedAmount !== null && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-green-400 mb-5 font-medium"
              >
                ✓ {creditedAmount > 0 ? `${creditedAmount}€ creditado na sua carteira!` : "Prémio processado!"}
              </motion.p>
            )}

            {!premioClaimed && (!isNonRegularUser || !playerDataModified) && (
              <div className="mb-5 space-y-3">
                <button
                  disabled={claiming}
                  onClick={() => onClaim("carteira")}
                  className="w-full py-3.5 sm:py-4 bg-primary text-primary-foreground font-bold rounded-2xl active:scale-[0.98] transition-all shadow-xl shadow-glow disabled:opacity-50"
                >
                  {claiming ? "A processar..." : "Reclamar Prémio"}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reclamar mais tarde
                </button>
              </div>
            )}

            {!premioClaimed && isNonRegularUser && playerDataModified && (
              <div className="mb-5 space-y-2">
                <p className="text-xs text-muted-foreground/60 mb-2">
                  Como administrador/vendedor, escolha como processar o prémio:
                </p>
                <button
                  disabled={claiming}
                  onClick={() => onClaim("pagar_cliente")}
                  className="w-full py-3 bg-green-600 text-white font-bold rounded-2xl active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {claiming ? "A processar..." : `Pagar ao Cliente - ${winningPrize.valorDinheiroAlternative}€`}
                </button>
                <button
                  disabled={claiming}
                  onClick={() => onClaim("cofre")}
                  className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-2xl active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {claiming ? "A processar..." : "Entregar ao Cofre"}
                </button>
                <button
                  disabled={claiming}
                  onClick={() => onClaim("jogar_novamente")}
                  className="w-full py-3 bg-surface-container-low text-muted-foreground font-semibold rounded-2xl border border-outline-variant/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  Usar para Jogar Novamente
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reclamar mais tarde
                </button>
              </div>
            )}

            {premioClaimed && (
              <div className="space-y-2">
                <button
                  onClick={onViewProva}
                  className="w-full py-3 bg-surface-container-low text-primary font-semibold rounded-2xl border border-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="h-4 w-4" /> Ver Prova de Jogo
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3.5 sm:py-4 bg-primary text-primary-foreground font-bold rounded-2xl active:scale-[0.98] transition-all"
                >
                  Fechar
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
