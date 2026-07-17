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

  const { permissionId, aldeiaId, allow } = body;

  if (!permissionId || allow === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await prisma.userPermission.findFirst({
    where: {
      userId,
      permissionId,
      aldeiaId: aldeiaId ?? null,
    },
  });

  if (existing) {
    await prisma.userPermission.update({
      where: { id: existing.id },
      data: { allow },
    });
  } else {
    await prisma.userPermission.create({
      data: { userId, permissionId, allow, aldeiaId },
    });
  }

  return NextResponse.json({ success: true });
}
