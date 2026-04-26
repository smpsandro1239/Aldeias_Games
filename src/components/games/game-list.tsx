"use client";

import { motion } from "framer-motion";
import { Ticket, Trophy, Sparkles, ArrowRight, Leaf, Gamepad2, Loader2 } from "lucide-react";

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

export function GameList({
  jogos,
  onJogoClick,
  loading = false,
  title = "Os Nossos Jogos",
  emptyMessage = "Nenhum jogo disponível",
  emptySubtext = "Volte mais tarde!",
  showAldeia = true,
}: GameListProps) {
  const getGameIcon = (tipo: string) => {
    switch (tipo) {
      case "raspadinha": return Sparkles;
      case "poio_da_vaca": return Leaf;
      case "rifa": return Ticket;
      case "tombola": return Trophy;
      default: return Gamepad2;
    }
  };

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
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                onClick={() => onJogoClick(jogo)}
                className="w-full text-left bg-surface-container rounded-2xl p-5 hover:scale-[1.02] transition-all border border-outline-variant/20 shadow-lg"
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
                  <ArrowRight className="w-5 h-5 text-primary" />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
