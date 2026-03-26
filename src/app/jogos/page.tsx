"use client";

import { useState } from "react";
import PoioDaVacaTicket from "@/components/games/poio-da-vaca-ticket";
import UltimateRaffleTicket from "@/components/games/ultimate-raffle-ticket";
import TombolaTicket from "@/components/games/tombola-ticket";
import { ScratchCard } from "@/components/games/ScratchCard";

export default function JogosPage() {
  const [selectedGame, setSelectedGame] = useState<"poio_da_vaca" | "rifa" | "tombola" | "raspadinha" | null>(null);
  const [scratchCardResult, setScratchCardResult] = useState<{ ganhou: boolean; premio: { id: string; nome: string; descricao?: string | null; imagemUrl?: string | null; valorDinheiroAlternative?: number | null } } | null>(null);

  const games = [
    { id: "poio_da_vaca" as const, label: "Poio da Vaca", icon: "🐄" },
    { id: "rifa" as const, label: "Rifa", icon: "🎟️" },
    { id: "tombola" as const, label: "Tombola", icon: "🎫" },
    { id: "raspadinha" as const, label: "Raspadinha", icon: "💳" },
  ];

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
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Selecionar Jogo</h1>
      
      {!selectedGame ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {games.map((game) => (
            <div
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              className="cursor-pointer border rounded-lg p-6 text-center hover:shadow-lg transition-shadow duration-200"
            >
              <div className="text-5xl mb-3">{game.icon}</div>
              <h3 className="font-semibold">{game.label}</h3>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-6">
            <button 
              onClick={() => setSelectedGame(null)}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              ← Voltar à seleção
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center">
              {games.find(g => g.id === selectedGame)?.label}
            </h2>
          </div>
          <div className="max-w-4xl mx-auto">
            {renderTicket()}
          </div>
        </>
      )}
    </div>
  );
}
