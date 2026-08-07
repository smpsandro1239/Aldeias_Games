"use client";
import { Button } from "@/components/ui/button";
import { Scale, Download, RefreshCw } from "lucide-react";

export function ReconciliacaoHeader({
  onExportCSV,
  onRefresh,
}: {
  onExportCSV: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="relative bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-orange-500/10 rounded-3xl p-6 border border-amber-500/10">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center">
          <Scale className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold">Reconciliação</h1>
          <p className="text-muted-foreground font-medium">
            Comparação entre cashbox vendedores e cofre da aldeia
          </p>
        </div>
      </div>
      <div className="absolute top-4 right-4 flex gap-2">
        <Button variant="outline" size="sm" onClick={onExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>
    </div>
  );
}
