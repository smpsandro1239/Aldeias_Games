"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Trophy,
  User
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Vencedor } from "../types";
import { VencedorDetailModal } from "@/components/modals/vencedor-detail-modal";

interface VencedoresTabProps {
  vencedores: Vencedor[];
  setSelectedPremio: (vencedor: Vencedor | null) => void;
  setConvertPrizeOpen: (open: boolean) => void;
  setConfirmEntregaOpen: (open: boolean) => void;
  token: string;
}

export function VencedoresTab({
  vencedores,
  setSelectedPremio,
  setConvertPrizeOpen,
  setConfirmEntregaOpen,
  token,
}: VencedoresTabProps) {
  const [vencedorSearch, setVencedorSearch] = useState("");
  const [vencedorPage, setVencedorPage] = useState(1);
  const [selectedVencedor, setSelectedVencedor] = useState<Vencedor | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filteredVencedores = useMemo(() => {
    const searchLower = vencedorSearch.toLowerCase();
    return vencedores.filter(v => {
      if (!searchLower) return true;
      return (
        v.jogo?.nome?.toLowerCase().includes(searchLower) ||
        v.nomeCliente?.toLowerCase().includes(searchLower) ||
        v.user?.nome?.toLowerCase().includes(searchLower) ||
        v.telefoneCliente?.toLowerCase().includes(searchLower) ||
        v.user?.telefone?.toLowerCase().includes(searchLower)
      );
    });
  }, [vencedores, vencedorSearch]);

  const handleOpenDetail = (v: Vencedor) => {
    setSelectedVencedor(v);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Participações Vencedoras</h2>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <div className="flex-1 max-w-md">
          <Label htmlFor="vencedorSearch" className="sr-only">
            Pesquisar vencedor
          </Label>
          <Input
            id="vencedorSearch"
            placeholder="Pesquisar por jogo, nome ou telefone..."
            value={vencedorSearch}
            onChange={(e) => {
              setVencedorSearch(e.target.value);
              setVencedorPage(1);
            }}
          />
        </div>
      </div>

      {/* Lista */}
      {filteredVencedores.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Trophy className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sem vencedores</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Nenhum vencedor encontrado no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredVencedores
            .slice((vencedorPage - 1) * 10, vencedorPage * 10)
            .map((v) => (
              <Card 
                key={v.id} 
                className="cursor-pointer hover:bg-accent/5 transition-colors"
                onClick={() => handleOpenDetail(v)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{v.jogo?.nome || "Jogo eliminado"}</h3>
                    <p className="text-sm text-muted-foreground">
                      Cliente: {v.nomeCliente || v.user?.nome || "Anónimo"} • {v.telefoneCliente || v.user?.telefone || "Sem contacto"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Data: {formatDate(v.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                    {v.premioEntregue ? (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        Prémio Entregue/Convertido
                      </Badge>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPremio(v);
                            setConvertPrizeOpen(true);
                          }}
                        >
                          <DollarSign className="h-4 w-4 mr-1" /> Converter em Saldo
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPremio(v);
                            setConfirmEntregaOpen(true);
                          }}
                        >
                          Entregar Prémio
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Paginação */}
      {filteredVencedores.length > 10 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Mostrando {(vencedorPage - 1) * 10 + 1} a {Math.min(vencedorPage * 10, filteredVencedores.length)} de {filteredVencedores.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={vencedorPage === 1}
              onClick={() => setVencedorPage(vencedorPage - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={vencedorPage * 10 >= filteredVencedores.length}
              onClick={() => setVencedorPage(vencedorPage + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Vencedor */}
      <VencedorDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        vencedor={selectedVencedor}
        token={token}
        onConvertPrize={(v) => {
          setSelectedPremio(v);
          setConvertPrizeOpen(true);
          setDetailOpen(false);
        }}
        onEntregaPremio={(v) => {
          setSelectedPremio(v);
          setConfirmEntregaOpen(true);
          setDetailOpen(false);
        }}
      />
    </div>
  );
}
