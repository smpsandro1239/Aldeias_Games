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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EventoData {
  id?: string;
  nome: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  objectivoAngariacao?: number;
  publico: boolean;
  aldeiaId: string;
}

interface CreateEventoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EventoData) => Promise<void>;
  aldeiaId?: string;
  initialData?: any;
  aldeias?: any[];
}

export function CreateEventoModal({ open, onOpenChange, onSubmit, aldeiaId, initialData, aldeias }: CreateEventoModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    dataInicio: "",
    dataFim: "",
    objectivoAngariacao: "",
    publico: false,
    aldeiaId: aldeiaId || "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData && open) {
      setFormData({
        nome: initialData.nome || "",
        descricao: initialData.descricao || "",
        dataInicio: initialData.dataInicio ? new Date(initialData.dataInicio).toISOString().slice(0, 16) : "",
        dataFim: initialData.dataFim ? new Date(initialData.dataFim).toISOString().slice(0, 16) : "",
        objectivoAngariacao: initialData.objectivoAngariacao ? String(initialData.objectivoAngariacao) : "",
        publico: initialData.publico || false,
        aldeiaId: initialData.aldeiaId || aldeiaId || "",
      });
    } else if (!open) {
      setFormData({
        nome: "",
        descricao: "",
        dataInicio: "",
        dataFim: "",
        objectivoAngariacao: "",
        publico: false,
        aldeiaId: aldeiaId || "",
      });
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        id: initialData?.id,
        nome: formData.nome,
        descricao: formData.descricao || undefined,
        dataInicio: formData.dataInicio,
        dataFim: formData.dataFim,
        objectivoAngariacao: formData.objectivoAngariacao
          ? parseFloat(formData.objectivoAngariacao)
          : undefined,
        publico: formData.publico,
        aldeiaId: formData.aldeiaId,
      });

      if (!initialData) {
        setFormData({
          nome: "",
          descricao: "",
          dataInicio: "",
          dataFim: "",
          objectivoAngariacao: "",
          publico: false,
          aldeiaId: aldeiaId || "",
        });
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Evento" : "Novo Evento"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Edite as informações do evento." : "Crie um novo evento de angariação de fundos."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {aldeias && aldeias.length > 0 && !initialData && (
              <div className="grid gap-2">
                <Label htmlFor="aldeia">Aldeia/Organização *</Label>
                <Select
                  value={formData.aldeiaId}
                  onValueChange={(value) => setFormData({ ...formData, aldeiaId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma aldeia" />
                  </SelectTrigger>
                  <SelectContent>
                    {aldeias.map((al) => (
                      <SelectItem key={al.id} value={al.id}>
                        {al.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Evento *</Label>
              <Input
                id="nome"
                placeholder="Ex: Festa de Verão 2024"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o evento..."
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dataInicio">Data de Início *</Label>
                <Input
                  id="dataInicio"
                  type="datetime-local"
                  value={formData.dataInicio}
                  onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dataFim">Data de Fim *</Label>
                <Input
                  id="dataFim"
                  type="datetime-local"
                  value={formData.dataFim}
                  onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="objectivo">Objetivo de Angariação (€)</Label>
              <Input
                id="objectivo"
                type="number"
                min="0"
                step="0.01"
                placeholder="5000"
                value={formData.objectivoAngariacao}
                onChange={(e) => setFormData({ ...formData, objectivoAngariacao: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="publico">Evento Público</Label>
                <p className="text-sm text-muted-foreground">
                  Visível para todos os utilizadores
                </p>
              </div>
              <Switch
                id="publico"
                checked={formData.publico}
                onCheckedChange={(checked) => setFormData({ ...formData, publico: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "A guardar..." : (initialData ? "Guardar Alterações" : "Criar Evento")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
