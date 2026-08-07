"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { Banknote, ArrowUpRight, History, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { AldeiaResumo } from "@/features/admin/superadmin-cofre-types";

export function SuperCofreAldeiasTab({ aldeias }: { aldeias: AldeiaResumo[] }) {
  return (
    <TabsContent value="aldeias" className="space-y-3 mt-4">
      {aldeias.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma aldeia encontrada</p>
          </CardContent>
        </Card>
      ) : (
        aldeias.map((aldeia) => (
          <Card key={aldeia.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-lg">{aldeia.nome}</p>
                    <Badge variant="outline" className="text-xs">
                      {aldeia.numVendedores} vend.
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Banknote className="w-3 h-3" />
                      <strong className="text-green-600">{formatCurrency(aldeia.saldoCofre)}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      {formatCurrency(aldeia.totalAngariado)} total angariado
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/admindashboard/cofre?aldeiaId=${aldeia.id}`, '_blank')}
                >
                  <History className="w-4 h-4 mr-2" />
                  Detalhes
                </Button>
              </div>

              {aldeia.movimentosRecentes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-outline-variant/20">
                  <p className="text-xs text-muted-foreground mb-2">Últimos movimentos:</p>
                  {aldeia.movimentosRecentes.slice(0, 3).map((mov) => (
                    <div key={mov.id} className="flex items-center justify-between text-xs py-1">
                      <span>{mov.descricao}</span>
                      <span className="font-medium text-green-600">
                        +{formatCurrency(mov.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </TabsContent>
  );
}
