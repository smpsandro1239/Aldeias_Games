"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Constants for user roles to avoid magic strings
const USER_ROLES = {
  USER: 'user',
  VENDEDOR: 'vendedor',
  ALDEIA_ADMIN: 'aldeia_admin',
  SUPER_ADMIN: 'super_admin'
} as const;

type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

interface Aldeia {
  id: string;
  nome: string;
}

export interface UserData {
   id?: string;
   nome: string;
   email: string;
   password?: string;
   role: UserRole;
   telefone?: string;
   aldeiaId?: string | null;
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
  const [formData, setFormData] = useState<UserData>({
    nome: "",
    email: "",
    password: "",
    role: USER_ROLES.USER,
    telefone: "",
    aldeiaId: null,
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
        role: USER_ROLES.USER,
        telefone: "",
        aldeiaId: null,
      });
    }
  }, [initialData, open]);

  const handleChange = useCallback((field: keyof UserData, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleRoleChange = useCallback((value: UserRole) => {
    setFormData(prev => ({ ...prev, role: value }));
  }, []);

  const handleAldeiaChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, aldeiaId: value === "none" ? null : value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="user-modal-description">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Utilizador" : "Novo Utilizador"}</DialogTitle>
          <DialogDescription id="user-modal-description">
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
                onChange={(e) => handleChange("nome", e.target.value)}
                required
                aria-describedby="nome-error"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
                disabled={!!initialData}
                aria-describedby="email-error"
              />
            </div>

            {!initialData && (
              <div className="grid gap-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password || ""}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required={!initialData}
                  aria-describedby="password-error"
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger id="role" aria-describedby="role-error">
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
            </div>

            {(currentUserRole === USER_ROLES.SUPER_ADMIN || (currentUserRole === USER_ROLES.ALDEIA_ADMIN && aldeias.length > 0)) && (
              <div className="grid gap-2">
                <Label htmlFor="aldeiaId">Aldeia</Label>
                <Select
                  value={formData.aldeiaId || "none"}
                  onValueChange={handleAldeiaChange}
                >
                  <SelectTrigger id="aldeiaId" aria-describedby="aldeia-error">
                    <SelectValue placeholder="Selecione uma aldeia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geral (Nenhuma)</SelectItem>
                    {aldeias.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone || ""}
                onChange={(e) => handleChange("telefone", e.target.value)}
                aria-describedby="telefone-error"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "A guardar..." : (initialData ? "Guardar Alterações" : "Criar Utilizador")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}