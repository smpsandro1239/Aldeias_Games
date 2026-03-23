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
import { toast } from "sonner";

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
  token: string;
  onUpdate: (data: { nome?: string; telefone?: string; notificacoesEmail?: boolean }) => Promise<void>;
}

export function ProfileModal({ open, onOpenChange, user, token, onUpdate }: ProfileModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    notificacoesEmail: true,
  });
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    atual: "",
    nova: "",
    confirmacao: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordLoading, setPasswordLoading] = useState(false);

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

  const handlePasswordChange = async () => {
    const errors: Record<string, string> = {};
    
    if (!passwordData.atual) {
      errors.atual = "Password atual é obrigatória";
    }
    if (!passwordData.nova) {
      errors.nova = "Nova password é obrigatória";
    }
    if (passwordData.nova.length < 8) {
      errors.nova = "Password deve ter pelo menos 8 caracteres";
    }
    if (passwordData.nova !== passwordData.confirmacao) {
      errors.confirmacao = "As passwords não coincidem";
    }
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/users/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          passwordAtual: passwordData.atual,
          novaPassword: passwordData.nova,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || "Erro ao alterar password");
        return;
      }
      
      toast.success("Password alterada com sucesso");
      setShowPasswordChange(false);
      setPasswordData({ atual: "", nova: "", confirmacao: "" });
    } catch (error) {
      toast.error("Erro ao alterar password");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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

            {/* Alterar Password */}
            {!showPasswordChange ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordChange(true)}
              >
                Alterar Password
              </Button>
            ) : (
              <div className="rounded-lg border p-4 space-y-4">
                <h4 className="font-medium">Alterar Password</h4>
                
                <div className="grid gap-2">
                  <Label htmlFor="passwordAtual">Password Atual</Label>
                  <Input
                    id="passwordAtual"
                    type="password"
                    value={passwordData.atual}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, atual: e.target.value });
                      if (passwordErrors.atual) setPasswordErrors({ ...passwordErrors, atual: "" });
                    }}
                  />
                  {passwordErrors.atual && <p className="text-sm text-destructive">{passwordErrors.atual}</p>}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="novaPassword">Nova Password</Label>
                  <Input
                    id="novaPassword"
                    type="password"
                    value={passwordData.nova}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, nova: e.target.value });
                      if (passwordErrors.nova) setPasswordErrors({ ...passwordErrors, nova: "" });
                    }}
                  />
                  {passwordErrors.nova && <p className="text-sm text-destructive">{passwordErrors.nova}</p>}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirmar Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmacao}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, confirmacao: e.target.value });
                      if (passwordErrors.confirmacao) setPasswordErrors({ ...passwordErrors, confirmacao: "" });
                    }}
                  />
                  {passwordErrors.confirmacao && <p className="text-sm text-destructive">{passwordErrors.confirmacao}</p>}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setPasswordData({ atual: "", nova: "", confirmacao: "" });
                      setPasswordErrors({});
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handlePasswordChange}
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? "A guardar..." : "Guardar Password"}
                  </Button>
                </div>
              </div>
            )}

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
