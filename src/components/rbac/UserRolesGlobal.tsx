"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, Shield } from "lucide-react";

type Role = {
  id: string;
  name: string;
};

type UserGlobalRole = {
  roleId: string;
  role: {
    name: string;
  };
};

type User = {
  id: string;
  availableRoles: Role[];
  userGlobalRoles: UserGlobalRole[];
};

export default function UserRolesGlobal({ user, onChange }: { user: User; onChange?: () => void }) {
  const [activeRoleIds, setActiveRoleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    const roleIds = user.userGlobalRoles.map((role) => role.roleId);
    setActiveRoleIds(roleIds);
  }, [user.userGlobalRoles]);

  async function toggleRole(roleId: string, enabled: boolean) {
    setLoading(roleId);
    try {
      const response = await fetch(`/api/rbac/user/${user.id}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId, action: enabled ? "add" : "remove" }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Não foi possível atualizar o role global");
      }

      setActiveRoleIds((current) =>
        enabled ? [...current, roleId] : current.filter((id) => id !== roleId)
      );

      onChange?.();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao atualizar roles globais");
    } finally {
      setLoading(null);
    }
  }

  if (!user.availableRoles || user.availableRoles.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--card-alt)] bg-[var(--card)] p-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">Nenhuma role disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {user.availableRoles.map((role: Role) => {
        const active = activeRoleIds.includes(role.id);
        const isLoading = loading === role.id;

        return (
          <div
            key={role.id}
            className="card-m3 group flex items-center justify-between gap-4 px-4 py-3"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`flex-shrink-0 rounded-lg p-2 ${active ? 'bg-[var(--primary)]/20' : 'bg-[var(--card-alt)]'}`}>
                {active ? (
                  <Check className={`h-4 w-4 ${active ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
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
                <Badge className="bg-[var(--primary)]/20 text-[var(--primary)] hover:bg-[var(--primary)]/20 border-0">
                  Ativo
                </Badge>
              )}
              <Switch
                checked={active}
                onCheckedChange={(v) => toggleRole(role.id, v)}
                disabled={isLoading}
                className="data-[state=checked]:bg-[var(--primary)]"
              />
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
