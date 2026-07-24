import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  variant?: "emerald" | "blue" | "violet" | "amber" | "pink" | "orange";
  icon?: LucideIcon;
  className?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  subtext?: string;
  onClick?: () => void;
}

const variantStyles = {
  emerald: "border-l-emerald-500 bg-card",
  blue: "border-l-blue-500 bg-card",
  violet: "border-l-violet-500 bg-card",
  amber: "border-l-amber-500 bg-card",
  pink: "border-l-pink-500 bg-card",
  orange: "border-l-orange-500 bg-card",
};

const iconBgStyles = {
  emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
  amber: "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  pink: "bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
};

export function StatCard({
  title,
  value,
  variant = "emerald",
  icon: Icon,
  className,
  trend,
  subtext,
  onClick,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "shadow-md border-2 transition-all hover:shadow-lg",
        onClick && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        variantStyles[variant],
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground mb-1 truncate">{title}</p>
            <p className="text-2xl font-black text-foreground leading-none">{value}</p>
            {trend && (
              <div className={cn("flex items-center gap-1 mt-2 text-xs", trend.positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                {trend.positive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{trend.label}</span>
              </div>
            )}
            {subtext && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Activity className="h-3 w-3" />
                <span>{subtext}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ml-4", iconBgStyles[variant])}>
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}