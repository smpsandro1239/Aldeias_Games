"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface WalletContextValue {
  saldo: number;
  loading: boolean;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue>({
  saldo: 0,
  loading: true,
  refreshBalance: async () => {},
});

export function useWallet() {
  return useContext(WalletContext);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [saldo, setSaldo] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet");
      if (res.ok) {
        const data = await res.json();
        if (data.saldo !== undefined) {
          setSaldo(data.saldo);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  return (
    <WalletContext.Provider value={{ saldo, loading, refreshBalance }}>
      {children}
    </WalletContext.Provider>
  );
}
