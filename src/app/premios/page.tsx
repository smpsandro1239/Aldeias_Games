"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LayoutHeader } from "@/components/layout-header";
import { BottomNav } from "@/components/bottom-nav";
import {
  Gift, Trophy, Star, Clock, Award, Wallet, User, Heart, Home,
  Eye, CheckCircle2, XCircle, Hash, MapPin, Calendar, Gamepad2,
  Loader2, ChevronRight, AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProvaJogoModal } from "@/components/modals/prova-jogo-modal";

interface User {
  id: string;
  email: string;
  nome: string;
  role: string;
  aldeiaId?: string;
  saldo?: number;
}

interface PremioData {
  id: string;
  jogoNome: string;
  jogoTipo: string;
  aldeiaNome: string;
  valorPago: number;
  premioNome: string;
  premioValor: number;
  ganhador: boolean;
  premioEntregue: boolean;
  resultadoRaspe: string | null;
  hash: string | null;
  data: string;
  nomeCliente: string | null;
  vendedorNome: string | null;
  numerosSelecionados: number[] | null;
  grid: any[] | null;
}

export default function PremiosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [premios, setPremios] = useState<PremioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saldo, setSaldo] = useState(0);
  const [selectedPremio, setSelectedPremio] = useState<PremioData | null>(null);
  const [provaModalOpen, setProvaModalOpen] = useState(false);
  const [provaId, setProvaId] = useState<string | undefined>();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    fetchPremios();
    fetchSaldo();
  }, []);

  const fetchSaldo = async () => {
    try {
      const res = await fetch("/api/users/perfil");
      if (res.ok) {
        const data = await res.json();
        if (data.data?.saldo !== undefined) {
          setSaldo(data.data.saldo);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar saldo:", error);
    }
  };

  const fetchPremios = async () => {
    try {
      const allParticipacoes: any[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const res = await fetch(`/api/participacoes?page=${page}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          allParticipacoes.push(...(data.data || []));
          hasMore = data.pagination?.hasNext || false;
          page++;
        } else {
          hasMore = false;
        }
      }

      const premiosList: PremioData[] = allParticipacoes
        .filter((p: any) => p.ganhador)
        .map((p: any) => {
          let premioNome = "Prémio";
          let premioValor = 0;
          let grid: any[] | null = null;
          let numerosSelecionados: number[] | null = null;

          try {
            const dados = typeof p.dadosParticipacao === 'string'
              ? JSON.parse(p.dadosParticipacao)
              : p.dadosParticipacao;

            if (dados?.winningPrize) {
              premioNome = dados.winningPrize.nome || dados.winningPrize.name || premioNome;
              premioValor = dados.winningPrize.valorDinheiroAlternative || dados.winningPrize.valor || 0;
            } else if (p.resultadoRaspe && p.resultadoRaspe !== 'sem_premio') {
              premioNome = p.resultadoRaspe;
              // Try to find the prize value from the grid
              if (dados?.grid && Array.isArray(dados.grid)) {
                const found = dados.grid.find((g: any) => g.nome === p.resultadoRaspe);
                if (found) premioValor = found.valorDinheiroAlternative || found.valor || 0;
              }
            }

            grid = dados?.grid || null;
            numerosSelecionados = dados?.numeros || null;
          } catch {}

          return {
            id: p.id,
            jogoNome: p.jogo?.nome || "Jogo",
            jogoTipo: p.jogo?.tipo || "raspadinha",
            aldeiaNome: p.jogo?.evento?.aldeia?.nome || "Aldeia",
            valorPago: p.valorPago || 0,
            premioNome,
            premioValor,
            ganhador: p.ganhador,
            premioEntregue: p.premioEntregue || false,
            resultadoRaspe: p.resultadoRaspe,
            hash: p.hashParticipacao || p.hashRaspe || null,
            data: p.createdAt,
            nomeCliente: p.nomeCliente || null,
            vendedorNome: null,
            numerosSelecionados,
            grid,
          };
        });

      setPremios(premiosList);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "raspadinha": return <Gift className="w-5 h-5" />;
      case "poio_da_vaca": return <Trophy className="w-5 h-5" />;
      case "rifa": return <Star className="w-5 h-5" />;
      case "euromilhoes": return <Award className="w-5 h-5" />;
      default: return <Gift className="w-5 h-5" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "raspadinha": return "Raspadinha";
      case "poio_da_vaca": return "Poio da Vaca";
      case "rifa": return "Rifa";
      case "euromilhoes": return "Euromilhões";
      default: return tipo;
    }
  };

  const openProvaModal = (premio: PremioData) => {
    setProvaId(premio.id);
    setProvaModalOpen(true);
  };

  return (
    <LayoutHeader>
      <main className="px-4 py-6 max-w-md mx-auto space-y-6 pb-24">
        {/* Saldo Card */}
        {user && (
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center gap-3">
              <Wallet className="w-8 h-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Saldo Disponível</p>
                <p className="text-2xl font-black text-primary">{saldo.toFixed(2)}€</p>
              </div>
            </div>
          </div>
        )}

        {/* Prémios */}
        <div>
          <h2 className="font-serif text-lg text-accent mb-4">Os Teus Prémios</h2>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              A carregar os teus prémios...
            </div>
          ) : premios.length > 0 ? (
            <div className="space-y-3">
              {premios.map((premio) => (
                <Card
                  key={premio.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => openProvaModal(premio)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      {getTipoIcon(premio.jogoTipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-serif text-accent font-bold truncate">{premio.premioNome}</h3>
                        {premio.premioValor > 0 && (
                          <Badge className="bg-green-500/20 text-green-700 shrink-0">
                            +{premio.premioValor.toFixed(2)}€
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{premio.jogoNome}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(premio.data).toLocaleDateString("pt-PT")}
                        </span>
                        <span className="text-xs bg-surface-container-low text-muted-foreground px-2 py-0.5 rounded-full">
                          {getTipoLabel(premio.jogoTipo)}
                        </span>
                        {premio.premioEntregue ? (
                          <Badge className="bg-green-500/20 text-green-700 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Entregue
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-700 text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" /> Pendente
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-primary/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Ainda não ganhaste nenhum prémio</p>
              <p className="text-sm text-muted-foreground/60 mt-1">A sorte ainda não te sorriu. Participa e tenta a tua sorte!</p>
              <button
                onClick={() => router.push("/jogos")}
                className="mt-4 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl w-full sm:w-auto"
              >
                Participar Agora
              </button>
            </div>
          )}
        </div>

        <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/10">
          <h3 className="font-serif text-accent font-bold mb-3">Como Ganhar Prémios?</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Star className="w-4 h-4 text-primary mt-0.5" />
              <span>Participa nas Raspadinhas e descobre os teus prémios instantâneos</span>
            </li>
            <li className="flex items-start gap-2">
              <Trophy className="w-4 h-4 text-primary mt-0.5" />
              <span>No Poio da Vaca, os mais rápidos podem trazer prémios para casa</span>
            </li>
            <li className="flex items-start gap-2">
              <Award className="w-4 h-4 text-primary mt-0.5" />
              <span>Os Euromilhões e Rifas sorteiam prémios em dinheiro para a tua aldeia</span>
            </li>
          </ul>
        </div>
      </main>

      <ProvaJogoModal
        open={provaModalOpen}
        onOpenChange={setProvaModalOpen}
        participacaoId={provaId}
      />

      <BottomNav />
    </LayoutHeader>
  );
}
