"use client";

import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BarChart3, RefreshCw, Trophy, Package, Euro, Users, Clock, Star } from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import type { JogoDetalhes } from "@/features/admin/components/types";

interface JogoDetalhesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jogoId: string | null;
  jogoNome: string | null;
}

function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border p-3 flex items-start gap-3">
      <div className="rounded-md bg-primary/10 p-2">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold text-lg leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export function JogoDetalhesModal({ open, onOpenChange, jogoId, jogoNome }: JogoDetalhesModalProps) {
  const [detalhes, setDetalhes] = useState<JogoDetalhes | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDetalhes = useCallback(async () => {
    if (!jogoId) return;
    setLoading(true);
    try {
      const res = await apiRequest(`/api/jogos/${jogoId}/detail`, {});
      if (res.ok) {
        const data = await res.json();
        setDetalhes(data);
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes do jogo:", error);
    } finally {
      setLoading(false);
    }
  }, [jogoId]);

  useEffect(() => {
    if (open && jogoId) fetchDetalhes();
  }, [open, jogoId, fetchDetalhes]);

  const config = typeof detalhes?.configuracao === "string" ? null : (detalhes?.configuracao as any) || null;
  const poolRestante = detalhes?.poolRestante || [];
  const premios = detalhes?.premios || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Métricas: {detalhes?.nome || jogoNome}
            <ButtonGhost onRefresh={fetchDetalhes} loading={loading} />
          </DialogTitle>
        </DialogHeader>

        {loading && !detalhes ? (
          <p className="text-center text-muted-foreground py-8">A carregar métricas...</p>
        ) : detalhes ? (
          <div className="space-y-5 py-2">
            {/* Estado */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={detalhes.estado === "aberto" ? "default" : "secondary"}>
                {detalhes.estado === "aberto" ? "Aberto" : detalhes.estado}
              </Badge>
              {detalhes.eliminado && <Badge className="bg-destructive/15 text-destructive">Eliminado</Badge>}
              <span className="text-sm text-muted-foreground">
                {detalhes.evento?.nome} · {detalhes.evento?.aldeia?.nome}
              </span>
            </div>

            {/* Métricas principais */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <MetricCard
                icon={<Users className="h-4 w-4" />}
                label="Participações pagas"
                value={String(detalhes.totalParticipacoes)}
              />
              <MetricCard
                icon={<Euro className="h-4 w-4" />}
                label="Total angariado"
                value={formatCurrency(detalhes.totalAngariado)}
              />
              <MetricCard
                icon={<Package className="h-4 w-4" />}
                label="Bilhetes vendidos"
                value={`${detalhes.vendidos} / ${detalhes.stockInicial}`}
                sub={`Stock restante: ${detalhes.stockAtual}`}
              />
              <MetricCard
                icon={<Clock className="h-4 w-4" />}
                label="Pagamentos pendentes"
                value={String(detalhes.pendentes)}
              />
              <MetricCard
                icon={<Trophy className="h-4 w-4" />}
                label="Ganhadores"
                value={String(detalhes.ganhadores)}
                sub={`Entregues: ${detalhes.premiosEntregues} · Por entregar: ${detalhes.premiosPendentes}`}
              />
              <MetricCard
                icon={<Star className="h-4 w-4" />}
                label="Prémio por bilhete"
                value={formatCurrency(detalhes.preco)}
              />
            </div>

            {/* Prémios configurados */}
            {premios.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Prémios configurados</h4>
                <div className="flex flex-wrap gap-2">
                  {premios.map((p) => (
                    <span key={p.id} className="rounded-full border px-3 py-1 text-sm">
                      {p.nome}
                      {p.valorDinheiroAlternative ? ` · ${formatCurrency(p.valorDinheiroAlternative)}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pool raspadinha */}
            {detalhes.tipo === "raspadinha" && (
              <div>
                <h4 className="font-semibold mb-2">Prémios por sortear no pool</h4>
                {poolRestante.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem pool configurado (jogo antigo) ou pool esgotado.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {poolRestante.map((item) => (
                      <span key={item.nome} className="rounded-full border px-3 py-1 text-sm">
                        {item.nome} × {item.qtd}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Configuração */}
            {config && (
              <div className="text-sm text-muted-foreground space-y-1">
                {config.dataSorteio && <p>Sorteio: {new Date(config.dataSorteio).toLocaleDateString("pt-PT")}</p>}
                {config.horaSorteio && <p>Hora: {config.horaSorteio}</p>}
                {config.localSorteio && <p>Local: {config.localSorteio}</p>}
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Jogo não encontrado.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ButtonGhost({ onRefresh, loading }: { onRefresh: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      className="ml-auto rounded-md p-1.5 hover:bg-accent"
      title="Atualizar métricas"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
    </button>
  );
}
