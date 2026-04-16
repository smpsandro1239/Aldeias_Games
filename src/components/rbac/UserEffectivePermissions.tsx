"use client";

import { Badge } from "@/components/ui/badge";
import { PermissionKey } from "@prisma/client";
import { Shield, Lock, Globe } from "lucide-react";

type UserPermission = {
  allow: boolean;
  aldeiaId: string | null;
  permission: {
    key: PermissionKey;
  };
};

type UserGlobalRole = {
  role: {
    name: string;
  };
};

type UserAldeiaRole = {
  aldeiaId: string;
  role: {
    name: string;
  };
};

type User = {
  id: string;
  userPermissions: UserPermission[];
  userGlobalRoles: UserGlobalRole[];
  userAldeiaRoles: UserAldeiaRole[];
};

export default function UserEffectivePermissions({ user }: { user: User }) {
  return (
    <div className="space-y-6">

      {/* ROLES GLOBAIS */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-[var(--primary)]" />
          <h3 className="font-semibold text-[var(--text)] text-sm">Roles Globais</h3>
        </div>
        {user.userGlobalRoles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.userGlobalRoles.map((gr, i) => (
              <Badge key={i} className="bg-[var(--primary)]/20 text-[var(--primary)] hover:bg-[var(--primary)]/20 border-0">
                {gr.role.name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)] italic">Nenhuma role global atribuída</p>
        )}
      </div>

      {/* ROLES POR ALDEIA */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Lock className="h-4 w-4 text-[var(--secondary)]" />
          <h3 className="font-semibold text-[var(--text)] text-sm">Roles por Aldeia</h3>
        </div>
        {user.userAldeiaRoles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.userAldeiaRoles.map((ar, i) => (
              <Badge key={i} className="bg-[var(--secondary)]/20 text-[var(--secondary)] hover:bg-[var(--secondary)]/20 border-0">
                {ar.role.name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)] italic">Nenhuma role local atribuída</p>
        )}
      </div>

      {/* OVERRIDES */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-[var(--accent)]" />
          <h3 className="font-semibold text-[var(--text)] text-sm">Overrides</h3>
        </div>
        {user.userPermissions.length > 0 ? (
          <div className="space-y-2">
            {user.userPermissions.map((up, i) => (
              <div key={i} className="flex items-center gap-2">
                <Badge
                  className={up.allow ? "bg-green-500/20 text-green-500 hover:bg-green-500/20 border-0" : "bg-red-500/20 text-red-500 hover:bg-red-500/20 border-0"}
                >
                  {up.allow ? "✓" : "✗"}
                </Badge>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  {up.permission.key}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)] italic">Nenhum override definido</p>
        )}
      </div>

    </div>
  );
}
