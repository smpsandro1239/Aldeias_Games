"use client";
import { apiRequest } from '@/lib/api-client';

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
import { UserPlus, User, Mail, KeyRound, Phone, ShieldCheck, Building2 } from "lucide-react";

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    setFieldErrors({});
    setLoading(true);

    try {
      const data = {
        ...formData,
        tipoOrganizacao: formData.role === USER_ROLES.ALDEIA_ADMIN && formData.tipoOrganizacao ? formData.tipoOrganizacao : undefined,
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
      if (err instanceof Error && (err as any).fieldErrors) {
        setFieldErrors((err as any).fieldErrors);
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Erro ao registar");
      }
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
        <DialogHeader className="bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-green-600/10 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-emerald-500/20">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-emerald-600/20 p-2 rounded-lg">
              <UserPlus className="h-5 w-5 text-emerald-600" />
            </div>
            Criar Conta
          </DialogTitle>
          <DialogDescription id="register-modal-description">
            Registe-se para participar nos jogos e campanhas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="nome" className="text-sm font-medium">Nome</Label>
                <div className="relative">
                  <Input
                    id="nome"
                    placeholder="O seu nome"
                    value={formData.nome}
                    onChange={(e) => handleChange("nome", e.target.value)}
                    required
                    className="pl-10"
                    aria-describedby="nome-error"
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                    <User className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="telefone" className="text-sm font-medium">Telefone</Label>
                <div className="relative">
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="+351 9XX XXX XXX"
                    value={formData.telefone}
                    onChange={(e) => handleChange("telefone", e.target.value)}
                    className="pl-10"
                    aria-describedby="telefone-error"
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                    <Phone className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                  className="pl-10"
                  aria-describedby="email-error"
                />
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required
                  minLength={8}
                  className="pl-10"
                  aria-describedby="password-error"
                />
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                  <KeyRound className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role" className="text-sm font-medium">Tipo de Conta</Label>
              <Select
                value={formData.role}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger id="role" className="pl-10 relative" aria-describedby="role-error">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={USER_ROLES.USER}>
                    <div className="flex items-center gap-2"><User className="h-4 w-4" /> Jogador</div>
                  </SelectItem>
                  <SelectItem value={USER_ROLES.VENDEDOR}>
                    <div className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Vendedor</div>
                  </SelectItem>
                  <SelectItem value={USER_ROLES.ALDEIA_ADMIN}>
                    <div className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Organização</div>
                  </SelectItem>
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
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-300" role="alert">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading ? "A registar..." : "Criar Conta"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Já tem conta?{" "}
              <button
                type="button"
                onClick={handleLoginClick}
                className="text-emerald-600 hover:text-emerald-500 hover:underline font-medium"
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