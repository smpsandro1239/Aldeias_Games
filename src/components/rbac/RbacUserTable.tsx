"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { RbacFilters } from "./rbac-filters";
import { RbacBulkActions } from "./rbac-bulk-actions";
import { RbacUsersTable } from "./rbac-users-table";
import { RbacPagination } from "./rbac-pagination";
import {
  filterUsers,
  type Role,
  type Aldeia,
  type User,
  type SortField,
  type SortDirection,
} from "./rbac-types";

type RbacUserTableProps = {
  users: User[];
  availableRoles: Role[];
  availableAldeias: Aldeia[];
};

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

  const filters = useMemo(
    () => ({
      search: searchTerm,
      aldeia: filterAldeia,
      role: filterRole,
      hasRole: filterHasRole,
    }),
    [searchTerm, filterAldeia, filterRole, filterHasRole]
  );

  const filteredUsers = useMemo(
    () => filterUsers(users, filters, sortField, sortDirection),
    [users, filters, sortField, sortDirection]
  );

  useEffect(() => {
    setCurrentPage(1);
    setSelectedUsers(new Set());
  }, [searchTerm, filterAldeia, filterRole, filterHasRole, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pageUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const rangeStart = filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
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
          body: JSON.stringify({ roleId: bulkRoleId, aldeiaId, action: bulkAction }),
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
          <RbacFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterAldeia={filterAldeia}
            onAldeiaChange={setFilterAldeia}
            filterRole={filterRole}
            onRoleChange={setFilterRole}
            filterHasRole={filterHasRole}
            onHasRoleChange={setFilterHasRole}
            availableAldeias={availableAldeias}
            availableRoles={availableRoles}
          />

          {selectedUsers.size > 0 && (
            <RbacBulkActions
              selectedCount={selectedUsers.size}
              bulkAction={bulkAction}
              onBulkActionChange={setBulkAction}
              bulkRoleId={bulkRoleId}
              onBulkRoleChange={setBulkRoleId}
              bulkAldeiaId={bulkAldeiaId}
              onBulkAldeiaChange={setBulkAldeiaId}
              availableRoles={availableRoles}
              availableAldeias={availableAldeias}
              loading={bulkLoading}
              onApply={handleBulkAction}
            />
          )}

          <RbacPagination
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            total={filteredUsers.length}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={() => setCurrentPage((page) => Math.max(1, page - 1))}
            onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          />

          <RbacUsersTable
            users={pageUsers}
            selectedUsers={selectedUsers}
            sortField={sortField}
            sortDirection={sortDirection}
            onSelectAll={handleSelectAll}
            onSelectUser={handleSelectUser}
            onSort={handleSort}
          />
        </CardContent>
      </Card>
    </div>
  );
}