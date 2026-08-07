"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function ReconciliacaoEquation({ resumo }: { resumo: any }) {
  if (!resumo) return null;
  const discrepancia = resumo.totalRecebido - resumo.totalDepositadoCashbox - resumo.saldoCashboxGeral;
  return (
    <Card className="border border-outline-variant/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm">
          <Scale className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Equação de verificação:</span>
          <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
            Recebido ({formatCurrency(resumo.totalRecebido)})
          </code>
          <span className="text-muted-foreground"> = </span>
          <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
            Depositado Cashbox ({formatCurrency(resumo.totalDepositadoCashbox)})
          </code>
          <span className="text-muted-foreground"> + </span>
          <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
            Saldo Atual ({formatCurrency(resumo.saldoCashboxGeral)})
          </code>
          {Math.abs(discrepancia) < 0.01 ? (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 ml-2">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              OK
            </Badge>
          ) : (
            <Badge variant="destructive" className="ml-2">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Discrepância de {formatCurrency(Math.abs(discrepancia))}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
