"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Plus, 
  CreditCard, 
  Smartphone, 
  ArrowRight,
  Check,
  Loader2,
  Info,
  Sparkles,
  Banknote
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface WalletBalanceProps {
  token: string;
  className?: string;
  showAddButton?: boolean;
  compact?: boolean;
}

interface Transaction {
  id: string;
  valor: number;
  tipo: string;
  descricao?: string;
  createdAt: string;
}

export function WalletBalance({ token, className = "", showAddButton = true, compact = false }: WalletBalanceProps) {
  const [saldo, setSaldo] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addBalanceOpen, setAddBalanceOpen] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, [token]);

  const fetchWallet = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSaldo(data.saldo || 0);
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-[#1f1b19] to-[#2e2928] rounded-2xl p-4 border border-[#ff734b]/20 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 w-20 bg-[#2e2928] rounded mb-2" />
          <div className="h-8 w-24 bg-[#2e2928] rounded" />
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="p-2 bg-[#ff734b]/20 rounded-xl">
          <Wallet className="h-5 w-5 text-[#ff734b]" />
        </div>
        <div>
          <p className="text-xs text-[#e0bfb7]">Saldo</p>
          <p className="font-bold text-white">{formatCurrency(saldo)}</p>
        </div>
        {showAddButton && (
          <button
            onClick={() => setAddBalanceOpen(true)}
            className="ml-auto p-2 bg-[#ff734b] rounded-xl hover:bg-[#ff734b]/90 transition-colors"
          >
            <Plus className="h-4 w-4 text-[#110d0c]" />
          </button>
        )}
        <AddBalanceModal
          open={addBalanceOpen}
          onOpenChange={setAddBalanceOpen}
          onSuccess={() => {
            fetchWallet();
            setAddBalanceOpen(false);
          }}
          token={token}
        />
      </div>
    );
  }

  return (
    <>
      <div className={`bg-gradient-to-br from-[#1f1b19] to-[#2e2928] rounded-2xl p-5 border border-[#ff734b]/20 relative overflow-hidden ${className}`}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff734b]/10 rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#ff734b]/20 rounded-xl">
                <Wallet className="h-5 w-5 text-[#ff734b]" />
              </div>
              <span className="text-sm text-[#e0bfb7]">Saldo Aldeias</span>
            </div>
            <Badge variant="outline" className="bg-[#ff734b]/10 text-[#9cefff] border-[#9cefff]/30">
              <Sparkles className="h-3 w-3 mr-1" />
              5% Cashback
            </Badge>
          </div>
          
          <p className="text-3xl font-bold text-white mb-1 font-serif italic">
            {formatCurrency(saldo)}
          </p>
          
          <p className="text-xs text-[#e0bfb7]/60 mb-4">
            Cashback de 5% em todas as compras
          </p>
          
          {showAddButton && (
            <Button
              onClick={() => setAddBalanceOpen(true)}
              className="w-full bg-[#ff734b] hover:bg-[#ff734b]/90 text-[#110d0c] font-bold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Saldo
            </Button>
          )}
        </div>
      </div>

      <AddBalanceModal
        open={addBalanceOpen}
        onOpenChange={setAddBalanceOpen}
        onSuccess={() => {
          fetchWallet();
          setAddBalanceOpen(false);
        }}
        token={token}
      />
    </>
  );
}

interface AddBalanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  token: string;
}

