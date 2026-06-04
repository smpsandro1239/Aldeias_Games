"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Constants for organization types
const TIPO_ORGANIZACAO = {
  ALDEIA: 'aldeia',
  ESCOLA: 'escola',
  ASSOCIACAO_PAIS: 'associacao_pais',
  CLUBE: 'clube'
} as const;

type TipoOrganizacao = typeof TIPO_ORGANIZACAO[keyof typeof TIPO_ORGANIZACAO];

export interface AldeiaData {
   id?: string;
   nome: string;
   tipoOrganizacao: TipoOrganizacao;
   descricao?: string;
   telefone?: string;
   email?: string;
}

interface AldeiaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AldeiaData) => Promise<void>;
  initialData?: AldeiaData;
  loading?: boolean;
}

export function AldeiaModal({ open, onOpenChange, onSubmit, initialData, loading = false }: AldeiaModalProps) {
  const [formData, setFormData] = useState<AldeiaData>({
    nome: "",
    tipoOrganizacao: TIPO_ORGANIZACAO.ALDEIA,
    descricao: "",
    telefone: "",
    email: "",
  });
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (initialData && open) {
      setFormData(initialData);
    } else if (!open) {
      setFormData({
        nome: "",
        tipoOrganizacao: TIPO_ORGANIZACAO.ALDEIA,
        descricao: "",
        telefone: "",
        email: "",
      });
    }
  }, [initialData, open]);

  const handleChange = useCallback((field: keyof AldeiaData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleTipoChange = useCallback((value: TipoOrganizacao) => {
    setFormData(prev => ({ ...prev, tipoOrganizacao: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Organização" : "Nova Organização"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Edite as propriedades da organização." : "Registe uma nova organização."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[60vh]">
          <div className="grid gap-4 py-4 pr-2">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo de Organização *</Label>
              <Select
                value={formData.tipoOrganizacao}
                onValueChange={handleTipoChange}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={TIPO_ORGANIZACAO.ALDEIA}>Aldeia</SelectItem>
                  <SelectItem value={TIPO_ORGANIZACAO.ESCOLA}>Escola</SelectItem>
                  <SelectItem value={TIPO_ORGANIZACAO.ASSOCIACAO_PAIS}>Associação de Pais</SelectItem>
                  <SelectItem value={TIPO_ORGANIZACAO.CLUBE}>Clube Desportivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone || ""}
                onChange={(e) => handleChange("telefone", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao || ""}
                onChange={(e) => handleChange("descricao", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-background pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading || localLoading}>
              {loading || localLoading ? "A guardar..." : (initialData ? "Guardar Alterações" : "Criar Organização")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
