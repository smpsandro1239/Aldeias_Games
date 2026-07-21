"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Edit,
  Trash2,
  KeyRound,
  Percent
} from "lucide-react";
import { User } from "../types";
import { Pagination } from "@/components/ui/pagination";

interface UsersTabProps {
  users?: User[];
  setSelectedUser: (user: User | null) => void;
  setUserModalOpen: (open: boolean) => void;
  requestDelete: (type: string, id: string) => void;
}

export function UsersTab({
  users: usersProp,
  setSelectedUser,
  setUserModalOpen,
  requestDelete,
}: UsersTabProps) {
  const [users, setUsers] = useState<User[]>(usersProp || []);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [resettingPinUserId, setResettingPinUserId] = useState<string | null>(null);
  const [togglingComissaoUserId, setTogglingComissaoUserId] = useState<string | null>(null);
  const limit = 50;

  const fetchUsers = useCallback(async (page: number, search: string) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/users?${params}`);
      if (res.ok) {
        const json = await res.json();
        setUsers(json.data || []);
        setTotalUsers(json.pagination?.total || 0);
      }
    } catch {
      // keep existing data
    }
  }, []);

  useEffect(() => {
    if (usersProp && usersProp.length > 0 && totalUsers === 0) {
      setUsers(usersProp);
    }
  }, [usersProp, totalUsers]);

  useEffect(() => {
    fetchUsers(userPage, userSearch);
  }, [userPage, userSearch, fetchUsers]);

  useEffect(() => {
    setUserPage(1);
  }, [userSearch]);

  const handleResetPin = async (userId: string, userName: string) => {
    if (!confirm(`Repor o PIN do cofre de ${userName}? O utilizador terá de configurar um novo PIN.`)) return;
    setResettingPinUserId(userId);
    try {
      const res = await fetch("/api/users/vault-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "admin-reset", targetUserId: userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao repor PIN");
        return;
      }
      alert(data.message || "PIN reposto com sucesso");
      window.location.reload();
    } catch {
      alert("Erro ao repor PIN");
    } finally {
      setResettingPinUserId(null);
    }
  };

  const handleToggleComissao = async (userId: string, current: boolean) => {
    setTogglingComissaoUserId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comissaoAtiva: !current }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao alterar comissões");
        return;
      }
      window.location.reload();
    } catch {
      alert("Erro ao alterar comissões");
    } finally {
      setTogglingComissaoUserId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-xl font-semibold">Gestão de Utilizadores</h2>
        <Button
          onClick={() => {
            setSelectedUser(null);
            setUserModalOpen(true);
          }}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Utilizador
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 min-w-0 max-w-md">
              <Label htmlFor="userSearch" className="sr-only">
                Pesquisar (nome, email, telemóvel)
              </Label>
              <div className="relative">
                <Input
                  id="userSearch"
                  placeholder="Pesquisar por nome, email ou telemóvel..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-10"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {users.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum utilizador encontrado
              </p>
            ) : (
               users.map((u) => (
                 <div
                   key={u.id}
                   className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg border hover:bg-accent/5 transition-colors cursor-pointer"
                 >
                   <div
                     className="min-w-0 flex-1"
                     onClick={() => {
                       setSelectedUser(u);
                       setUserModalOpen(true);
                     }}
                   >
                     <h3 className="font-semibold truncate">{u.nome}</h3>
                     <p className="text-sm text-muted-foreground truncate">
                       {u.email}
                     </p>
                      <p className="text-xs text-muted-foreground">
                        {u.telefone ? `Tlm: ${u.telefone}` : "Sem telemóvel"} • Perfil: {u.role}
                        {(u.role === "vendedor" || u.role === "aldeia_admin") && (
                          <span className={`ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${u.comissaoAtiva ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                            <Percent className="h-2.5 w-2.5" />
                            {u.comissaoAtiva ? "On" : "Off"}
                          </span>
                        )}
                      </p>
                   </div>
                   <div
                     className="flex flex-wrap gap-2 items-center self-stretch sm:self-auto"
                     onClick={(e) => e.stopPropagation()}
                   >
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => {
                         setSelectedUser(u);
                         setUserModalOpen(true);
                       }}
                       title="Editar"
                     >
                       <Edit className="h-4 w-4" />
                     </Button>
                     {u.vaultPinEnabled && (
                       <Button
                         variant="ghost"
                         size="icon"
                         className="text-amber-600 hover:text-amber-700"
                         disabled={resettingPinUserId === u.id}
                         onClick={() => handleResetPin(u.id, u.nome)}
                         title="Repor PIN do cofre"
                       >
                         <KeyRound className="h-4 w-4" />
                       </Button>
                     )}
                     {(u.role === "vendedor" || u.role === "aldeia_admin") && (
                       <Button
                         variant="ghost"
                         size="icon"
                         className={u.comissaoAtiva ? "text-emerald-600 hover:text-emerald-700" : "text-muted-foreground hover:text-accent"}
                         disabled={togglingComissaoUserId === u.id}
                         onClick={() => handleToggleComissao(u.id, u.comissaoAtiva ?? false)}
                         title={u.comissaoAtiva ? "Desligar comissões" : "Ligar comissões"}
                       >
                         <Percent className="h-4 w-4" />
                       </Button>
                     )}
                     <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => requestDelete("user", u.id)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                   </div>
                 </div>
               ))
            )}
          </div>

          <Pagination
            page={userPage}
            total={totalUsers}
            limit={limit}
            onPageChange={setUserPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
