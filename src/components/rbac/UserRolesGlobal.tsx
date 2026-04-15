"use client";

import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

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

export default function UserRolesGlobal({ user }: { user: User }) {
  const roles = user.userGlobalRoles;

  async function toggleRole(roleId: string, enabled: boolean) {
    await fetch(`/api/rbac/user/${user.id}/roles`, {
      method: "POST",
      body: JSON.stringify({
        roleId,
        action: enabled ? "add" : "remove",
      }),
    });
  }

  return (
    <div className="space-y-3 mt-4">
      {user.availableRoles?.map((role: Role) => {
        const active = roles.some((r: UserGlobalRole) => r.roleId === role.id);

        return (
          <div
            key={role.id}
            className="flex items-center justify-between py-2 border-b"
          >
            <Badge variant="secondary">{role.name}</Badge>

            <Switch
              checked={active}
              onCheckedChange={(v) => toggleRole(role.id, v)}
            />
          </div>
        );
      })}
    </div>
  );
}
