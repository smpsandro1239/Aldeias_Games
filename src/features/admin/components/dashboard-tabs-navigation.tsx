"use client";

import { useRouter } from "next/navigation";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Calendar, Gamepad2, Users, DollarSign,
  BarChart3, Hash, Wallet, TrendingUp, Building2, CreditCard,
  Shield, Trophy, ShieldCheck,
} from "lucide-react";

interface DashboardTabsNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: string;
  pedidosPendentesCount: number;
  entregasPendentesCount: number;
}

export function DashboardTabsNavigation({
  activeTab,
  setActiveTab,
  userRole,
  pedidosPendentesCount,
  entregasPendentesCount,
}: DashboardTabsNavigationProps) {
  const router = useRouter();

  return (
    <>
      {/* ==================== GRUPO 1: TABS PRINCIPAIS ==================== */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-surface to-transparent opacity-0 md:opacity-100 pointer-events-none z-10" aria-hidden="true" />
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-surface to-transparent opacity-0 md:opacity-100 pointer-events-none z-10" aria-hidden="true" />

        <TabsList className="flex overflow-x-auto pb-2 gap-1 md:gap-2 justify-start md:justify-center whitespace-nowrap scroll-smooth snap-x snap-mandatory">
          <TabsTrigger value="overview" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
            <LayoutDashboard className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Visão Geral</span>
            <span className="sm:hidden">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
            <BarChart3 className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="eventos" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
            <Calendar className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">{userRole === "aldeia_admin" ? "Minha Aldeia" : "Eventos"}</span>
            <span className="sm:hidden">{userRole === "aldeia_admin" ? "Aldeia" : "Eventos"}</span>
          </TabsTrigger>
          {userRole !== "aldeia_admin" && (
            <TabsTrigger value="jogos" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
              <Gamepad2 className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Jogos</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="vencedores" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
            <Trophy className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Vencedores</span>
          </TabsTrigger>

          {userRole === "aldeia_admin" && (
            <TabsTrigger value="pedidos" onClick={() => router.push("/admindashboard/pedidos")} className="flex-shrink-0 relative text-sm md:text-base px-3 md:px-4 py-2">
              <Wallet className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Pedidos</span>
              {pedidosPendentesCount > 0 && (
                <Badge className="absolute -top-1.5 -right-1.5 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-foreground text-xs">
                  {pedidosPendentesCount}
                </Badge>
              )}
            </TabsTrigger>
          )}

          {userRole === "aldeia_admin" && (
            <TabsTrigger value="entregas" onClick={() => router.push("/admindashboard/entregas")} className="flex-shrink-0 relative text-sm md:text-base px-3 md:px-4 py-2">
              <TrendingUp className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Entregas</span>
              {entregasPendentesCount > 0 && (
                <Badge className="absolute -top-1.5 -right-1.5 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-foreground text-xs">
                  {entregasPendentesCount}
                </Badge>
              )}
            </TabsTrigger>
          )}

          <TabsTrigger
            value="cofre"
            onClick={() => router.push(userRole === "super_admin" ? "/superadmindashboard/cofre" : "/admindashboard/cofre")}
            className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2"
          >
            <ShieldCheck className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Cofre</span>
          </TabsTrigger>

          {userRole === "aldeia_admin" && (
            <TabsTrigger value="euromilhoes" onClick={() => router.push("/admindashboard/euromilhoes")} className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
              <Trophy className="h-4 w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Euromilhões</span>
            </TabsTrigger>
          )}

          <TabsTrigger value="verificar" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
            <Hash className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Verificar</span>
          </TabsTrigger>
        </TabsList>
      </div>

      {/* ==================== GRUPO 2: TABS ADMINISTRATIVAS ==================== */}
      <div className="relative">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 pl-1">Administração</p>

        <div className="absolute left-0 top-8 bottom-0 w-4 bg-gradient-to-r from-surface to-transparent opacity-0 md:opacity-100 pointer-events-none z-10" aria-hidden="true" />
        <div className="absolute right-0 top-8 bottom-0 w-4 bg-gradient-to-l from-surface to-transparent opacity-0 md:opacity-100 pointer-events-none z-10" aria-hidden="true" />

        <TabsList className="flex overflow-x-auto pb-2 gap-1 md:gap-2 justify-start md:justify-center whitespace-nowrap scroll-smooth">
          <TabsTrigger value="users" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
            <Users className="h-4 w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Utilizadores</span>
            <span className="sm:hidden">Users</span>
          </TabsTrigger>

          {userRole === "aldeia_admin" && (
            <TabsTrigger value="comissoes" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
              <DollarSign className="h-4 w-4 mr-1 md:mr-2" />
              Comissões
            </TabsTrigger>
          )}

          {userRole === "super_admin" && (
            <>
              <TabsTrigger value="aldeias" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
                <Building2 className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Aldeias</span>
              </TabsTrigger>
              <TabsTrigger value="transacoes" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
                <CreditCard className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Transações</span>
                <span className="sm:hidden">Trans.</span>
              </TabsTrigger>
              <TabsTrigger value="auditoria" className="flex-shrink-0 text-sm md:text-base px-3 md:px-4 py-2">
                <Shield className="h-4 w-4 mr-1 md:mr-2" />
                Auditoria
              </TabsTrigger>
            </>
          )}
        </TabsList>
      </div>
    </>
  );
}
