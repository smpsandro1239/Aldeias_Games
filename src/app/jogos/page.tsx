"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LayoutHeader } from "@/components/layout-header";
import { Ticket, Trophy, Sparkles, ArrowRight, Leaf, Gamepad2, MapPin, Calendar, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useGameAnalytics } from "@/lib/game-analytics";

interface Jogo {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  stockAtual: number;
  estado: string;
  evento?: {
    id: string;
    nome: string;
    aldeia?: { id: string; nome: string };
  };
}

const GAME_ROUTES: Record<string, string> = {
  raspadinha: "/jogos/raspadinha-premium",
  poio_da_vaca: "/jogos/poio-da-vaca",
  rifa: "/jogos/rifa",
  euromilhoes: "/jogos/euromilhoes",
};

function hapticFeedback(duration: number = 10): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { navigator.vibrate?.(duration); } catch {}
  }
}

function getGameIcon(tipo: string) {
  switch (tipo) {
    case "raspadinha": return Sparkles;
    case "poio_da_vaca": return Leaf;
    case "rifa": return Ticket;
    case "euromilhoes": return Trophy;
    default: return Gamepad2;
  }
}

function getGameLabel(tipo: string) {
  switch (tipo) {
    case "raspadinha": return "Raspadinha";
    case "poio_da_vaca": return "Poio da Vaca";
    case "rifa": return "Rifa";
    case "euromilhoes": return "Euromilhões";
    default: return tipo;
  }
}

interface AldeiaGroup {
  aldeiaId: string;
  aldeiaNome: string;
  eventos: EventoGroup[];
}

interface EventoGroup {
  eventoId: string;
  eventoNome: string;
  jogos: Jogo[];
}

export default function JogosPage() {
  const router = useRouter();
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAldeias, setExpandedAldeias] = useState<Set<string>>(new Set());
  const [expandedEventos, setExpandedEventos] = useState<Set<string>>(new Set());
  const { trackGameClick } = useGameAnalytics();

  useEffect(() => {
    fetchJogos();
  }, []);

  const fetchJogos = useCallback(async () => {
    try {
      const res = await fetch("/api/jogos?ativos=true");
      if (res.ok) {
        const data = await res.json();
        setJogos(data.data || []);
        setExpandedAldeias(new Set(data.data?.map((j: Jogo) => j.evento?.aldeia?.id).filter(Boolean)));
      }
    } catch (error) {
      console.error("Erro ao carregar jogos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const grupos = useMemo<AldeiaGroup[]>(() => {
    const aldeiaMap = new Map<string, AldeiaGroup>();

    for (const jogo of jogos) {
      const aldeiaId = jogo.evento?.aldeia?.id || "sem-aldeia";
      const aldeiaNome = jogo.evento?.aldeia?.nome || "Aldeias Games";
      const eventoId = jogo.evento?.id || "sem-evento";
      const eventoNome = jogo.evento?.nome || "Sem Evento";

      if (!aldeiaMap.has(aldeiaId)) {
        aldeiaMap.set(aldeiaId, { aldeiaId, aldeiaNome, eventos: [] });
      }
      const aldeia = aldeiaMap.get(aldeiaId)!;

      let eventoGroup = aldeia.eventos.find(e => e.eventoId === eventoId);
      if (!eventoGroup) {
        eventoGroup = { eventoId, eventoNome, jogos: [] };
        aldeia.eventos.push(eventoGroup);
      }
      eventoGroup.jogos.push(jogo);
    }

    return Array.from(aldeiaMap.values());
  }, [jogos]);

  const toggleAldeia = (id: string) => {
    setExpandedAldeias(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleEvento = (id: string) => {
    setExpandedEventos(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleJogoClick = useCallback((jogo: Jogo) => {
    hapticFeedback(10);
    trackGameClick(jogo.id, jogo.tipo);
    const route = GAME_ROUTES[jogo.tipo] || GAME_ROUTES.raspadinha;
    router.push(`${route}?id=${jogo.id}`);
  }, [router, trackGameClick]);

  return (
    <LayoutHeader>
      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-primary mb-2">Os Teus Jogos</h1>
          <p className="text-muted-foreground text-sm">Participa nos jogos das aldeias</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : grupos.length === 0 ? (
          <div className="text-center py-12 bg-surface-container rounded-2xl border border-outline-variant/20">
            <Gamepad2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Nenhum jogo disponível</p>
            <p className="text-sm text-muted-foreground/60 mt-2">Volte mais tarde!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grupos.map((aldeia) => (
              <div key={aldeia.aldeiaId} className="bg-surface-container rounded-2xl border border-outline-variant/20 overflow-hidden">
                <button
                  onClick={() => toggleAldeia(aldeia.aldeiaId)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-surface-container-high transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <h2 className="font-serif text-lg font-bold text-foreground">{aldeia.aldeiaNome}</h2>
                    <p className="text-xs text-muted-foreground">
                      {aldeia.eventos.length} evento{aldeia.eventos.length !== 1 ? "s" : ""} • {" "}
                      {aldeia.eventos.reduce((acc, e) => acc + e.jogos.length, 0)} jogo{aldeia.eventos.reduce((acc, e) => acc + e.jogos.length, 0) !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {expandedAldeias.has(aldeia.aldeiaId) ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {expandedAldeias.has(aldeia.aldeiaId) && (
                  <div className="border-t border-outline-variant/10">
                    {aldeia.eventos.map((evento) => (
                      <div key={evento.eventoId}>
                        <button
                          onClick={() => toggleEvento(evento.eventoId)}
                          className="w-full flex items-center gap-3 px-4 py-3 pl-12 hover:bg-surface-container-high transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4 text-secondary" />
                          </div>
                          <div className="flex-1 text-left">
                            <h3 className="text-sm font-semibold text-foreground">{evento.eventoNome}</h3>
                            <p className="text-xs text-muted-foreground">
                              {evento.jogos.length} jogo{evento.jogos.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          {expandedEventos.has(evento.eventoId) ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>

                        {expandedEventos.has(evento.eventoId) && (
                          <div className="pb-2 pl-12 pr-4 space-y-2">
                            {evento.jogos.map((jogo) => {
                              const Icon = getGameIcon(jogo.tipo);
                              return (
                                <button
                                  key={jogo.id}
                                  onClick={() => handleJogoClick(jogo)}
                                  className="w-full text-left bg-surface-container-high rounded-xl p-4 hover:scale-[1.01] transition-all border border-outline-variant/10 shadow-sm"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                      <Icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-sm text-foreground truncate">{jogo.nome}</h4>
                                      <p className="text-xs text-muted-foreground">
                                        {getGameLabel(jogo.tipo)} • {jogo.preco}€ • {jogo.stockAtual} disponíveis
                                      </p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </LayoutHeader>
  );
}
