"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Gift, 
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  const [data, setData] = useState<{ 
    saldo: number; 
    transacoes: Transaction[]; 
    historicoPremios?: { total: number; quantidade: number } 
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

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
      <div className="animate-pulse bg-muted h-14 rounded-xl" />
    );
  }

  return (
    <div className="space-y-0">
      {/* Saldo compacto - clicável */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 rounded-xl transition-all duration-300 border border-amber-500/20 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {formatCurrency(data?.saldo || 0)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {data?.historicoPremios && data.historicoPremios.quantidade > 0 && (
            <span className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">
              {data.historicoPremios.quantidade} vitória(s)
            </span>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              fetchWallet();
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Transações expandidas */}
      <AnimatePresence>
        {expanded && data?.transacoes && data.transacoes.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-4 bg-muted/50 rounded-xl space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Últimas Transações
              </p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {data.transacoes.map((t) => (
                  <div 
                    key={t.id} 
                    className="flex items-center justify-between text-sm bg-background p-3 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-2">
                      {t.tipo === "cashback" ? (
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <Gift className="h-3 w-3 text-amber-500" />
                        </div>
                      ) : t.valor > 0 ? (
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                          <ArrowDownLeft className="h-3 w-3 text-red-500" />
                        </div>
                      )}
                      <span className="truncate max-w-[140px] text-muted-foreground">
                        {t.descricao}
                      </span>
                    </div>
                    <span className={`font-semibold ${t.valor > 0 ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
                      {t.valor > 0 ? "+" : ""}{formatCurrency(t.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
