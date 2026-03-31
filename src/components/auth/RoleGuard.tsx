"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  redirectPath: string;
  panelName: string;
}

interface User {
  id: string;
  role: string;
  nome: string;
  aldeiaId?: string;
  aldeia?: {
    id: string;
    nome: string;
    slug: string;
  };
}

export function RoleGuard({ allowedRoles, children, redirectPath, panelName }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (!token || !userStr) {
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        router.push("/");
        return;
      }

      try {
        const user: User = JSON.parse(userStr);
        
        if (!allowedRoles.includes(user.role)) {
          toast.error(`Acesso negado, não tem permissão para aceder ao painel ${panelName}`);
          router.push(redirectPath);
          return;
        }

        setHasAccess(true);
      } catch {
        toast.error("Erro ao verificar permissões");
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [allowedRoles, redirectPath, panelName, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">A verificar permissões...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground">A redireccionar...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
