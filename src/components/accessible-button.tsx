"use client";

import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAccessibility } from "@/hooks/useAccessibility";

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  announceLoading?: boolean;
}

const variants = {
  primary: "bg-[#ff734b] hover:bg-[#ff734b]/90 text-[#110d0c] font-bold",
  secondary: "bg-[#9cefff]/20 hover:bg-[#9cefff]/30 text-[#9cefff]",
  outline: "border border-[#ff734b]/30 hover:bg-[#ff734b]/10 text-[#ff734b]",
  ghost: "hover:bg-[#2e2928] text-[#e0bfb7]",
  destructive: "bg-red-500 hover:bg-red-600 text-white",
};

const sizes = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-11 px-5 text-base rounded-xl",
  lg: "h-14 px-8 text-lg rounded-xl",
  icon: "h-10 w-10 rounded-xl",
};

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      fullWidth = false,
      announceLoading = true,
      disabled,
      className = "",
      onClick,
      ...props
    },
    ref
  ) => {
    const { prefersReducedMotion } = useAccessibility();
    const isDisabled = disabled || loading;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        onClick={handleClick}
        aria-disabled={isDisabled}
        aria-busy={loading}
        aria-label={loading && announceLoading ? `${children} - A carregar` : undefined}
        style={{
          transitionDuration: prefersReducedMotion ? "0ms" : undefined,
        }}
        className={`
          inline-flex items-center justify-center gap-2
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? "w-full" : ""}
          ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff734b]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#110d0c]
          disabled:pointer-events-none
          ${className}
        `.trim().replace(/\s+/g, " ")}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 
              className={`h-4 w-4 animate-spin ${iconPosition === "left" ? "order-1" : "order-2"}`} 
              aria-hidden="true"
            />
            <span className={iconPosition === "left" ? "order-2" : "order-1"}>
              A carregar...
            </span>
          </>
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <span className="order-1" aria-hidden="true">{icon}</span>
            )}
            <span className={icon && iconPosition === "left" ? "order-2" : icon && iconPosition === "right" ? "order-1" : ""}>
              {children}
            </span>
            {icon && iconPosition === "right" && (
              <span className="order-2" aria-hidden="true">{icon}</span>
            )}
          </>
        )}
      </button>
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";

// Icon button with proper touch target
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const iconSizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const iconPadding = {
  sm: "p-1",
  md: "p-2",
  lg: "p-3",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, variant = "ghost", size = "md", className = "", ...props }, ref) => {
    const { prefersReducedMotion } = useAccessibility();

    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        style={{
          transitionDuration: prefersReducedMotion ? "0ms" : undefined,
        }}
        className={`
          inline-flex items-center justify-center rounded-xl
          ${iconSizes[size]}
          ${iconPadding[size]}
          ${variants[variant]}
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff734b]/50
          disabled:opacity-50 disabled:pointer-events-none
          ${className}
        `.trim().replace(/\s+/g, " ")}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

// Loading button with progress
interface LoadingButtonProps extends AccessibleButtonProps {
  progress?: number;
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ children, loading, progress, className = "", ...props }, ref) => {
    return (
      <div className="relative">
        <AccessibleButton
          ref={ref}
          loading={loading}
          className={className}
          {...props}
        >
          {children}
        </AccessibleButton>
        
        {progress !== undefined && progress >= 0 && progress <= 100 && (
          <div 
            className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-xl transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        )}
      </div>
    );
  }
);

LoadingButton.displayName = "LoadingButton";
