"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Home, School, Users, Music, Phone, Mail, FileText } from "lucide-react";

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
        <DialogHeader className="bg-gradient-to-r from-amber-600/10 via-orange-600/10 to-yellow-600/10 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-amber-500/20">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="bg-amber-600/20 p-2 rounded-lg">
              <Building2 className="h-5 w-5 text-amber-600" />
            </div>
            {initialData ? "Editar Organização" : "Nova Organização"}
          </DialogTitle>
          <DialogDescription>
            {initialData ? "Edite as propriedades da organização." : "Registe uma nova organização."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[60vh]">
          <div className="grid gap-4 py-4 pr-2">
            <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Building2 className="h-3 w-3" /> Informação
              </p>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="nome" className="text-sm font-medium">Nome *</Label>
                  <div className="relative">
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => handleChange("nome", e.target.value)}
                      required
                      className="pl-10"
                    />
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="tipo" className="text-sm font-medium">Tipo de Organização *</Label>
                  <Select
                    value={formData.tipoOrganizacao}
                    onValueChange={handleTipoChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TIPO_ORGANIZACAO.ALDEIA}>
                        <div className="flex items-center gap-2"><Home className="h-4 w-4" /> Aldeia</div>
                      </SelectItem>
                      <SelectItem value={TIPO_ORGANIZACAO.ESCOLA}>
                        <div className="flex items-center gap-2"><School className="h-4 w-4" /> Escola</div>
                      </SelectItem>
                      <SelectItem value={TIPO_ORGANIZACAO.ASSOCIACAO_PAIS}>
                        <div className="flex items-center gap-2"><Users className="h-4 w-4" /> Associação de Pais</div>
                      </SelectItem>
                      <SelectItem value={TIPO_ORGANIZACAO.CLUBE}>
                        <div className="flex items-center gap-2"><Music className="h-4 w-4" /> Clube Desportivo</div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Mail className="h-3 w-3" /> Contacto
              </p>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="pl-10"
                    />
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                      <Mail className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="telefone" className="text-sm font-medium">Telefone</Label>
                  <div className="relative">
                    <Input
                      id="telefone"
                      value={formData.telefone || ""}
                      onChange={(e) => handleChange("telefone", e.target.value)}
                      className="pl-10"
                    />
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                      <Phone className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <FileText className="h-3 w-3" /> Descrição
              </p>
              <div className="grid gap-2">
                <Label htmlFor="descricao" className="text-sm font-medium">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao || ""}
                  onChange={(e) => handleChange("descricao", e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-background pt-2 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading || localLoading} className="bg-amber-600 hover:bg-amber-700">
              {loading || localLoading ? "A guardar..." : (initialData ? "Guardar Alterações" : "Criar Organização")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
