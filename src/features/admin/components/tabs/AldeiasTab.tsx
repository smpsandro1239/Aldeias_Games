"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Gamepad2,
  Clock,
  Euro,
  Power,
  PowerOff,
} from "lucide-react";
import { Aldeia, Evento, Jogo, EstadoEvento } from "../types";

interface AldeiasTabProps {
  aldeias: Aldeia[];
  eventos: Evento[];
  jogos: Jogo[];
  setSelectedAldeia: (aldeia: Aldeia | null) => void;
  setAldeiaModalOpen: (open: boolean) => void;
  setSelectedEvento: (evento: Evento | null) => void;
  setEventoModalOpen: (open: boolean) => void;
  setEventoModalAldeiaId?: (id: string) => void;
  setSelectedJogo: (jogo: Jogo | null) => void;
  setJogoModalOpen: (open: boolean) => void;
  setSelectedEventoIdParaJogo: (id: string) => void;
  onToggleJogoEstado?: (jogo: Jogo) => void;
  requestDelete: (type: string, id: string) => void;
}

function getEstadoBadge(estado: EstadoEvento) {
  const config: Record<EstadoEvento, { label: string; className: string }> = {
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

export function AldeiasTab({
  aldeias,
  eventos,
  jogos,
  setSelectedAldeia,
  setAldeiaModalOpen,
  setSelectedEvento,
  setEventoModalOpen,
  setEventoModalAldeiaId,
  setSelectedJogo,
  setJogoModalOpen,
  setSelectedEventoIdParaJogo,
  onToggleJogoEstado,
  requestDelete,
}: AldeiasTabProps) {
  const [aldeiaSearch, setAldeiaSearch] = useState("");
  const [expandedAldeias, setExpandedAldeias] = useState<Set<string>>(new Set());
  const [expandedEventos, setExpandedEventos] = useState<Set<string>>(new Set());

  const eventosByAldeia = useMemo(() => {
    const map: Record<string, Evento[]> = {};
    for (const ev of eventos) {
      if (!map[ev.aldeiaId]) map[ev.aldeiaId] = [];
      map[ev.aldeiaId].push(ev);
    }
    return map;
  }, [eventos]);

  const jogosByEvento = useMemo(() => {
    const map: Record<string, Jogo[]> = {};
    for (const j of jogos) {
      if (!map[j.eventoId]) map[j.eventoId] = [];
      map[j.eventoId].push(j);
    }
    return map;
  }, [jogos]);

  const filteredAldeias = useMemo(() => {
    const searchLower = aldeiaSearch.toLowerCase();
    return aldeias.filter((al) => {
      if (!searchLower) return true;
      return (
        al.nome?.toLowerCase().includes(searchLower) ||
        al.tipoOrganizacao?.toLowerCase().includes(searchLower) ||
        al.email?.toLowerCase().includes(searchLower)
      );
    });
  }, [aldeias, aldeiaSearch]);

  const toggleAldeia = (id: string) => {
    setExpandedAldeias((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleEvento = (id: string) => {
    setExpandedEventos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNovoEvento = (aldeiaId: string) => {
    setSelectedEvento(null);
    setEventoModalAldeiaId?.(aldeiaId);
    setEventoModalOpen(true);
  };

  const handleNovoJogo = (eventoId: string) => {
    setSelectedJogo(null);
    setSelectedEventoIdParaJogo(eventoId);
    setJogoModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestão de Aldeias/Organizações</h2>
        <Button onClick={() => { setSelectedAldeia(null); setAldeiaModalOpen(true); }} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nova Aldeia
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 max-w-md">
          <Label htmlFor="aldeiaSearch" className="sr-only">Pesquisar aldeia</Label>
          <Input
            id="aldeiaSearch"
            placeholder="Pesquisar por nome, tipo ou email..."
            value={aldeiaSearch}
            onChange={(e) => setAldeiaSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredAldeias.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sem organizações</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Crie a primeira organização para começar a gerir aldeias, escolas e associações.
            </p>
            <Button onClick={() => setAldeiaModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Nova Organização
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAldeias.map((al) => {
            const evs = eventosByAldeia[al.id] || [];
            const isExpanded = expandedAldeias.has(al.id);
            const ativos = evs.filter((e) => e.estado === "ativo").length;

            return (
              <Card key={al.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Aldeia header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => toggleAldeia(al.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{al.nome}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {al.tipoOrganizacao}
                          {al.email ? ` • ${al.email}` : ""}
                          {" • "}
                          <Calendar className="h-3 w-3 inline" /> {evs.length} evento{evs.length !== 1 ? "s" : ""}
                          {ativos > 0 && <span className="text-green-600 dark:text-green-400"> ({ativos} ativo{ativos !== 1 ? "s" : ""})</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Novo evento" onClick={() => handleNovoEvento(al.id)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar aldeia" onClick={() => { setSelectedAldeia(al); setAldeiaModalOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Eliminar" onClick={() => requestDelete("aldeia", al.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded: events */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30">
                      {evs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4">
                          <Calendar className="h-8 w-8 text-muted-foreground/50 mb-2" />
                          <p className="text-sm text-muted-foreground mb-3">Sem eventos nesta organização.</p>
                          <Button size="sm" onClick={() => handleNovoEvento(al.id)}>
                            <Plus className="h-4 w-4 mr-1" /> Criar Primeiro Evento
                          </Button>
                        </div>
                      ) : (
                        <div>
                          {evs
                            .sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime())
                            .map((ev) => {
                              const evJogos = jogosByEvento[ev.id] || [];
                              const evExpanded = expandedEventos.has(ev.id);

                              return (
                                <div key={ev.id} className="border-b last:border-b-0">
                                  {/* Event row */}
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
                                    </div>
                                  </div>

                                  {/* Expanded: games under this event */}
                                  {evExpanded && (
                                    <div className="bg-background/50 px-4 pb-3 pl-10">
                                      {evJogos.length === 0 ? (
                                        <div className="flex items-center justify-between py-3">
                                          <p className="text-xs text-muted-foreground">Sem jogos neste evento.</p>
                                          <Button size="sm" variant="outline" onClick={() => handleNovoJogo(ev.id)}>
                                            <Plus className="h-3 w-3 mr-1" /> Novo Jogo
                                          </Button>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex justify-end mb-2">
                                            <Button size="sm" variant="outline" onClick={() => handleNovoJogo(ev.id)}>
                                              <Plus className="h-3 w-3 mr-1" /> Novo Jogo
                                            </Button>
                                          </div>
                                          <div className="space-y-1">
                                            {evJogos.map((jg) => (
                                              <div
                                                key={jg.id}
                                                className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent/50 transition-colors"
                                              >
                                                <div className="flex items-center gap-2 min-w-0">
                                                  <Gamepad2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                                  <span className="text-sm font-medium truncate">{jg.nome}</span>
                                                  {getJogoTipoBadge(jg.tipo)}
                                                  <span className="text-xs text-muted-foreground">
                                                    {jg.preco.toLocaleString("pt-PT", { style: "currency", currency: "EUR" })}
                                                  </span>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                  {onToggleJogoEstado && (
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="h-7 w-7"
                                                      title={jg.estado === "aberto" ? "Fechar" : "Abrir"}
                                                      onClick={() => onToggleJogoEstado(jg)}
                                                    >
                                                      {jg.estado === "aberto" ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                                                    </Button>
                                                  )}
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive"
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
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
