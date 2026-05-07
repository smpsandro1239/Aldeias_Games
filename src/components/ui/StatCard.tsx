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
}

const variantStyles = {
  emerald: "border-l-emerald-500 bg-white",
  blue: "border-l-blue-500 bg-white",
  violet: "border-l-violet-500 bg-white",
  amber: "border-l-amber-500 bg-white",
  pink: "border-l-pink-500 bg-white",
  orange: "border-l-orange-500 bg-white",
};

const iconBgStyles = {
  emerald: "bg-emerald-100 text-emerald-600",
  blue: "bg-blue-100 text-blue-600",
  violet: "bg-violet-100 text-violet-600",
  amber: "bg-orange-100 text-orange-600",
  pink: "bg-pink-100 text-pink-600",
  orange: "bg-orange-100 text-orange-600",
};

export function StatCard({
  title,
  value,
  variant = "emerald",
  icon: Icon,
  className,
  trend,
  subtext,
}: StatCardProps) {
  return (
    <Card className={cn("shadow-sm", variantStyles[variant], className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-black">{value}</p>
            {trend && (
              <div className={cn("flex items-center gap-1 mt-2 text-xs", trend.positive ? "text-green-600" : "text-red-600")}>
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
            <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", iconBgStyles[variant])}>
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}