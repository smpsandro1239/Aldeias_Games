"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  nome: string;
  telefone?: string;
  role: string;
  notificacoesEmail: boolean;
  ultimoLogin?: string;
  estatisticas?: {
    totalParticipacoes: number;
    totalGasto: number;
    totalVitorias: number;
  };
}

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onUpdate: (data: { nome?: string; telefone?: string; notificacoesEmail?: boolean }) => Promise<void>;
}

export function ProfileModal({ open, onOpenChange, user, onUpdate }: ProfileModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    notificacoesEmail: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || "",
        telefone: user.telefone || "",
        notificacoesEmail: user.notificacoesEmail ?? true,
      });
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onUpdate(formData);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Perfil do Utilizador</DialogTitle>
          <DialogDescription>
            Veja e edite as suas informações de perfil.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Informações básicas */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="+351 9XX XXX XXX"
              />
            </div>

            {/* Notificações */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="notificacoes">Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações sobre sorteios e prémios
                </p>
              </div>
              <Switch
                id="notificacoes"
                checked={formData.notificacoesEmail}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, notificacoesEmail: checked })
                }
              />
            </div>

            {/* Estatísticas */}
            {user.estatisticas && (
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="font-medium">Estatísticas</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{user.estatisticas.totalParticipacoes}</p>
                    <p className="text-xs text-muted-foreground">Participações</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{user.estatisticas.totalGasto.toFixed(2)}€</p>
                    <p className="text-xs text-muted-foreground">Total Gasto</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{user.estatisticas.totalVitorias}</p>
                    <p className="text-xs text-muted-foreground">Vitórias</p>
                  </div>
                </div>
              </div>
            )}

            {/* Último login */}
            {user.ultimoLogin && (
              <p className="text-sm text-muted-foreground">
                Último login: {formatDate(user.ultimoLogin)}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "A guardar..." : "Guardar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
