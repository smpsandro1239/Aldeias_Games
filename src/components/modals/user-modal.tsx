"use client";

import { useState, useEffect, useCallback, useReducer } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { normalizeAldeiasList } from "@/lib/utils";

// Constants for user roles to avoid magic strings
const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ALDEIA_ADMIN: 'aldeia_admin',
  VENDEDOR: 'vendedor',
  USER: 'user'
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

export interface UserData {
  id?: string;
  nome: string;
  email: string;
  password?: string;
  role: UserRole;
  telefone?: string;
  aldeiaId?: string | null;
}

interface Aldeia {
  id: string;
  nome: string;
}

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserData) => Promise<void>;
  initialData?: UserData;
  aldeias?: Aldeia[];
  currentUserRole: string;
}

export function UserModal({ open, onOpenChange, onSubmit, initialData, aldeias = [], currentUserRole }: UserModalProps) {
  const normalizedAldeias = normalizeAldeiasList(aldeias);

  const [formData, setFormData] = useState<UserData>({
    nome: "",
    email: "",
    password: "",
    role: USER_ROLES.USER,
    telefone: "",
    aldeiaId: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData && open) {
      setFormData({ ...initialData, password: "" });
    } else if (!open) {
      setFormData({
        nome: "",
        email: "",
        password: "",
        role: "user",
        telefone: "",
        aldeiaId: "",
      });
    }
  }, [initialData, open]);

  // Validation function
  const validateForm = useCallback((): string[] => {
    const errors: string[] = [];

    if (!formData.nome || formData.nome.length < 2) {
      errors.push("Nome deve ter pelo menos 2 caracteres");
    }

    if (!formData.email || !formData.email.includes("@")) {
      errors.push("Email inválido");
    }

    if (!initialData && (!formData.password || formData.password.length < 6)) {
      errors.push("Password deve ter pelo menos 6 caracteres");
    }

    if (formData.role === USER_ROLES.ALDEIA_ADMIN && !formData.aldeiaId) {
      errors.push("Administradores de aldeia devem ter uma aldeia associada");
    }

    return errors;
  }, [formData, initialData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar utilizador:", error);
      toast.error("Erro ao salvar utilizador");
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, onSubmit, onOpenChange]);

  // Form field handlers
  const updateFormField = useCallback((field: keyof UserData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleRoleChange = useCallback((role: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role,
      aldeiaId: role === USER_ROLES.ALDEIA_ADMIN ? prev.aldeiaId : undefined
    }));
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Utilizador" : "Novo Utilizador"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Altere as permissões ou dados do utilizador." : "Registe um novo utilizador na plataforma."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => updateFormField('nome', e.target.value)}
                required
                aria-describedby="nome-description"
                placeholder="Nome completo do utilizador"
              />
              <p id="nome-description" className="sr-only">Nome completo do utilizador (mínimo 2 caracteres)</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormField('email', e.target.value)}
                required
                disabled={!!initialData}
                aria-describedby="email-description"
                placeholder="email@exemplo.com"
              />
              <p id="email-description" className="sr-only">Endereço de email válido para login</p>
            </div>

            {!initialData && (
              <div className="grid gap-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password || ""}
                  onChange={(e) => updateFormField('password', e.target.value)}
                  required={!initialData}
                  aria-describedby="password-description"
                  placeholder="Mínimo 6 caracteres"
                />
                <p id="password-description" className="sr-only">Password de acesso (mínimo 6 caracteres)</p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={handleRoleChange}
                aria-describedby="role-description"
              >
                <SelectTrigger aria-label="Selecionar role do utilizador">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={USER_ROLES.USER}>Utilizador Geral</SelectItem>
                  {currentUserRole === USER_ROLES.SUPER_ADMIN && (
                    <>
                      <SelectItem value={USER_ROLES.VENDEDOR}>Vendedor</SelectItem>
                      <SelectItem value={USER_ROLES.ALDEIA_ADMIN}>Admin da Aldeia</SelectItem>
                      <SelectItem value={USER_ROLES.SUPER_ADMIN}>Super Admin</SelectItem>
                    </>
                  )}
                  {currentUserRole === USER_ROLES.ALDEIA_ADMIN && (
                    <SelectItem value={USER_ROLES.VENDEDOR}>Vendedor</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p id="role-description" className="sr-only">Define as permissões e acesso do utilizador no sistema</p>
            </div>

            {(currentUserRole === USER_ROLES.SUPER_ADMIN || (currentUserRole === USER_ROLES.ALDEIA_ADMIN && normalizedAldeias.length > 0)) && (
              <div className="grid gap-2">
                <Label htmlFor="aldeiaId">Aldeia {formData.role === USER_ROLES.ALDEIA_ADMIN && '*'}</Label>
                <Select
                  value={formData.aldeiaId || "none"}
                  onValueChange={(value) => updateFormField('aldeiaId', value === "none" ? "" : value)}
                  aria-describedby="aldeia-description"
                >
                  <SelectTrigger aria-label="Selecionar aldeia do utilizador">
                    <SelectValue placeholder="Selecione uma aldeia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geral (Nenhuma)</SelectItem>
                    {normalizedAldeias.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p id="aldeia-description" className="sr-only">Aldeia associada ao utilizador (obrigatório para admins)</p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone || ""}
                onChange={(e) => updateFormField('telefone', e.target.value)}
                placeholder="+351 912345678"
                aria-describedby="telefone-description"
              />
              <p id="telefone-description" className="sr-only">Número de telefone opcional para contacto</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              aria-label="Cancelar e fechar modal"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              aria-label={initialData ? "Atualizar dados do utilizador" : "Criar novo utilizador"}
            >
              {loading ? "A guardar..." : initialData ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
