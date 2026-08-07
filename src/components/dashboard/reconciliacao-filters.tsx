"use client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { AldeiaResumo } from "@/features/admin/reconciliacao-cofre-types";

export function ReconciliacaoFilters({
  aldeias,
  search,
  onSearchChange,
}: {
  aldeias: AldeiaResumo[];
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      {aldeias.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          <Badge variant="secondary" className="cursor-pointer">
            Todas
          </Badge>
          {aldeias.map(a => (
            <Badge
              key={a.id}
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                window.location.href = `/admindashboard/cofre/reconciliacao?aldeiaId=${a.id}`;
              }}
            >
              {a.nome}
            </Badge>
          ))}
        </div>
      )}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar vendedor..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
