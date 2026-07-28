"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface PendingSale {
  id: string;
  jogoId: string;
  quantidade: number;
  metodoPagamento: string;
  dadosCliente?: { nome: string; telefone?: string; email?: string };
  timestamp: number;
}

const OFFLINE_SALES_KEY = "aldeias_offline_sales";

export function useOfflineSales(onSell: (data: any) => Promise<any>) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const saved = localStorage.getItem(OFFLINE_SALES_KEY);
    if (saved) {
      try {
        setPendingSales(JSON.parse(saved));
      } catch {
        console.error("Erro ao carregar vendas offline");
      }
    }

    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const saveOfflineSale = useCallback((sale: PendingSale) => {
    setPendingSales(prev => {
      const updated = [...prev, sale];
      localStorage.setItem(OFFLINE_SALES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const syncOfflineSales = useCallback(async () => {
    if (!navigator.onLine || pendingSales.length === 0) return;

    for (const sale of pendingSales) {
      try {
        await onSell({
          jogoId: sale.jogoId,
          quantidade: sale.quantidade,
          metodoPagamento: sale.metodoPagamento,
          dadosCliente: sale.dadosCliente,
        });
      } catch (error) {
        console.error("Erro ao sincronizar venda:", error);
      }
    }

    setPendingSales([]);
    localStorage.removeItem(OFFLINE_SALES_KEY);
    toast.success(`${pendingSales.length} venda(s) sincronizada(s)`);
  }, [pendingSales, onSell]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingSales.length > 0) {
      syncOfflineSales();
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isOnline,
    pendingSales,
    saveOfflineSale,
    syncOfflineSales,
  };
}
