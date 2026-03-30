"use client";

import { useEffect, useRef, ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useAccessibility } from "@/hooks/useAccessibility";

interface AccessibleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-[95vw] max-h-[95vh]",
};

export function AccessibleModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const { prefersReducedMotion, announce } = useAccessibility();

  // Focus management
  useEffect(() => {
    if (open) {
      // Store current focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Focus the modal or first focusable element
      setTimeout(() => {
        const focusable = modalRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        (focusable || modalRef.current)?.focus();
      }, 10);

      // Prevent body scroll
      document.body.style.overflow = "hidden";

      // Announce to screen readers
      announce(`${title} diálogo aberto`);
    } else {
      // Restore body scroll
      document.body.style.overflow = "";

      // Return focus to previous element
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, title, announce]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        onOpenChange(false);
        return;
      }

      if (e.key !== "Tab") return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
      ].join(", ");

      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>(focusableSelectors)
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, closeOnEscape, onOpenChange]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
      role="presentation"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal */}
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
        initial={{ scale: prefersReducedMotion ? 1 : 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: prefersReducedMotion ? 1 : 0.95, opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        className={`
          relative w-full ${sizes[size]}
          bg-[#1f1b19] rounded-2xl border border-[#ff734b]/20
          shadow-2xl shadow-black/50 overflow-hidden
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <h2 id="modal-title" className="text-xl font-bold text-white">
              {title}
            </h2>
            {description && (
              <p id="modal-description" className="text-sm text-[#e0bfb7] mt-1">
                {description}
              </p>
            )}
          </div>
          
          {showCloseButton && (
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff734b]/50"
              aria-label="Fechar diálogo"
            >
              <X className="h-5 w-5 text-white/70" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Confirmation dialog
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { prefersReducedMotion } = useAccessibility();

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AccessibleModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="sm"
    >
      <div className="space-y-6">
        <p className="text-[#e0bfb7]">{description}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-[#ff734b]/30 text-[#ff734b] hover:bg-[#ff734b]/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff734b]/50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`
              px-4 py-2 rounded-xl font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1f1b19]
              ${variant === "destructive"
                ? "bg-red-500 hover:bg-red-600 text-white focus-visible:ring-red-500"
                : "bg-[#ff734b] hover:bg-[#ff734b]/90 text-[#110d0c] focus-visible:ring-[#ff734b]"
              }
              disabled:opacity-50
            `}
          >
            {loading ? "A processar..." : confirmLabel}
          </button>
        </div>
      </div>
    </AccessibleModal>
  );
}
