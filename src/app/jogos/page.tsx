"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/bottom-nav";
import { UserMenuModal } from "@/components/user-menu-modal";
import { Ticket, Trophy, Sparkles, ArrowRight, ArrowLeft, Leaf, User, Menu, Loader2, Gamepad2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  nome: string;
  role: string;
  aldeiaId?: string;
}

interface Jogo {
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

export default function JogosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    fetchJogos();
  }, []);

  const fetchJogos = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      
      const res = await fetch("/api/jogos?ativos=true", { headers });
      if (res.ok) {
        const data = await res.json();
        setJogos(data.data || []);
      }
    } catch (error) {
      console.error("Erro ao carregar jogos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = useCallback(() => {
    setUser(null);
    setUserMenuOpen(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const handleJogoClick = (jogo: Jogo) => {
    switch (jogo.tipo) {
      case "raspadinha":
        router.push(`/jogos/raspadinha-premium?id=${jogo.id}`);
        break;
      case "poio_da_vaca":
        router.push(`/jogos/poio-da-vaca?id=${jogo.id}`);
        break;
      case "rifa":
      case "tombola":
        router.push(`/jogos/rifa?id=${jogo.id}`);
        break;
      default:
        router.push(`/jogos/raspadinha-premium?id=${jogo.id}`);
    }
  };

  const getGameIcon = (tipo: string) => {
    switch (tipo) {
      case "raspadinha": return Sparkles;
      case "poio_da_vaca": return Leaf;
      case "rifa": return Ticket;
      case "tombola": return Trophy;
      default: return Gamepad2;
    }
  };

  const getGameLabel = (tipo: string) => {
    switch (tipo) {
      case "raspadinha": return "Raspadinha";
      case "poio_da_vaca": return "Poio da Vaca";
      case "rifa": return "Rifa";
      case "tombola": return "Tombola";
      default: return "Jogo";
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
      
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff734b]" />
          </div>
        ) : jogos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#e0bfb7]">Nenhum jogo disponível no momento.</p>
            <p className="text-sm text-[#e0bfb7]/60 mt-2">Volte mais tarde!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {jogos.map((jogo, index) => {
              const Icon = getGameIcon(jogo.tipo);
              const label = getGameLabel(jogo.tipo);
              return (
                <motion.button
                  key={jogo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleJogoClick(jogo)}
                  className="w-full text-left bg-[#1f1b19] rounded-2xl p-5 hover:scale-[1.02] transition-all border border-[#58413b]/20 shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[#2e2928] flex items-center justify-center">
                      <Icon className="w-7 h-7 text-[#ff734b]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-xl font-bold text-[#ffb5a0]">{jogo.nome}</h3>
                      <p className="text-sm text-[#e0bfb7] mt-1">
                        {jogo.evento?.aldeia?.nome || "Aldeias Games"} • {jogo.preco}€
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
      </main>

      <UserMenuModal open={userMenuOpen} onOpenChange={setUserMenuOpen} />
      <BottomNav />
    </div>
  );
}
