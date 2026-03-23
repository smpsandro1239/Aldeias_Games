"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowUpRight, ArrowDownLeft, Gift, RefreshCw } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface Transaction {
  id: string;
  valor: number;
  tipo: string;
  descricao: string;
  createdAt: string;
}

interface WalletCardProps {
  token: string;
}

export function WalletCard({ token }: WalletCardProps) {
  const [data, setData] = useState<{ saldo: number; transacoes: Transaction[]; historicoPremios?: { total: number; quantidade: number } } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Erro ao carregar carteira");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [token]);

  if (loading && !data) {
    return (
      <Card className="animate-pulse">
        <div className="h-40 bg-muted rounded-xl" />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-primary/90 to-primary text-primary-foreground">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-white/20 rounded-lg">
            <Wallet className="h-6 w-6" />
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={fetchWallet}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <CardTitle className="text-sm font-medium opacity-80 mt-2">O seu Saldo Aldeias</CardTitle>
        <div className="text-4xl font-black">{formatCurrency(data?.saldo || 0)}</div>
        {data?.historicoPremios && data.historicoPremios.quantidade > 0 && (
          <div className="flex gap-4 text-xs opacity-70 mt-1">
            <span>{data.historicoPremios.quantidade} vitória(s)</span>
            <span>Total: {formatCurrency(data.historicoPremios.total)}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="mt-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest opacity-60">Últimas Transações</p>
          <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
            {data?.transacoes.length ? (
              data.transacoes.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    {t.tipo === "cashback" ? (
                      <Gift className="h-3 w-3 text-yellow-300" />
                    ) : t.valor > 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-green-300" />
                    ) : (
                      <ArrowDownLeft className="h-3 w-3 text-red-300" />
                    )}
                    <span className="truncate max-w-[120px]">{t.descricao}</span>
                  </div>
                  <span className={`font-bold ${t.valor > 0 ? "text-green-300" : "text-white"}`}>
                    {t.valor > 0 ? "+" : ""}{formatCurrency(t.valor)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs opacity-50 italic">Sem transações recentes</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
