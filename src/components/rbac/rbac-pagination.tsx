"use client";
import { Button } from "@/components/ui/button";
import { PAGE_SIZES } from "./rbac-types";

interface RbacPaginationProps {
  rangeStart: number;
  rangeEnd: number;
  total: number;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export function RbacPagination({
  rangeStart,
  rangeEnd,
  total,
  pageSize,
  onPageSizeChange,
  currentPage,
  totalPages,
  onPrev,
  onNext,
}: RbacPaginationProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--text-muted)]">
        Mostrando {rangeStart}–{rangeEnd} de {total} utilizador{total === 1 ? "" : "es"}.
      </p>
      <div className="flex items-center gap-2">
        <label className="text-sm text-[var(--text-muted)]">Por página:</label>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="rounded-md border border-[var(--card-alt2)] bg-[var(--card-alt)] px-3 py-2 text-sm text-[var(--text)] shadow-sm outline-none transition focus:border-[var(--primary)]"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={onPrev}>
          Anterior
        </Button>
        <span className="text-sm text-[var(--text-muted)]">
          {currentPage} / {totalPages}
        </span>
        <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={onNext}>
          Seguinte
        </Button>
      </div>
    </div>
  );
}