import prisma from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import RbacUserTable from "@/components/rbac/RbacUserTable";

export default async function RbacPage() {
  const users = await prisma.user.findMany({
    include: {
      userGlobalRoles: {
        include: { role: true },
      },
      userAldeiaRoles: {
        include: { role: true, aldeia: true },
      },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2">
            <CardTitle>Gestão de Permissões</CardTitle>
            <p className="text-sm text-slate-600 max-w-2xl">
              Veja todos os utilizadores, os seus roles globais e roles por aldeia. Use a pesquisa para filtrar enquanto escreve e altere quantos utilizadores aparecem por página.
            </p>
          </div>
        </CardHeader>
      </Card>

      <RbacUserTable users={users} />
    </div>
  );
}
