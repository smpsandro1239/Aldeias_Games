"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Plus, ChevronDown, ChevronRight,
  Calendar, Gamepad2, Clock, Euro,
  Power, PowerOff, Trash2, Edit,
} from "lucide-react";
import type { Evento, Jogo, Aldeia } from "../types";

interface MinhaAldeiaTabProps {
  aldeias: Aldeia[];
  eventos: Evento[];
  jogos: Jogo[];
  setSelectedAldeia: (aldeia: Aldeia | null) => void;
  setAldeiaModalOpen: (open: boolean) => void;
  setSelectedEvento: (evento: Evento | null) => void;
  setEventoModalOpen: (open: boolean) => void;
  setSelectedJogo: (jogo: Jogo | null) => void;
  setJogoModalOpen: (open: boolean) => void;
  setSelectedEventoIdParaJogo: (id: string) => void;
  onToggleJogoEstado: (jogo: Jogo) => void;
  requestDelete: (type: string, id: string) => void;
}

function getEstadoBadge(estado: string) {
  const config: Record<string, { label: string; className: string }> = {
    rascunho: { label: "Rascunho", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
    ativo: { label: "Ativo", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
    pausado: { label: "Pausado", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
    finalizado: { label: "Finalizado", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
    cancelado: { label: "Cancelado", className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  };
  const c = config[estado] || config.rascunho;
  return <Badge className={c.className}>{c.label}</Badge>;
}

function getJogoTipoBadge(tipo: string) {
  const labels: Record<string, string> = {
    rifa: "Rifa",
    raspadinha: "Raspadinha",
    euromilhoes: "Euromilhões",
    poio_da_vaca: "Póio da Vaca",
  };
  return <Badge variant="outline" className="text-xs">{labels[tipo] || tipo}</Badge>;
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function MinhaAldeiaTab({
  aldeias,
  eventos,
  jogos,
  setSelectedAldeia,
  setAldeiaModalOpen,
  setSelectedEvento,
  setEventoModalOpen,
  setSelectedJogo,
  setJogoModalOpen,
  setSelectedEventoIdParaJogo,
  onToggleJogoEstado,
  requestDelete,
}: MinhaAldeiaTabProps) {
  const [expandedEventos, setExpandedEventos] = useState<Set<string>>(new Set());

  const toggleEvento = (id: string) => {
    setExpandedEventos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const aldeia = aldeias[0];

  const eventosAldeia = useMemo(() => eventos.filter((e) => e.aldeiaId === aldeia?.id), [eventos, aldeia]);
  const jogosByEvento = useMemo(() => {
    const map: Record<string, Jogo[]> = {};
    for (const j of jogos) {
      if (!map[j.eventoId]) map[j.eventoId] = [];
      map[j.eventoId].push(j);
    }
    return map;
  }, [jogos]);

  const totalJogos = jogos.filter((j) => eventosAldeia.some((e) => e.id === j.eventoId)).length;
  const jogosAbertos = jogos.filter((j) => j.estado === "aberto" && eventosAldeia.some((e) => e.id === j.eventoId)).length;
  const ativos = eventosAldeia.filter((e) => e.estado === "ativo").length;

  if (!aldeia) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Building2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Nenhuma aldeia encontrada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{aldeia.nome}</h2>
                  <p className="text-sm text-muted-foreground capitalize">{aldeia.tipoOrganizacao.replace("_", " ")}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Editar aldeia"
                onClick={() => { setSelectedAldeia(aldeia); setAldeiaModalOpen(true); }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {eventosAldeia.length} evento{eventosAldeia.length !== 1 ? "s" : ""}
                {ativos > 0 && <span className="text-green-600 dark:text-green-400"> ({ativos} ativo{ativos !== 1 ? "s" : ""})</span>}
              </span>
              <span className="inline-flex items-center gap-1">
                <Gamepad2 className="h-3 w-3" /> {totalJogos} jogo{totalJogos !== 1 ? "s" : ""} ({jogosAbertos} aberto{jogosAbertos !== 1 ? "s" : ""})
              </span>
            </div>
          </div>

          <div className="border-t">
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
              <span className="text-sm font-medium">Eventos</span>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedEvento(null);
                  setEventoModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Novo Evento
              </Button>
            </div>

            {eventosAldeia.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <Calendar className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground mb-3">Sem eventos nesta aldeia.</p>
                <Button size="sm" onClick={() => { setSelectedEvento(null); setEventoModalOpen(true); }}>
                  <Plus className="h-4 w-4 mr-1" /> Criar Primeiro Evento
                </Button>
              </div>
            ) : (
              <div>
                {eventosAldeia
                  .sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime())
                  .map((ev) => {
                    const evJogos = jogosByEvento[ev.id] || [];
                    const evExpanded = expandedEventos.has(ev.id);

                    return (
                      <div key={ev.id} className="border-b last:border-b-0">
                        <div
                          className="flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors cursor-pointer"
                          onClick={() => toggleEvento(ev.id)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {evExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{ev.nome}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-2">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(ev.dataInicio)} — {formatDate(ev.dataFim)}
                                </span>
                                {ev.totalAngariado > 0 && (
                                  <span className="inline-flex items-center gap-1">
                                    <Euro className="h-3 w-3" />
                                    {ev.totalAngariado.toLocaleString("pt-PT")}€
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1">
                                  <Gamepad2 className="h-3 w-3" />
                                  {evJogos.length} jogo{evJogos.length !== 1 ? "s" : ""}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            {getEstadoBadge(ev.estado)}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Editar evento"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvento(ev);
                                setEventoModalOpen(true);
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {evExpanded && (
                          <div className="bg-background/50 px-4 pb-3 pl-10">
                            {evJogos.length === 0 ? (
                              <div className="flex items-center justify-between py-3">
                                <p className="text-xs text-muted-foreground">Sem jogos neste evento.</p>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedJogo(null);
                                    setSelectedEventoIdParaJogo(ev.id);
                                    setJogoModalOpen(true);
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" /> Novo Jogo
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-end mb-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedJogo(null);
                                      setSelectedEventoIdParaJogo(ev.id);
                                      setJogoModalOpen(true);
                                    }}
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> Novo Jogo
                                  </Button>
                                </div>
                                <div className="space-y-1">
                                  {evJogos.map((jg) => (
                                    <div
                                      key={jg.id}
                                      className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent/50 transition-colors group"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <Gamepad2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                        <span className="text-sm font-medium truncate">{jg.nome}</span>
                                        {getJogoTipoBadge(jg.tipo)}
                                        <span className="text-xs text-muted-foreground">
                                          {jg.preco.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <Badge variant={jg.estado === "aberto" ? "default" : "secondary"} className="text-[10px]">
                                          {jg.estado === "aberto" ? "Aberto" : "Fechado"}
                                        </Badge>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                          title={jg.estado === "aberto" ? "Fechar" : "Abrir"}
                                          onClick={() => onToggleJogoEstado(jg)}
                                        >
                                          {jg.estado === "aberto" ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Eliminar"
                                          onClick={() => requestDelete("jogo", jg.id)}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
