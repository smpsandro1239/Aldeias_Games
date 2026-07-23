"use client";
import { apiRequest } from '@/lib/api-client';

import { useState, useEffect, useCallback, useMemo, useReducer } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/modals/confirm-modal";
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

// Constants for form validation to avoid magic strings
const FORM_VALIDATION = {
  MIN_NOME_LENGTH: 2,
  MAX_DESCRICAO_LENGTH: 500,
  MAX_IMAGEM_URL_LENGTH: 2048,
} as const;

// Constants for drag directions
const DRAG_DIRECTIONS = {
  UP: 'up',
  DOWN: 'down'
} as const;

type DragDirection = typeof DRAG_DIRECTIONS[keyof typeof DRAG_DIRECTIONS];

interface Premio {
  id?: string;
  nome: string;
  descricao?: string;
  imagemUrl?: string;
  valorDinheiroAlternative?: number;
  ordem: number;
}

interface PremioFormData {
  nome: string;
  descricao: string;
  imagemUrl: string;
  valorDinheiroAlternative: number;
  ordem: number;
}

interface PremioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  premio?: Premio | null;
  aldeiaId: string;
  jogoId?: string;
  onSave?: (premio: Premio) => void;
  onDelete?: (id: string) => void;
}

interface PremioListProps {
  premios: Premio[];
  onEdit: (premio: Premio) => void;
  onDelete: (id: string) => void;
  onReorder: (premios: Premio[]) => void;
}

// Reducer actions for form state management
type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DELETING'; payload: boolean }
  | { type: 'UPDATE_FORM_DATA'; payload: Partial<PremioFormData> }
  | { type: 'RESET_FORM' };

// Initial state
const getInitialFormState = (): PremioFormData => ({
  nome: "",
  descricao: "",
  imagemUrl: "",
  valorDinheiroAlternative: 0,
  ordem: 0,
});

// Reducer
function premioFormReducer(state: PremioFormData, action: Action): PremioFormData {
  switch (action.type) {
    case 'SET_LOADING':
    case 'SET_DELETING':
      return state; // Loading states are separate
    case 'UPDATE_FORM_DATA':
      return { ...state, ...action.payload };
    case 'RESET_FORM':
      return getInitialFormState();
    default:
      return state;
  }
}

