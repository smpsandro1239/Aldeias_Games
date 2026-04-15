"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import AldeiaSelector from "./AldeiaSelector";

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
  userAldeiaRoles: UserAldeiaRole[]; // <-- nome correto do Prisma
};

export default function UserRolesAldeia({ user }: { user: User }) {
  const [aldeiaId, setAldeiaId] = useState<string | null>(null);

  const rolesForAldeia = user.userAldeiaRoles.filter(
    (r: UserAldeiaRole) => r.aldeiaId === aldeiaId
  );

  async function toggleRole(roleId: string, enabled: boolean) {
    await fetch(`/api/rbac/user/${user.id}/roles`, {
      method: "POST",
      body: JSON.stringify({
        roleId,
        aldeiaId,
        action: enabled ? "add" : "remove",
      }),
    });
  }

  return (
    <div className="space-y-4 mt-4">
      <AldeiaSelector value={aldeiaId} onChange={setAldeiaId} />

      {aldeiaId && (
        <div className="space-y-3">
          {user.availableRoles?.map((role: Role) => {
            const active = rolesForAldeia.some(
              (r: UserAldeiaRole) => r.roleId === role.id
            );

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
      )}
    </div>
  );
}
