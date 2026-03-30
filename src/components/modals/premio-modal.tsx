"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Gift, 
  Plus, 
  Edit, 
  Trash2, 
  Image, 
  Euro,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";

interface Premio {
  id?: string;
  nome: string;
  descricao?: string;
  imagemUrl?: string;
  valorDinheiroAlternative?: number;
  ordem: number;
}

interface PremioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  premio?: Premio | null;
  aldeiaId: string;
  jogoId?: string;
  token: string;
  onSave?: (premio: Premio) => void;
  onDelete?: (id: string) => void;
}

export function PremioModal({ 
  open, 
  onOpenChange, 
  premio, 
  aldeiaId, 
  jogoId,
  token,
  onSave,
  onDelete 
}: PremioModalProps) {
  const [formData, setFormData] = useState<Premio>({
    nome: "",
    descricao: "",
    imagemUrl: "",
    valorDinheiroAlternative: 0,
    ordem: 0,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (premio) {
      setFormData(premio);
    } else {
      setFormData({
        nome: "",
        descricao: "",
        imagemUrl: "",
        valorDinheiroAlternative: 0,
        ordem: 0,
      });
    }
  }, [premio, open]);

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error("Nome do prémio é obrigatório");
      return;
    }

    setSaving(true);

    try {
      const url = premio?.id ? `/api/premios/${premio.id}` : "/api/premios";
      const method = premio?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          aldeiaId,
          jogoId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(premio ? "Prémio atualizado!" : "Prémio criado!");
        onSave?.(data.data || formData);
        onOpenChange(false);
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao guardar prémio");
      }
    } catch (error) {
      toast.error("Erro ao guardar prémio");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!premio?.id) return;

    setDeleting(true);

    try {
      const res = await fetch(`/api/premios/${premio.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success("Prémio eliminado!");
        onDelete?.(premio.id);
        onOpenChange(false);
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao eliminar prémio");
      }
    } catch (error) {
      toast.error("Erro ao eliminar prémio");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1f1b19] border-[#ff734b]/20 p-0 max-w-md overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-[#ff734b]" />
            {premio ? "Editar Prémio" : "Novo Prémio"}
          </DialogTitle>
          <DialogDescription>
            {premio
              ? "Altera os detalhes do prémio"
              : "Adiciona um novo prémio para o jogo"}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <Label className="text-xs text-[#e0bfb7] uppercase tracking-wider mb-2 block">
              Nome do Prémio *
            </Label>
            <Input
              placeholder="Ex: Vale de 50€"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="bg-[#2e2928] border-transparent text-white"
            />
          </div>

          {/* Descrição */}
          <div>
            <Label className="text-xs text-[#e0bfb7] uppercase tracking-wider mb-2 block">
              Descrição
            </Label>
            <Input
              placeholder="Descrição do prémio"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="bg-[#2e2928] border-transparent text-white"
            />
          </div>

          {/* Valor em Dinheiro */}
          <div>
            <Label className="text-xs text-[#e0bfb7] uppercase tracking-wider mb-2 block">
              Valor em Dinheiro (alternativa)
            </Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ff734b]" />
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.valorDinheiroAlternative || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    valorDinheiroAlternative: parseFloat(e.target.value) || 0,
                  })
                }
                className="pl-10 bg-[#2e2928] border-transparent text-white"
              />
            </div>
            <p className="text-xs text-[#e0bfb7] mt-1">
              Se preferir dar dinheiro em vez do prémio físico
            </p>
          </div>

          {/* Imagem URL */}
          <div>
            <Label className="text-xs text-[#e0bfb7] uppercase tracking-wider mb-2 block">
              URL da Imagem
            </Label>
            <div className="relative">
              <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ff734b]" />
              <Input
                placeholder="https://..."
                value={formData.imagemUrl}
                onChange={(e) => setFormData({ ...formData, imagemUrl: e.target.value })}
                className="pl-10 bg-[#2e2928] border-transparent text-white"
              />
            </div>
          </div>

          {/* Preview */}
          {formData.imagemUrl && (
            <div className="bg-[#2e2928] rounded-xl p-4">
              <p className="text-xs text-[#e0bfb7] mb-2">Preview:</p>
              <img
                src={formData.imagemUrl}
                alt={formData.nome}
                className="w-full h-32 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          {/* Info */}
          <div className="bg-[#9cefff]/10 rounded-xl p-4 flex items-start gap-3">
            <Gift className="h-5 w-5 text-[#9cefff] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#9cefff]">
              Os prémios são ordenados por ordem de atribuição. O 1º prémio vai ao 1º número sorteado, o 2º ao 2º número, etc.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3">
          {premio?.id && (
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="border-red-500/30 text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? "A eliminar..." : "Eliminar"}
            </Button>
          )}
          <div className="flex-1" />
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#ff734b]/30 text-[#ff734b]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#ff734b] hover:bg-[#ff734b]/90 text-[#110d0c] font-bold"
          >
            {saving ? "A guardar..." : premio?.id ? "Guardar" : "Criar Prémio"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Prize list manager
interface PremioListProps {
  premios: Premio[];
  onEdit: (premio: Premio) => void;
  onDelete: (id: string) => void;
  onReorder: (premios: Premio[]) => void;
}

export function PremioList({ premios, onEdit, onDelete, onReorder }: PremioListProps) {
  const [editingOrdem, setEditingOrdem] = useState<string | null>(null);
  const [tempOrdem, setTempOrdem] = useState(0);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newList = [...premios];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    onReorder(newList);
  };

  const handleMoveDown = (index: number) => {
    if (index === premios.length - 1) return;
    const newList = [...premios];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    onReorder(newList);
  };

  return (
    <div className="space-y-2">
      {premios.length === 0 ? (
        <div className="bg-[#1f1b19] rounded-xl p-6 text-center border border-[#58413b]/10">
          <Gift className="h-10 w-10 text-[#ff734b] mx-auto mb-2 opacity-50" />
          <p className="text-sm text-[#e0bfb7]">Nenhum prémio adicionado</p>
        </div>
      ) : (
        premios.map((premio, index) => (
          <motion.div
            key={premio.id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1f1b19] rounded-xl p-4 border border-[#58413b]/10 flex items-center gap-3"
          >
            {/* Order badge */}
            <div className="w-8 h-8 rounded-full bg-[#ff734b]/20 flex items-center justify-center text-[#ff734b] font-bold text-sm">
              {index + 1}
            </div>

            {/* Image */}
            {premio.imagemUrl ? (
              <img
                src={premio.imagemUrl}
                alt={premio.nome}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-[#2e2928] flex items-center justify-center">
                <Gift className="h-5 w-5 text-[#ff734b]" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{premio.nome}</p>
              <p className="text-xs text-[#e0bfb7] truncate">
                {premio.descricao || ((premio.valorDinheiroAlternative ?? 0) > 0 && `€${premio.valorDinheiroAlternative}`)}
              </p>
            </div>

            {/* Value */}
            {(premio.valorDinheiroAlternative ?? 0) > 0 && (
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                €{premio.valorDinheiroAlternative}
              </Badge>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="p-2 rounded-lg hover:bg-[#2e2928] disabled:opacity-30 transition-colors"
              >
                <ArrowUp className="h-4 w-4 text-[#e0bfb7]" />
              </button>
              <button
                onClick={() => handleMoveDown(index)}
                disabled={index === premios.length - 1}
                className="p-2 rounded-lg hover:bg-[#2e2928] disabled:opacity-30 transition-colors"
              >
                <ArrowDown className="h-4 w-4 text-[#e0bfb7]" />
              </button>
              <button
                onClick={() => onEdit(premio)}
                className="p-2 rounded-lg hover:bg-[#2e2928] transition-colors"
              >
                <Edit className="h-4 w-4 text-[#9cefff]" />
              </button>
              <button
                onClick={() => premio.id && onDelete(premio.id)}
                className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
