"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { PendenteItem } from "@/features/admin/reconciliacao-cofre-types";

export function ReconciliacaoPendentesCard({ pendentes }: { pendentes: PendenteItem[] }) {
  if (pendentes.length === 0) return null;
  return (
    <Card className="border border-orange-200/50 dark:border-orange-800/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Pendentes que afetam a reconciliação
        </CardTitle>
        <CardDescription>
          {pendentes.length} pedido{pendentes.length !== 1 ? 's' : ''} por confirmar — {formatCurrency(pendentes.reduce((s, p) => s + p.valor, 0))} não refletido no cofre
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {pendentes.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
              <div>
                <p className="font-medium">{formatCurrency(p.valor)}</p>
                <p className="text-xs text-muted-foreground">
                  {p.vendedor.nome} — {formatDateTime(p.createdAt)}
                </p>
              </div>
              <Badge className="bg-accent">
                <Clock className="w-3 h-3 mr-1" />
                PENDENTE
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
