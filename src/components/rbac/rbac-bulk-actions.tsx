"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role, Aldeia } from "./rbac-types";

type BulkAction = "add" | "remove";

interface RbacBulkActionsProps {
  selectedCount: number;
  bulkAction: BulkAction | null;
  onBulkActionChange: (value: BulkAction) => void;
  bulkRoleId: string;
  onBulkRoleChange: (value: string) => void;
  bulkAldeiaId: string;
  onBulkAldeiaChange: (value: string) => void;
  availableRoles: Role[];
  availableAldeias: Aldeia[];
  loading: boolean;
  onApply: () => void;
}

export function RbacBulkActions({
  selectedCount,
  bulkAction,
  onBulkActionChange,
  bulkRoleId,
  onBulkRoleChange,
  bulkAldeiaId,
  onBulkAldeiaChange,
  availableRoles,
  availableAldeias,
  loading,
  onApply,
}: RbacBulkActionsProps) {
  return (
    <div className="rounded-lg border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-[var(--primary)]/20 text-[var(--primary)]">
            {selectedCount} selecionado{selectedCount > 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={bulkAction || ""}
            onValueChange={(v) => onBulkActionChange(v as BulkAction)}
          >
            <SelectTrigger className="w-[140px] bg-[var(--card-alt)] border-[var(--card-alt2)] text-[var(--text)]">
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--card)] border-[var(--card-alt2)]">
              <SelectItem value="add" className="text-[var(--text)]">Atribuir role</SelectItem>
              <SelectItem value="remove" className="text-[var(--text)]">Remover role</SelectItem>
            </SelectContent>
          </Select>

          <Select value={bulkRoleId} onValueChange={onBulkRoleChange} disabled={!bulkAction}>
            <SelectTrigger className="w-[180px] bg-[var(--card-alt)] border-[var(--card-alt2)] text-[var(--text)]">
              <SelectValue placeholder="Selecionar role" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--card)] border-[var(--card-alt2)]">
              {availableRoles.map((role) => (
                <SelectItem key={role.id} value={role.id} className="text-[var(--text)]">
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {bulkAction === "add" && (
            <Select value={bulkAldeiaId} onValueChange={onBulkAldeiaChange}>
              <SelectTrigger className="w-[180px] bg-[var(--card-alt)] border-[var(--card-alt2)] text-[var(--text)]">
                <SelectValue placeholder="Aldeia (opcional)" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--card)] border-[var(--card-alt2)]">
                <SelectItem value="" className="text-[var(--text)]">Global (sem aldeia)</SelectItem>
                {availableAldeias.map((aldeia) => (
                  <SelectItem key={aldeia.id} value={aldeia.id} className="text-[var(--text)]">
                    {aldeia.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={onApply}
            disabled={!bulkAction || !bulkRoleId || loading || selectedCount === 0}
            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
          </Button>
        </div>
      </div>
    </div>
  );
}