"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import AldeiaSelector from "./AldeiaSelector";
import { Check, X, Loader2, Building2 } from "lucide-react";

type Role = {
  id: string;
  name: string;
};

type UserAldeiaRole = {
  roleId: string;
  aldeiaId: string;
};

type User = {
  id: string;
  availableRoles: Role[];
  userAldeiaRoles: UserAldeiaRole[];
};

export default function UserRolesAldeia({ user, onChange }: { user: User; onChange?: () => void }) {
  const [aldeiaId, setAldeiaId] = useState<string | null>(null);
  const [activeAldeiaRoles, setActiveAldeiaRoles] = useState<UserAldeiaRole[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    setActiveAldeiaRoles(user.userAldeiaRoles);
  }, [user.userAldeiaRoles]);

  const rolesForAldeia = activeAldeiaRoles.filter(
    (role: UserAldeiaRole) => role.aldeiaId === aldeiaId
  );

  async function toggleRole(roleId: string, enabled: boolean) {
    if (!aldeiaId) return;

    setLoading(roleId);
    try {
      const response = await fetch(`/api/rbac/user/${user.id}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId, aldeiaId, action: enabled ? "add" : "remove" }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Não foi possível atualizar o role por aldeia");
      }

      setActiveAldeiaRoles((current) => {
        if (enabled) {
          return [...current, { roleId, aldeiaId }];
        }

        return current.filter(
          (entry) => !(entry.roleId === roleId && entry.aldeiaId === aldeiaId)
        );
      });

      onChange?.();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao atualizar roles por aldeia");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card-m3 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <Building2 className="h-5 w-5 text-[var(--secondary)]" />
          <label className="font-medium text-[var(--text)] text-sm">Selecionar Aldeia</label>
        </div>
        <AldeiaSelector value={aldeiaId} onChange={setAldeiaId} />
      </div>

      {aldeiaId ? (
        <div className="space-y-2">
          {user.availableRoles && user.availableRoles.length > 0 ? (
            user.availableRoles.map((role: Role) => {
              const active = rolesForAldeia.some(
                (r: UserAldeiaRole) => r.roleId === role.id
              );
              const isLoading = loading === role.id;

              return (
                <div
                  key={role.id}
                  className="card-m3 group flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`flex-shrink-0 rounded-lg p-2 ${active ? 'bg-[var(--secondary)]/20' : 'bg-[var(--card-alt)]'}`}>
                      {active ? (
                        <Check className={`h-4 w-4 ${active ? 'text-[var(--secondary)]' : 'text-[var(--text-muted)]'}`} />
                      ) : (
                        <X className="h-4 w-4 text-[var(--text-muted)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--text)] text-sm">{role.name}</p>
                      <p className="text-xs text-[var(--text-muted)] font-mono truncate">{role.id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {active && (
                      <Badge className="bg-[var(--secondary)]/20 text-[var(--secondary)] hover:bg-[var(--secondary)]/20 border-0">
                        Ativo
                      </Badge>
                    )}
                    <Switch
                      checked={active}
                      onCheckedChange={(v) => toggleRole(role.id, v)}
                      disabled={isLoading}
                      className="data-[state=checked]:bg-[var(--secondary)]"
                    />
                    {isLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--secondary)]" />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--card-alt)] bg-[var(--card)] p-6 text-center">
              <p className="text-sm text-[var(--text-muted)]">Nenhuma role disponível</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card-m3 p-8 text-center">
          <Building2 className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium text-[var(--text)]">Selecione uma aldeia</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Para ajustar roles locais específicos</p>
        </div>
      )}
    </div>
  );
}
