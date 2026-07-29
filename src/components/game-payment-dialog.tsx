"use client";

import { Euro, User, Phone, Mail, MessageCircle, Bell } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PaymentSelector } from "@/components/payment";
import type { Participante } from "@/hooks/useGamePage";

interface GamePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  gameName: string;
  /** When true, shows customer data form (nome, telefone, notificação) */
  showCustomerForm?: boolean;
  participante?: Participante;
  setParticipante?: (p: Participante | ((prev: Participante) => Participante)) => void;
  onSelect: (metodo: "dinheiro" | "saldo" | "mbway" | "stripe" | "transferencia") => void;
  /** Optional description line (e.g. "3 números selecionados") */
  description?: string;
}

export function GamePaymentDialog({
  open,
  onOpenChange,
  amount,
  gameName,
  showCustomerForm = false,
  participante,
  setParticipante,
  onSelect,
  description,
}: GamePaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg bg-surface-container border border-outline-variant/10 p-0 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col">
        <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
          <DialogTitle className="font-headline text-xl flex items-center gap-2">
            <Euro className="w-5 h-5 text-primary" />
            Pagamento - {gameName}
          </DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </DialogHeader>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Amount display */}
          <div className="bg-surface-container-high rounded-xl p-4 text-center">
            <p className="text-xs text-on-surface-variant">Total a pagar</p>
            <p className="font-headline text-3xl text-primary">{amount.toFixed(2)}€</p>
          </div>

          {/* Customer data form (optional) */}
          {showCustomerForm && participante && setParticipante && (
            <>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Nome</label>
                <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
                  <User className="w-5 h-5 text-primary shrink-0" />
                  <input
                    type="text"
                    value={participante.nome}
                    onChange={(e) =>
                      setParticipante((prev) => ({ ...prev, nome: e.target.value }))
                    }
                    className="flex-1 bg-transparent outline-none text-foreground min-w-0"
                    placeholder="O seu nome"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Telemóvel</label>
                <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
                  <Phone className="w-5 h-5 text-primary shrink-0" />
                  <input
                    type="tel"
                    value={participante.telefone}
                    onChange={(e) =>
                      setParticipante((prev) => ({ ...prev, telefone: e.target.value }))
                    }
                    className="flex-1 bg-transparent outline-none text-foreground min-w-0"
                    placeholder="912 345 678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Receber Notificação
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: "whatsapp", icon: MessageCircle, label: "WhatsApp", color: "#25D366" },
                      { value: "email", icon: Mail, label: "Email", color: "primary" },
                      { value: "nenhum", icon: Bell, label: "Nenhum", color: "#666" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setParticipante((prev) => ({ ...prev, notificacao: opt.value }))
                      }
                      className={`p-2.5 sm:p-3 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all ${
                        participante.notificacao === opt.value
                          ? `bg-[${opt.color}] text-foreground`
                          : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                      }`}
                      style={
                        participante.notificacao === opt.value
                          ? { backgroundColor: opt.color === "primary" ? undefined : opt.color }
                          : undefined
                      }
                    >
                      <opt.icon className="w-4 h-4" />
                      <span className="text-[10px] sm:text-xs font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Payment methods */}
          <PaymentSelector amount={amount} onSelect={onSelect as any} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
