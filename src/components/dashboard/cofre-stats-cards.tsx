"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, Clock, ArrowUpFromLine } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { VaultData, Levantamento } from "@/features/admin/admin-cofre-types";

export function CofreStatsCards({
  vault,
  pendentesCount,
  levPendentesCount,
  levantamentos,
}: {
  vault: VaultData | null;
  pendentesCount: number;
  levPendentesCount: number;
  levantamentos: Levantamento[];
}) {
  const levProcessados = levantamentos.filter((l) => l.estado !== "pendente");
  const totalLevantado = levantamentos
    .filter((l) => l.estado === "confirmado")
    .reduce((sum, l) => sum + l.valor, 0);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20 border-green-200/50 dark:border-green-800/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            Saldo do Cofre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-green-900 dark:text-green-100">
            {formatCurrency(vault?.saldo || 0)}
          </p>
          <p className="text-sm text-green-700/80 dark:text-green-300/80 mt-1">
            Dinheiro físico guardado
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/20 border-orange-200/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-orange-900 dark:text-orange-100 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pedidos Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
            {pendentesCount + levPendentesCount}
          </p>
          <p className="text-xs text-orange-700/80 dark:text-orange-300/80 mt-1">
            {pendentesCount} depósitos + {levPendentesCount} levantamentos
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/20 border-purple-200/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
            <ArrowUpFromLine className="w-4 h-4" />
            Total Levantado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
            {formatCurrency(totalLevantado)}
          </p>
          <p className="text-xs text-purple-700/80 dark:text-purple-300/80 mt-1">
            {levProcessados.length} levantamentos processados
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
