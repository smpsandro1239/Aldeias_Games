"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

// Constants for variants
const MODAL_VARIANTS = {
  DEFAULT: 'default',
  DESTRUCTIVE: 'destructive'
} as const;

type ModalVariant = typeof MODAL_VARIANTS[keyof typeof MODAL_VARIANTS];

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ModalVariant;
  onConfirm: () => void;
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = MODAL_VARIANTS.DEFAULT,
  onConfirm,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="confirm-modal-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {variant === MODAL_VARIANTS.DESTRUCTIVE && (
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription id="confirm-modal-description">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === MODAL_VARIANTS.DESTRUCTIVE ? "destructive" : "default"}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}