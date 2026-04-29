"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";
import { VendedorStats } from "../types";

interface ComissoesTabProps {
  vendedoresStats: VendedorStats[];
  setSelectedUser: (user: any) => void;
  setUserModalOpen: (open: boolean) => void;
}

export function ComissoesTab({
  vendedoresStats,
  setSelectedUser,
  setUserModalOpen,
}: ComissoesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">
          Comissões & Desempenho de Vendedores (POS)
        </h2>
      </div>

      {/* Lista */}
      {vendedoresStats.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <DollarSign className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sem vendedores</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Adicione vendedores à sua organização para ver as estatísticas de
              desempenho e comissões.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {vendedoresStats.map((vs) => (
            <Card key={vs.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <h3 className="font-semibold text-lg">{vs.nome}</h3>
                    <Badge variant="outline">{vs.totalVendas} vendas globais</Badge>
                  </div>
                  {/* Adicionar mais estatísticas conforme necessário */}
                </div>
                <div className="text-right">
                  {/* Exibir comissões, etc. */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
