"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [saldoAtual, setSaldoAtual] = useState<number | null>(null);

  useEffect(() => {
    const checkPayment = async () => {
      const sessionId = searchParams.get("session_id");

      if (!sessionId) {
        setStatus("missing");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        
        // Verificar estado do pagamento
        const res = await fetch(`/api/pagamentos/stripe?sessionId=${sessionId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = await res.json();

        if (data.success && data.data?.status === "paid") {
          setStatus("success");
          setAmount(data.data.amount / 100);
          
          // Buscar saldo atualizado após pagamento bem-sucedido
          if (token) {
            try {
              const walletRes = await fetch("/api/wallet", {
                headers: { Authorization: `Bearer ${token}` }
              });
              const walletData = await walletRes.json();
              if (walletData.saldo !== undefined) {
                setSaldoAtual(walletData.saldo);
              }
            } catch (e) {
              console.error("Erro ao buscar saldo:", e);
            }
          }
        } else {
          setStatus("pending");
        }
      } catch (error) {
        console.error("Error checking payment:", error);
        setStatus("error");
      } finally {
        setLoading(false);
      }
    };

    checkPayment();
  }, [searchParams]);

  const handleGoBack = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1f1b19] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#ff734b] animate-spin mx-auto mb-4" />
          <p className="text-[#e0bfb7]">A verificar pagamento...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-[#1f1b19] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Pagamento Concluído!</h1>
          <p className="text-[#e0bfb7] mb-2">
            O seu saldo foi creditado com sucesso.
          </p>
          {amount && (
            <p className="text-lg text-[#ff734b] font-bold mb-2">
              +€{amount.toFixed(2)}
            </p>
          )}
          {saldoAtual !== null && (
            <p className="text-sm text-[#e0bfb7] mb-6">
              Saldo atual: <span className="text-white font-bold">€{saldoAtual.toFixed(2)}</span>
            </p>
          )}
          <Button
            onClick={handleGoBack}
            className="bg-[#ff734b] hover:bg-[#ff734b]/90 text-[#110d0c] font-bold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1f1b19] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Pagamento em Processamento</h1>
        <p className="text-[#e0bfb7] mb-6">
          O seu pagamento está a ser processado. O saldo será creditado assim que for confirmado.
        </p>
        <Button
          onClick={handleGoBack}
          className="bg-[#ff734b] hover:bg-[#ff734b]/90 text-[#110d0c] font-bold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Início
        </Button>
      </div>
    </div>
  );
}

export default function PagamentoSucessoPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}