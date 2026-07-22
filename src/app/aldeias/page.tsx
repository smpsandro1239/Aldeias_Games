"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useCallback } from "react";
import { AldeiaModal } from "@/components/modals/aldeia-modal";
import { LayoutHeader } from "@/components/layout-header";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users, Building2, ChevronRight, Loader2 } from "lucide-react";

interface Aldeia {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  tipoOrganizacao: string;
  verificado: boolean;
  ativo: boolean;
  membrosAtivos?: number;
  nivel?: number;
  pontos?: number;
}

export default function AldeiasPage() {
  const [search, setSearch] = useState("");
  const [tipoOrganizacao, setTipoOrganizacao] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aldeias, setAldeias] = useState<Aldeia[]>([]);
  const [isLoadingAldeias, setIsLoadingAldeias] = useState(true);
  const router = useRouter();

  const fetchAldeias = useCallback(async () => {
    setIsLoadingAldeias(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (tipoOrganizacao && tipoOrganizacao !== "all") params.set("tipoOrganizacao", tipoOrganizacao);
      params.set("limit", "50");

      const res = await fetch(`/api/aldeias?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar aldeias");
      const data = await res.json();
      setAldeias(data.aldeias || []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar aldeias");
    } finally {
      setIsLoadingAldeias(false);
    }
  }, [search, tipoOrganizacao]);

  useEffect(() => {
    fetchAldeias();
  }, [fetchAldeias]);

  const handleSubmitAldeia = async (data: {
    nome: string;
    tipoOrganizacao: string;
    descricao?: string;
    telefone?: string;
    email?: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/aldeias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: data.nome,
          descricao: data.descricao,
          logoUrl: "",
          tipoOrganizacao: data.tipoOrganizacao,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar aldeia");
      }

      const aldeia = await response.json();
      toast.success("Aldeia criada com sucesso!");
      setIsCreateModalOpen(false);
      router.push(`/aldeia/${aldeia.id}`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar aldeia");
    } finally {
      setIsLoading(false);
    }
  };

  const tipoLabel: Record<string, string> = {
    aldeia: "Aldeia",
    escola: "Escola",
    associacao_pais: "Assoc. Pais",
    clube: "Clube",
  };

  return (
    <LayoutHeader>
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-foreground">Aldeias</h1>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Criar Aldeia
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <Input
              placeholder="Buscar aldeias..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-auto max-w-xs"
            />
            <Select value={tipoOrganizacao} onValueChange={setTipoOrganizacao}>
              <SelectTrigger className="w-full sm:w-auto">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="aldeia">Aldeia</SelectItem>
                <SelectItem value="escola">Escola</SelectItem>
                <SelectItem value="associacao_pais">Associação de Pais</SelectItem>
                <SelectItem value="clube">Clube Desportivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoadingAldeias ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : aldeias.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Nenhuma aldeia encontrada</p>
              <p className="text-sm mt-1">Crie uma nova organização ou ajuste os filtros.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {aldeias.map((aldeia) => (
                <Link key={aldeia.id} href={`/aldeia/${aldeia.id}`} className="block group">
                  <Card className="h-full transition-shadow group-hover:shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-semibold text-foreground">{aldeia.nome}</CardTitle>
                        <ChevronRight className="h-5 w-5 text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                          {tipoLabel[aldeia.tipoOrganizacao] || aldeia.tipoOrganizacao}
                        </span>
                        {aldeia.verificado ? (
                          <span className="text-green-500 text-xs">Verificada</span>
                        ) : (
                          <span className="text-yellow-500 text-xs">Pendente</span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {aldeia.descricao && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{aldeia.descricao}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{aldeia.membrosAtivos ?? 0} membros</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <AldeiaModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSubmit={handleSubmitAldeia}
          loading={isLoading}
        />
      </div>
    </LayoutHeader>
  );
}
