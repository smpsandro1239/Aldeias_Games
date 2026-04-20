"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Crown, Gamepad2, Gift, Banknote } from "lucide-react";
import { toast } from "sonner";

interface RankingEntry {
  tipo: string;
  posicao: number;
  userId: string;
  nome: string;
  aldeia?: string;
  totalVendas?: number;
  totalJogos?: number;
  totalPremios?: number;
  totalGasto?: number;
  totalGanho?: number;
  numTransacoes?: number;
}

interface LeaderboardListProps {
  aldeiaId?: string;
  tipo?: "all" | "vendas" | "jogos" | "premios";
}

export function LeaderboardList({ aldeiaId, tipo = "all" }: LeaderboardListProps) {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "vendas" | "jogos" | "premios">(tipo);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    fetchRanking();
  }, [activeTab, aldeiaId, mounted]);

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (aldeiaId) params.set("aldeiaId", aldeiaId);
      params.set("tipo", activeTab);
      params.set("limite", "10");

      const res = await fetch(`/api/ranking?${params}`);
      const data = await res.json();

      if (res.ok) {
        setRankings(data.data || []);
      } else {
        toast.error("Erro ao carregar ranking");
      }
    } catch (error) {
      console.error("Erro ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (posicao: number) => {
    switch (posicao) {
      case 1:
        return "text-yellow-500";
      case 2:
        return "text-gray-400";
      case 3:
        return "text-amber-700";
      default:
        return "text-muted-foreground";
    }
  };

  const getMedalIcon = (posicao: number) => {
    switch (posicao) {
      case 1:
        return <Crown className="w-6 h-6" />;
      case 2:
        return <Medal className="w-5 h-5" />;
      case 3:
        return <Medal className="w-5 h-5" />;
      default:
        return <span className="text-sm font-bold w-6 text-center">{posicao}</span>;
    }
  };

  const formatValue = (entry: RankingEntry) => {
    if (activeTab === "vendas") {
      return `${entry.totalVendas?.toFixed(2)}€ (${entry.numTransacoes} vendas)`;
    }
    if (activeTab === "jogos") {
      return `${entry.totalJogos} jogos (${entry.totalGasto?.toFixed(2)}€)`;
    }
    if (activeTab === "premios") {
      return `${entry.totalPremios} prémios (${entry.totalGanho?.toFixed(2)}€)`;
    }
    return "";
  };

  if (!mounted) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "all" | "vendas" | "jogos" | "premios")} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Geral</TabsTrigger>
            <TabsTrigger value="vendas">
              <Banknote className="w-4 h-4 mr-1" /> Vendas
            </TabsTrigger>
            <TabsTrigger value="jogos">
              <Gamepad2 className="w-4 h-4 mr-1" /> Jogos
            </TabsTrigger>
            <TabsTrigger value="premios">
              <Gift className="w-4 h-4 mr-1" /> Prémios
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 animate-pulse"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-3 w-20 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : rankings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Sem dados para mostrar</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rankings.slice(0, 10).map((entry) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      entry.posicao <= 3
                        ? "bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20"
                        : "bg-muted/30"
                    }`}
                  >
                    <div className={`${getMedalColor(entry.posicao)} flex-shrink-0`}>
                      {getMedalIcon(entry.posicao)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{entry.nome}</p>
                      {entry.aldeia && (
                        <p className="text-xs text-muted-foreground truncate">
                          {entry.aldeia}
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <Badge
                        variant={entry.posicao <= 3 ? "default" : "secondary"}
                        className="font-mono"
                      >
                        {formatValue(entry)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}