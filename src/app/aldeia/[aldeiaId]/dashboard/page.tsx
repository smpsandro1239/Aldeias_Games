"use client";

import { useEffect, useState } from "react";
import { LayoutHeader } from "@/components/layout-header";
import { LoaderScreen } from "@/components/loader-screen";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Gamepad2, Calendar } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function AldeiaDashboardPage() {
  const searchParams = useSearchParams();
  const aldeiaId = searchParams.get("aldeiaId");
  const [aldeia, setAldeia] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!aldeiaId) {
      setError("ID da aldeia não fornecido");
      setLoading(false);
      return;
    }

    fetch(`/api/aldeia/${aldeiaId}/dashboard`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Falha ao buscar dados da aldeia");
        }
        return res.json();
      })
      .then((data) => {
        setAldeia(data.aldeia);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao buscar aldeia dashboard:", err);
        setError(err.message || "Erro desconhecido");
        setLoading(false);
      });
  }, [aldeiaId]);

  if (loading) {
    return (
      <LoaderScreen message="Carregando dashboard da aldeia..." />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-4 p-6">
          <CardHeader>
            <CardTitle>Erro ao carregar dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>{error}</CardDescription>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!aldeia) {
    return (
      <LoaderScreen message="Nenhum dado encontrado..." />
    );
  }

  return (
    <RoleGuard allowedRoles={["aldeia_admin", "super_admin", "vendedor"]} redirectPath="/" panelName="AldeiaDashboard">
      <LayoutHeader>
        <div className="pt-20 pb-24 px-4 md:px-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              {aldeia.logoUrl ? (
                <img 
                  src={aldeia.logoUrl} 
                  alt={aldeia.nome} 
                  className="h-8 w-8 rounded" 
                />
              ) : (
                <div className="h-8 w-8 bg-primary flex items-center justify-center rounded">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
              <span className="ml-2">{aldeia.nome}</span>
            </h1>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Estatísticas rápidas */}
            <Card className="border">
              <CardHeader className="pb-4">
                <h2 className="text-xl font-semibold text-gray-700">Visão Geral</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Nível</p>
                  <p className="text-2xl font-bold">{aldeia.nivel}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Experiência</p>
                  <p className="text-lg font-medium">{aldeia.experiencia.toLocaleString()} XP</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Pontos</p>
                  <p className="text-lg font-medium">{aldeia.pontos.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Moeda Interna</p>
                  <p className="text-lg font-medium">{aldeia.moedaInterna.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader className="pb-4">
                <h2 className="text-xl font-semibold text-gray-700">Progresso</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Próximo nível</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-500"
                      style={{ width: Math.min((aldeia.progressoNivel || 0) * 100, 100) + "%" }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    {aldeia.progressoNivel ? `${(aldeia.progressoNivel * 100).toFixed(0)}%` : "0%"}
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Membros Ativos</p>
                  <p className="text-2xl font-bold">{aldeia.membrosAtivos}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader className="pb-4">
                <h2 className="text-xl font-semibold text-gray-700">Atividade</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Eventos</p>
                  <p className="text-2xl font-bold">{aldeia.totalEventos}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Jogos</p>
                  <p className="text-2xl font-bold">{aldeia.totalJogos}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Prêmios</p>
                  <p className="text-2xl font-bold">{aldeia.totalPremios}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secção de ações rápidas */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ações Rápidas</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Button 
                variant="outline"
                className="w-full flex items-center justify-between px-6 py-4"
              >
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-800">Ver Membros</h3>
                  <p className="text-sm text-muted-foreground">Gerencie os membros da sua aldeia</p>
                </div>
                <div className="flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
              </Button>
              
              <Button 
                variant="outline"
                className="w-full flex items-center justify-between px-6 py-4"
              >
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-800">Criar Jogo</h3>
                  <p className="text-sm text-muted-foreground">Organize um novo jogo para angariação</p>
                </div>
                <div className="flex-shrink-0">
                  <Gamepad2 className="h-5 w-5 text-primary" />
                </div>
              </Button>
              
              <Button 
                variant="outline"
                className="w-full flex items-center justify-between px-6 py-4"
              >
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-800">Planeamento de Eventos</h3>
                  <p className="text-sm text-muted-foreground">Organize eventos para a comunidade</p>
                </div>
                <div className="flex-shrink-0">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
              </Button>
            </div>
          </div>
        </div>
      </LayoutHeader>
    </RoleGuard>
  );
}