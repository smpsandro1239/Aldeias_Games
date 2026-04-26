"use client";

import { useState, useEffect } from "react";
import { PaymentCard } from "./payment-card";
import { MetodoPagamento, getAvailableMethods, AldeiaSettings } from "@/lib/payment-commissions";

interface PaymentSelectorProps {
  amount: number;
  onSelect: (method: MetodoPagamento) => void;
  selectedMethod?: MetodoPagamento | null;
  disabled?: boolean;
  showLabels?: boolean;
}

export function PaymentSelector({ 
  amount, 
  onSelect, 
  selectedMethod, 
  disabled,
  showLabels = true 
}: PaymentSelectorProps) {
  const [availableMethods, setAvailableMethods] = useState<MetodoPagamento[]>([]);
  const [selected, setSelected] = useState<MetodoPagamento | null>(selectedMethod || null);
  const [saldo, setSaldo] = useState(0);

  useEffect(() => {
    const loadUserData = async () => {
      const storedUser = localStorage.getItem("user");
      let userRole: string | null = null;
      let aldeiaSettings: AldeiaSettings | undefined;

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          userRole = user.role;
          aldeiaSettings = {
            permitirStripe: user.permitirStripe,
            permitirMBWay: user.permitirMBWay,
          };
        } catch (e) {
          console.error("Erro ao parse user:", e);
        }
      }

      const methods = getAvailableMethods(userRole, aldeiaSettings);
      setAvailableMethods(methods);

      if (selected && !methods.includes(selected)) {
        setSelected(null);
      }
    };

    loadUserData();

    const loadSaldo = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("/api/wallet", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.saldo !== undefined) {
          setSaldo(data.saldo);
        }
      } catch (e) {
        console.error("Erro ao buscar saldo:", e);
      }
    };

    loadSaldo();
  }, [selected]);

  const handleSelect = (method: MetodoPagamento) => {
    if (disabled) return;
    
    if (method === "saldo" && saldo < amount) {
      return;
    }
    
    setSelected(method);
    onSelect(method);
  };

  const insufficientBalance = selected === "saldo" && saldo < amount;

  return (
    <div className="space-y-3">
      {showLabels && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Método de Pagamento</p>
          {saldo > 0 && (
            <p className="text-xs text-primary">
              Saldo: {saldo.toFixed(2)}€
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        {availableMethods.map((method) => (
          <PaymentCard
            key={method}
            method={method}
            selected={selected === method}
            onClick={() => handleSelect(method)}
            disabled={disabled || (method === "saldo" && saldo < amount)}
          />
        ))}
      </div>

      {insufficientBalance && (
        <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
          <p className="text-sm text-orange-400">
            Saldo insuficiente. Precisas de {amount.toFixed(2)}€ mas só tens {saldo.toFixed(2)}€ 
          </p>
        </div>
      )}

      {availableMethods.length === 0 && (
        <div className="p-4 rounded-xl bg-surface-container-low text-center">
          <p className="text-sm text-muted-foreground">
            Inicia sessão para selecionar método de pagamento
          </p>
        </div>
      )}
    </div>
  );
}
