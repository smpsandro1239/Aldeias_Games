"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LayoutHeader } from "@/components/layout-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, FileText, Shield, AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function DadosPessoaisPage() {
  const { user, logout } = useAuth();
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const response = await fetch("/api/me");
      if (!response.ok) throw new Error("Falha ao exportar");
      const data = await response.json();

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aldeias-games-dados-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar dados");
    } finally {
      setExportLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!deleteReason.trim()) {
      toast.error("Por favor, indique o motivo da eliminação");
      return;
    }
    setDeleteLoading(true);
    try {
      const response = await fetch("/api/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: deleteReason }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao solicitar eliminação");
      }
      toast.success("Pedido de eliminação submetido. Será processado em até 48h.");
      setShowDeleteConfirm(false);
      setDeleteReason("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!user) {
    return (
      <LayoutHeader>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </LayoutHeader>
    );
  }

  return (
    <LayoutHeader>
      <div className="min-h-screen bg-background text-foreground font-body">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-primary/10 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <a href="/perfil" className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-primary" />
            </a>
            <h1 className="font-serif text-xl tracking-wide text-accent font-bold italic">Dados Pessoais</h1>
          </div>
        </header>

        <main className="px-4 pt-6 pb-24 max-w-2xl mx-auto space-y-6">
          {/* Info Card */}
          <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Shield className="w-5 h-5" />
                Proteção de Dados RGPD
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tem o direito de aceder, retificar e eliminar os seus dados pessoais. 
                Pode exportar uma cópia completa dos seus dados ou solicitar a eliminação da conta.
              </p>
            </CardContent>
          </Card>

          {/* Export Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Exportar Dados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Transfira um arquivo JSON com todas as suas informações, incluindo:
                perfil, histórico de participações, transações financeiras e configurações.
              </p>
              <Button onClick={handleExportData} disabled={exportLoading} className="w-full sm:w-auto">
                <Download className="w-4 h-4 mr-2" />
                {exportLoading ? "A gerar..." : "Exportar todos os dados"}
              </Button>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Eliminar Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-4 bg-destructive/5 rounded-lg border border-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Atenção: Ação irreversível</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    A eliminação da conta irá remover permanentemente todos os seus dados, incluindo:
                    histórico de participações, saldo, prémios e configurações. Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full sm:w-auto mt-4"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Solicitar Eliminação da Conta
                </Button>
              ) : (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Motivo da eliminação (opcional)</label>
                    <textarea
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="Ex: Não uso mais a plataforma, encontrei alternativa, etc."
                      className="w-full p-3 bg-surface-container-low border border-outline-variant/20 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      rows={3}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="destructive"
                      onClick={handleRequestDeletion}
                      disabled={deleteLoading}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deleteLoading ? "A processar..." : "Confirmar Pedido de Eliminação"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    Ao confirmar, a sua conta será desativada e os dados removidos no prazo de 48 horas conforme RGPD.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rights Info */}
          <Card className="border-outline-variant/20">
            <CardHeader>
              <CardTitle className="text-lg">Seus Direitos (RGPD)</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li><strong>Acesso:</strong> Pode solicitar uma cópia de todos os seus dados.</li>
                <li><strong>Retificação:</strong> Corrija informações inexatas no seu perfil.</li>
                <li><strong>Apagamento:</strong> Solicite a eliminação dos seus dados.</li>
                <li><strong>Limitação:</strong> Restrinja o tratamento dos seus dados.</li>
                <li><strong>Portabilidade:</strong> Receba seus dados em formato estruturado.</li>
                <li><strong>Oposição:</strong> Conteste o tratamento dos seus dados.</li>
              </ul>
              <p className="text-xs text-muted-foreground/60 mt-4">
                Para exercer qualquer direito ou esclarecer dúvidas, contacte-nos em:
                <a href="mailto:privacidade@aldeias.pt" className="text-primary hover:underline ml-1">privacidade@aldeias.pt</a>
              </p>
            </CardContent>
          </Card>
        </main>
        </div>
    </LayoutHeader>
  );
}
