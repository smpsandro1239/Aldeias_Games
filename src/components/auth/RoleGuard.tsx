"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Constants
const STORAGE_CHECK_DELAY = 100;
const LOADING_MESSAGE = "A verificar permissões...";
const REDIRECT_MESSAGE = "A redireccionar...";

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

  const checkAccess = useCallback(() => {
    let userStr: string | null = null;

    try {
      userStr = localStorage.getItem("user");
    } catch (storageError) {
      console.error("Erro ao acessar localStorage:", storageError);
      toast.error("Erro ao acessar dados de sessão.");
      router.push("/");
      return;
    }

    if (!userStr) {
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
    } catch (parseError) {
      console.error("Erro ao verificar permissões:", parseError);
      toast.error("Erro ao verificar permissões. Faça login novamente.");
      // Limpar storage corrompido
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch (clearError) {
        console.warn("Erro ao limpar localStorage:", clearError);
      }
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [allowedRoles, redirectPath, panelName, router]);

  useEffect(() => {
    // Pequeno delay para garantir que o localStorage está pronto
    const timeout = setTimeout(checkAccess, STORAGE_CHECK_DELAY);
    return () => clearTimeout(timeout);
  }, [checkAccess]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">{LOADING_MESSAGE}</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground">{REDIRECT_MESSAGE}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
