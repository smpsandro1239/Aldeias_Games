"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type UserGlobalRole = {
  roleId: string;
  role: {
    name: string;
  };
};

type UserAldeiaRole = {
  roleId: string;
  aldeiaId: string;
  role: {
    name: string;
  };
  aldeia: {
    nome: string;
  } | null;
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
};

const PAGE_SIZES = [20, 50, 100];

export default function RbacUserTable({ users }: RbacUserTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    if (!normalizedSearch) {
      return users;
    }

    return users.filter((user) => {
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
  }, [normalizedSearch, users]);

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedSearch, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pageUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const rangeStart = filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(filteredUsers.length, currentPage * pageSize);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Utilizadores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1.5fr_auto] items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Pesquisar utilizadores</label>
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Nome, email, id, role ou aldeia"
              className="w-full"
            />
          </div>

          <div className="grid gap-2 sm:items-end">
            <label className="text-sm font-medium text-slate-700">Utilizadores por página</label>
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-700">
            Mostrando {rangeStart}–{rangeEnd} de {filteredUsers.length} utilizador{filteredUsers.length === 1 ? "" : "es"}.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              Seguinte
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-300 text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="py-3 px-4 text-left font-semibold text-slate-900">Nome</th>
                <th className="py-3 px-4 text-left font-semibold text-slate-900">Email</th>
                <th className="py-3 px-4 text-left font-semibold text-slate-900">Roles Globais</th>
                <th className="py-3 px-4 text-left font-semibold text-slate-900">Roles por Aldeia</th>
                <th className="py-3 px-4 text-right font-semibold text-slate-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 bg-white">
              {pageUsers.length > 0 ? (
                pageUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-medium text-slate-900">{user.nome}</td>
                    <td className="py-4 px-4 text-slate-700">{user.email}</td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-2">
                        {user.userGlobalRoles.length > 0 ? (
                          user.userGlobalRoles.map((role) => (
                            <Badge key={role.roleId} variant="default">
                              {role.role.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs italic text-slate-700">Sem roles globais</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-2">
                        {user.userAldeiaRoles.length > 0 ? (
                          user.userAldeiaRoles.map((role) => (
                            <div
                              key={`${role.roleId}-${role.aldeiaId}`}
                              className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1"
                            >
                              <Badge variant="outline">{role.role.name}</Badge>
                              <span className="text-xs text-slate-500">{role.aldeia?.nome ?? "Aldeia desconhecida"}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs italic text-slate-700">Sem roles por aldeia</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link href={`/admin/rbac/user/${user.id}`}>
                        <Button variant="outline" size="sm">
                          Gerir Permissões
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-600">
                    Nenhum utilizador corresponde à pesquisa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
