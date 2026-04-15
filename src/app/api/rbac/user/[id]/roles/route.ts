import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req, { params }) {
  const { id: userId } = await params;
  const body = await req.json();

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