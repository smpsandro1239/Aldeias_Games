"use client";

import { Button } from "@/components/ui/button";

interface ClientePaginationProps {
  page: number;
  setPage: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  label: string;
}

export function ClientePagination({ page, setPage, totalItems, itemsPerPage, label }: ClientePaginationProps) {
  const start = (page - 1) * itemsPerPage + 1;
  const end = Math.min(page * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <p className="text-sm text-muted-foreground">
        Mostrando {start} a {end} de {totalItems} {label}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground min-w-[80px] text-center">Página {page}</span>
        <Button variant="outline" size="sm" disabled={page * itemsPerPage >= totalItems} onClick={() => setPage(page + 1)}>
          Próxima
        </Button>
      </div>
    </div>
  );
}
