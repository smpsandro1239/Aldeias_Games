import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const roles = await prisma.role.findMany({
    include: { rolePermissions: true },
  });

  return NextResponse.json(roles);
}