"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/bottom-nav";
import { UserMenuModal } from "@/components/user-menu-modal";
import { Ticket, Trophy, Sparkles, ArrowRight, ArrowLeft, Leaf, User, Menu, Loader2, Gamepad2, Heart, Home } from "lucide-react";

interface User {
  id: string;
  email: string;
  nome: string;
  role: string;
  aldeiaId?: string;
}

import { GameList, Jogo } from "@/components/games/game-list";

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



  return (
    <div className="min-h-screen bg-[#110d0c] text-[#eae0de] font-body pb-32">
      <header className="sticky top-0 z-50 bg-[#110d0c]/95 backdrop-blur-xl border-b border-[#ff734b]/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="flex items-center gap-2">
              <Home className="text-[#ff734b] text-xl" />
              <span className="font-serif italic text-[#ff734b] text-lg font-bold">
                Aldeias Games
              </span>
            </button>
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
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-[#ff734b] mb-2">Os Teus Jogos</h1>
          <p className="text-[#e0bfb7] text-sm">Participa nos jogos da tua aldeia</p>
        </div>
        <GameList
          jogos={jogos}
          onJogoClick={handleJogoClick}
          loading={loading}
          title=""
          showAldeia={true}
        />
      </main>

      <UserMenuModal open={userMenuOpen} onOpenChange={setUserMenuOpen} />
      <BottomNav />
    </div>
  );
}
