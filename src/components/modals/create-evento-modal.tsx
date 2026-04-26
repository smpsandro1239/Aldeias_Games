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
import { Gift, Star, Award, Gamepad2 } from "lucide-react";

interface EventoData {
  id?: string;
  nome: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  objectivoAngariacao?: number;
  publico: boolean;
  aldeiaId: string;
  estado: "rascunho" | "ativo" | "fechado" | "finalizado";
  jogosSelecionados?: string[]; // tipos de jogos para criar: raspadinha, rifa, tombola, poio_vaca
}

const TIPOS_JOGOS = [
  { id: "raspadinha", nome: "Raspadinha", descricao: "Jogo de raspar instantâneo", icon: Gift },
  { id: "rifa", nome: "Rifa", descricao: "Sorteio de números", icon: Star },
  { id: "tombola", nome: "Tombola", descricao: "Lotaria tradicional", icon: Award },
  { id: "poio_vaca", nome: "Poio da Vaca", descricao: "Jogo rápido", icon: Gamepad2 },
];

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
    estado: "rascunho" as "rascunho" | "ativo" | "fechado" | "finalizado",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [jogosSelecionados, setJogosSelecionados] = useState<string[]>([]);

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
        estado: initialData.estado || "rascunho",
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
        estado: "rascunho",
      });
    }
  }, [initialData, open, aldeiaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!formData.nome || formData.nome.length < 2) {
      newErrors.nome = "Nome deve ter pelo menos 2 caracteres";
    }
    if (!formData.dataInicio) {
      newErrors.dataInicio = "Data de início é obrigatória";
    }
    if (!formData.dataFim) {
      newErrors.dataFim = "Data de fim é obrigatória";
    }
    if (formData.dataInicio && formData.dataFim && new Date(formData.dataFim) < new Date(formData.dataInicio)) {
      newErrors.dataFim = "Data de fim deve ser posterior à data de início";
    }
    if (!formData.aldeiaId) {
      newErrors.aldeiaId = "Selecione uma organização";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
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
        estado: formData.estado,
        jogosSelecionados: jogosSelecionados,
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
          estado: "rascunho",
        });
      }
      onOpenChange(false);
      setErrors({});
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
                {errors.aldeiaId && <p className="text-sm text-destructive">{errors.aldeiaId}</p>}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Evento *</Label>
              <Input
                id="nome"
                placeholder="Ex: Festa de Verão 2024"
                value={formData.nome}
                onChange={(e) => {
                  setFormData({ ...formData, nome: e.target.value });
                  if (errors.nome) setErrors({ ...errors, nome: "" });
                }}
                required
              />
              <p className="text-xs text-muted-foreground">Nome que aparecerá nos cartões e materiais</p>
              {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
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
                  onChange={(e) => {
                    setFormData({ ...formData, dataInicio: e.target.value });
                    if (errors.dataInicio) setErrors({ ...errors, dataInicio: "" });
                  }}
                  required
                />
                <p className="text-xs text-muted-foreground">Data de inicio do evento</p>
                {errors.dataInicio && <p className="text-sm text-destructive">{errors.dataInicio}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dataFim">Data de Fim *</Label>
                <Input
                  id="dataFim"
                  type="datetime-local"
                  value={formData.dataFim}
                  onChange={(e) => {
                    setFormData({ ...formData, dataFim: e.target.value });
                    if (errors.dataFim) setErrors({ ...errors, dataFim: "" });
                  }}
                  required
                />
                <p className="text-xs text-muted-foreground">Data de fim do evento</p>
                {errors.dataFim && <p className="text-sm text-destructive">{errors.dataFim}</p>}
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
              <p className="text-xs text-muted-foreground">Valor objetivo a angariar (opcional)</p>
            </div>

            {/* Seleção de Jogos */}
            <div className="grid gap-2">
              <Label>Criar Jogos para este Evento</Label>
              <p className="text-xs text-muted-foreground mb-2">Selecione os tipos de jogos que deseja criar automaticamente</p>
              <div className="grid grid-cols-2 gap-2">
                {TIPOS_JOGOS.map((jogo) => {
                  const Icon = jogo.icon;
                  const selecionado = jogosSelecionados.includes(jogo.id);
                  return (
                    <button
                      key={jogo.id}
                      type="button"
                      onClick={() => {
                        if (selecionado) {
                          setJogosSelecionados(jogosSelecionados.filter(j => j !== jogo.id));
                        } else {
                          setJogosSelecionados([...jogosSelecionados, jogo.id]);
                        }
                      }}
                      className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${
                        selecionado 
                          ? "border-primary bg-primary/10" 
                          : "border-outline-variant/20 bg-surface-container hover:border-primary/30"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${selecionado ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-sm font-medium ${selecionado ? "text-primary" : "text-muted-foreground"}`}>
                        {jogo.nome}
                      </span>
                    </button>
                  );
                })}
              </div>
              {jogosSelecionados.length > 0 && (
                <p className="text-xs text-primary">
                  {jogosSelecionados.length} jogo(s) será(ão) criado(s) automaticamente
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="estado">Estado do Evento</Label>
              <Select
                value={formData.estado}
                onValueChange={(value: "rascunho" | "ativo" | "fechado" | "finalizado") => 
                  setFormData({ ...formData, estado: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Evento ativo fica visível para participantes</p>
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