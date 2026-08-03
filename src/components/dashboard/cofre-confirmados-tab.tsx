"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { Check } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { DepositoData } from "@/features/admin/admin-cofre-types";

export function CofreConfirmadosTab({ confirmados }: { confirmados: DepositoData[] }) {
  return (
    <TabsContent value="confirmados" className="space-y-3 mt-4">
      {confirmados.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            <Check className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum depósito confirmado</p>
          </CardContent>
        </Card>
      ) : (
        confirmados.map((dep) => (
          <Card key={dep.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg">{formatCurrency(dep.valor)}</p>
                    <Badge className="bg-primary">
                      <Check className="w-3 h-3 mr-1" /> CONFIRMADO
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{dep.descricao || "Depósito"}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>De: <strong>{dep.vendedor.nome}</strong></span>
                    <span>Por: <strong>{dep.confirmadoPor?.nome || "—"}</strong></span>
                    <span>{dep.confirmadoAt ? formatDateTime(dep.confirmadoAt) : "—"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </TabsContent>
  );
}
