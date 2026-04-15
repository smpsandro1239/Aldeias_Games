import Link from "next/link";
import prisma from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function RbacPage() {
  const users = await prisma.user.findMany({
    include: {
      userGlobalRoles: {
        include: { role: true },
      },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Permissões</CardTitle>
        </CardHeader>

        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Nome</th>
                <th>Email</th>
                <th>Roles Globais</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="py-2">{u.nome}</td>
                  <td>{u.email}</td>
                  <td className="space-x-1">
                    {u.userGlobalRoles.map((gr) => (
                      <Badge key={gr.roleId} variant="secondary">
                        {gr.role.name}
                      </Badge>
                    ))}
                  </td>
                  <td className="text-right">
                    <Link href={`/admin/rbac/user/${u.id}`}>
                      <Button variant="outline" size="sm">
                        Gerir Permissões
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
