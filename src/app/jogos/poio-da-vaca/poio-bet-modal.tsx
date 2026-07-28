"use client";

import { UserPlus, User, Phone, Mail, MessageCircle, Bell, Ticket } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { JogadorForm } from "./poio-types";

interface PoioBetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jogadorForm: JogadorForm;
  setJogadorForm: (form: JogadorForm) => void;
  selectedSquares: number[];
  cells: Array<{ id: number; display: string }>;
  custoPorQuadrado: number;
  onSubmit: () => void;
}

export function PoioBetModal({
  open, onOpenChange, jogadorForm, setJogadorForm,
  selectedSquares, cells, custoPorQuadrado, onSubmit,
}: PoioBetModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-surface-container border border-outline-variant/10 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-headline text-xl flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Identificar Jogador
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          <p className="text-xs text-on-surface-variant">
            Registar aposta para: <strong>{selectedSquares.map(id => cells[id - 1]?.display || `N${id}`).join(", ")}</strong>
          </p>

          <div className="bg-surface-container-high rounded-xl p-4 space-y-3">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Nome do Jogador *</label>
              <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
                <User className="w-5 h-5 text-primary" />
                <input
                  type="text"
                  value={jogadorForm.nome}
                  onChange={(e) => setJogadorForm({ ...jogadorForm, nome: e.target.value })}
                  className="flex-1 bg-transparent outline-none text-foreground"
                  placeholder="Nome completo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Telemóvel</label>
              <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
                <Phone className="w-5 h-5 text-primary" />
                <input
                  type="tel"
                  value={jogadorForm.telefone}
                  onChange={(e) => setJogadorForm({ ...jogadorForm, telefone: e.target.value })}
                  className="flex-1 bg-transparent outline-none text-foreground"
                  placeholder="912 345 678"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Ou Email</label>
              <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
                <Mail className="w-5 h-5 text-primary" />
                <input
                  type="email"
                  value={jogadorForm.email}
                  onChange={(e) => setJogadorForm({ ...jogadorForm, email: e.target.value })}
                  className="flex-1 bg-transparent outline-none text-foreground"
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Receber Notificação</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setJogadorForm({ ...jogadorForm, notificacao: "whatsapp" })}
                  className={`p-3 rounded-xl flex items-center gap-2 transition-all ${jogadorForm.notificacao === "whatsapp" ? "bg-[#25D366] text-foreground" : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"}`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => setJogadorForm({ ...jogadorForm, notificacao: "email" })}
                  className={`p-3 rounded-xl flex items-center gap-2 transition-all ${jogadorForm.notificacao === "email" ? "bg-primary text-foreground" : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"}`}
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-xs font-medium">Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => setJogadorForm({ ...jogadorForm, notificacao: "nenhum" })}
                  className={`p-3 rounded-xl flex items-center gap-2 transition-all ${jogadorForm.notificacao === "nenhum" ? "bg-[#666] text-foreground" : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"}`}
                >
                  <Bell className="w-4 h-4" />
                  <span className="text-xs font-medium">Nenhum</span>
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/60">Por predefinição, receberá notificação por WhatsApp</p>
            </div>
          </div>

          <div className="bg-surface-container-high rounded-xl p-4">
            <p className="text-xs text-on-surface-variant mb-1">Total a pagar</p>
            <p className="font-headline text-2xl text-primary">{selectedSquares.length * custoPorQuadrado}€</p>
          </div>

          <button
            onClick={onSubmit}
            className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <Ticket className="w-5 h-5" />
            Confirmar Aposta
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
