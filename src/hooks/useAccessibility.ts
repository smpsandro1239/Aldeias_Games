"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface A11yOptions {
  announceText?: boolean;
  reducedMotion?: boolean;
  highContrast?: boolean;
  largeText?: boolean;
}

export interface FocusTrapOptions {
  enabled: boolean;
  onEscape?: () => void;
}

export function useFocusTrap(options: FocusTrapOptions) {
  const containerRef = useRef<HTMLElement>(null);
  const { enabled, onEscape } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    const getFocusableElements = () =>
      Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && onEscape) {
        onEscape();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    const focusable = getFocusableElements();
    focusable[0]?.focus();

    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onEscape]);

  return containerRef;
}

export function useAccessibility() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);
  const [prefersLargeText, setPrefersLargeText] = useState(false);

  useEffect(() => {
    // Check reduced motion preference
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(motionQuery.matches);
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    motionQuery.addEventListener("change", handleMotionChange);

    // Check high contrast preference
    const contrastQuery = window.matchMedia("(prefers-contrast: more)");
    setPrefersHighContrast(contrastQuery.matches);
    
    const handleContrastChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };
    contrastQuery.addEventListener("change", handleContrastChange);

    // Check large text preference (via font size detection)
    const detectLargeText = () => {
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      setPrefersLargeText(rootFontSize >= 18);
    };
    
    detectLargeText();
    const resizeObserver = new ResizeObserver(detectLargeText);
    resizeObserver.observe(document.documentElement);

    return () => {
      motionQuery.removeEventListener("change", handleMotionChange);
      contrastQuery.removeEventListener("change", handleContrastChange);
      resizeObserver.disconnect();
    };
  }, []);

  // Announce text to screen readers
  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    const announcer = document.createElement("div");
    announcer.setAttribute("role", "status");
    announcer.setAttribute("aria-live", priority);
    announcer.setAttribute("aria-atomic", "true");
    announcer.className = "sr-only";
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(announcer);
    
    // Small delay to ensure screen reader picks up the change
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }, []);

  // Get animation duration based on reduced motion preference
  const getAnimationDuration = useCallback((baseDuration: number): number => {
    return prefersReducedMotion ? 0 : baseDuration;
  }, [prefersReducedMotion]);

  // Focus management
  const focusElement = useCallback((selector: string | HTMLElement) => {
    const element = typeof selector === "string" 
      ? document.querySelector<HTMLElement>(selector)
      : selector;
    
    if (element) {
      element.focus();
      
      // Scroll into view if needed
      element.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
    }
  }, [prefersReducedMotion]);

  // Get aria attributes for common patterns
  const getButtonAria = useCallback((label: string, isLoading?: boolean) => ({
    "aria-label": label,
    "aria-disabled": isLoading,
    role: "button",
  }), []);

  const getDialogAria = useCallback((title: string, description?: string) => ({
    role: "dialog",
    "aria-modal": true,
    "aria-labelledby": "dialog-title",
    "aria-describedby": description ? "dialog-description" : undefined,
  }), []);


  return {
    // Preferences
    prefersReducedMotion,
    prefersHighContrast,
    prefersLargeText,
    
    // Utilities
    announce,
    getAnimationDuration,
    focusElement,
    getButtonAria,
    getDialogAria,
    useFocusTrap,
  };
}

// Hook for keyboard navigation
export function useKeyboardNavigation(items: HTMLElement[], options?: {
  orientation?: "horizontal" | "vertical" | "both";
  loop?: boolean;
  onSelect?: (index: number) => void;
}) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const orientation = options?.orientation || "vertical";
  const loop = options?.loop ?? true;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (items.length === 0) return;

    let newIndex = focusedIndex;
    const isVertical = orientation === "vertical" || orientation === "both";
    const isHorizontal = orientation === "horizontal" || orientation === "both";

    switch (e.key) {
      case "ArrowDown":
        if (isVertical) {
          e.preventDefault();
          newIndex = focusedIndex + 1;
          if (newIndex >= items.length) newIndex = loop ? 0 : items.length - 1;
        }
        break;
      case "ArrowUp":
        if (isVertical) {
          e.preventDefault();
          newIndex = focusedIndex - 1;
          if (newIndex < 0) newIndex = loop ? items.length - 1 : 0;
        }
        break;
      case "ArrowRight":
        if (isHorizontal) {
          e.preventDefault();
          newIndex = focusedIndex + 1;
          if (newIndex >= items.length) newIndex = loop ? 0 : items.length - 1;
        }
        break;
      case "ArrowLeft":
        if (isHorizontal) {
          e.preventDefault();
          newIndex = focusedIndex - 1;
          if (newIndex < 0) newIndex = loop ? items.length - 1 : 0;
        }
        break;
      case "Home":
        e.preventDefault();
        newIndex = 0;
        break;
      case "End":
        e.preventDefault();
        newIndex = items.length - 1;
        break;
      case "Enter":
      case " ":
        if (focusedIndex >= 0 && options?.onSelect) {
          e.preventDefault();
          options.onSelect(focusedIndex);
        }
        break;
    }

    if (newIndex !== focusedIndex && items[newIndex]) {
      setFocusedIndex(newIndex);
      items[newIndex].focus();
    }
  }, [focusedIndex, items, orientation, loop, options]);

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    props: {
      onKeyDown: handleKeyDown,
      role: "listbox",
    },
  };
}

// Skip link component helper
export function useSkipLink(targetId: string, label: string = "Saltar para o conteúdo principal") {
  return {
    href: `#${targetId}`,
    children: label,
  };
}

// Generate unique IDs for accessibility
let idCounter = 0;
export function useUniqueId(prefix: string = "a11y"): string {
  const [id] = useState(() => `${prefix}-${++idCounter}`);
  return id;
}
