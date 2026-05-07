"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface AldeiaData {
   id?: string;
   nome: string;
   tipoOrganizacao: "aldeia" | "escola" | "associacao_pais" | "clube";
   descricao?: string;
   telefone?: string;
   email?: string;
}

interface AldeiaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AldeiaData) => Promise<void>;
  initialData?: AldeiaData;
}

export function AldeiaModal({ open, onOpenChange, onSubmit, initialData }: AldeiaModalProps) {
  const [formData, setFormData] = useState<AldeiaData>({
    nome: "",
    tipoOrganizacao: "aldeia",
    descricao: "",
    telefone: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData && open) {
      setFormData(initialData);
    } else if (!open) {
      setFormData({
        nome: "",
        tipoOrganizacao: "aldeia",
        descricao: "",
        telefone: "",
        email: "",
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
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo de Organização *</Label>
              <Select
                value={formData.tipoOrganizacao}
                onValueChange={(value: "aldeia" | "escola" | "associacao_pais" | "clube") => setFormData({ ...formData, tipoOrganizacao: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aldeia">Aldeia</SelectItem>
                  <SelectItem value="escola">Escola</SelectItem>
                  <SelectItem value="associacao_pais">Associação de Pais</SelectItem>
                  <SelectItem value="clube">Clube Desportivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone || ""}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao || ""}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-background pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "A guardar..." : (initialData ? "Guardar Alterações" : "Criar Organização")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
