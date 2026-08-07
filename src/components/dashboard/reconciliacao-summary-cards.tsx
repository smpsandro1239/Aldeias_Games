"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Banknote, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function ReconciliacaoSummaryCards({ resumo }: { resumo: any }) {
  if (!resumo) return null;
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20 border-green-200/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Total Recebido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {formatCurrency(resumo.totalRecebido)}
          </p>
          <p className="text-xs text-muted-foreground">Dos jogadores (cashbox)</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/20 border-blue-200/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Banknote className="w-4 h-4 text-blue-600" />
            Total Depositado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {formatCurrency(resumo.totalDepositadoVault)}
          </p>
          <p className="text-xs text-muted-foreground">No cofre</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/20 border-purple-200/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            Saldo Cashbox
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {formatCurrency(resumo.saldoCashboxGeral)}
          </p>
          <p className="text-xs text-muted-foreground">Em mãos dos vendedores</p>
        </CardContent>
      </Card>

      <Card className={`bg-gradient-to-br ${
        resumo.pendentesCount > 0
          ? "from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/20 border-orange-200/50"
          : "from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20 border-green-200/50"
      }`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            {resumo.pendentesCount > 0 ? (
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            )}
            Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
            {formatCurrency(resumo.pendentesValor)}
          </p>
          <p className="text-xs text-muted-foreground">
            {resumo.pendentesCount} pedido{resumo.pendentesCount !== 1 ? 's' : ''} por aprovar
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
