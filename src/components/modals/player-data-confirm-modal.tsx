"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Phone, Mail, AlertTriangle, Check } from "lucide-react";

interface PlayerDataConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userPhone: string;
  userEmail: string;
  onConfirmWithOwnData: () => void;
  onConfirmWithNewData: (data: { nome: string; telefone: string; email: string }) => void;
}

export function PlayerDataConfirmModal({
  open,
  onOpenChange,
  userName,
  userPhone,
  userEmail,
  onConfirmWithOwnData,
  onConfirmWithNewData,
}: PlayerDataConfirmModalProps) {
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState(userName);
  const [telefone, setTelefone] = useState(userPhone);
  const [email, setEmail] = useState(userEmail);

  useEffect(() => {
    if (open) {
      setEditing(false);
      setNome(userName);
      setTelefone(userPhone);
      setEmail(userEmail);
    }
  }, [open, userName, userPhone, userEmail]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[92vw] sm:max-w-md bg-surface-container border border-outline-variant/10 p-0 sm:p-6 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
          <DialogTitle className="font-headline text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-accent" />
            Dados do Jogador
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          {!editing ? (
            <>
              <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Está autenticado como <strong className="text-foreground">{userName}</strong>.
                </p>
                <p className="text-sm text-muted-foreground">
                  Os dados de nome, telefone e email não foram alterados. Tem a certeza que não está a jogar por outro utilizador?
                </p>
              </div>

              <div className="bg-surface-container-high rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium">{userName || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Telemóvel:</span>
                  <span className="font-medium">{userPhone || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{userEmail || "—"}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Inserir dados do cliente
                </button>
                <button
                  onClick={() => onConfirmWithOwnData()}
                  className="w-full py-3 bg-surface-container-low text-muted-foreground font-semibold rounded-xl border border-outline-variant/20 active:scale-[0.98] transition-all"
                >
                  Sim, jogar com os meus dados
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Insira os dados do jogador para quem está a comprar.
              </p>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Nome</label>
                  <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
                    <User className="w-5 h-5 text-primary shrink-0" />
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-foreground min-w-0"
                      placeholder="Nome do cliente"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Telemóvel</label>
                  <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
                    <Phone className="w-5 h-5 text-primary shrink-0" />
                    <input
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-foreground min-w-0"
                      placeholder="912 345 678"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">Email</label>
                  <div className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3">
                    <Mail className="w-5 h-5 text-primary shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-foreground min-w-0"
                      placeholder="email@exemplo.pt"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onConfirmWithNewData({ nome, telefone, email })}
                  disabled={!nome}
                  className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Confirmar dados do cliente
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="w-full py-3 bg-surface-container-low text-muted-foreground font-semibold rounded-xl border border-outline-variant/20 active:scale-[0.98] transition-all"
                >
                  Voltar
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
