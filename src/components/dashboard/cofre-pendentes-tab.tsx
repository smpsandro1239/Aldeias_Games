"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { Check, X, Clock, Send, ArrowUpFromLine } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { DepositoData, Levantamento } from "@/features/admin/admin-cofre-types";

export function CofrePendentesTab({
  levPendentes,
  pendentes,
  onAprovarLev,
  onRejeitarLev,
  onConfirmarDep,
  onRejeitarDep,
}: {
  levPendentes: Levantamento[];
  pendentes: DepositoData[];
  onAprovarLev: (id: string) => void;
  onRejeitarLev: (id: string) => void;
  onConfirmarDep: (id: string) => void;
  onRejeitarDep: (id: string) => void;
}) {
  return (
    <TabsContent value="pendentes" className="space-y-4 mt-4">
      {levPendentes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <ArrowUpFromLine className="w-4 h-4" />
            Levantamentos Pendentes ({levPendentes.length})
          </h3>
          {levPendentes.map((lev) => (
            <Card key={lev.id} className="border-purple-500/30 mb-3">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-lg text-purple-700">{formatCurrency(lev.valor)}</p>
                      <Badge className="bg-purple-500/20 text-purple-700 border-purple-500/30">
                        <ArrowUpFromLine className="w-3 h-3 mr-1" />
                        LEVANTAMENTO
                      </Badge>
                    </div>
                    <p className="text-sm">{lev.descricao}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Solicitado por: <strong>{lev.criadoPor.nome}</strong></span>
                      <span>{formatDateTime(lev.dataCriacao)}</span>
                    </div>
                    {lev.observacoes && (
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded mt-1">
                        {lev.observacoes.split('\n').filter(l => l.startsWith('Destino:')).map((l, i) => (
                          <p key={i}><strong>Destino:</strong> {l.replace('Destino: ', '')}</p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onAprovarLev(lev.id)}>
                      <Check className="w-4 h-4 mr-1" /> Aprovar
                    </Button>
                    <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => onRejeitarLev(lev.id)}>
                      <X className="w-4 h-4 mr-1" /> Rejeitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pendentes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Send className="w-4 h-4" />
            Depósitos Pendentes ({pendentes.length})
          </h3>
          {pendentes.map((dep) => (
            <Card key={dep.id} className="border-accent/50 mb-3">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-lg">{formatCurrency(dep.valor)}</p>
                      <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                        <Clock className="w-3 h-3 mr-1" /> PENDENTE
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{dep.descricao || "Depósito"}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>De: <strong>{dep.vendedor.nome}</strong></span>
                      <span>Criado: {formatDateTime(dep.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onConfirmarDep(dep.id)}>
                      <Check className="w-4 h-4 mr-1" /> Confirmar
                    </Button>
                    <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => onRejeitarDep(dep.id)}>
                      <X className="w-4 h-4 mr-1" /> Rejeitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pendentes.length === 0 && levPendentes.length === 0 && (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            <Check className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Tudo processado! Nenhum pedido pendente.</p>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}
