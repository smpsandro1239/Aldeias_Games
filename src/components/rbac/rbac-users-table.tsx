"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Shield, Building2, ChevronDown, ChevronUp } from "lucide-react";
import type { User, SortField, SortDirection } from "./rbac-types";

interface RbacUsersTableProps {
  users: User[];
  selectedUsers: Set<string>;
  sortField: SortField;
  sortDirection: SortDirection;
  onSelectAll: () => void;
  onSelectUser: (userId: string) => void;
  onSort: (field: SortField) => void;
}

export function RbacUsersTable({
  users,
  selectedUsers,
  sortField,
  sortDirection,
  onSelectAll,
  onSelectUser,
  onSort,
}: RbacUsersTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--card-alt)]">
      <table className="min-w-full divide-y divide-[var(--card-alt)] text-sm">
        <thead className="bg-[var(--card-alt)]">
          <tr>
            <th className="py-3 px-4 text-left">
              <input
                type="checkbox"
                checked={selectedUsers.size === users.length && users.length > 0}
                onChange={onSelectAll}
                className="h-4 w-4 rounded border-[var(--card-alt2)]"
              />
            </th>
            <th
              className="py-3 px-4 text-left font-semibold text-[var(--text)] cursor-pointer hover:text-[var(--primary)]"
              onClick={() => onSort("nome")}
            >
              <div className="flex items-center gap-1">
                Nome <SortIcon field="nome" sortField={sortField} sortDirection={sortDirection} />
              </div>
            </th>
            <th
              className="py-3 px-4 text-left font-semibold text-[var(--text)] cursor-pointer hover:text-[var(--primary)]"
              onClick={() => onSort("email")}
            >
              <div className="flex items-center gap-1">
                Email <SortIcon field="email" sortField={sortField} sortDirection={sortDirection} />
              </div>
            </th>
            <th className="py-3 px-4 text-left font-semibold text-[var(--text)]">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" /> Roles Globais
              </div>
            </th>
            <th className="py-3 px-4 text-left font-semibold text-[var(--text)]">
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" /> Roles por Aldeia
              </div>
            </th>
            <th className="py-3 px-4 text-right font-semibold text-[var(--text)]">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--card-alt)] bg-[var(--card)]">
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id} className="hover:bg-[var(--card-alt)]/50 transition-colors">
                <td className="py-4 px-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={() => onSelectUser(user.id)}
                    className="h-4 w-4 rounded border-[var(--card-alt2)]"
                  />
                </td>
                <td className="py-4 px-4 font-medium text-[var(--text)]">{user.nome}</td>
                <td className="py-4 px-4 text-[var(--text-muted)]">{user.email}</td>
                <td className="py-4 px-4">
                  <div className="flex flex-wrap gap-1">
                    {user.userGlobalRoles.length > 0 ? (
                      user.userGlobalRoles.map((role) => (
                        <Badge key={role.roleId} className="bg-[var(--primary)]/20 text-[var(--primary)] border-0">
                          <Shield className="h-3 w-3 mr-1" />
                          {role.role.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs italic text-[var(--text-muted)]">Nenhuma</span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-wrap gap-1">
                    {user.userAldeiaRoles.length > 0 ? (
                      user.userAldeiaRoles.map((role) => (
                        <Badge key={`${role.roleId}-${role.aldeiaId}`} className="bg-[var(--secondary)]/20 text-[var(--secondary)] border-0">
                          <Building2 className="h-3 w-3 mr-1" />
                          {role.role.name}@{role.aldeia?.nome ?? "?"}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs italic text-[var(--text-muted)]">Nenhuma</span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <Link href={`/admin/rbac/user/${user.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[var(--card-alt2)] text-[var(--text)] hover:bg-[var(--card-alt)]"
                    >
                      Gerir
                    </Button>
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                Nenhum utilizador corresponde aos filtros selecionados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SortIcon({ field, sortField, sortDirection }: { field: SortField; sortField: SortField; sortDirection: SortDirection }) {
  if (sortField !== field) return null;
  return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
}