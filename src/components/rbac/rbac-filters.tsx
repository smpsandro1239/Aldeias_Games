"use client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role, Aldeia } from "./rbac-types";

interface RbacFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterAldeia: string;
  onAldeiaChange: (value: string) => void;
  filterRole: string;
  onRoleChange: (value: string) => void;
  filterHasRole: string;
  onHasRoleChange: (value: string) => void;
  availableAldeias: Aldeia[];
  availableRoles: Role[];
}

export function RbacFilters({
  searchTerm,
  onSearchChange,
  filterAldeia,
  onAldeiaChange,
  filterRole,
  onRoleChange,
  filterHasRole,
  onHasRoleChange,
  availableAldeias,
  availableRoles,
}: RbacFiltersProps) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto]">
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text)]">Pesquisar</label>
        <Input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Nome, email, role ou aldeia..."
          className="w-full bg-[var(--card-alt)] border-[var(--card-alt2)] text-[var(--text)]"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text)]">Aldeia</label>
        <Select value={filterAldeia} onValueChange={onAldeiaChange}>
          <SelectTrigger className="w-[180px] bg-[var(--card-alt)] border-[var(--card-alt2)] text-[var(--text)]">
            <SelectValue placeholder="Todas as aldeias" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--card)] border-[var(--card-alt2)]">
            <SelectItem value="all" className="text-[var(--text)]">Todas as aldeias</SelectItem>
            {availableAldeias.map((aldeia) => (
              <SelectItem key={aldeia.id} value={aldeia.id} className="text-[var(--text)]">
                {aldeia.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text)]">Role</label>
        <Select value={filterRole} onValueChange={onRoleChange}>
          <SelectTrigger className="w-[180px] bg-[var(--card-alt)] border-[var(--card-alt2)] text-[var(--text)]">
            <SelectValue placeholder="Todas as roles" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--card)] border-[var(--card-alt2)]">
            <SelectItem value="all" className="text-[var(--text)]">Todas as roles</SelectItem>
            {availableRoles.map((role) => (
              <SelectItem key={role.id} value={role.id} className="text-[var(--text)]">
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text)]">Estado</label>
        <Select value={filterHasRole} onValueChange={onHasRoleChange}>
          <SelectTrigger className="w-[160px] bg-[var(--card-alt)] border-[var(--card-alt2)] text-[var(--text)]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--card)] border-[var(--card-alt2)]">
            <SelectItem value="all" className="text-[var(--text)]">Todos</SelectItem>
            <SelectItem value="with" className="text-[var(--text)]">Com roles</SelectItem>
            <SelectItem value="without" className="text-[var(--text)]">Sem roles</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}