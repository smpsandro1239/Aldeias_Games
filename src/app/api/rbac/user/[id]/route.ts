import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getFullUserFromRequest } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac/checkPermission";
import { resolvePermissions } from "@/lib/rbac/resolvePermissions";

export async function GET(request: NextRequest, context: { params: Promise<{id: string}> }) {
  const user = await getFullUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const denied = await requirePermission(user.id, "MANAGE_USERS");
  if (denied) return denied;

  const { id: userId } = await context.params;

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userGlobalRoles: {
        include: {
          role: true,
        },
      },
      userAldeiaRoles: {
        include: {
          role: true,
          aldeia: true,
        },
      },
      userPermissions: {
        include: {
          permission: true,
          aldeia: true,
        },
      },
    },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const effective = await resolvePermissions(userId);

  return NextResponse.json({
    user: targetUser,
    effective,
  });
}
