"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, Clock, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function SuperCofreStatsCards({
  totalGeral,
  totalPendentes,
  pendentesCount,
  aldeiasCount,
}: {
  totalGeral: number;
  totalPendentes: number;
  pendentesCount: number;
  aldeiasCount: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20 border-green-200/50 dark:border-green-800/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
            <Banknote className="w-4 h-4" />
            Total nos Cofres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-900 dark:text-green-100">
            {formatCurrency(totalGeral)}
          </p>
          <p className="text-xs text-green-700/80 dark:text-green-300/80 mt-1">
            {aldeiasCount} aldeias ativas
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/20 border-orange-200/50 dark:border-orange-800/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-orange-900 dark:text-orange-100 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
            {formatCurrency(totalPendentes)}
          </p>
          <p className="text-xs text-orange-700/80 dark:text-orange-300/80 mt-1">
            {pendentesCount} pedidos por aprovar
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/20 border-blue-200/50 dark:border-blue-800/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Média por Aldeia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
            {formatCurrency(aldeiasCount > 0 ? totalGeral / aldeiasCount : 0)}
          </p>
          <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-1">
            Saldo médio nos cofres
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
