"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, CreditCard, Phone, Building2, AlertTriangle, Check, Copy, Wallet, Info, ExternalLink } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserMenuButton } from "@/components/user-menu-button";

interface Aldeia {
  id: string;
  nome: string;
  slug: string;
  telefone?: string;
  email?: string;
  permitirStripe: boolean;
  permitirMBWay: boolean;
  iban?: string;
  nomeTitularConta?: string;
  avisoPagamentosEnviado: boolean;
}

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [aldeia, setAldeia] = useState<Aldeia | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ajudaModalOpen, setAjudaModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    permitirStripe: false,
    permitirMBWay: false,
    iban: "",
    nomeTitularConta: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      if (userData.aldeiaId) {
        fetchAldeia(userData.aldeiaId);
      }
    }
  }, []);

  const fetchAldeia = async (aldeiaId: string) => {
    try {
      const response = await fetch(`/api/aldeias/${aldeiaId}`);
      const data = await response.json();
      if (data.data) {
        setAldeia(data.data);
        setFormData({
          permitirStripe: data.data.permitirStripe || false,
          permitirMBWay: data.data.permitirMBWay || false,
          iban: data.data.iban || "",
          nomeTitularConta: data.data.nomeTitularConta || "",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar aldeia:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!aldeia) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/aldeias/${aldeia.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          permitirStripe: formData.permitirStripe,
          permitirMBWay: formData.permitirMBWay,
          iban: formData.iban || null,
          nomeTitularConta: formData.nomeTitularConta || null,
        }),
      });

      if (response.ok) {
        toast.success("Configurações guardadas com sucesso!");
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
      <div className="min-h-screen bg-[#110d0c] text-[#eae0de] flex items-center justify-center">
        <div className="text-[#ff734b]">A carregar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#110d0c] text-[#eae0de] font-body">
      <header className="sticky top-0 z-50 bg-[#110d0c]/95 backdrop-blur-xl border-b border-[#ff734b]/10 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-[#2e2928] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#ff734b]" />
          </button>
          <h1 className="font-serif text-xl tracking-wide text-[#ffb5a0] font-bold italic">Configurações</h1>
        </div>
        <UserMenuButton />
      </header>

      <main className="px-4 pt-6 space-y-6 pb-24">
        <div className="bg-gradient-to-r from-[#ff734b]/20 to-transparent rounded-2xl p-4 border border-[#ff734b]/10">
          <h2 className="font-serif text-lg text-[#ffb5a0] mb-2">Métodos de Pagamento</h2>
          <p className="text-sm text-[#e0bfb7]">
            Configure os métodos de pagamento disponíveis para a sua aldeia/organização.
          </p>
          <button
            onClick={() => setAjudaModalOpen(true)}
            className="mt-3 text-xs text-[#9cefff] flex items-center gap-1 hover:underline"
          >
            <Info className="w-3 h-3" />
            Ver tutorial completo
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="bg-[#1f1b19] rounded-2xl p-4 border border-[#58413b]/10">
          <h3 className="font-serif text-[#ffb5a0] font-bold mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Métodos Ativos
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#2e2928] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💵</span>
                </div>
                <div>
                  <p className="font-medium text-[#ffb5a0]">Dinheiro</p>
                  <p className="text-xs text-[#e0bfb7]/60">Sempre disponível</p>
                </div>
              </div>
              <Check className="w-5 h-5 text-green-500" />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#2e2928] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#ff734b]/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
                <div>
                  <p className="font-medium text-[#ffb5a0]">Saldo Aldeias</p>
                  <p className="text-xs text-[#e0bfb7]/60">Sem custos</p>
                </div>
              </div>
              <Check className="w-5 h-5 text-green-500" />
            </div>

            <div className="flex items-center justify-between p-3 bg-[#2e2928] rounded-xl border border-[#58413b]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-[#ffb5a0]">Stripe (Cartão)</p>
                  <p className="text-xs text-[#e0bfb7]/60">1.5% + €0.25 por transação</p>
                </div>
              </div>
              <button
                onClick={() => setFormData({ ...formData, permitirStripe: !formData.permitirStripe })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  formData.permitirStripe ? "bg-green-500" : "bg-[#58413b]"
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  formData.permitirStripe ? "translate-x-6" : "translate-x-0.5"
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#2e2928] rounded-xl border border-[#58413b]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-[#ffb5a0]">MBWay</p>
                  <p className="text-xs text-[#e0bfb7]/60">~1-2% por transação</p>
                </div>
              </div>
              <button
                onClick={() => setFormData({ ...formData, permitirMBWay: !formData.permitirMBWay })}
                className={`w-12 h-6 rounded-full transition-colors ${
                  formData.permitirMBWay ? "bg-green-500" : "bg-[#58413b]"
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  formData.permitirMBWay ? "translate-x-6" : "translate-x-0.5"
                }`} />
              </button>
            </div>
          </div>

          {(formData.permitirStripe || formData.permitirMBWay) && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-xs text-yellow-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <strong>Aviso:</strong> Ao ativar estes métodos,会有 custos por transação que serão deduzidos automaticamente.
              </p>
            </div>
          )}
        </div>

        <div className="bg-[#1f1b19] rounded-2xl p-4 border border-[#58413b]/10">
          <h3 className="font-serif text-[#ffb5a0] font-bold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Dados para Transferência
          </h3>

          <p className="text-xs text-[#e0bfb7]/60 mb-4">
            Estes dados serão mostrados aos clientes que quiserem fazer transferência bancária.
          </p>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs text-[#e0bfb7]">Nome do Titular da Conta</Label>
              <Input
                value={formData.nomeTitularConta}
                onChange={(e) => setFormData({ ...formData, nomeTitularConta: e.target.value })}
                placeholder="Ex: Junta de Freguesia de Vila Verde"
                className="bg-[#2e2928] border-[#58413b]/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-[#e0bfb7]">IBAN</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                  placeholder="PT50 0000 0000 0000 0000 00"
                  className="bg-[#2e2928] border-[#58413b]/20 font-mono"
                />
                {formData.iban && (
                  <button
                    onClick={copiarIBAN}
                    className="p-2 bg-[#2e2928] rounded-lg hover:bg-[#58413b]/30"
                  >
                    <Copy className="w-5 h-5 text-[#ff734b]" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-6 bg-[#ff734b] text-[#110d0c] font-bold rounded-xl"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? "A guardar..." : "Guardar Configurações"}
        </Button>
      </main>

      <BottomNav />

      <Dialog open={ajudaModalOpen} onOpenChange={setAjudaModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-[#1f1b19] border border-[#ff734b]/10">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-[#ffb5a0]">Tutorial: Métodos de Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <section>
              <h3 className="font-bold text-[#ffb5a0] mb-2">1. Dinheiro (Grátis ✅)</h3>
              <p className="text-sm text-[#e0bfb7]">
                O vendedor recebe dinheiro vivo e carrega o saldo na app. Tudo fica registado automaticamente.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-[#ffb5a0] mb-2">2. Saldo Aldeias (Grátis ✅)</h3>
              <p className="text-sm text-[#e0bfb7]">
                Os jogadores podem ter saldo na plataforma. Os vendedores carregam saldo quando recebem pagamento.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-[#ffb5a0] mb-2">3. Transferência Bancária</h3>
              <p className="text-sm text-[#e0bfb7]">
                Configure os dados bancários acima. O cliente faz a transferência e o vendedor confirma o recebimento.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-blue-400 mb-2">4. Stripe (1.5% + €0.25)</h3>
              <p className="text-sm text-[#e0bfb7]">
                Permite pagamentos com cartão de crédito/débito. Para ativar:
              </p>
              <ul className="text-sm text-[#e0bfb7]/80 mt-2 space-y-1 ml-4">
                <li>1. Criar conta em <strong>stripe.com/pt</strong></li>
                <li>2. Obter as chaves API (Publishable e Secret)</li>
                <li>3. Ativar no admin da aldeia</li>
                <li>4. Configurar no ficheiro .env do servidor</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-purple-400 mb-2">5. MBWay (~1-2%)</h3>
              <p className="text-sm text-[#e0bfb7]">
                Pagamento via telemóvel. Para ativar:
              </p>
              <ul className="text-sm text-[#e0bfb7]/80 mt-2 space-y-1 ml-4">
                <li>1. Registar em <strong>lemonway.com</strong> ou <strong>paybyrd.com</strong></li>
                <li>2. Completar verificação de identidade</li>
                <li>3. Obter credenciais API</li>
                <li>4. Ativar no admin da aldeia</li>
              </ul>
            </section>

            <section className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <h3 className="font-bold text-yellow-500 mb-2">💡 Recomendação</h3>
              <p className="text-sm text-[#e0bfb7]">
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
  );
}