export function PremioModal({
  open,
  onOpenChange,
  premio,
  aldeiaId,
  jogoId,
  onSave,
  onDelete
}: PremioModalProps) {
  const [formData, dispatch] = useReducer(premioFormReducer, getInitialFormState());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form validation
  const validateForm = useCallback((): string[] => {
    const errors: string[] = [];

    if (!formData.nome.trim()) {
      errors.push("Nome do prémio é obrigatório");
    } else if (formData.nome.trim().length < FORM_VALIDATION.MIN_NOME_LENGTH) {
      errors.push(`Nome deve ter pelo menos ${FORM_VALIDATION.MIN_NOME_LENGTH} caracteres`);
    }

    if (formData.descricao && formData.descricao.length > FORM_VALIDATION.MAX_DESCRICAO_LENGTH) {
      errors.push(`Descrição deve ter no máximo ${FORM_VALIDATION.MAX_DESCRICAO_LENGTH} caracteres`);
    }

    if (formData.imagemUrl && formData.imagemUrl.length > FORM_VALIDATION.MAX_IMAGEM_URL_LENGTH) {
      errors.push(`URL da imagem deve ter no máximo ${FORM_VALIDATION.MAX_IMAGEM_URL_LENGTH} caracteres`);
    }

    if (formData.valorDinheiroAlternative && formData.valorDinheiroAlternative < 0) {
      errors.push("Valor alternativo não pode ser negativo");
    }

    return errors;
  }, [formData]);

  // Reset form when modal opens/closes or premio changes
  useEffect(() => {
    if (premio) {
      dispatch({ type: 'UPDATE_FORM_DATA', payload: premio });
    } else {
      dispatch({ type: 'RESET_FORM' });
    }
  }, [premio, open]);

  // Form field update handlers
  const updateFormField = useCallback((field: keyof PremioFormData, value: string | number) => {
    dispatch({ type: 'UPDATE_FORM_DATA', payload: { [field]: value } });
  }, []);

  const handleNomeChange = useCallback((value: string) => {
    updateFormField('nome', value);
  }, [updateFormField]);

  const handleDescricaoChange = useCallback((value: string) => {
    updateFormField('descricao', value);
  }, [updateFormField]);

  const handleImagemUrlChange = useCallback((value: string) => {
    updateFormField('imagemUrl', value);
  }, [updateFormField]);

  const handleValorChange = useCallback((value: number) => {
    updateFormField('valorDinheiroAlternative', value);
  }, [updateFormField]);

  const handleSave = useCallback(async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setSaving(true);

    try {
      const url = premio?.id ? `/api/premios/${premio.id}` : "/api/premios";
      const method = premio?.id ? "PUT" : "POST";

      const premioData = {
        ...formData,
        aldeiaId,
        jogoId: jogoId || null,
      };

      const res = await apiRequest(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(premioData),
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
  }, [formData, validateForm, premio?.id, onSave, onOpenChange, aldeiaId, jogoId]);

  const handleDelete = useCallback(async () => {
    if (!premio?.id) return;

    setDeleting(true);

    try {
      const res = await apiRequest(`/api/premios/${premio.id}`, {
        method: "DELETE",
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
      console.error("Erro ao eliminar prémio:", error);
      toast.error("Erro ao eliminar prémio");
    } finally {
      setDeleting(false);
    }
  }, [premio?.id, onDelete, onOpenChange]);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-container border-primary/20 p-0 max-w-md overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
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
            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Nome do Prémio *
            </Label>
            <Input
              id="premio-nome"
              placeholder="Ex: Vale de 50€"
              value={formData.nome}
              onChange={(e) => handleNomeChange(e.target.value)}
              className="bg-surface-container-low border-transparent text-foreground"
              aria-describedby="nome-description"
              required
            />
            <p id="nome-description" className="sr-only">Nome obrigatório do prémio (mínimo 2 caracteres)</p>
          </div>

          {/* Descrição */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Descrição
            </Label>
            <Input
              id="premio-descricao"
              placeholder="Descrição do prémio"
              value={formData.descricao}
              onChange={(e) => handleDescricaoChange(e.target.value)}
              className="bg-surface-container-low border-transparent text-foreground"
              aria-describedby="descricao-description"
              maxLength={FORM_VALIDATION.MAX_DESCRICAO_LENGTH}
            />
            <p id="descricao-description" className="sr-only">Descrição opcional do prémio (máximo 500 caracteres)</p>
          </div>

          {/* Valor em Dinheiro */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Valor em Dinheiro (alternativa)
            </Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                id="premio-valor"
                value={formData.valorDinheiroAlternative || ""}
                onChange={(e) => handleValorChange(parseFloat(e.target.value) || 0)}
                aria-describedby="valor-description"
                className="pl-10 bg-surface-container-low border-transparent text-foreground"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Se preferir dar dinheiro em vez do prémio físico
            </p>
          </div>

          {/* Imagem URL */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              URL da Imagem
            </Label>
            <div className="relative">
              <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" aria-hidden="true" />
              <Input
                id="premio-imagem"
                placeholder="https://..."
                value={formData.imagemUrl}
                onChange={(e) => handleImagemUrlChange(e.target.value)}
                className="pl-10 bg-surface-container-low border-transparent text-foreground"
                aria-describedby="imagem-description"
                maxLength={FORM_VALIDATION.MAX_IMAGEM_URL_LENGTH}
              />
            </div>
            <p id="imagem-description" className="sr-only">URL opcional da imagem do prémio</p>
          </div>

          {/* Preview */}
          {formData.imagemUrl && (
            <div className="bg-surface-container-low rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-2">Preview:</p>
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
          <div className="bg-secondary/10 rounded-xl p-4 flex items-start gap-3">
            <Gift className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-secondary">
              Os prémios são ordenados por ordem de atribuição. O 1º prémio vai ao 1º número sorteado, o 2º ao 2º número, etc.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3">
          {premio?.id && (
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="border-red-500/30 text-destructive hover:bg-destructive/10"
              aria-label={`Eliminar prémio "${premio.nome}"`}
            >
              <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
              {deleting ? "A eliminar..." : "Eliminar"}
            </Button>
          )}
          <div className="flex-1" />
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-primary/30 text-primary"
            aria-label="Cancelar e fechar modal"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            aria-label={premio?.id ? `Guardar alterações do prémio "${premio.nome}"` : "Criar novo prémio"}
          >
            {saving ? "A guardar..." : premio?.id ? "Guardar" : "Criar Prémio"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <ConfirmModal
      open={showDeleteConfirm}
      onOpenChange={setShowDeleteConfirm}
      title="Eliminar Prémio"
      description={`Tem certeza que deseja eliminar o prémio "${premio?.nome}"? Esta ação não pode ser desfeita.`}
      confirmText="Eliminar"
      variant="destructive"
      onConfirm={() => { setShowDeleteConfirm(false); handleDelete(); }}
    />
    </>
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

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    const newList = [...premios];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    onReorder(newList);
  }, [premios, onReorder]);

  const handleMoveDown = useCallback((index: number) => {
    if (index === premios.length - 1) return;
    const newList = [...premios];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    onReorder(newList);
  }, [premios, onReorder]);

  const handleEdit = useCallback((premio: Premio) => {
    onEdit(premio);
  }, [onEdit]);

  const handleDelete = useCallback((id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja eliminar o prémio "${nome}"?`)) {
      onDelete(id);
    }
  }, [onDelete]);

  return (
    <div className="space-y-2">
      {premios.length === 0 ? (
        <div className="bg-surface-container rounded-xl p-6 text-center border border-outline-variant/10">
          <Gift className="h-10 w-10 text-primary mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">Nenhum prémio adicionado</p>
        </div>
      ) : (
        premios.map((premio, index) => (
          <motion.div
            key={premio.id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container rounded-xl p-4 border border-outline-variant/10 flex items-center gap-3"
          >
            {/* Order badge */}
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
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
              <div className="w-12 h-12 rounded-lg bg-surface-container-low flex items-center justify-center">
                <Gift className="h-5 w-5 text-primary" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{premio.nome}</p>
              <p className="text-xs text-muted-foreground truncate">
                {premio.descricao || ((premio.valorDinheiroAlternative ?? 0) > 0 && `€${premio.valorDinheiroAlternative}`)}
              </p>
            </div>

            {/* Value */}
            {(premio.valorDinheiroAlternative ?? 0) > 0 && (
              <Badge variant="outline" className="bg-primary/10 text-green-400 border-green-500/30">
                €{premio.valorDinheiroAlternative}
              </Badge>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1" role="group" aria-label={`Ações para prémio ${premio.nome}`}>
              <button
                type="button"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="p-2 rounded-lg hover:bg-surface-container-low disabled:opacity-30 transition-colors"
                aria-label={`Mover prémio "${premio.nome}" para cima`}
                aria-disabled={index === 0}
              >
                <ArrowUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => handleMoveDown(index)}
                disabled={index === premios.length - 1}
                className="p-2 rounded-lg hover:bg-surface-container-low disabled:opacity-30 transition-colors"
                aria-label={`Mover prémio "${premio.nome}" para baixo`}
                aria-disabled={index === premios.length - 1}
              >
                <ArrowDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => handleEdit(premio)}
                className="p-2 rounded-lg hover:bg-surface-container-low transition-colors"
                aria-label={`Editar prémio "${premio.nome}"`}
              >
                <Edit className="h-4 w-4 text-secondary" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => premio.id && handleDelete(premio.id, premio.nome)}
                className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                aria-label={`Eliminar prémio "${premio.nome}"`}
                disabled={!premio.id}
              >
                <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
