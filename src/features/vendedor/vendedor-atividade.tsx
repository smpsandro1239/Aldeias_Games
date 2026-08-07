"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { VendedorSales } from "./vendedor-types";

interface VendedorAtividadeProps {
  vendas: VendedorSales[];
  onVerTudo: () => void;
}

export function VendedorAtividade({ vendas, onVerTudo }: VendedorAtividadeProps) {
  return (
    <div>
      <h2 className="font-serif text-lg font-semibold text-accent mb-3">Atividade Recente</h2>
      <Card className="bg-card border-outline-variant/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-muted-foreground">Últimas Vendas</h3>
            <button onClick={onVerTudo} className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver tudo <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            {vendas.slice(0, 5).map((venda) => (
              <div key={venda.id} className="flex items-center justify-between py-1.5 border-b border-outline-variant/5 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-accent truncate">{venda.jogo?.nome || "Jogo"}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(venda.createdAt)}</p>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="text-sm font-bold text-emerald-500">
                    +{formatCurrency(venda.valor)}
                  </p>
                  <Badge variant="outline" className="text-xs capitalize">
                    {venda.metodoPagamento}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}