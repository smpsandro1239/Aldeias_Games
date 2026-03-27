"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PoioDaVacaTicket from "@/components/games/poio-da-vaca-ticket";
import UltimateRaffleTicket from "@/components/games/ultimate-raffle-ticket";
import TombolaTicket from "@/components/games/tombola-ticket";
import { ScratchCard } from "@/components/games/ScratchCard";
import { 
  Ticket, 
  Trophy, 
  Sparkles, 
  ArrowRight,
  Leaf
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function JogosPage() {
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<"poio_da_vaca" | "rifa" | "tombola" | "raspadinha" | null>(null);
  const [scratchCardResult, setScratchCardResult] = useState<{ ganhou: boolean; premio: { id: string; nome: string; descricao?: string | null; imagemUrl?: string | null; valorDinheiroAlternative?: number | null } } | null>(null);

  const games = [
    { 
      id: "poio_da_vaca" as const, 
      label: "Poio da Vaca", 
      icon: Leaf, 
      description: "O jogo tradicional português",
      color: "bg-primary-container/20 text-primary-container",
      page: "/jogos/poio-da-vaca"
    },
    { 
      id: "rifa" as const, 
      label: "Rifa", 
      icon: Ticket, 
      description: "Sorteie os seus números",
      color: "bg-secondary-container/20 text-secondary",
      page: null
    },
    { 
      id: "tombola" as const, 
      label: "Tombola", 
      icon: Trophy, 
      description: "A grande tombolada",
      color: "bg-tertiary-container/20 text-tertiary",
      page: null
    },
    { 
      id: "raspadinha" as const, 
      label: "Raspadinha", 
      icon: Sparkles, 
      description: "Raspe e ganhe",
      color: "bg-primary/20 text-primary",
      page: "/raspadinha-premium"
    },
  ];

  const handleGameSelect = (game: typeof games[0]) => {
    if (game.page) {
      router.push(game.page);
    } else {
      setSelectedGame(game.id);
    }
  };

  // Dados de exemplo para a raspadinha
  const premioExemplo = {
    id: "premio-exemplo-1",
    nome: "Prémio Especial",
    descricao: "Vale de 50€ para gastar em lojas parceiras",
    imagemUrl: null,
    valorDinheiroAlternative: 50,
  };

  const handleScratchCardReveal = (ganhou: boolean, premio: { id: string; nome: string; descricao?: string | null; imagemUrl?: string | null; valorDinheiroAlternative?: number | null }) => {
    setScratchCardResult({ ganhou, premio });
    if (ganhou) {
      // Mostrar notificação de vitória
      alert(`🎉 Parabéns! Ganhou: ${premio.nome}`);
    }
  };

  const renderTicket = () => {
    switch (selectedGame) {
      case "poio_da_vaca":
        return <PoioDaVacaTicket />;
      case "rifa":
        return <UltimateRaffleTicket />;
      case "tombola":
        return <TombolaTicket />;
      case "raspadinha":
        return (
          <div className="flex flex-col items-center gap-6">
            <ScratchCard
              key="raspadinha-demo"
              premio={premioExemplo}
              jogoId="raspadinha-demo"
              onRevelado={handleScratchCardReveal}
            />
            {scratchCardResult && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg text-center">
                <p className="text-lg font-semibold">
                  {scratchCardResult.ganhou ? "🎉 Parabéns!" : "😢 Não foi desta vez"}
                </p>
                <p className="text-sm text-gray-600">
                  {scratchCardResult.ganhou
                    ? `Ganhou: ${scratchCardResult.premio.nome}`
                    : "Tente novamente com outra raspadinha!"}
                </p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface font-body p-6">
      <header className="flex items-center gap-3 mb-8">
        <h1 className="font-headline text-3xl text-primary">Os Nossos Jogos</h1>
      </header>
      
      <div className="grid gap-4 md:grid-cols-2">
        {games.map((game) => {
          const Icon = game.icon;
          return (
            <button
              key={game.id}
              onClick={() => handleGameSelect(game)}
              className={`${game.color} rounded-3xl p-6 text-left hover:scale-[1.02] transition-transform shadow-lg`}
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center">
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="font-headline text-xl">{game.label}</h3>
              </div>
              <p className="text-sm text-on-surface-variant mb-3">{game.description}</p>
              <div className="flex items-center text-xs font-bold uppercase tracking-widest opacity-60">
                Jogar <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
