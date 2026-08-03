"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { Check, X, Clock, ArrowUpFromLine } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Levantamento } from "@/features/admin/admin-cofre-types";

export function CofreLevantamentosTab({
  levPendentes,
  levProcessados,
  onAprovarLev,
  onRejeitarLev,
  onSolicitar,
}: {
  levPendentes: Levantamento[];
  levProcessados: Levantamento[];
  onAprovarLev: (id: string) => void;
  onRejeitarLev: (id: string) => void;
  onSolicitar: () => void;
}) {
  return (
    <TabsContent value="levantamentos" className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Levantamentos do Cofre</h3>
        <Button onClick={onSolicitar}>
          <ArrowUpFromLine className="w-4 h-4 mr-2" /> Solicitar Levantamento
        </Button>
      </div>

      {levPendentes.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">Pendentes de Aprovação</h4>
          {levPendentes.map((lev) => (
            <Card key={lev.id} className="border-purple-500/30 mb-3">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-lg text-purple-700">{formatCurrency(lev.valor)}</p>
                      <Badge className="bg-purple-500/20 text-purple-700 border-purple-500/30">
                        <Clock className="w-3 h-3 mr-1" /> PENDENTE
                      </Badge>
                    </div>
                    <p className="text-sm">{lev.descricao}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Por: <strong>{lev.criadoPor.nome}</strong></span>
                      <span>{formatDateTime(lev.dataCriacao)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onAprovarLev(lev.id)}>
                      <Check className="w-4 h-4 mr-1" /> Aprovar
                    </Button>
                    <Button size="sm" variant="outline" className="border-destructive text-destructive" onClick={() => onRejeitarLev(lev.id)}>
                      <X className="w-4 h-4 mr-1" /> Rejeitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-3">Histórico</h4>
        {levProcessados.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              <ArrowUpFromLine className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum levantamento registado</p>
            </CardContent>
          </Card>
        ) : (
          levProcessados.map((lev) => (
            <Card key={lev.id} className="mb-2">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      lev.estado === 'confirmado' ? 'bg-purple-500/20' : 'bg-red-500/20'
                    }`}>
                      <ArrowUpFromLine className={`w-4 h-4 ${lev.estado === 'confirmado' ? 'text-purple-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{lev.descricao}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>Por: {lev.criadoPor.nome}</span>
                        {lev.aprovadoPor && <span>Aprovado por: {lev.aprovadoPor.nome}</span>}
                        <span>{formatDateTime(lev.dataCriacao)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${lev.estado === 'confirmado' ? 'text-purple-600' : 'text-red-600'}`}>
                      -{formatCurrency(lev.valor)}
                    </p>
                    <Badge variant={lev.estado === 'confirmado' ? 'default' : 'destructive'} className="text-xs">
                      {lev.estado === 'confirmado' ? 'APROVADO' : 'REJEITADO'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </TabsContent>
  );
}
