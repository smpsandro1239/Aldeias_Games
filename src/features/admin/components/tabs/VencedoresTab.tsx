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
  User,
  Gift,
  Clock
} from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Vencedor } from "../types";
import { VencedorDetailModal } from "@/components/modals/vencedor-detail-modal";

interface VencedoresTabProps {
  vencedores: Vencedor[];
  setSelectedPremio: (vencedor: Vencedor | null) => void;
  setConvertPrizeOpen: (open: boolean) => void;
  setConfirmEntregaOpen: (open: boolean) => void;
}

export function VencedoresTab({
  vencedores,
  setSelectedPremio,
  setConvertPrizeOpen,
  setConfirmEntregaOpen,
}: VencedoresTabProps) {
  const [vencedorSearch, setVencedorSearch] = useState("");
  const [vencedorPage, setVencedorPage] = useState(1);
  const [selectedVencedor, setSelectedVencedor] = useState<Vencedor | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const parseWinningPrize = (v: Vencedor): { nome: string; valor: number } | null => {
    let dp: Record<string, unknown> | null = null;
    try {
      dp = typeof v.dadosParticipacao === 'string' ? JSON.parse(v.dadosParticipacao) : (v.dadosParticipacao as unknown);
    } catch {
      dp = null;
    }
    const winningPrize = (dp as Record<string, unknown>)?.winningPrize as Record<string, unknown> | null | undefined;
    if (winningPrize && typeof winningPrize.nome === 'string') {
      return { nome: winningPrize.nome, valor: Number(winningPrize.valorDinheiroAlternative) || 0 };
    }
    if ((dp as Record<string, unknown>)?.hasWin === true && Array.isArray((dp as Record<string, unknown>)?.grid)) {
      const counts = new Map<string, number>();
      for (const g of ((dp as Record<string, unknown>).grid as { nome?: string; valorDinheiroAlternative?: number }[])) {
        if (!g?.nome) continue;
        counts.set(g.nome, (counts.get(g.nome) || 0) + 1);
        if (counts.get(g.nome)! >= 3 && (Number(g.valorDinheiroAlternative) || 0) > 0) {
          return { nome: g.nome, valor: Number(g.valorDinheiroAlternative) || 0 };
        }
      }
    }
    if (v.resultadoRaspe && v.resultadoRaspe !== 'sem_premio') {
      const match = v.jogo?.premios?.find((p) => p.nome === v.resultadoRaspe);
      if (match) return { nome: match.nome || v.resultadoRaspe, valor: Number(match.valorDinheiroAlternative) || 0 };
      return { nome: v.resultadoRaspe, valor: 0 };
    }
    return null;
  };

  const getEntregaMeta = (v: Vencedor) =>
    v.alteracoes?.find((a) =>
      ["entrega_premio", "convert_prize", "claim", "claim_cofre", "claim_jogar_novamente", "claim_pagar_cliente", "desfazer_entrega_premio"].includes(a.tipoAlteracao || "")
    );

  const ENTREGA_TIPO_LABEL: Record<string, string> = {
    entrega_premio: "Entregue",
    convert_prize: "Convertido em saldo",
    claim: "Reclamado (carteira)",
    claim_cofre: "Entregue ao cofre",
    claim_jogar_novamente: "Convertido para jogar",
    claim_pagar_cliente: "Pago ao cliente",
    desfazer_entrega_premio: "Entrega anulada",
  };

  const filteredVencedores = useMemo(() => {
    const searchLower = vencedorSearch.toLowerCase();
    return vencedores.filter(v => {
      if (!searchLower) return true;
      const won = parseWinningPrize(v);
      return (
        v.jogo?.nome?.toLowerCase().includes(searchLower) ||
        v.nomeCliente?.toLowerCase().includes(searchLower) ||
        v.user?.nome?.toLowerCase().includes(searchLower) ||
        v.telefoneCliente?.toLowerCase().includes(searchLower) ||
        v.user?.telefone?.toLowerCase().includes(searchLower) ||
        (won?.nome ?? "").toLowerCase().includes(searchLower)
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
            .map((v) => {
              const won = parseWinningPrize(v);
              const entrega = getEntregaMeta(v);
              return (
                <Card
                  key={v.id}
                  className="cursor-pointer hover:bg-accent/5 transition-colors"
                  onClick={() => handleOpenDetail(v)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{v.jogo?.nome || "Jogo eliminado"}</h3>
                          <Badge variant="secondary" className="text-xs">{v.jogo?.tipo || "jogo"}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Cliente: {v.nomeCliente || v.user?.nome || "Anónimo"} • {v.telefoneCliente || v.user?.telefone || "Sem contacto"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {v.jogo?.evento?.aldeia?.nome ? <>Aldeia: {v.jogo.evento.aldeia.nome} • </> : null}
                          Data: {formatDate(v.createdAt)}
                        </p>
                        {(v.jogo?.premios?.length ?? 0) > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            <span className="font-medium">Prémios em jogo:</span>{" "}
                            {v.jogo!.premios!.map((p, i) => (
                              <span key={p.id || i} className="inline-flex items-center mr-3">
                                {p.nome}
                                {typeof p.valorDinheiroAlternative === "number" && p.valorDinheiroAlternative > 0
                                  ? ` (${formatCurrency(p.valorDinheiroAlternative)})`
                                  : ""}
                              </span>
                            ))}
                          </p>
                        )}
                        {won && (
                          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-2 inline-flex items-center gap-1">
                            <Gift className="h-4 w-4" /> Prémio ganho: {won.nome}
                            {won.valor > 0 ? ` • ${formatCurrency(won.valor)}` : ""}
                          </p>
                        )}
                        {v.premioEntregue && entrega && (
                          <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {entrega.user?.nome || "Desconhecido"}
                            {entrega.createdAt ? ` • ${formatDate(entrega.createdAt)}` : ""}
                            {entrega.tipoAlteracao ? ` • ${ENTREGA_TIPO_LABEL[entrega.tipoAlteracao] || entrega.tipoAlteracao}` : ""}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 items-end shrink-0" onClick={(e) => e.stopPropagation()}>
                        {v.premioEntregue ? (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {entrega?.tipoAlteracao
                              ? ENTREGA_TIPO_LABEL[entrega.tipoAlteracao] || "Prémio Entregue"
                              : "Prémio Entregue"}
                          </Badge>
                        ) : (
                          <div className="flex flex-col gap-2">
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
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
