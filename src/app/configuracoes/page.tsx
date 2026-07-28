"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Building2, Info, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LayoutHeader } from "@/components/layout-header";
import { BottomNav } from "@/components/bottom-nav";
import { useConfiguracoes } from "./use-configuracoes";
import { PagamentoSections } from "./pagamento-sections";
import { TransferenciaSection } from "./transferencia-section";
import { AjudaTutorialDialog } from "./ajuda-tutorial-dialog";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const {
    aldeia, loading, error, saving, ajudaModalOpen, setAjudaModalOpen,
    formData, setFormData, metodosPagamentoAceites, setMetodosPagamentoAceites,
    defaultMethods, setDefaultMethods,
    handleSave, copiarIBAN,
  } = useConfiguracoes(authUser, authLoading);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-primary">A carregar...</div>
      </div>
    );
  }

  if (error === "super_admin") {
    return (
      <LayoutHeader>
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-semibold">Configurações de Aldeia</h2>
            <p className="text-muted-foreground max-w-sm">
              Como super admin, deve configurar cada aldeia individualmente a partir do painel de administração.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push('/superadmindashboard')} variant="outline">Ir para o Painel</Button>
              <Button onClick={() => router.push('/aldeias')}><Building2 className="h-4 w-4 mr-2" />Gerir Aldeias</Button>
            </div>
          </div>
        </div>
      </LayoutHeader>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500">Erro ao carregar configurações</div>
          <div className="text-sm text-muted-foreground">{error}</div>
          <Button onClick={() => window.location.reload()} variant="outline">Tentar novamente</Button>
        </div>
      </div>
    );
  }

  if (!aldeia) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500">Aldeia não encontrada</div>
          <Button onClick={() => router.push('/')} variant="outline">Voltar ao início</Button>
        </div>
      </div>
    );
  }

  return (
    <LayoutHeader>
      <div className="min-h-screen bg-background text-foreground font-body">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-primary/10 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-surface-container-low rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-primary" />
            </button>
            <h1 className="font-serif text-xl tracking-wide text-accent font-bold italic">As Minhas Configurações</h1>
          </div>
        </header>

        <main className="px-4 pt-6 space-y-6 pb-24">
          <div className="bg-gradient-to-r from-primary/20 to-transparent rounded-2xl p-4 border border-primary/10">
            <h2 className="font-serif text-lg text-accent mb-2">Métodos de Pagamento</h2>
            <p className="text-sm text-muted-foreground">
              Configure os métodos de pagamento disponíveis para a sua aldeia/organização.
            </p>
            <button onClick={() => setAjudaModalOpen(true)} className="mt-3 text-xs text-secondary flex items-center gap-1 hover:underline">
              <Info className="w-3 h-3" />Ver tutorial completo<ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <PagamentoSections
            formData={formData}
            setFormData={setFormData}
            metodosPagamentoAceites={metodosPagamentoAceites}
            setMetodosPagamentoAceites={setMetodosPagamentoAceites}
            defaultMethods={defaultMethods}
            setDefaultMethods={setDefaultMethods}
          />

          <TransferenciaSection
            formData={formData}
            setFormData={setFormData}
            copiarIBAN={copiarIBAN}
          />

          <Button onClick={handleSave} disabled={saving}
            className="w-full py-6 bg-primary text-primary-foreground font-bold rounded-xl">
            <Save className="w-5 h-5 mr-2" />{saving ? "A guardar..." : "Guardar Configurações"}
          </Button>
        </main>

        <BottomNav role={authUser?.role as string | undefined} />

        <AjudaTutorialDialog open={ajudaModalOpen} onOpenChange={setAjudaModalOpen} />
      </div>
    </LayoutHeader>
  );
}
