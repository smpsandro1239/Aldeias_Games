import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { resolvePermissions } from "@/lib/rbac/resolvePermissions";

export async function GET(req: NextRequest, context: { params: Promise<{id: string}> }) {
  const { id: userId } = await context.params;

  const user = await prisma.user.findUnique({
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

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const effective = await resolvePermissions(userId);

  return NextResponse.json({
    user,
    effective,
  });
}