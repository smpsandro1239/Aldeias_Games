"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LayoutHeader } from "@/components/layout-header";
import { GameList, Jogo } from "@/components/games/game-list";

export default function JogosPage() {
  const router = useRouter();
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    <LayoutHeader>
      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-primary mb-2">Os Teus Jogos</h1>
          <p className="text-muted-foreground text-sm">Participa nos jogos da tua aldeia</p>
        </div>
        <GameList
          jogos={jogos}
          onJogoClick={handleJogoClick}
          loading={loading}
          title=""
          showAldeia={true}
        />
      </main>
    </LayoutHeader>
  );
}
