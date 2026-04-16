import prisma from "@/lib/db";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import RbacUserTable from "@/components/rbac/RbacUserTable";

export default async function RbacPage() {
  const [users, roles, aldeias] = await Promise.all([
    prisma.user.findMany({
      include: {
        userGlobalRoles: {
          include: { role: true },
        },
        userAldeiaRoles: {
          include: { role: true, aldeia: true },
        },
      },
      orderBy: { nome: "asc" },
    }),
    prisma.role.findMany(),
    prisma.aldeia.findMany({
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="border-[var(--card-alt)] bg-[var(--card)]">
          <CardHeader className="border-b border-[var(--card-alt)] bg-gradient-to-r from-[var(--primary)]/5 to-[var(--secondary)]/5">
            <div className="flex flex-col gap-2">
              <CardTitle className="text-2xl font-bold text-[var(--text)] flex items-center gap-2">
                Gestão de Permissões (RBAC)
              </CardTitle>
              <CardDescription className="text-[var(--text-muted)]">
                See todos os utilizadores, os seus roles globais e roles por aldeia. Use os filtros para pesquisar e a atribuição em massa para gerir múltiplos utilizadores ao mesmo tempo.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        <RbacUserTable users={users} availableRoles={roles} availableAldeias={aldeias} />
      </div>
    </div>
  );
}
