"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, CreditCard, Phone, Building2, AlertTriangle, Check, Copy, Wallet, Info, ExternalLink, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { LayoutHeader } from "@/components/layout-header";
import { BottomNav } from "@/components/bottom-nav";

interface Aldeia {
  id: string;
  nome: string;
  slug: string;
  telefone?: string;
  email?: string;
  permitirStripe: boolean;
  permitirMBWay: boolean;
  metodosPagamentoDefault?: string;
  metodosPagamentoAceites?: string;
  iban?: string;
  nomeTitularConta?: string;
  avisoPagamentosEnviado: boolean;
}

interface MetodoPagamentoDefault {
  saldo: boolean;
  dinheiro: boolean;
  mbway: boolean;
  stripe: boolean;
  transferencia: boolean;
}

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [aldeia, setAldeia] = useState<Aldeia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ajudaModalOpen, setAjudaModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    permitirStripe: false,
    permitirMBWay: false,
    metodosPagamentoDefault: '["saldo","dinheiro"]',
    iban: "",
    nomeTitularConta: "",
  });

  const [metodosPagamentoAceites, setMetodosPagamentoAceites] = useState({
    dinheiro: true,
    saldo: true,
    mbway: true,
    stripe: true,
    transferencia: true,
    vendedor: true,
  });

  const [defaultMethods, setDefaultMethods] = useState<MetodoPagamentoDefault>({
    saldo: true,
    dinheiro: true,
    mbway: false,
    stripe: false,
    transferencia: false,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      if (userData.aldeiaId) {
        fetchAldeia(userData.aldeiaId);
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAldeia = async (aldeiaId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/aldeias/${aldeiaId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.data) {
        setAldeia(data.data);
        setFormData({
          permitirStripe: data.data.permitirStripe || false,
          permitirMBWay: data.data.permitirMBWay || false,
          metodosPagamentoDefault: data.data.metodosPagamentoDefault || '["saldo","dinheiro"]',
          iban: data.data.iban || "",
          nomeTitularConta: data.data.nomeTitularConta || "",
        });

        // Parse default methods
        try {
          const defaultArr = JSON.parse(data.data.metodosPagamentoDefault || '["saldo","dinheiro"]');
          setDefaultMethods({
            saldo: defaultArr.includes("saldo"),
            dinheiro: defaultArr.includes("dinheiro"),
            mbway: defaultArr.includes("mbway"),
            stripe: defaultArr.includes("stripe"),
            transferencia: defaultArr.includes("transferencia"),
          });
        } catch (e) {
          console.error("Erro ao parsear métodos padrão:", e);
        }

        // Parse metodosPagamentoAceites
        try {
          const aceitesArr = JSON.parse(data.data.metodosPagamentoAceites || '["dinheiro","saldo","mbway","stripe","transferencia","vendedor"]');
          setMetodosPagamentoAceites({
            dinheiro: aceitesArr.includes("dinheiro"),
            saldo: aceitesArr.includes("saldo"),
            mbway: aceitesArr.includes("mbway"),
            stripe: aceitesArr.includes("stripe"),
            transferencia: aceitesArr.includes("transferencia"),
            vendedor: aceitesArr.includes("vendedor"),
          });
        } catch (e) {
          console.error("Erro ao parsear métodos aceites:", e);
        }
      } else {
        throw new Error("Dados da aldeia não encontrados");
      }
    } catch (error) {
      console.error("Erro ao buscar aldeia:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!aldeia) return;
    
    // Build the default methods array from toggle states
    const defaultMethodsArr: string[] = [];
    if (defaultMethods.saldo) defaultMethodsArr.push("saldo");
    if (defaultMethods.dinheiro) defaultMethodsArr.push("dinheiro");
    if (defaultMethods.mbway) defaultMethodsArr.push("mbway");
    if (defaultMethods.stripe) defaultMethodsArr.push("stripe");
    if (defaultMethods.transferencia) defaultMethodsArr.push("transferencia");
    
    if (defaultMethodsArr.length === 0) {
      defaultMethodsArr.push("saldo", "dinheiro");
    }

    // Build the aceites methods array from toggle states
    const aceitesArr: string[] = [];
    if (metodosPagamentoAceites.dinheiro) aceitesArr.push("dinheiro");
    if (metodosPagamentoAceites.saldo) aceitesArr.push("saldo");
    if (metodosPagamentoAceites.mbway) aceitesArr.push("mbway");
    if (metodosPagamentoAceites.stripe) aceitesArr.push("stripe");
    if (metodosPagamentoAceites.transferencia) aceitesArr.push("transferencia");
    if (metodosPagamentoAceites.vendedor) aceitesArr.push("vendedor");

    if (aceitesArr.length === 0) {
      aceitesArr.push("dinheiro", "saldo");
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/aldeias/${aldeia.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          permitirStripe: formData.permitirStripe,
          permitirMBWay: formData.permitirMBWay,
          metodosPagamentoDefault: JSON.stringify(defaultMethodsArr),
          metodosPagamentoAceites: JSON.stringify(aceitesArr),
          iban: formData.iban || null,
          nomeTitularConta: formData.nomeTitularConta || null,
        }),
      });

      if (response.ok) {
        toast.success("Configurações guardadas com sucesso!");
        setFormData(prev => ({ ...prev, metodosPagamentoDefault: JSON.stringify(defaultMethodsArr) }));
        setAldeia({ ...aldeia, ...formData });
      } else {
        toast.error("Erro ao guardar configurações");
      }
    } catch (error) {
      console.error("Erro ao guardar:", error);
      toast.error("Erro ao guardar configurações");
    } finally {
      setSaving(false);
    }
  };

  const copiarIBAN = () => {
    if (formData.iban) {
      navigator.clipboard.writeText(formData.iban);
      toast.success("IBAN copiado!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-primary">A carregar...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500">Erro ao carregar configurações</div>
          <div className="text-sm text-muted-foreground">{error}</div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!aldeia) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500">Aldeia não encontrada</div>
          <Button onClick={() => router.push('/')} variant="outline">
            Voltar ao início
          </Button>
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
          <button
            onClick={() => setAjudaModalOpen(true)}
            className="mt-3 text-xs text-secondary flex items-center gap-1 hover:underline"
          >
            <Info className="w-3 h-3" />
            Ver tutorial completo
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10">
          <h3 className="font-serif text-accent font-bold mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Métodos Ativos
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💵</span>
                </div>
                <div>
                  <p className="font-medium text-accent">Dinheiro</p>
                  <p className="text-xs text-muted-foreground/60">Sempre disponível</p>
                </div>
              </div>
              <Check className="w-5 h-5 text-primary" />
            </div>

            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
                <div>
                  <p className="font-medium text-accent">Saldo Aldeias</p>
                  <p className="text-xs text-muted-foreground/60">Sem custos</p>
                </div>
              </div>
              <Check className="w-5 h-5 text-primary" />
            </div>

            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-accent">Stripe (Cartão)</p>
                  <p className="text-xs text-muted-foreground/60">1.5% + €0.25 por transação</p>
                </div>
              </div>
              <button
                onClick={() => setFormData({ ...formData, permitirStripe: !formData.permitirStripe })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  formData.permitirStripe ? "bg-primary" : "bg-muted"
                }`}
              >
                <div className={`w-5 h-5 bg-foreground rounded-full transition-transform ${
                  formData.permitirStripe ? "translate-x-6" : "translate-x-0.5"
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-accent">MBWay</p>
                  <p className="text-xs text-muted-foreground/60">~1-2% por transação</p>
                </div>
              </div>
              <button
                onClick={() => setFormData({ ...formData, permitirMBWay: !formData.permitirMBWay })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  formData.permitirMBWay ? "bg-primary" : "bg-muted"
                }`}
              >
                <div className={`w-5 h-5 bg-foreground rounded-full transition-transform ${
                  formData.permitirMBWay ? "translate-x-6" : "translate-x-0.5"
                }`} />
              </button>
            </div>
          </div>

          <div className="mt-6 border-t border-outline-variant/20 pt-6">
            <h3 className="font-serif text-accent font-bold mb-2 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Métodos de Pagamento Aceites
            </h3>
            <p className="text-xs text-muted-foreground/60 mb-4">
              Configure quais métodos de pagamento estão disponíveis em toda a aldeia (carregamento, jogos, etc). Métodos desativados não serão apresentados a nenhum utilizador.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <span className="text-xl">💵</span>
                  </div>
                  <div>
                    <p className="font-medium text-accent">Dinheiro</p>
                    <p className="text-xs text-muted-foreground/60">Pagamento presencial</p>
                  </div>
                </div>
                <button
                  onClick={() => setMetodosPagamentoAceites({ ...metodosPagamentoAceites, dinheiro: !metodosPagamentoAceites.dinheiro })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    metodosPagamentoAceites.dinheiro ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div className={`w-5 h-5 bg-foreground rounded-full transition-transform ${
                    metodosPagamentoAceites.dinheiro ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <span className="text-xl">💰</span>
                  </div>
                  <div>
                    <p className="font-medium text-accent">Saldo Aldeias</p>
                    <p className="text-xs text-muted-foreground/60">Carteira digital</p>
                  </div>
                </div>
                <button
                  onClick={() => setMetodosPagamentoAceites({ ...metodosPagamentoAceites, saldo: !metodosPagamentoAceites.saldo })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    metodosPagamentoAceites.saldo ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div className={`w-5 h-5 bg-foreground rounded-full transition-transform ${
                    metodosPagamentoAceites.saldo ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-accent">MBWay</p>
                    <p className="text-xs text-muted-foreground/60">Pagamento via telemóvel</p>
                  </div>
                </div>
                <button
                  onClick={() => setMetodosPagamentoAceites({ ...metodosPagamentoAceites, mbway: !metodosPagamentoAceites.mbway })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    metodosPagamentoAceites.mbway ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div className={`w-5 h-5 bg-foreground rounded-full transition-transform ${
                    metodosPagamentoAceites.mbway ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-accent">Stripe (Cartão)</p>
                    <p className="text-xs text-muted-foreground/60">Cartão de crédito/débito</p>
                  </div>
                </div>
                <button
                  onClick={() => setMetodosPagamentoAceites({ ...metodosPagamentoAceites, stripe: !metodosPagamentoAceites.stripe })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    metodosPagamentoAceites.stripe ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div className={`w-5 h-5 bg-foreground rounded-full transition-transform ${
                    metodosPagamentoAceites.stripe ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-accent">Transferência Bancária</p>
                    <p className="text-xs text-muted-foreground/60">Transferência IBAN</p>
                  </div>
                </div>
                <button
                  onClick={() => setMetodosPagamentoAceites({ ...metodosPagamentoAceites, transferencia: !metodosPagamentoAceites.transferencia })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    metodosPagamentoAceites.transferencia ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div className={`w-5 h-5 bg-foreground rounded-full transition-transform ${
                    metodosPagamentoAceites.transferencia ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-accent">Vendedor (Carregamento)</p>
                    <p className="text-xs text-muted-foreground/60">Carregamento presencial com vendedor</p>
                  </div>
                </div>
                <button
                  onClick={() => setMetodosPagamentoAceites({ ...metodosPagamentoAceites, vendedor: !metodosPagamentoAceites.vendedor })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    metodosPagamentoAceites.vendedor ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div className={`w-5 h-5 bg-foreground rounded-full transition-transform ${
                    metodosPagamentoAceites.vendedor ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
            </div>

            <div className="mt-3 p-3 bg-accent/10 border border-accent/20 rounded-xl">
              <p className="text-xs text-accent flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <strong>Importante:</strong> Métodos desativados não serão apresentados a nenhum utilizador na aldeia, incluindo carregamento de saldo e pagamento de jogos.
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-outline-variant/20 pt-6">
            <h3 className="font-serif text-accent font-bold mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Predefinição para Novos Jogos
            </h3>
            <p className="text-xs text-muted-foreground/60 mb-4">
              Escolha quais métodos de pagamento vêm pré-selecionados ao criar um novo jogo.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <span className="text-xl">💵</span>
                  </div>
                  <div>
                    <p className="font-medium text-accent">Dinheiro</p>
                    <p className="text-xs text-muted-foreground/60">Sempre disponível</p>
                  </div>
                </div>
                <button
                  onClick={() => setDefaultMethods({ ...defaultMethods, dinheiro: !defaultMethods.dinheiro })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    defaultMethods.dinheiro ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div className={`w-5 h-5 bg-foreground rounded-full transition-transform ${
                    defaultMethods.dinheiro ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <span className="text-xl">💰</span>
                  </div>
                  <div>
                    <p className="font-medium text-accent">Saldo Aldeias</p>
                    <p className="text-xs text-muted-foreground/60">Sem custos</p>
                  </div>
                </div>
                <button
                  onClick={() => setDefaultMethods({ ...defaultMethods, saldo: !defaultMethods.saldo })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    defaultMethods.saldo ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div className={`w-5 h-5 bg-foreground rounded-full transition-transform ${
                    defaultMethods.saldo ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>

              {formData.permitirStripe && (
                <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-accent">Cartão (Stripe)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDefaultMethods({ ...defaultMethods, stripe: !defaultMethods.stripe })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      defaultMethods.stripe ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <div className={`w-5 h-5 bg-foreground rounded-full transition-transform ${
                      defaultMethods.stripe ? "translate-x-6" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              )}

              {formData.permitirMBWay && (
                <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-accent">MBWay</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDefaultMethods({ ...defaultMethods, mbway: !defaultMethods.mbway })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      defaultMethods.mbway ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <div className={`w-5 h-5 bg-foreground rounded-full transition-transform ${
                      defaultMethods.mbway ? "translate-x-6" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-accent">Transferência</p>
                  </div>
                </div>
                <button
                  onClick={() => setDefaultMethods({ ...defaultMethods, transferencia: !defaultMethods.transferencia })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    defaultMethods.transferencia ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <div className={`w-5 h-5 bg-foreground rounded-full transition-transform ${
                    defaultMethods.transferencia ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {(formData.permitirStripe || formData.permitirMBWay) && (
            <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-xl space-y-2">
              <p className="text-xs text-accent flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <strong>Aviso:</strong> Ao ativar estes métodos, terão custos por transação.
              </p>
              {formData.permitirStripe && (
                <p className="text-xs text-accent/80 pl-6">
                  • Stripe: ~2.9% + €0.30 por transação
                </p>
              )}
              {formData.permitirMBWay && (
                <p className="text-xs text-accent/80 pl-6">
                  • MBWay: ~1.5% + €0.25 por transação
                </p>
              )}
              <p className="text-xs text-primary pl-6 pt-1">
                💡 Recomendamos Dinheiro e Saldo Aldeias para maximizar receitas (sem comissões).
              </p>
            </div>
          )}
        </div>

        <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10">
          <h3 className="font-serif text-accent font-bold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Dados para Transferência
          </h3>

          <p className="text-xs text-muted-foreground/60 mb-4">
            Estes dados serão mostrados aos clientes que quiserem fazer transferência bancária.
          </p>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Nome do Titular da Conta</Label>
              <Input
                value={formData.nomeTitularConta}
                onChange={(e) => setFormData({ ...formData, nomeTitularConta: e.target.value })}
                placeholder="Ex: Junta de Freguesia de Vila Verde"
                className="bg-surface-container-low border-outline-variant/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">IBAN</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                  placeholder="PT50 0000 0000 0000 0000 00"
                  className="bg-surface-container-low border-outline-variant/20 font-mono"
                />
                 {formData.iban && (
                   <button
                     onClick={copiarIBAN}
                     className="p-3 bg-surface-container-low rounded-lg hover:bg-muted/30"
                   >
                     <Copy className="w-5 h-5 text-primary" />
                   </button>
                 )}
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-6 bg-primary text-primary-foreground font-bold rounded-xl"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? "A guardar..." : "Guardar Configurações"}
        </Button>
      </main>

      <BottomNav role={user?.role} />

      <Dialog open={ajudaModalOpen} onOpenChange={setAjudaModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-surface-container border border-primary/10">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-accent">Tutorial: Métodos de Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <section>
              <h3 className="font-bold text-accent mb-2">1. Dinheiro (Grátis ✅)</h3>
              <p className="text-sm text-muted-foreground">
                O vendedor recebe dinheiro vivo e carrega o saldo na app. Tudo fica registado automaticamente.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-accent mb-2">2. Saldo Aldeias (Grátis ✅)</h3>
              <p className="text-sm text-muted-foreground">
                Os jogadores podem ter saldo na plataforma. Os vendedores carregam saldo quando recebem pagamento.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-accent mb-2">3. Transferência Bancária</h3>
              <p className="text-sm text-muted-foreground">
                Configure os dados bancários acima. O cliente faz a transferência e o vendedor confirma o recebimento.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-primary mb-2">4. Stripe (1.5% + €0.25)</h3>
              <p className="text-sm text-muted-foreground">
                Permite pagamentos com cartão de crédito/débito. Para ativar:
              </p>
              <ul className="text-sm text-muted-foreground/80 mt-2 space-y-1 ml-4">
                <li>1. Criar conta em <strong>stripe.com/pt</strong></li>
                <li>2. Obter as chaves API (Publishable e Secret)</li>
                <li>3. Ativar no admin da aldeia</li>
                <li>4. Configurar no ficheiro .env do servidor</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-primary mb-2">5. MBWay (~1-2%)</h3>
              <p className="text-sm text-muted-foreground">
                Pagamento via telemóvel. Para ativar:
              </p>
              <ul className="text-sm text-muted-foreground/80 mt-2 space-y-1 ml-4">
                <li>1. Registar em <strong>lemonway.com</strong> ou <strong>paybyrd.com</strong></li>
                <li>2. Completar verificação de identidade</li>
                <li>3. Obter credenciais API</li>
                <li>4. Ativar no admin da aldeia</li>
              </ul>
            </section>

            <section className="bg-accent/10 border border-accent/20 rounded-xl p-4">
              <h3 className="font-bold text-accent mb-2">💡 Recomendação</h3>
              <p className="text-sm text-muted-foreground">
                Para maximizar a angariação de fundos, use principalmente <strong>Dinheiro</strong> e <strong>Saldo</strong> 
                (sem custos). Ative Stripe/MBWay apenas se clientes insistirem, pois as comissões reduzem os fundos angariados.
              </p>
             </section>

             <Button onClick={() => setAjudaModalOpen(false)} className="w-full">
               Entendi
             </Button>
           </div>
         </DialogContent>
       </Dialog>
       </div>
    </LayoutHeader>
  );
}
