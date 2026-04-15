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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Aldeia {
  id: string;
  nome: string;
  tipoOrganizacao: string;
}

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegister: (data: {
    nome: string;
    email: string;
    password: string;
    telefone?: string;
    role?: string;
    tipoOrganizacao?: string;
    aldeiaId?: string;
  }) => Promise<void>;
  onLoginClick: () => void;
}

export function RegisterModal({ open, onOpenChange, onRegister, onLoginClick }: RegisterModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    password: "",
    telefone: "",
    role: "user",
    tipoOrganizacao: "",
    aldeiaId: "",
  });
  const [aldeias, setAldeias] = useState<Aldeia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      fetchAldeias();
    }
  }, [open]);

  const fetchAldeias = async () => {
    try {
      const response = await fetch("/api/aldeias");
      const data = await response.json();
      if (data.data) {
        setAldeias(data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar aldeias:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = {
        ...formData,
        tipoOrganizacao: formData.role === "aldeia_admin" ? formData.tipoOrganizacao : undefined,
        aldeiaId: formData.role !== "aldeia_admin" && formData.aldeiaId ? formData.aldeiaId : undefined,
      };
      await onRegister(data);
      setFormData({
        nome: "",
        email: "",
        password: "",
        telefone: "",
        role: "user",
        tipoOrganizacao: "",
        aldeiaId: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Conta</DialogTitle>
          <DialogDescription>
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
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                type="tel"
                placeholder="+351 9XX XXX XXX"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Tipo de Conta</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Jogador</SelectItem>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="aldeia_admin">Organização</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role !== "aldeia_admin" && aldeias.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="aldeia">Aldeia/Organização *</Label>
                <Select
                  value={formData.aldeiaId}
                  onValueChange={(value) => setFormData({ ...formData, aldeiaId: value })}
                >
                  <SelectTrigger>
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

            {formData.role === "aldeia_admin" && (
              <div className="grid gap-2">
                <Label htmlFor="tipoOrganizacao">Tipo de Organização</Label>
                <Select
                  value={formData.tipoOrganizacao}
                  onValueChange={(value) => setFormData({ ...formData, tipoOrganizacao: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aldeia">Aldeia</SelectItem>
                    <SelectItem value="escola">Escola</SelectItem>
                    <SelectItem value="associacao_pais">Associação de Pais</SelectItem>
                    <SelectItem value="clube">Clube</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter className="flex-col gap-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "A registar..." : "Registar"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Já tem conta?{" "}
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onLoginClick();
                }}
                className="text-primary hover:underline"
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
