"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useAccessibility } from "@/hooks/useAccessibility";

export interface ToastProps {
  id: string;
  type: "success" | "error" | "warning" | "info" | "win";
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose: (id: string) => void;
}

const icons = {
  success: Check,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  win: Check,
};

const colors = {
  success: {
    bg: "bg-primary/10",
    border: "border-green-500/30",
    icon: "text-primary",
    title: "text-green-400",
  },
  error: {
    bg: "bg-destructive/10",
    border: "border-red-500/30",
    icon: "text-destructive",
    title: "text-red-400",
  },
  warning: {
    bg: "bg-accent/10",
    border: "border-yellow-500/30",
    icon: "text-accent",
    title: "text-primary",
  },
  info: {
    bg: "bg-secondary/10",
    border: "border-blue-500/30",
    icon: "text-secondary",
    title: "text-primary",
  },
  win: {
    bg: "bg-primary/10",
    border: "border-primary/30",
    icon: "text-primary",
    title: "text-primary",
  },
};

export function Toast({ id, type, title, message, action, onClose }: ToastProps) {
  const Icon = icons[type];
  const colorScheme = colors[type];
  const { prefersReducedMotion, announce } = useAccessibility();
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Announce to screen readers
    const announcement = message || title;
    announce(announcement, type === "error" ? "assertive" : "polite");

    // Focus management
    toastRef.current?.focus();
  }, [announce, message, title, type]);

  const handleClose = () => {
    onClose(id);
  };

  return (
    <motion.div
      ref={toastRef}
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -20, scale: prefersReducedMotion ? 1 : 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -10, scale: prefersReducedMotion ? 1 : 0.95 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
      role="alert"
      aria-live={type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      tabIndex={-1}
      className={`${colorScheme.bg} ${colorScheme.border} border rounded-xl p-4 shadow-lg backdrop-blur-sm max-w-sm w-full pointer-events-auto`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${colorScheme.icon}`}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold ${colorScheme.title}`}>{title}</p>
          {message && (
            <p className="text-sm text-foreground/70 mt-1">{message}</p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="text-sm font-medium text-primary hover:text-primary/80 mt-2 focus:outline-none focus:underline"
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded hover:bg-foreground/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
          aria-label="Fechar notificação"
        >
          <X className="h-4 w-4 text-foreground/50" />
        </button>
      </div>
    </motion.div>
  );
}

// Toast container with keyboard navigation
interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const { prefersReducedMotion } = useAccessibility();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (toasts.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % toasts.length);
          break;
        case "ArrowUp":
        case "ArrowLeft":
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + toasts.length) % toasts.length);
          break;
        case "Escape":
          if (focusedIndex >= 0) {
            onClose(toasts[focusedIndex].id);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toasts, focusedIndex, onClose]);

  return (
    <div
      ref={containerRef}
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-label="Notificações"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast, index) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              {...toast}
              onClose={onClose}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Screen reader only class
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <div className="sr-only">
      {children}
    </div>
  );
}
