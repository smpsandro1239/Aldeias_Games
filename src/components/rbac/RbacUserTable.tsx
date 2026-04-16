"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Shield,
  Building2,
  Check,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type Role = {
  id: string;
  name: string;
};

type Aldeia = {
  id: string;
  nome: string;
};

type UserGlobalRole = {
  roleId: string;
  role: Role;
};

type UserAldeiaRole = {
  roleId: string;
  aldeiaId: string;
  role: Role;
  aldeia: Aldeia | null;
};

type User = {
  id: string;
  nome: string;
  email: string;
  userGlobalRoles: UserGlobalRole[];
  userAldeiaRoles: UserAldeiaRole[];
};

type RbacUserTableProps = {
  users: User[];
  availableRoles: Role[];
  availableAldeias: Aldeia[];
};

type SortField = "nome" | "email" | "globalRolesCount" | "aldeiaRolesCount";
type SortDirection = "asc" | "desc";

const PAGE_SIZES = [20, 50, 100];

export default function RbacUserTable({ users, availableRoles, availableAldeias }: RbacUserTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAldeia, setFilterAldeia] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterHasRole, setFilterHasRole] = useState<string>("all");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("nome");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkAction, setBulkAction] = useState<"add" | "remove" | null>(null);
  const [bulkRoleId, setBulkRoleId] = useState<string>("");
  const [bulkAldeiaId, setBulkAldeiaId] = useState<string>("");

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    let result = users;

    if (normalizedSearch) {
      result = result.filter((user) => {
        const fields = [
          user.nome,
          user.email,
          user.id,
          user.userGlobalRoles.map((role) => role.role?.name).join(" "),
          user.userAldeiaRoles
            .map((role) => `${role.role?.name} ${role.aldeia?.nome ?? ""}`)
            .join(" "),
        ]
          .join(" ")
          .toLowerCase();

        return fields.includes(normalizedSearch);
      });
    }

    if (filterAldeia !== "all") {
      result = result.filter((user) =>
        user.userAldeiaRoles.some((r) => r.aldeiaId === filterAldeia)
      );
    }

    if (filterRole !== "all") {
      result = result.filter((user) =>
        user.userGlobalRoles.some((r) => r.roleId === filterRole) ||
        user.userAldeiaRoles.some((r) => r.roleId === filterRole)
      );
    }

    if (filterHasRole === "with") {
      result = result.filter(
        (user) =>
          user.userGlobalRoles.length > 0 || user.userAldeiaRoles.length > 0
      );
    } else if (filterHasRole === "without") {
      result = result.filter(
        (user) =>
          user.userGlobalRoles.length === 0 && user.userAldeiaRoles.length === 0
      );
    }

    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "nome":
          comparison = a.nome.localeCompare(b.nome);
          break;
        case "email":
          comparison = a.email.localeCompare(b.email);
          break;
        case "globalRolesCount":
          comparison = a.userGlobalRoles.length - b.userGlobalRoles.length;
          break;
        case "aldeiaRolesCount":
          comparison = a.userAldeiaRoles.length - b.userAldeiaRoles.length;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [
    users,
    normalizedSearch,
    filterAldeia,
    filterRole,
    filterHasRole,
    sortField,
    sortDirection,
  ]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedUsers(new Set());
  }, [normalizedSearch, filterAldeia, filterRole, filterHasRole, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pageUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const rangeStart =
    filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(filteredUsers.length, currentPage * pageSize);

  const handleSelectAll = () => {
    if (selectedUsers.size === pageUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(pageUsers.map((u) => u.id)));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkAction = async () => {
    if (!bulkAction || !bulkRoleId || selectedUsers.size === 0) return;

    const aldeiaId = bulkAction === "add" && bulkRoleId ? bulkAldeiaId || null : null;

    setBulkLoading(true);
    try {
      const promises = Array.from(selectedUsers).map((userId) =>
        fetch(`/api/rbac/user/${userId}/roles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roleId: bulkRoleId,
            aldeiaId,
            action: bulkAction,
          }),
        })
      );
      await Promise.all(promises);
      setSelectedUsers(new Set());
      setBulkAction(null);
      setBulkRoleId("");
      setBulkAldeiaId("");
      window.location.reload();
    } catch (error) {
      console.error("Bulk action failed:", error);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  return (
    <div className="space-y-4">
      <Card className="border-[var(--card-alt)] bg-[var(--card)]">
        <CardHeader className="border-b border-[var(--card-alt)] bg-[var(--card-alt)]/50">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-[var(--text)] flex items-center gap-2">
              <Users className="h-5 w-5 text-[var(--primary)]" />
              Lista de Utilizadores
            </CardTitle>
            <p className="text-sm text-[var(--text-muted)]">
              Gerir roles e permissões de todos os utilizadores do sistema.
              Selecione múltiplos utilizadores para atribuição em massa.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto]">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text)]">
                Pesquisar
              </label>
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Nome, email, role ou aldeia..."
                className="w-full bg-[var(--card-alt)] border-[var(--card-alt2)] text-[var(--text)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text)]">
                Aldeia
              </label>
              <Select value={filterAldeia} onValueChange={setFilterAldeia}>
                <SelectTrigger className="w-[180px] bg-[var(--card-alt)] border-[var(--card-alt2)] text-[var(--text)]">
                  <SelectValue placeholder="Todas as aldeias" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border-[var(--card-alt2)]">
                  <SelectItem value="all" className="text-[var(--text)]">
                    Todas as aldeias
                  </SelectItem>
                  {availableAldeias.map((aldeia) => (
                    <SelectItem
                      key={aldeia.id}
                      value={aldeia.id}
                      className="text-[var(--text)]"
                    >
                      {aldeia.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text)]">
                Role
              </label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[180px] bg-[var(--card-alt)] border-[var(--card-alt2)] text-[var(--text)]">
                  <SelectValue placeholder="Todas as roles" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border-[var(--card-alt2)]">
                  <SelectItem value="all" className="text-[var(--text)]">
                    Todas as roles
                  </SelectItem>
                  {availableRoles.map((role) => (
                    <SelectItem
                      key={role.id}
                      value={role.id}
                      className="text-[var(--text)]"
                    >
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text)]">
                Estado
              </label>
              <Select value={filterHasRole} onValueChange={setFilterHasRole}>
                <SelectTrigger className="w-[160px] bg-[var(--card-alt)] border-[var(--card-alt2)] text-[var(--text)]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--card)] border-[var(--card-alt2)]">
                  <SelectItem value="all" className="text-[var(--text)]">
                    Todos
                  </SelectItem>
                  <SelectItem value="with" className="text-[var(--text)]">
                    Com roles
                  </SelectItem>
                  <SelectItem value="without" className="text-[var(--text)]">
                    Sem roles
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedUsers.size > 0 && (
            <div className="rounded-lg border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-[var(--primary)]/20 text-[var(--primary)]">
                    {selectedUsers.size} selecionado
                    {selectedUsers.size > 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={bulkAction || ""}
                    onValueChange={(v) => setBulkAction(v as "add" | "remove")}
                  >
                    <SelectTrigger className="w-[140px] bg-[var(--card-alt)] border-[var(--card-alt2)] text-[var(--text)]">
                      <SelectValue placeholder="Ação" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--card)] border-[var(--card-alt2)]">
                      <SelectItem value="add" className="text-[var(--text)]">
                        Atribuir role
                      </SelectItem>
                      <SelectItem value="remove" className="text-[var(--text)]">
                        Remover role
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={bulkRoleId}
                    onValueChange={setBulkRoleId}
                    disabled={!bulkAction}
                  >
                    <SelectTrigger className="w-[180px] bg-[var(--card-alt)] border-[var(--card-alt2)] text-[var(--text)]">
                      <SelectValue placeholder="Selecionar role" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--card)] border-[var(--card-alt2)]">
                      {availableRoles.map((role) => (
                        <SelectItem
                          key={role.id}
                          value={role.id}
                          className="text-[var(--text)]"
                        >
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {bulkAction === "add" && (
                    <Select value={bulkAldeiaId} onValueChange={setBulkAldeiaId}>
                      <SelectTrigger className="w-[180px] bg-[var(--card-alt)] border-[var(--card-alt2)] text-[var(--text)]">
                        <SelectValue placeholder="Aldeia (opcional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--card)] border-[var(--card-alt2)]">
                        <SelectItem value="" className="text-[var(--text)]">
                          Global (sem aldeia)
                        </SelectItem>
                        {availableAldeias.map((aldeia) => (
                          <SelectItem
                            key={aldeia.id}
                            value={aldeia.id}
                            className="text-[var(--text)]"
                          >
                            {aldeia.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Button
                    onClick={handleBulkAction}
                    disabled={
                      !bulkAction ||
                      !bulkRoleId ||
                      bulkLoading ||
                      selectedUsers.size === 0
                    }
                    className="bg-[var(--primary)] hover:bg-[var(--primary)]/90"
                  >
                    {bulkLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Aplicar"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--text-muted)]">
              Mostrando {rangeStart}–{rangeEnd} de {filteredUsers.length}{" "}
              utilizador
              {filteredUsers.length === 1 ? "" : "es"}.
            </p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--text-muted)]">
                Por página:
              </label>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="rounded-md border border-[var(--card-alt2)] bg-[var(--card-alt)] px-3 py-2 text-sm text-[var(--text)] shadow-sm outline-none transition focus:border-[var(--primary)]"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Anterior
              </Button>
              <span className="text-sm text-[var(--text-muted)]">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
              >
                Seguinte
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[var(--card-alt)]">
            <table className="min-w-full divide-y divide-[var(--card-alt)] text-sm">
              <thead className="bg-[var(--card-alt)]">
                <tr>
                  <th className="py-3 px-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === pageUsers.length && pageUsers.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-[var(--card-alt2)]"
                    />
                  </th>
                  <th
                    className="py-3 px-4 text-left font-semibold text-[var(--text)] cursor-pointer hover:text-[var(--primary)]"
                    onClick={() => handleSort("nome")}
                  >
                    <div className="flex items-center gap-1">
                      Nome <SortIcon field="nome" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 text-left font-semibold text-[var(--text)] cursor-pointer hover:text-[var(--primary)]"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center gap-1">
                      Email <SortIcon field="email" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-semibold text-[var(--text)]">
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4" /> Roles Globais
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left font-semibold text-[var(--text)]">
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" /> Roles por Aldeia
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right font-semibold text-[var(--text)]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-alt)] bg-[var(--card)]">
                {pageUsers.length > 0 ? (
                  pageUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-[var(--card-alt)]/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="h-4 w-4 rounded border-[var(--card-alt2)]"
                        />
                      </td>
                      <td className="py-4 px-4 font-medium text-[var(--text)]">
                        {user.nome}
                      </td>
                      <td className="py-4 px-4 text-[var(--text-muted)]">
                        {user.email}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {user.userGlobalRoles.length > 0 ? (
                            user.userGlobalRoles.map((role) => (
                              <Badge
                                key={role.roleId}
                                className="bg-[var(--primary)]/20 text-[var(--primary)] border-0"
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                {role.role.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs italic text-[var(--text-muted)]">
                              Nenhuma
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {user.userAldeiaRoles.length > 0 ? (
                            user.userAldeiaRoles.map((role) => (
                              <Badge
                                key={`${role.roleId}-${role.aldeiaId}`}
                                className="bg-[var(--secondary)]/20 text-[var(--secondary)] border-0"
                              >
                                <Building2 className="h-3 w-3 mr-1" />
                                {role.role.name}@{role.aldeia?.nome ?? "?"}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs italic text-[var(--text-muted)]">
                              Nenhuma
                            </span>
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
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-[var(--text-muted)]"
                    >
                      Nenhum utilizador corresponde aos filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
