"use client";

import { apiRequest } from "@/lib/api-client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { LayoutHeader } from "@/components/layout-header";
import { LoaderScreen } from "@/components/loader-screen";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Plus, RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { GrelhaWithVencedor, Jogo, POLL_INTERVAL } from "./euromilhoes-types";
import { EuromilhoesStats, GrelhaCard, NovaGrelhaDialog } from "./euromilhoes-widgets";

const AdminEuromilhoesPage = () => {
  const { isLoading } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready || isLoading) {
    return <LoaderScreen message="A carregar" />;
  }

  return (
    <RoleGuard
      allowedRoles={["super_admin", "aldeia_admin"]}
      redirectPath="/"
      panelName="Euromilhões"
    >
      <LayoutHeader>
        <AdminEuromilhoes />
      </LayoutHeader>
    </RoleGuard>
  );
};

function AdminEuromilhoes() {
  const router = useRouter();
  const [grelhas, setGrelhas] = useState<GrelhaWithVencedor[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaGrelhaOpen, setNovaGrelhaOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formJogoId, setFormJogoId] = useState("");
  const [formPremioDescricao, setFormPremioDescricao] = useState("");
  const [formPremioValor, setFormPremioValor] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [grelhasRes, jogosRes] = await Promise.all([
        apiRequest("/api/euromilhoes/grelhas"),
        apiRequest("/api/jogos?tipo=euromilhoes"),
      ]);

      if (grelhasRes.ok) {
        const data = await grelhasRes.json();
        setGrelhas(data.data ?? data);
      }
      if (jogosRes.ok) {
        const data = await jogosRes.json();
        setJogos(data.data ?? data);
      }
    } catch {
      toast.error("Erro ao carregar dados de Euromilhões");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (jogos.length === 1 && !formJogoId) {
      setFormJogoId(jogos[0].id);
    }
  }, [jogos, formJogoId]);

  useEffect(() => {
    const interval = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleFechar = async (grelhaId: string) => {
    try {
      const res = await apiRequest(
        `/api/euromilhoes/grelhas/${grelhaId}/fechar`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok) {
        toast.success("Grelha fechada com sucesso!");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao fechar grelha");
      }
    } catch {
      toast.error("Erro ao fechar grelha");
    }
  };

  const handleSortear = async (grelhaId: string) => {
    try {
      const res = await apiRequest(
        `/api/euromilhoes/grelhas/${grelhaId}/sortear`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok) {
        toast.success("Sorteio realizado com sucesso!");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao sortear grelha");
      }
    } catch {
      toast.error("Erro ao sortear grelha");
    }
  };

  const handleCriarGrelha = async () => {
    if (!formJogoId) {
      toast.error("Selecione um jogo");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest("/api/euromilhoes/grelhas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jogoId: formJogoId,
          premioDescricao: formPremioDescricao || undefined,
          premioValor: formPremioValor ? parseFloat(formPremioValor) : undefined,
        }),
      });
      if (res.ok) {
        toast.success("Grelha criada com sucesso!");
        setNovaGrelhaOpen(false);
        setFormJogoId("");
        setFormPremioDescricao("");
        setFormPremioValor("");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao criar grelha");
      }
    } catch {
      toast.error("Erro ao criar grelha");
    } finally {
      setSubmitting(false);
    }
  };

  const parseOcupados = (raw: string): number[] => {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(Number);
      return [];
    } catch {
      return [];
    }
  };

  const abertas = grelhas.filter((g) => g.estado === "aberta");
  const preenchidas = grelhas.filter((g) => g.estado === "preenchida");
  const sorteadas = grelhas.filter((g) => g.estado === "sorteada");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Back Button */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-primary/10 flex items-center gap-3 px-4 py-3 -mx-4 -mt-6 mb-0">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-surface-container-low rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-primary" />
        </button>
        <span className="font-serif font-bold text-lg text-accent">Euromilhões</span>
      </div>

      {/* Header */}
      <div className="relative bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-indigo-500/10 rounded-3xl p-6 border border-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold">
                Gestão de Euromilhões
              </h1>
              <p className="text-muted-foreground font-medium">
                Criar e gerir grelhas de apostas do Euromilhões
              </p>
            </div>
          </div>
          <Button
            onClick={() => setNovaGrelhaOpen(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Grelha
          </Button>
        </div>
      </div>

      <EuromilhoesStats
        abertas={abertas.length}
        preenchidas={preenchidas.length}
        sorteadas={sorteadas.length}
        total={grelhas.length}
      />

      {/* Refresh button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Grid list */}
      {grelhas.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Star className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-lg">
              Nenhuma grelha de Euromilhões encontrada
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Crie uma nova grelha para começar
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {grelhas.map((grelha) => (
            <GrelhaCard
              key={grelha.id}
              grelha={grelha}
              ocupados={parseOcupados(grelha.numerosOcupados)}
              onFechar={handleFechar}
              onSortear={handleSortear}
            />
          ))}
        </div>
      )}

      <NovaGrelhaDialog
        open={novaGrelhaOpen}
        onOpenChange={setNovaGrelhaOpen}
        jogos={jogos}
        formJogoId={formJogoId}
        formPremioDescricao={formPremioDescricao}
        formPremioValor={formPremioValor}
        submitting={submitting}
        onJogoId={setFormJogoId}
        onPremioDescricao={setFormPremioDescricao}
        onPremioValor={setFormPremioValor}
        onCreate={handleCriarGrelha}
      />
    </div>
  );
}

export default AdminEuromilhoesPage;