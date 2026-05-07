"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Edit,
  Trash2
} from "lucide-react";
import { User } from "../types";

interface UsersTabProps {
  users: User[];
  setSelectedUser: (user: User | null) => void;
  setUserModalOpen: (open: boolean) => void;
  requestDelete: (type: string, id: string) => void;
}

export function UsersTab({
  users,
  setSelectedUser,
  setUserModalOpen,
  requestDelete,
}: UsersTabProps) {
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);

  const filteredUsers = useMemo(() => {
    const searchLower = userSearch.toLowerCase();
    return users.filter((u) => {
      if (!searchLower) return true;
      return (
        u.nome?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower) ||
        u.telefone?.toLowerCase().includes(searchLower)
      );
    });
  }, [users, userSearch]);

  useEffect(() => {
    setUserPage(1);
  }, [userSearch]);

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

      {/* Filtros */}
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

          {/* Lista */}
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {users.length === 0
                  ? "Sem utilizadores"
                  : "Nenhum utilizador corresponde aos filtros"}
              </p>
            ) : (
               filteredUsers
                 .slice((userPage - 1) * 50, userPage * 50)
                 .map((u) => (
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

           {/* Paginação */}
           {filteredUsers.length > 50 && (
             <div className="flex items-center justify-between pt-4 mt-4 border-t">
               <p className="text-sm text-muted-foreground">
                 Mostrando {(userPage - 1) * 50 + 1} a{" "}
                 {Math.min(userPage * 50, filteredUsers.length)} de{" "}
                 {filteredUsers.length} utilizadores
               </p>
               <div className="flex items-center gap-2">
                 <Button
                   variant="outline"
                   size="sm"
                   disabled={userPage === 1}
                   onClick={() => setUserPage(userPage - 1)}
                 >
                   Anterior
                 </Button>
                 <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                   Página {userPage}
                 </span>
                 <Button
                   variant="outline"
                   size="sm"
                   disabled={userPage * 50 >= filteredUsers.length}
                   onClick={() => setUserPage(userPage + 1)}
                 >
                   Próxima
                 </Button>
               </div>
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
