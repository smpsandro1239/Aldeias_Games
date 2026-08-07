"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Check, Send, Banknote, Wallet } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { SaldoAngariado } from "./vendedor-types";

interface VendedorAngariacaoTabProps {
  saldoAngariado: SaldoAngariado;
  onSolicitarEntrega: () => void;
}

export function VendedorAngariacaoTab({ saldoAngariado, onSolicitarEntrega }: VendedorAngariacaoTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Angariado"
          value={formatCurrency(saldoAngariado.totalAngariado)}
          icon={<DollarSign className="h-5 w-5" />}
          color="emerald"
        />
        <StatCard
          title="Entregue"
          value={formatCurrency(saldoAngariado.totalEntregue)}
          icon={<Check className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="Solicitado"
          value={formatCurrency(saldoAngariado.totalSolicitado)}
          icon={<Send className="h-5 w-5" />}
          color="amber"
        />
        <Card className="bg-card border-l-4 border-l-orange-500 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">A Entregar</p>
                <p className="text-xl md:text-2xl font-black text-foreground">{formatCurrency(saldoAngariado.saldoAEntregar)}</p>
              </div>
              <div className="h-10 w-10 rounded-full flex items-center justify-center bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Banknote className="h-5 w-5" />
              </div>
            </div>
            {saldoAngariado.saldoAEntregar > 0 && (
              <Button
                size="sm"
                className="w-full mt-3"
                onClick={onSolicitarEntrega}
              >
                <Send className="w-4 h-4 mr-2" /> Solicitar Entrega
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-outline-variant/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">Histórico de Entregas</h3>
          </div>
          {saldoAngariado.historicoEntregas?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma entrega registada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(saldoAngariado.historicoEntregas || []).map((entrega) => (
                <div
                  key={entrega.id}
                  className="flex items-center justify-between py-1.5 border-b border-outline-variant/5 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-accent">{formatCurrency(entrega.valor)}</p>
                    <p className="text-xs text-muted-foreground">
                      Solicitado: {formatDate(entrega.dataSolicitacao)}
                      {entrega.admin && ` — Admin: ${entrega.admin.nome}`}
                    </p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
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
                    {entrega.dataConclusao && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Entregue: {formatDate(entrega.dataConclusao)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}