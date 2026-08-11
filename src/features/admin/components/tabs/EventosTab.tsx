"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Edit,
  Trash2,
  Gamepad2,
  RotateCcw,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Evento, Jogo } from "../types";

interface EventosTabProps {
  eventos: Evento[];
  setSelectedEvento: (evento: Evento | null) => void;
  setEventoModalOpen: (open: boolean) => void;
  setJogoModalOpen: (open: boolean) => void;
  requestDelete: (type: string, id: string) => void;
  onRequestEliminacao?: (tipo: "jogo" | "evento" | "aldeia", recursoId: string, recursoNome: string) => void;
  getEstadoBadge: (estado: string) => React.ReactNode;
  onVerJogos?: (eventoId: string) => void;
}

export function EventosTab({
  eventos,
  setSelectedEvento,
  setEventoModalOpen,
  setJogoModalOpen,
  requestDelete,
  onRequestEliminacao,
  getEstadoBadge,
  onVerJogos,
}: EventosTabProps) {
  const [eventoSearch, setEventoSearch] = useState("");
  const [eventoPage, setEventoPage] = useState(1);

  const filteredEventos = useMemo(() => {
    const searchLower = eventoSearch.toLowerCase();
    return eventos.filter(ev =>
      !searchLower || ev.nome?.toLowerCase().includes(searchLower)
    );
  }, [eventos, eventoSearch]);

  // Resetar página quando busca mudar
  useEffect(() => {
    setEventoPage(1);
  }, [eventoSearch]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-accent">Eventos</h2>
            <p className="text-xs text-muted-foreground">{filteredEventos.length} eventos encontrados</p>
          </div>
        </div>
        <Button
          onClick={() => {
            setSelectedEvento(null);
            setEventoModalOpen(true);
          }}
          size="sm"
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 mr-1" /> Novo Evento
        </Button>
      </div>

      {/* Filtros */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="eventoSearch"
          placeholder="Pesquisar eventos..."
          value={eventoSearch}
          onChange={(e) => {
            setEventoSearch(e.target.value);
            setEventoPage(1);
          }}
          className="pl-9"
        />
      </div>

      {/* Lista */}
      {filteredEventos.length === 0 ? (
        <Card className="border-dashed border-outline-variant/20">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Calendar className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-accent">Sem eventos</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              {eventoSearch ? "Nenhum evento encontrado para esta pesquisa." : "Comece por criar o seu primeiro evento para organizar jogos e angariações."}
            </p>
            <Button onClick={() => setEventoModalOpen(true)} className="shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" /> Criar Evento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredEventos
            .slice((eventoPage - 1) * 10, eventoPage * 10)
            .map((ev) => (
              <Card key={ev.id} className="border-outline-variant/10 hover:border-primary/20 transition-all cursor-pointer overflow-hidden group">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div
                      className="flex-1 p-4"
                      onClick={() => {
                        setSelectedEvento(ev);
                        setEventoModalOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-accent">{ev.nome}</h3>
                        {ev.isTemplate && (
                          <span className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-medium">
                            <RotateCcw className="h-3 w-3" />
                            Recorrente
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(ev.dataInicio)} — {formatDate(ev.dataFim)}
                        <span className="text-primary/50">|</span>
                        <span className="font-medium text-emerald-500">{formatCurrency(ev.totalAngariado || 0)}</span>
                      </div>
                      {ev.isTemplate && ev.frequenciaRecorrencia && (
                        <p className="text-xs text-blue-500 mt-1">
                          Próxima: {ev.proximaData ? formatDate(ev.proximaData) : 'Calculando...'}
                        </p>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-1 px-3 border-l border-outline-variant/10 bg-surface-container-low"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 text-xs hover:bg-primary/10"
                        onClick={() => onVerJogos?.(ev.id)}
                      >
                        <Gamepad2 className="h-3.5 w-3.5 mr-1" /> Jogos
                      </Button>
                      {getEstadoBadge(ev.estado)}
                      <div className="w-px h-6 bg-outline-variant/10 mx-1" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-accent"
                        onClick={() => {
                          setSelectedEvento(ev);
                          setEventoModalOpen(true);
                        }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          onRequestEliminacao
                            ? onRequestEliminacao("evento", ev.id, ev.nome)
                            : requestDelete("evento", ev.id)
                        }
                        title="Pedir eliminação (requer aprovação de 2ª pessoa)"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Paginação */}
      {filteredEventos.length > 10 && (
        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
          <p className="text-xs text-muted-foreground">
            Mostrando {(eventoPage - 1) * 10 + 1} a {Math.min(eventoPage * 10, filteredEventos.length)} de {filteredEventos.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={eventoPage === 1}
              onClick={() => setEventoPage(eventoPage - 1)}
              className="border-outline-variant/20"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={eventoPage * 10 >= filteredEventos.length}
              onClick={() => setEventoPage(eventoPage + 1)}
              className="border-outline-variant/20"
            >
              Próxima <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
