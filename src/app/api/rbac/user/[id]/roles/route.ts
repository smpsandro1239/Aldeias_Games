import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getFullUserFromRequest } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac/checkPermission";

export async function POST(request: NextRequest, context: { params: Promise<{id: string}> }) {
  const user = await getFullUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const denied = await requirePermission(user.id, "MANAGE_USERS");
  if (denied) return denied;

  const { id: userId } = await context.params;
  const body = await request.json();

  const { roleId, aldeiaId, action } = body;

  if (!roleId || !action) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (aldeiaId) {
    if (action === "add") {
      await prisma.userAldeiaRole.create({
        data: { userId, roleId, aldeiaId },
      });
    } else {
      await prisma.userAldeiaRole.delete({
        where: { userId_aldeiaId_roleId: { userId, aldeiaId, roleId } },
      });
    }
  } else {
    if (action === "add") {
      await prisma.userGlobalRole.create({
        data: { userId, roleId },
      });
    } else {
      await prisma.userGlobalRole.delete({
        where: { userId_roleId: { userId, roleId } },
      });
    }
  }

  return NextResponse.json({ success: true });
}
