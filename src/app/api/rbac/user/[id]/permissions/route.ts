import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest, context: { params: Promise<{id: string}> }) {
  const { id: userId } = await context.params;
  const body = await req.json();

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
