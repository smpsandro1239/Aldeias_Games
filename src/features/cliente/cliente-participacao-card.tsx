"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Sparkles, Shield, Eye } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Participacao } from "./cliente-dashboard-types";

interface ClienteParticipacaoCardProps {
  participacao: Participacao;
  getTipoIcon: (tipo: string) => React.ReactNode;
  onVerVitoria: (p: Participacao) => void;
  onRevelarRaspadinha: (p: Participacao) => void;
  onVerProva: (id: string) => void;
  onVerDetalhes: (p: Participacao) => void;
}

export function ClienteParticipacaoCard({
  participacao, getTipoIcon,
  onVerVitoria, onRevelarRaspadinha,
  onVerProva, onVerDetalhes,
}: ClienteParticipacaoCardProps) {
  return (
    <Card className="bg-surface-container border-outline-variant/20 rounded-2xl overflow-hidden card-hover">
      <CardContent className="p-4 md:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 md:p-3 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
              {getTipoIcon(participacao.jogo?.tipo || "")}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-gaming text-base md:text-lg text-foreground truncate">{participacao.jogo?.nome}</h3>
              <p className="text-xs md:text-sm text-muted-foreground/60 truncate mt-0.5 md:mt-1">
                {participacao.jogo?.evento?.aldeia?.nome} • {formatDate(participacao.createdAt)}
              </p>
              <p className="text-sm font-bold text-primary mt-0.5 md:mt-1">
                {formatCurrency(participacao.valorPago)}
              </p>

              {participacao.jogo?.tipo === "rifa" || participacao.jogo?.tipo === "euromilhoes" ? (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground/50">Números:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(() => {
                      const dados = JSON.parse(participacao.dadosParticipacao || "{}");
                      const numeros = dados.numeros || [];
                      return numeros.map((n: number) => (
                        <span key={n} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">{n}</span>
                      ));
                    })()}
                  </div>
                </div>
              ) : participacao.jogo?.tipo === "poio_da_vaca" ? (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground/50">Coordenadas:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(() => {
                      const dados = JSON.parse(participacao.dadosParticipacao || "{}");
                      const coordenadas = dados.coordenadas || dados.selecao || [];
                      return coordenadas.map((c: { letra: string; numero: number }) => (
                        <span key={`${c.letra}${c.numero}`} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">{c.letra}{c.numero}</span>
                      ));
                    })()}
                  </div>
                </div>
              ) : null}

              {participacao.jogo?.sorteado && (
                <div className="mt-2">
                  {participacao.ganhador ? (
                    <p className="text-sm text-primary font-medium">✓ Ganhou!</p>
                  ) : (
                    <p className="text-xs md:text-sm text-muted-foreground/40">Sorteio: não foi sorteado</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {participacao.ganhador && (
              <Badge className="bg-accent cursor-pointer hover:bg-yellow-600 text-xs" onClick={() => onVerVitoria(participacao)}>
                <Trophy className="h-3 w-3 mr-1" /> Vencedor
              </Badge>
            )}
            {participacao.jogo?.tipo === "raspadinha" && !participacao.revelado && (
              <Button size="sm" className="text-xs" onClick={() => onRevelarRaspadinha(participacao)}>
                <Sparkles className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> Revelar
              </Button>
            )}
            {participacao.jogo?.tipo === "raspadinha" && participacao.revelado && (
              <Badge variant={participacao.resultadoRaspe ? "default" : "secondary"} className="text-xs">
                {participacao.resultadoRaspe || "Sem prémio"}
              </Badge>
            )}
            {participacao.jogo?.sorteado && participacao.jogo?.premioId && (
              <Button variant="outline" size="sm" className="text-xs">Prémios</Button>
            )}
            {(participacao.hashRaspe || participacao.hashParticipacao) && participacao.jogo?.tipo !== "poio_da_vaca" && (
              <Button variant="ghost" size="icon" className="shrink-0 text-primary" title="Ver Prova de Jogo" onClick={() => onVerProva(participacao.id)}>
                <Shield className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="shrink-0" title="Ver detalhes" onClick={() => onVerDetalhes(participacao)}>
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
