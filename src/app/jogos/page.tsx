"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BottomNav } from "@/components/bottom-nav";
import { Ticket, Trophy, Sparkles, ArrowRight, ArrowLeft, Leaf, User, LogOut, Menu } from "lucide-react";

const PoioDaVacaTicket = dynamic(() => import("@/components/games/poio-da-vaca-ticket").then(m => m.default), { ssr: false });
const UltimateRaffleTicket = dynamic(() => import("@/components/games/ultimate-raffle-ticket").then(m => m.default), { ssr: false });
const TombolaTicket = dynamic(() => import("@/components/games/tombola-ticket").then(m => m.default), { ssr: false });
const ScratchCard = dynamic(() => import("@/components/games/ScratchCard").then(m => m.ScratchCard), { ssr: false });

interface User {
  id: string;
  email: string;
  nome: string;
  role: string;
  aldeiaId?: string;
}

export default function JogosPage() {
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<"poio_da_vaca" | "rifa" | "tombola" | "raspadinha" | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scratchCardResult, setScratchCardResult] = useState<{ ganhou: boolean; premio: { id: string; nome: string; descricao?: string | null; imagemUrl?: string | null; valorDinheiroAlternative?: number | null } } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setUserMenuOpen(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const games = useMemo(() => [
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
      page: "/jogos/rifa"
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
  ], []);

  const handleGameSelect = useCallback((game: typeof games[0]) => {
    if (game.page) {
      router.push(game.page);
    } else {
      setSelectedGame(game.id);
    }
  }, []);

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
    <div className="min-h-screen bg-[#110d0c] text-[#eae0de] font-body pb-32">
      <header className="sticky top-0 z-50 bg-[#110d0c]/95 backdrop-blur-xl border-b border-[#ff734b]/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Menu className="text-[#ff734b] text-xl cursor-pointer" onClick={() => router.push("/")} />
            <span className="font-serif italic text-[#ff734b] text-lg font-bold">
              Aldeias Games
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#2e2928] overflow-hidden border border-[#ff734b]/20 relative">
              {user ? (
                <button 
                  onClick={() => setUserMenuOpen(true)}
                  className="w-full h-full bg-[#ff734b]/20 flex items-center justify-center hover:bg-[#ff734b]/30 transition-colors"
                >
                  <User className="h-4 w-4 text-[#ff734b]" />
                </button>
              ) : (
                <button onClick={() => router.push("/")} className="w-full h-full flex items-center justify-center text-[#ff734b] font-bold text-lg">
                  +
                </button>
              )}
            </div>
            <button 
              onClick={() => router.push("/")}
              className="p-2 rounded-full text-[#ff734b] hover:bg-[#2e2928] active:scale-95 transition-all"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-1"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9cefff]">
            Escolhe o Jogo
          </p>
          <h2 className="font-serif text-3xl font-bold tracking-tight">
            Os Nossos <span className="text-[#ff734b]">Jogos</span>
          </h2>
        </motion.section>
      
        <div className="grid gap-4">
          {games.map((game, index) => {
            const Icon = game.icon;
            return (
              <motion.button
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleGameSelect(game)}
                className="w-full text-left bg-[#1f1b19] rounded-2xl p-5 hover:scale-[1.02] transition-all border border-[#58413b]/20 shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#2e2928] flex items-center justify-center">
                    <Icon className="w-7 h-7 text-[#ff734b]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-xl font-bold text-[#ffb5a0]">{game.label}</h3>
                    <p className="text-sm text-[#e0bfb7] mt-1">{game.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#ff734b]" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </main>

      {/* User Menu Modal */}
      <Dialog open={userMenuOpen} onOpenChange={setUserMenuOpen}>
        <DialogContent className="sm:max-w-md bg-[#1f1b19] border border-[#ff734b]/10 p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="font-serif text-xl text-[#ffb5a0]">A minha Conta</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <div className="bg-[#2e2928] rounded-xl p-4 text-center">
              <p className="text-xs text-[#e0bfb7] mb-1">Bem-vindo</p>
              <p className="font-serif text-lg text-[#ffb5a0]">{user?.nome}</p>
              <p className="text-xs text-[#e0bfb7]/60 mt-1">{user?.email}</p>
            </div>
            <div className="bg-[#2e2928] rounded-xl p-4 text-center">
              <p className="text-xs text-[#e0bfb7] mb-1">O meu Saldo Aldeias</p>
              <p className="font-serif text-3xl text-[#ff734b]">5,55 €</p>
            </div>
            <button 
              onClick={() => {
                setUserMenuOpen(false);
                router.push('/perfil');
              }}
              className="w-full py-3 text-center text-[#9cefff] hover:bg-[#9cefff]/10 rounded-xl flex items-center justify-center gap-2"
            >
              <User className="h-4 w-4" />
              Editar Perfil
            </button>
            <button 
              onClick={handleLogout}
              className="w-full py-3 text-center text-red-500 hover:bg-red-500/10 rounded-xl flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Terminar Sessão
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
