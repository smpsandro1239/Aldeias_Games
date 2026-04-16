import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = await params;
  const body = await req.json();

  const { permissionId, aldeiaId, allow } = body;

  if (!permissionId || allow === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await prisma.userPermission.upsert({
    where: {
      userId_permissionId_aldeiaId: {
        userId,
        permissionId,
        aldeiaId: aldeiaId ?? null,
      },
    },
    update: { allow },
    create: { userId, permissionId, allow, aldeiaId },
  });

  return NextResponse.json({ success: true });
}