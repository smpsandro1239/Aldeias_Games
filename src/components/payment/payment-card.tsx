"use client";

import { Euro, CreditCard, Smartphone, Wallet, AlertCircle, User } from "lucide-react";
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
     bgColor: "bg-primary/20",
     textColor: "text-primary",
     borderColor: "border-primary/30",
   },
  saldo: {
    icon: Wallet,
    label: "Saldo Aldeias",
    bgColor: "bg-primary/20",
    textColor: "text-primary",
    borderColor: "border-primary/30",
  },
  mbway: {
    icon: Smartphone,
    label: "MBWay",
    bgColor: "bg-accent/20",
    textColor: "text-primary",
    borderColor: "border-accent/30",
  },
  stripe: {
    icon: CreditCard,
    label: "Cartão",
    bgColor: "bg-secondary/20",
    textColor: "text-primary",
    borderColor: "border-secondary/30",
  },
  transferencia: {
    icon: CreditCard,
    label: "Transferência",
    bgColor: "bg-muted/20",
    textColor: "text-muted-foreground",
    borderColor: "border-muted/30",
  },
  vendedor: {
    icon: User,
    label: "Vendedor",
    bgColor: "bg-secondary/20",
    textColor: "text-primary",
    borderColor: "border-secondary/30",
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
        "w-full p-3 sm:p-4 rounded-xl flex items-center gap-2.5 sm:gap-3 transition-all border-2",
        config.bgColor,
        config.borderColor,
        selected 
          ? "ring-2 ring-primary shadow-lg shadow-primary/20 scale-[1.02]" 
          : "hover:scale-[1.01]",
        disabled && "opacity-50 cursor-not-allowed hover:scale-100"
      )}
    >
      <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", config.textColor)} />
      <div className="text-left flex-1 min-w-0">
        <p className={cn("font-medium text-sm sm:text-base", config.textColor)}>{config.label}</p>
        <p className="text-[10px] sm:text-xs opacity-60 truncate">{commission.description}</p>
      </div>
      {hasFee ? (
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[10px] sm:text-xs text-accent font-medium">{commission.label}</span>
          <span className="text-[9px] sm:text-[10px] text-accent/60">com taxa</span>
        </div>
      ) : (
        <span className="text-[10px] sm:text-xs text-primary font-medium shrink-0">Sem taxa</span>
      )}
      {selected && (
        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <svg className="w-3 h-3 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}
