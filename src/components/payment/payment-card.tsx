"use client";

import { Euro, CreditCard, Smartphone, Wallet, AlertCircle } from "lucide-react";
import { MetodoPagamento, PAYMENT_COMMISSIONS, hasCommission } from "@/lib/payment-commissions";
import { cn } from "@/lib/utils";

interface PaymentCardProps {
  method: MetodoPagamento;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const methodConfig: Record<MetodoPagamento, {
  icon: typeof Euro;
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  dinheiro: {
    icon: Euro,
    label: "Dinheiro",
    bgColor: "bg-green-600/20",
    textColor: "text-green-400",
    borderColor: "border-green-600/30",
  },
  saldo: {
    icon: Wallet,
    label: "Saldo Aldeias",
    bgColor: "bg-[#ff734b]/20",
    textColor: "text-[#ff734b]",
    borderColor: "border-[#ff734b]/30",
  },
  mbway: {
    icon: Smartphone,
    label: "MBWay",
    bgColor: "bg-purple-600/20",
    textColor: "text-purple-400",
    borderColor: "border-purple-600/30",
  },
  stripe: {
    icon: CreditCard,
    label: "Cartão",
    bgColor: "bg-blue-600/20",
    textColor: "text-blue-400",
    borderColor: "border-blue-600/30",
  },
  transferencia: {
    icon: CreditCard,
    label: "Transferência",
    bgColor: "bg-gray-600/20",
    textColor: "text-gray-400",
    borderColor: "border-gray-600/30",
  },
};

export function PaymentCard({ method, selected, onClick, disabled }: PaymentCardProps) {
  const config = methodConfig[method];
  const commission = PAYMENT_COMMISSIONS[method];
  const Icon = config.icon;
  const hasFee = hasCommission(method);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full p-4 rounded-xl flex items-center gap-3 transition-all border-2",
        config.bgColor,
        config.borderColor,
        selected 
          ? "ring-2 ring-[#ff734b] shadow-lg shadow-[#ff734b]/20 scale-[1.02]" 
          : "hover:scale-[1.01]",
        disabled && "opacity-50 cursor-not-allowed hover:scale-100"
      )}
    >
      <Icon className={cn("w-6 h-6", config.textColor)} />
      <div className="text-left flex-1">
        <p className={cn("font-medium", config.textColor)}>{config.label}</p>
        <p className="text-xs opacity-60">{commission.description}</p>
      </div>
      {hasFee ? (
        <div className="flex flex-col items-end">
          <span className="text-xs text-orange-400 font-medium">{commission.label}</span>
          <span className="text-[10px] text-orange-400/60">com taxa</span>
        </div>
      ) : (
        <span className="text-xs text-green-400 font-medium">Sem taxa</span>
      )}
      {selected && (
        <div className="w-5 h-5 rounded-full bg-[#ff734b] flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}
