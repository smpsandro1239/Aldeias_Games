"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { Ticket, Trophy, Sparkles, ArrowRight, Leaf, Gamepad2, Loader2 } from "lucide-react";
import { useGameAnalytics } from "@/lib/game-analytics";

export interface Jogo {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  stockAtual: number;
  estado: string;
  evento?: {
    nome: string;
    aldeia?: { nome: string };
  };
}

export interface GameListProps {
  jogos: Jogo[];
  onJogoClick: (jogo: Jogo) => void;
  loading?: boolean;
  title?: string;
  emptyMessage?: string;
  emptySubtext?: string;
  showAldeia?: boolean;
}

// Haptic feedback helper
function hapticFeedback(duration: number = 10): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate?.(duration);
    } catch {
      // Ignorar
    }
  }
}

export function GameList({
  jogos,
  onJogoClick,
  loading = false,
  title = "Os Nossos Jogos",
  emptyMessage = "Nenhum jogo disponível",
  emptySubtext = "Volte mais tarde!",
  showAldeia = true,
}: GameListProps) {
  const { trackGameClick } = useGameAnalytics();

  const getGameIcon = (tipo: string) => {
    switch (tipo) {
      case "raspadinha": return Sparkles;
      case "poio_da_vaca": return Leaf;
      case "rifa": return Ticket;
      case "tombola": return Trophy;
      default: return Gamepad2;
    }
  };

  const handleClick = useCallback(
    (jogo: Jogo) => {
      hapticFeedback(10);
      trackGameClick(jogo.id, jogo.tipo);
      onJogoClick(jogo);
    },
    [onJogoClick, trackGameClick]
  );

  const GameCardSkeleton = () => (
    <div className="w-full bg-surface-container rounded-2xl p-5 border border-outline-variant/20 shadow-lg animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-surface-container-low flex items-center justify-center">
          <div className="w-7 h-7 bg-muted-foreground/20 rounded" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-muted-foreground/20 rounded w-3/4" />
          <div className="h-4 bg-muted-foreground/20 rounded w-1/2" />
          <div className="h-3 bg-muted-foreground/20 rounded w-1/3" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-1 mb-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
          Escolhe o Jogo
        </p>
        <h2 className="font-serif text-3xl font-bold tracking-tight">
          {title.split(' ').map((word, i, arr) => (
            i === arr.length - 1 ? (
              <span key={i} className="text-primary"> {word}</span>
            ) : (
              <span key={i}> {word}</span>
            )
          ))}
        </h2>
      </motion.section>

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      ) : jogos.length === 0 ? (
        <div className="text-center py-12 bg-surface-container rounded-2xl border border-outline-variant/20">
          <p className="text-muted-foreground font-medium">{emptyMessage}</p>
          <p className="text-sm text-muted-foreground/60 mt-2">{emptySubtext}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jogos.map((jogo, index) => {
            const Icon = getGameIcon(jogo.tipo);
            return (
                <motion.button
                key={jogo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleClick(jogo)}
                className="w-full text-left bg-surface-container rounded-2xl p-5 hover:scale-[1.02] transition-all border border-outline-variant/20 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick(jogo);
                  }
                }}
                aria-label={`Jogo ${jogo.nome}, ${jogo.preco}€, ${jogo.stockAtual} disponíveis`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-surface-container-low flex items-center justify-center">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-xl font-bold text-accent">{jogo.nome}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {showAldeia && (jogo.evento?.aldeia?.nome ? `${jogo.evento.aldeia.nome} • ` : "Aldeias Games • ")}
                      {jogo.preco}€
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {jogo.stockAtual} disponíveis
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
