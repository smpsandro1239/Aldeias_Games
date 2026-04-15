import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const permissions = await prisma.permission.findMany();
  return NextResponse.json(permissions);
}