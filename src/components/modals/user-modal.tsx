"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserData {
  id?: string;
  nome: string;
  email: string;
  password?: string;
  role: "super_admin" | "aldeia_admin" | "vendedor" | "user";
  telefone?: string;
  aldeiaId?: string | null;
}

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserData) => Promise<void>;
  initialData?: UserData;
  aldeias?: { id: string; nome: string }[];
  currentUserRole: string;
}

export function UserModal({ open, onOpenChange, onSubmit, initialData, aldeias = [], currentUserRole }: UserModalProps) {
  const [formData, setFormData] = useState<UserData>({
    nome: "",
    email: "",
    password: "",
    role: "user",
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
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={!!initialData}
              />
            </div>

            {!initialData && (
              <div className="grid gap-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!initialData}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "super_admin" | "aldeia_admin" | "vendedor" | "user") => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="user">Utilizador Geral</SelectItem>
                   <SelectItem value="vendedor">Vendedor</SelectItem>
                   <SelectItem value="aldeia_admin">Admin da Aldeia</SelectItem>
                   {currentUserRole === 'super_admin' && (
                     <SelectItem value="super_admin">Super Admin</SelectItem>
                   )}
                </SelectContent>
              </Select>
            </div>

            {(currentUserRole === 'super_admin' && formData.role !== 'super_admin') && (
              <div className="grid gap-2">
                <Label htmlFor="aldeiaId">Aldeia</Label>
                <Select
                  value={formData.aldeiaId || "none"}
                  onValueChange={(value) => setFormData({ ...formData, aldeiaId: value === "none" ? "" : value })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione uma aldeia" /></SelectTrigger>
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
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
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
