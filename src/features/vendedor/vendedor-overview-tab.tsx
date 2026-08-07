"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { SaldoAngariado } from "./vendedor-types";

export function VendedorOverviewTab({ saldoAngariado }: { saldoAngariado: SaldoAngariado }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-card border-outline-variant/10">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Angariado</p>
            <p className="text-2xl font-black text-foreground">{formatCurrency(saldoAngariado.totalAngariado)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-outline-variant/10">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Entregue</p>
            <p className="text-2xl font-black text-foreground">{formatCurrency(saldoAngariado.totalEntregue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-outline-variant/10">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Solicitado</p>
            <p className="text-2xl font-black text-foreground">{formatCurrency(saldoAngariado.totalSolicitado)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-outline-variant/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">Histórico de Entregas</h3>
          </div>
          {saldoAngariado.historicoEntregas?.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Wallet className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma entrega registada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(saldoAngariado.historicoEntregas || []).slice(0, 5).map((entrega) => (
                <div
                  key={entrega.id}
                  className="flex items-center justify-between py-1.5 border-b border-outline-variant/5 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-accent">{formatCurrency(entrega.valor)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(entrega.dataSolicitacao)}
                      {entrega.admin && ` — ${entrega.admin.nome}`}
                    </p>
                  </div>
                  <Badge
                    className={
                      entrega.estado === 'concluido' ? 'bg-emerald-500/20 text-emerald-700' :
                      entrega.estado === 'confirmado' ? 'bg-blue-500/20 text-blue-700' :
                      entrega.estado === 'cancelado' ? 'bg-red-500/20 text-red-700' :
                      'bg-amber-500/20 text-amber-700'
                    }
                  >
                    {entrega.estado}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}