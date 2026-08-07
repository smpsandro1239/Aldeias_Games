"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BarChart3, Download, RefreshCw } from "lucide-react";

export function SuperCofreToolbar({
  search,
  onSearchChange,
  onFinanceiro,
  onExportCSV,
  onRefresh,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onFinanceiro: () => void;
  onExportCSV: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar aldeia..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Button variant="outline" size="sm" onClick={onFinanceiro}>
        <BarChart3 className="w-4 h-4 mr-2" />
        Visão Financeira
      </Button>
      <Button variant="outline" size="sm" onClick={onExportCSV}>
        <Download className="w-4 h-4 mr-2" />
        CSV
      </Button>
      <Button variant="outline" size="icon" onClick={onRefresh}>
        <RefreshCw className="w-4 h-4" />
      </Button>
    </div>
  );
}
