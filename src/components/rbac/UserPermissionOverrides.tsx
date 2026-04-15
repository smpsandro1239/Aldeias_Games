"use client";

import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PermissionKey } from "@prisma/client";

type UserPermission = {
  id: string;
  permissionId: string;
  allow: boolean;
  permission: {
    key: PermissionKey;
  };
};

type User = {
  id: string;
  userPermissions: UserPermission[];
};

export default function UserPermissionOverrides({ user }: { user: User }) {
  async function toggleOverride(permissionId: string, allow: boolean) {
    await fetch(`/api/rbac/user/${user.id}/permissions`, {
      method: "POST",
      body: JSON.stringify({ permissionId, allow }),
    });
  }

  return (
    <div className="space-y-3 mt-4">
      {user.userPermissions.map((up: UserPermission) => (
        <div
          key={up.id}
          className="flex items-center justify-between py-2 border-b"
        >
          <Badge variant="outline">{up.permission.key}</Badge>

          <Switch
            checked={up.allow}
            onCheckedChange={(v) => toggleOverride(up.permissionId, v)}
          />
        </div>
      ))}
    </div>
  );
}
