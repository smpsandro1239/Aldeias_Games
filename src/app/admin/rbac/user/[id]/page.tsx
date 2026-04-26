"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import UserRolesGlobal from "@/components/rbac/UserRolesGlobal";
import UserRolesAldeia from "@/components/rbac/UserRolesAldeia";
import UserEffectivePermissions from "@/components/rbac/UserEffectivePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Users, Lock } from "lucide-react";
import { LayoutHeader } from "@/components/layout-header";

type Role = {
  id: string;
  name: string;
};

type UserData = {
  id: string;
  nome: string;
  email: string;
  userGlobalRoles: any[];
  userAldeiaRoles: any[];
  userPermissions: any[];
  availableRoles: Role[];
};

export default function UserRbacPage() {
  const params = useParams();
  const userId = params?.id as string | undefined;
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    if (!userId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [userResponse, rolesResponse] = await Promise.all([
        fetch(`/api/rbac/user/${userId}`, { credentials: "include" }),
        fetch("/api/rbac/roles", { credentials: "include" }),
      ]);

      if (!userResponse.ok) {
        const payload = await userResponse.json().catch(() => null);
        throw new Error(payload?.error || `Erro ${userResponse.status}`);
      }

      if (!rolesResponse.ok) {
        throw new Error("Não foi possível carregar a lista de roles");
      }

      const userData = await userResponse.json();
      const rolesData = await rolesResponse.json();

      setUser({
        ...userData.user,
        availableRoles: rolesData,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar utilizador");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-[var(--text-muted)]">A carregar...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[var(--destructive)]">Erro: {error}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-[var(--text-muted)]">Utilizador não encontrado.</div>
      </div>
    );
  }

  return (
    <LayoutHeader>
      <div className="min-h-screen bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <button 
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          </div>

          <div className="card-m3 mb-8 px-8 py-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 p-3">
                    <Users className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[var(--text)]">{user.nome}</h1>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">Gerir permissões e roles de utilizador</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-3 rounded-lg bg-[var(--card-alt)] px-4 py-2">
                  <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Email</span>
                  <span className="font-mono text-sm font-semibold text-[var(--text)]">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-[var(--card-alt)] px-4 py-2">
                  <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">ID</span>
                  <span className="font-mono text-xs text-[var(--text-muted)]">{user.id}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-[var(--card-alt)] bg-[var(--card)] shadow-sm">
                <CardHeader className="border-b border-[var(--card-alt)] bg-[var(--card-alt)]/50">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-[var(--primary)]/20 p-2">
                      <Shield className="h-5 w-5 text-[var(--primary)]" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-[var(--text)]">Roles Globais</CardTitle>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Aplicam-se a todo o sistema</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <UserRolesGlobal user={user} onChange={loadUser} />
                </CardContent>
              </Card>

              <Card className="border-[var(--card-alt)] bg-[var(--card)] shadow-sm">
                <CardHeader className="border-b border-[var(--card-alt)] bg-[var(--card-alt)]/50">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-[var(--secondary)]/20 p-2">
                      <Lock className="h-5 w-5 text-[var(--secondary)]" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-[var(--text)]">Roles por Aldeia</CardTitle>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Específicos de cada aldeia</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <UserRolesAldeia user={user} onChange={loadUser} />
                </CardContent>
              </Card>
            </div>

            <Card className="lg:col-span-1 border-[var(--card-alt)] bg-[var(--card)] shadow-sm h-fit sticky top-8">
              <CardHeader className="border-b border-[var(--card-alt)] bg-gradient-to-r from-[var(--primary)]/5 to-[var(--secondary)]/5">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[var(--primary)]" />
                  <CardTitle className="text-[var(--text)]">Permissões Atuais</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <UserEffectivePermissions user={user} />
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-4 flex items-start gap-3">
            <div className="rounded-full bg-[var(--primary)]/20 p-2 mt-0.5">
              <Shield className="h-4 w-4 text-[var(--primary)]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--text)] text-sm">Alterações em tempo real</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">As alterações são aplicadas imediatamente no servidor. Recarregue a página se precisar confirmar o estado atualizado.</p>
            </div>
          </div>
        </div>
      </div>
    </LayoutHeader>
  );
}
