"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LayoutHeader } from "@/components/layout-header";
import { GameList, Jogo } from "@/components/games/game-list";

// Constants
const GAME_ROUTES = {
  raspadinha: "/jogos/raspadinha-premium",
  poio_da_vaca: "/jogos/poio-da-vaca",
  rifa: "/jogos/rifa",
  tombola: "/jogos/rifa",
  default: "/jogos/raspadinha-premium",
} as const;

const API_ENDPOINT = "/api/jogos?ativos=true";

export default function JogosPage() {
  const router = useRouter();
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJogos();
  }, []);

  const fetchJogos = useCallback(async () => {
    try {
      let token: string | null = null;
      try {
        token = localStorage.getItem("token");
      } catch (storageError) {
        console.warn("Erro ao acessar localStorage:", storageError);
      }

      const headers: HeadersInit = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(API_ENDPOINT, { headers });
      if (res.ok) {
        const data = await res.json();
        setJogos(data.data || []);
      } else {
        console.error("Erro na resposta da API:", res.status);
      }
    } catch (error) {
      console.error("Erro ao carregar jogos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleJogoClick = useCallback((jogo: Jogo) => {
    const route = GAME_ROUTES[jogo.tipo as keyof typeof GAME_ROUTES] || GAME_ROUTES.default;
    router.push(`${route}?id=${jogo.id}`);
  }, [router]);

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
