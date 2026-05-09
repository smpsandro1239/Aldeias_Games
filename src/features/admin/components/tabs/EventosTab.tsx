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
  RotateCcw
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Evento, Jogo } from "../types";

interface EventosTabProps {
  eventos: Evento[];
  setSelectedEvento: (evento: Evento | null) => void;
  setEventoModalOpen: (open: boolean) => void;
  setJogoModalOpen: (open: boolean) => void;
  requestDelete: (type: string, id: string) => void;
  getEstadoBadge: (estado: string) => React.ReactNode;
  onVerJogos?: (eventoId: string) => void;
}

export function EventosTab({
  eventos,
  setSelectedEvento,
  setEventoModalOpen,
  setJogoModalOpen,
  requestDelete,
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Eventos</h2>
        <Button
          onClick={() => {
            setSelectedEvento(null);
            setEventoModalOpen(true);
          }}
          size="sm"
          className="bg-primary"
        >
          <Plus className="h-4 w-4 mr-1" /> Novo
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <div className="flex-1 max-w-md">
          <Label htmlFor="eventoSearch" className="sr-only">
            Pesquisar evento
          </Label>
          <Input
            id="eventoSearch"
            placeholder="Pesquisar por nome..."
            value={eventoSearch}
            onChange={(e) => {
              setEventoSearch(e.target.value);
              setEventoPage(1);
            }}
          />
        </div>
      </div>

      {/* Lista */}
      {filteredEventos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Gamepad2 className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sem eventos</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Comece por criar o seu primeiro evento para organizar jogos e angariações.
            </p>
            <Button onClick={() => setEventoModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Criar Evento
            </Button>
          </CardContent>
        </Card>
      ) : (
          <div className="grid gap-4">
            {filteredEventos
              .slice((eventoPage - 1) * 10, eventoPage * 10)
              .map((ev) => (
                <Card key={ev.id} className="hover:bg-accent/5 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                     <div
                       className="flex-1"
                       onClick={() => {
                         setSelectedEvento(ev);
                         setEventoModalOpen(true);
                       }}
                     >
                       <div className="flex items-center gap-2">
                         <h3 className="font-semibold">{ev.nome}</h3>
                         {ev.isTemplate && (
                           <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                             <RotateCcw className="h-3 w-3" />
                             Recorrente
                           </div>
                         )}
                       </div>
                       <p className="text-sm text-muted-foreground">
                         {formatDate(ev.dataInicio)} - {formatDate(ev.dataFim)}
                       </p>
                       {ev.isTemplate && ev.frequenciaRecorrencia && (
                         <p className="text-xs text-blue-600 mt-1">
                           Próxima: {ev.proximaData ? formatDate(ev.proximaData) : 'Calculando...'}
                         </p>
                       )}
                     </div>
                    <div
                      className="flex flex-wrap gap-2 items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onVerJogos?.(ev.id)}
                      >
                        <Gamepad2 className="h-4 w-4 mr-1" /> Ver Jogos
                      </Button>
                      {getEstadoBadge(ev.estado)}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedEvento(ev);
                          setEventoModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => requestDelete("evento", ev.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
      )}

      {/* Paginação */}
      {filteredEventos.length > 10 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Mostrando {(eventoPage - 1) * 10 + 1} a {Math.min(eventoPage * 10, filteredEventos.length)} de {filteredEventos.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={eventoPage === 1}
              onClick={() => setEventoPage(eventoPage - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={eventoPage * 10 >= filteredEventos.length}
              onClick={() => setEventoPage(eventoPage + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
