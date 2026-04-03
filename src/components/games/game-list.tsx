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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9cefff]">
          Escolhe o Jogo
        </p>
        <h2 className="font-serif text-3xl font-bold tracking-tight">
          {title.split(' ').map((word, i, arr) => (
            i === arr.length - 1 ? (
              <span key={i} className="text-[#ff734b]"> {word}</span>
            ) : (
              <span key={i}> {word}</span>
            )
          ))}
        </h2>
      </motion.section>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff734b]" />
        </div>
      ) : jogos.length === 0 ? (
        <div className="text-center py-12 bg-[#1f1b19] rounded-2xl border border-[#58413b]/20">
          <p className="text-[#e0bfb7] font-medium">{emptyMessage}</p>
          <p className="text-sm text-[#e0bfb7]/60 mt-2">{emptySubtext}</p>
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
                className="w-full text-left bg-[#1f1b19] rounded-2xl p-5 hover:scale-[1.02] transition-all border border-[#58413b]/20 shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#2e2928] flex items-center justify-center">
                    <Icon className="w-7 h-7 text-[#ff734b]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-xl font-bold text-[#ffb5a0]">{jogo.nome}</h3>
                    <p className="text-sm text-[#e0bfb7] mt-1">
                      {showAldeia && (jogo.evento?.aldeia?.nome ? `${jogo.evento.aldeia.nome} • ` : "Aldeias Games • ")}
                      {jogo.preco}€
                    </p>
                    <p className="text-xs text-[#e0bfb7]/60 mt-1">
                      {jogo.stockAtual} disponíveis
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#ff734b]" />
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
