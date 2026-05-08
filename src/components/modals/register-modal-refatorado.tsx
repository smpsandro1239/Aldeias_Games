"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Constants for user roles to avoid magic strings
const USER_ROLES = {
  USER: 'user',
  VENDEDOR: 'vendedor',
  ALDEIA_ADMIN: 'aldeia_admin'
} as const;

type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Constants for organization types
const TIPO_ORGANIZACAO = {
  ALDEIA: 'aldeia',
  ESCOLA: 'escola',
  ASSOCIACAO_PAIS: 'associacao_pais',
  CLUBE: 'clube'
} as const;

type TipoOrganizacao = typeof TIPO_ORGANIZACAO[keyof typeof TIPO_ORGANIZACAO];

interface Aldeia {
  id: string;
  nome: string;
  tipoOrganizacao?: TipoOrganizacao;
}

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegister: (data: {
    nome: string;
    email: string;
    password: string;
    telefone?: string;
    role?: UserRole;
    tipoOrganizacao?: TipoOrganizacao;
    aldeiaId?: string;
  }) => Promise<void>;
  onLoginClick: () => void;
}

// Hook customizado para buscar aldeias
function useAldeias(open: boolean) {
  const [aldeias, setAldeias] = useState<Aldeia[]>([]);

  const fetchAldeias = useCallback(async () => {
    try {
      const response = await fetch("/api/aldeias");
      if (!response.ok) {
        throw new Error("Erro ao carregar aldeias");
      }
      const data = await response.json();
      if (data.data) {
        setAldeias(data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar aldeias:", error);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchAldeias();
    }
  }, [open, fetchAldeias]);

  return { aldeias, fetchAldeias };
}

export function RegisterModal({ open, onOpenChange, onRegister, onLoginClick }: RegisterModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    password: "",
    telefone: "",
    role: USER_ROLES.USER as UserRole,
    tipoOrganizacao: "" as TipoOrganizacao | "",
    aldeiaId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { aldeias } = useAldeias(open);

  const handleChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleRoleChange = useCallback((value: UserRole) => {
    setFormData(prev => ({ ...prev, role: value, aldeiaId: "", tipoOrganizacao: "" }));
  }, []);

  const handleTipoOrganizacaoChange = useCallback((value: TipoOrganizacao) => {
    setFormData(prev => ({ ...prev, tipoOrganizacao: value }));
  }, []);

  const handleAldeiaChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, aldeiaId: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = {
        ...formData,
        tipoOrganizacao: formData.role === USER_ROLES.ALDEIA_ADMIN ? formData.tipoOrganizacao : undefined,
        aldeiaId: formData.role !== USER_ROLES.ALDEIA_ADMIN && formData.aldeiaId ? formData.aldeiaId : undefined,
      };
      await onRegister(data);
      setFormData({
        nome: "",
        email: "",
        password: "",
        telefone: "",
        role: USER_ROLES.USER,
        tipoOrganizacao: "",
        aldeiaId: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registar");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = useCallback(() => {
    onOpenChange(false);
    onLoginClick();
  }, [onOpenChange, onLoginClick]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="register-modal-description">
        <DialogHeader>
          <DialogTitle>Criar Conta</DialogTitle>
          <DialogDescription id="register-modal-description">
            Registe-se para participar nos jogos e campanhas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                placeholder="O seu nome"
                value={formData.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                required
                aria-describedby="nome-error"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                aria-describedby="email-error"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                required
                minLength={8}
                aria-describedby="password-error"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                type="tel"
                placeholder="+351 9XX XXX XXX"
                value={formData.telefone}
                onChange={(e) => handleChange("telefone", e.target.value)}
                aria-describedby="telefone-error"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Tipo de Conta</Label>
              <Select
                value={formData.role}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger id="role" aria-describedby="role-error">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={USER_ROLES.USER}>Jogador</SelectItem>
                  <SelectItem value={USER_ROLES.VENDEDOR}>Vendedor</SelectItem>
                  <SelectItem value={USER_ROLES.ALDEIA_ADMIN}>Organização</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role !== USER_ROLES.ALDEIA_ADMIN && aldeias.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="aldeia">Aldeia/Organização *</Label>
                <Select
                  value={formData.aldeiaId}
                  onValueChange={handleAldeiaChange}
                >
                  <SelectTrigger id="aldeia" aria-describedby="aldeia-error">
                    <SelectValue placeholder="Selecione a aldeia" />
                  </SelectTrigger>
                  <SelectContent>
                    {aldeias.map((aldeia) => (
                      <SelectItem key={aldeia.id} value={aldeia.id}>
                        {aldeia.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.role === USER_ROLES.ALDEIA_ADMIN && (
              <div className="grid gap-2">
                <Label htmlFor="tipoOrganizacao">Tipo de Organização</Label>
                <Select
                  value={formData.tipoOrganizacao}
                  onValueChange={handleTipoOrganizacaoChange}
                >
                  <SelectTrigger id="tipoOrganizacao" aria-describedby="tipoOrganizacao-error">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TIPO_ORGANIZACAO.ALDEIA}>Aldeia</SelectItem>
                    <SelectItem value={TIPO_ORGANIZACAO.ESCOLA}>Escola</SelectItem>
                    <SelectItem value={TIPO_ORGANIZACAO.ASSOCIACAO_PAIS}>Associação de Pais</SelectItem>
                    <SelectItem value={TIPO_ORGANIZACAO.CLUBE}>Clube</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {error && (
              <p id="nome-error email-error password-error telefone-error role-error aldeia-error tipoOrganizacao-error" className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "A registar..." : "Registar"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Já tem conta?{" "}
              <button
                type="button"
                onClick={handleLoginClick}
                className="text-primary hover:underline"
                aria-label="Ir para página de login"
              >
                Entre aqui
              </button>
            </p>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}