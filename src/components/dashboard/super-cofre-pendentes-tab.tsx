"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { Clock, ShieldCheck } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { PendenteItem } from "@/features/admin/superadmin-cofre-types";

export function SuperCofrePendentesTab({
  pendentes,
  onConfirmar,
}: {
  pendentes: PendenteItem[];
  onConfirmar: (id: string) => void;
}) {
  return (
    <TabsContent value="pendentes" className="space-y-3 mt-4">
      {pendentes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum pedido pendente</p>
          </CardContent>
        </Card>
      ) : (
        pendentes.map((p) => (
          <Card key={p.id} className="border-accent/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg">{formatCurrency(p.valor)}</p>
                    <Badge className="bg-accent">
                      <Clock className="w-3 h-3 mr-1" />
                      PENDENTE
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {p.descricao || "Depósito"} — {p.vendedor.nome}
                  </p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Vendedor: <strong>{p.vendedor.nome}</strong></span>
                    <span>Aldeia: <strong>{p.aldeia.nome}</strong></span>
                    <span>{formatDateTime(p.createdAt)}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onConfirmar(p.id)}
                >
                  <ShieldCheck className="w-4 h-4 mr-1" />
                  Confirmar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </TabsContent>
  );
}
