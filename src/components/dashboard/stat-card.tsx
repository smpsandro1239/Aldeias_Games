"use client";
import { Card, CardContent } from "@/components/ui/card";

type StatCardColor = "emerald" | "blue" | "violet" | "amber" | "pink" | "orange" | "green" | "cyan";

export function StatCard({
  title, value, subtitle, icon, color, onClick,
}: {
  title: string; value: string; subtitle?: string; icon: React.ReactNode;
  color: StatCardColor;
  onClick?: () => void;
}) {
  const colorMap: Record<StatCardColor, string> = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    green: "bg-green-500/10 text-green-600 dark:text-green-400",
    cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  };
  const borderMap: Record<StatCardColor, string> = {
    emerald: "border-l-emerald-500",
    blue: "border-l-blue-500",
    violet: "border-l-violet-500",
    amber: "border-l-amber-500",
    pink: "border-l-pink-500",
    orange: "border-l-orange-500",
    green: "border-l-green-500",
    cyan: "border-l-cyan-500",
  };
  return (
    <Card
      className={`bg-card border-l-4 ${borderMap[color]} shadow-sm hover:shadow-md transition-shadow ${onClick ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <p className="text-xl md:text-2xl font-black text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colorMap[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
