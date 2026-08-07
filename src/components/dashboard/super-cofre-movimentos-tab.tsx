"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { History, TrendingUp } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { AldeiaResumo } from "@/features/admin/superadmin-cofre-types";

export function SuperCofreMovimentosTab({ aldeias }: { aldeias: AldeiaResumo[] }) {
  return (
    <TabsContent value="movimentos" className="space-y-3 mt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Movimentos Globais
          </CardTitle>
          <CardDescription>
            Últimos depósitos em todas as aldeias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aldeias.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum movimento registado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {aldeias.flatMap(a =>
                a.movimentosRecentes.map(mov => ({
                  ...mov,
                  aldeiaNome: a.nome,
                }))
              ).sort((a, b) =>
                new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
              ).slice(0, 50).map((mov) => (
                <div
                  key={mov.id}
                  className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{mov.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {(mov as any).aldeiaNome} — {formatDateTime(mov.dataCriacao)}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-green-600">
                    +{formatCurrency(mov.valor)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
