import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  try {
    // If userId provided, return aldeias where user has roles
    if (userId) {
      const aldeias = await prisma.aldeia.findMany({
        where: {
          OR: [
            { userAldeiaRoles: { some: { userId } } },
            { userPermissions: { some: { userId } } },
            { admins: { some: { id: userId } } },
            { vendedores: { some: { id: userId } } },
          ],
        },
        select: {
          id: true,
          nome: true,
        },
        orderBy: { nome: "asc" },
      });

      return NextResponse.json(aldeias);
    }

    // If no userId (public request), return all aldeias
    const aldeias = await prisma.aldeia.findMany({
      select: {
        id: true,
        nome: true,
        tipoOrganizacao: true,
      },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json({ data: aldeias });
  } catch (error) {
    console.error("Error fetching aldeias:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}