export function AddBalanceModal({ open, onOpenChange, onSuccess, token }: AddBalanceModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"amount" | "method" | "processing" | "success">("amount");
  const [selectedMethod, setSelectedMethod] = useState<"mbway" | "stripe" | "transferencia">("mbway");

  const quickAmounts = [5, 10, 20, 50];

  const handleQuickSelect = (value: number) => {
    setAmount(value.toString());
  };

  const handleContinue = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 1) {
      toast.error("Valor mínimo de €1");
      return;
    }
    setStep("method");
  };

  const handlePayment = async () => {
    setLoading(true);
    setStep("processing");

    try {
      if (selectedMethod === "stripe") {
        const res = await fetch("/api/pagamentos/stripe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            valor: parseFloat(amount),
            descricao: "Carregamento de saldo",
            metadata: { tipo: "carregamento_saldo" },
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Erro ao processar pagamento");
          setStep("method");
          setLoading(false);
          return;
        }

        if (data.data?.url) {
          window.location.href = data.data.url;
          return;
        }

        toast.error("Erro: URL de pagamento não disponível");
        setStep("method");
      } else if (selectedMethod === "mbway") {
        // Obter telefone do utilizador logado
        let telefone = "";
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const userData = JSON.parse(userStr);
            telefone = userData.telefone || "";
          }
        } catch (e) {
          console.error("Erro ao obter dados do utilizador:", e);
        }

        if (!telefone) {
          toast.error("Precisa de ter um telefone associado à sua conta para MBWay");
          setStep("method");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/pagamentos/mbway", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            telefone: telefone,
            valor: parseFloat(amount),
            descricao: "Carregamento de saldo",
            tipo: "carregamento_saldo",
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Erro ao processar pagamento");
          setStep("method");
          setLoading(false);
          return;
        }

        toast.success("Pagamento MBWay enviado! Confirme no seu telemóvel.");
        setStep("method");
      } else {
        // For dinheiro/transferencia, use the wallet API directly
        const res = await fetch("/api/wallet/carregar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            valor: parseFloat(amount),
            metodoPagamento: selectedMethod,
          }),
        });

        if (res.ok) {
          setStep("success");
          setTimeout(() => {
            onSuccess();
            setStep("amount");
            setAmount("");
          }, 2000);
        } else {
          const data = await res.json();
          toast.error(data.error || "Erro ao processar pagamento");
          setStep("method");
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Erro ao processar pagamento");
      setStep("method");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case "amount":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Adicionar Saldo</h3>
              <p className="text-sm text-[#e0bfb7]">
                Escolhe o valor que pretendes adicionar à tua carteira
              </p>
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((value) => (
                <button
                  key={value}
                  onClick={() => handleQuickSelect(value)}
                  className={`py-3 rounded-xl font-bold transition-all ${
                    amount === value.toString()
                      ? "bg-[#ff734b] text-[#110d0c]"
                      : "bg-[#2e2928] text-white hover:bg-[#58413b]/30"
                  }`}
                >
                  €{value}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-xs text-[#e0bfb7] uppercase tracking-wider">
                Ou introduce um valor
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff734b] font-bold text-xl">
                  €
                </span>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-10 bg-[#2e2928] border-[#58413b]/30 text-white text-xl font-bold text-center"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex items-start gap-3 p-3 bg-[#9cefff]/10 rounded-xl">
              <Info className="h-4 w-4 text-[#9cefff] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[#9cefff]">
                Recebes 5% de cashback em todas as compras. O saldo nunca expira.
              </p>
            </div>

            <Button
              onClick={handleContinue}
              disabled={!amount || parseFloat(amount) < 1}
              className="w-full bg-[#ff734b] hover:bg-[#ff734b]/90 text-[#110d0c] font-bold"
            >
              Continuar
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        );

      case "method":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Método de Pagamento</h3>
              <p className="text-sm text-[#e0bfb7]">
                Escolhe como pretendes pagar {formatCurrency(parseFloat(amount) || 0)}
              </p>
            </div>

            <div className="space-y-3">
              <PaymentMethodOption
                icon={Smartphone}
                title="MBWay"
                description="Pagamento instantâneo via telemóvel"
                selected={selectedMethod === "mbway"}
                onClick={() => setSelectedMethod("mbway")}
              />
              <PaymentMethodOption
                icon={CreditCard}
                title="Cartão de Crédito/Débito"
                description="Visa, Mastercard, American Express"
                selected={selectedMethod === "stripe"}
                onClick={() => setSelectedMethod("stripe")}
              />
              <PaymentMethodOption
                icon={Banknote}
                title="Transferência Bancária"
                description="Processamento em 1-2 dias úteis"
                selected={selectedMethod === "transferencia"}
                onClick={() => setSelectedMethod("transferencia")}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("amount")}
                className="flex-1 border-[#ff734b]/30 text-[#ff734b]"
              >
                Voltar
              </Button>
              <Button
                onClick={handlePayment}
                className="flex-1 bg-[#ff734b] hover:bg-[#ff734b]/90 text-[#110d0c] font-bold"
              >
                Pagar {formatCurrency(parseFloat(amount) || 0)}
              </Button>
            </div>
          </div>
        );

      case "processing":
        return (
          <div className="py-8 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mx-auto mb-6 w-16 h-16"
            >
              <Loader2 className="w-16 h-16 text-[#ff734b]" />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">A processar pagamento...</h3>
            <p className="text-sm text-[#e0bfb7]">
              Por favor espera, não feches esta janela
            </p>
          </div>
        );

      case "success":
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10 }}
              className="mx-auto mb-6 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center"
            >
              <Check className="w-8 h-8 text-green-500" />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">Pagamento concluído!</h3>
            <p className="text-sm text-[#e0bfb7]">
              O saldo foi adicionado à tua carteira
            </p>
          </motion.div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1f1b19] border-[#ff734b]/20 p-0 overflow-hidden max-w-md">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="sr-only">Adicionar Saldo</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}

interface PaymentMethodOptionProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

function PaymentMethodOption({ icon: Icon, title, description, selected, onClick }: PaymentMethodOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
        selected
          ? "bg-[#ff734b]/20 border-2 border-[#ff734b]"
          : "bg-[#2e2928] border-2 border-transparent hover:border-[#ff734b]/30"
      }`}
    >
      <div className={`p-3 rounded-xl ${selected ? "bg-[#ff734b]" : "bg-[#58413b]"}`}>
        <Icon className={`h-5 w-5 ${selected ? "text-[#110d0c]" : "text-[#ff734b]"}`} />
      </div>
      <div className="text-left flex-1">
        <p className="font-bold text-white">{title}</p>
        <p className="text-xs text-[#e0bfb7]">{description}</p>
      </div>
      {selected && (
        <div className="w-6 h-6 bg-[#ff734b] rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-[#110d0c]" />
        </div>
      )}
    </button>
  );
}

// Wallet history component
export function WalletHistory({ token }: { token: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transacoes || []);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (tipo: string) => {
    switch (tipo) {
      case "cashback":
        return <Sparkles className="h-4 w-4 text-[#9cefff]" />;
      case "deposito":
      case "carregamento_saldo":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "pagamento_jogo":
        return <CreditCard className="h-4 w-4 text-red-500" />;
      case "premio_dinheiro":
        return <Wallet className="h-4 w-4 text-[#ff734b]" />;
      default:
        return <CreditCard className="h-4 w-4 text-[#e0bfb7]" />;
    }
  };

  const getTransactionColor = (tipo: string) => {
    switch (tipo) {
      case "cashback":
      case "deposito":
      case "carregamento_saldo":
      case "premio_dinheiro":
        return "text-green-500";
      case "pagamento_jogo":
      case "levantamento":
        return "text-red-500";
      default:
        return "text-white";
    }
  };

  if (loading) {
    return <div className="animate-pulse h-48 bg-[#1f1b19] rounded-xl" />;
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-[#1f1b19] rounded-xl p-6 text-center border border-[#58413b]/10">
        <p className="text-[#e0bfb7]">Nenhuma transação ainda</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1f1b19] rounded-xl border border-[#58413b]/10 overflow-hidden">
      <div className="p-4 border-b border-[#58413b]/10">
        <h3 className="font-bold text-white">Histórico</h3>
      </div>
      <div className="divide-y divide-[#58413b]/10">
        {transactions.map((tx) => (
          <div key={tx.id} className="p-4 flex items-center gap-4">
            <div className="p-2 bg-[#2e2928] rounded-lg">
              {getTransactionIcon(tx.tipo)}
            </div>
            <div className="flex-1">
              <p className="font-medium text-white capitalize">
                {tx.tipo.replace("_", " ")}
              </p>
              {tx.descricao && (
                <p className="text-xs text-[#e0bfb7]">{tx.descricao}</p>
              )}
              <p className="text-xs text-[#e0bfb7]/60">
                {new Date(tx.createdAt).toLocaleDateString("pt-PT")}
              </p>
            </div>
            <p className={`font-bold ${getTransactionColor(tx.tipo)}`}>
              {tx.valor >= 0 ? "+" : ""}{formatCurrency(tx.valor)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
