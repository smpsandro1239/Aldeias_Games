import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getFullUserFromRequest } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac/checkPermission";

export async function GET(request: NextRequest) {
  const user = await getFullUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const denied = await requirePermission(user.id, "MANAGE_USERS");
  if (denied) return denied;

  const permissions = await prisma.permission.findMany();
  return NextResponse.json(permissions);
}
