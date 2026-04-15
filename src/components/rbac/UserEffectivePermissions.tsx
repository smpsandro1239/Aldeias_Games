"use client";

import { Badge } from "@/components/ui/badge";
import { PermissionKey } from "@prisma/client";

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
    <div className="space-y-6 mt-4">

      {/* ROLES GLOBAIS */}
      <div>
        <h2 className="font-semibold mb-2">Roles Globais</h2>
        <div className="flex flex-wrap gap-2">
          {user.userGlobalRoles.map((gr, i) => (
            <Badge key={i} variant="secondary">
              {gr.role.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* ROLES POR ALDEIA */}
      <div>
        <h2 className="font-semibold mb-2">Roles por Aldeia</h2>
        <div className="flex flex-wrap gap-2">
          {user.userAldeiaRoles.map((ar, i) => (
            <Badge key={i} variant="outline">
              {ar.role.name} — Aldeia {ar.aldeiaId}
            </Badge>
          ))}
        </div>
      </div>

      {/* OVERRIDES */}
      <div>
        <h2 className="font-semibold mb-2">Overrides Individuais</h2>
        <div className="flex flex-wrap gap-2">
          {user.userPermissions.map((up, i) => (
            <Badge
              key={i}
              variant={up.allow ? "default" : "destructive"}
            >
              {up.permission.key}
              {up.aldeiaId ? ` (Aldeia ${up.aldeiaId})` : " (Global)"}
            </Badge>
          ))}
        </div>
      </div>

    </div>
  );
}
