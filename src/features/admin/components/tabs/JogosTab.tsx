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
  Power,
  PowerOff,
  Eye,
  QrCode
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Jogo, Evento } from "../types";

interface JogosTabProps {
  jogos: Jogo[];
  eventos: Evento[];
  userRole: string;
  selectedEventoIdParaJogo: string;
  setSelectedJogo: (jogo: Jogo | null) => void;
  setJogoModalOpen: (open: boolean) => void;
  setSelectedEventoIdParaJogo: (id: string) => void;
  setQrCodeData: (data: any) => void;
  setQrCodeOpen: (open: boolean) => void;
  handleTestarJogo: (jogo: Jogo) => void;
  setTestJogoOpen: (open: boolean) => void;
  requestDelete: (type: string, id: string) => void;
  getEstadoBadge: (estado: string) => React.ReactNode;
  onToggleEstado: (jogo: Jogo) => void;
  filtroEventoId?: string | null;
  onLimparFiltro?: () => void;
}

export function JogosTab({
  jogos,
  eventos,
  userRole,
  selectedEventoIdParaJogo,
  setSelectedJogo,
  setJogoModalOpen,
  setSelectedEventoIdParaJogo,
  setQrCodeData,
  setQrCodeOpen,
  handleTestarJogo,
  setTestJogoOpen,
  requestDelete,
  getEstadoBadge,
  onToggleEstado,
  filtroEventoId,
  onLimparFiltro,
}: JogosTabProps) {
  const [jogoSearch, setJogoSearch] = useState("");
  const [jogoPage, setJogoPage] = useState(1);

  const filteredJogos = useMemo(() => {
    let result = jogos;
    // Filtro por evento
    if (filtroEventoId) {
      result = result.filter(j => j.eventoId === filtroEventoId);
    }
    // Filtro por texto
    const searchLower = jogoSearch.toLowerCase();
    if (searchLower) {
      result = result.filter(jg =>
        jg.nome?.toLowerCase().includes(searchLower) ||
        jg.tipo?.toLowerCase().includes(searchLower)
      );
    }
    return result;
  }, [jogos, jogoSearch, filtroEventoId]);

  // Resetar página quando filtro ou busca mudar
  useEffect(() => {
    setJogoPage(1);
  }, [filtroEventoId, jogoSearch]);

  const handleOpenJogoModal = (tipo?: string) => {
    if (!eventos.length) {
      alert("Crie um evento primeiro");
      return;
    }
    // Se já há um evento selecionado (por filtro), usa ele; senão usa o primeiro
    setSelectedJogo(null);
    const eventoId = selectedEventoIdParaJogo || eventos[0].id;
    setSelectedEventoIdParaJogo(eventoId);
    setJogoModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">Jogos Criados</h2>
        <Button
          onClick={() => handleOpenJogoModal()}
          disabled={!eventos.length}
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Jogo
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <div className="flex-1 max-w-md">
          <Label htmlFor="jogoSearch" className="sr-only">
            Pesquisar jogo
          </Label>
          <Input
            id="jogoSearch"
            placeholder="Pesquisar por nome ou tipo..."
            value={jogoSearch}
            onChange={(e) => {
              setJogoSearch(e.target.value);
              setJogoPage(1);
            }}
          />
        </div>
      </div>

      {/* Filtro ativo */}
      {filtroEventoId && onLimparFiltro && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg w-fit">
          <span>Filtrando por evento</span>
          <button
            onClick={onLimparFiltro}
            className="text-primary hover:underline font-medium"
          >
            Limpar filtro
          </button>
        </div>
      )}

      {/* Lista */}
      {filteredJogos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Gamepad2 className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sem jogos</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Crie jogos para os seus eventos e comece a angariar fundos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredJogos
            .slice((jogoPage - 1) * 10, jogoPage * 10)
            .map((jg) => (
              <Card key={jg.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{jg.nome}</h3>
                    <p className="text-sm text-muted-foreground">
                      {jg.tipo} • {jg.evento?.nome || "Sem evento"} • {formatCurrency(jg.preco)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {jg.estado === 'aberto' && (
                      <span className="flex items-center gap-1 text-primary text-xs font-medium">
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        Ativo
                      </span>
                    )}
                    {getEstadoBadge(jg.estado)}

                    {userRole === "super_admin" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Testar jogo (modo fictício)"
                        className="text-secondary hover:text-primary"
                        onClick={() => handleTestarJogo(jg)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      title="Gerar QR Code para partilha"
                      className="text-secondary hover:text-primary"
                      onClick={() => {
                        setQrCodeData({ jogoId: jg.id, type: "jogo" });
                        setQrCodeOpen(true);
                      }}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      title={jg.estado === 'aberto' ? 'Desativar jogo' : 'Ativar jogo'}
                      className={
                        jg.estado === 'aberto'
                          ? 'text-primary hover:text-destructive'
                          : 'text-muted-foreground hover:text-primary'
                      }
                       onClick={() => onToggleEstado(jg)}
                    >
                      {jg.estado === 'aberto' ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedJogo(jg);
                        setSelectedEventoIdParaJogo(jg.eventoId);
                        setJogoModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => requestDelete("jogo", jg.id)}
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
      {filteredJogos.length > 10 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Mostrando {(jogoPage - 1) * 10 + 1} a {Math.min(jogoPage * 10, filteredJogos.length)} de {filteredJogos.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={jogoPage === 1}
              onClick={() => setJogoPage(jogoPage - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={jogoPage * 10 >= filteredJogos.length}
              onClick={() => setJogoPage(jogoPage + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
