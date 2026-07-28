"use client";
import { Badge } from "@/components/ui/badge";

type QuickActionColor = "emerald" | "blue" | "violet" | "amber" | "pink" | "orange" | "green" | "cyan";

export function QuickAction({
  icon, label, onClick, color, badge,
}: {
  icon: React.ReactNode; label: string; onClick: () => void;
  color: QuickActionColor;
  badge?: number;
}) {
  const colorMap: Record<QuickActionColor, string> = {
    emerald: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400",
    blue: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400",
    violet: "bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 dark:text-violet-400",
    amber: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400",
    pink: "bg-pink-500/10 text-pink-600 hover:bg-pink-500/20 dark:text-pink-400",
    orange: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 dark:text-orange-400",
    green: "bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400",
    cyan: "bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20 dark:text-cyan-400",
  };
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-2 p-4 rounded-xl ${colorMap[color]} transition-all hover:scale-[1.02] active:scale-[0.98]`}
    >
      {badge !== undefined && badge > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center bg-destructive text-white text-xs">
          {badge > 99 ? "99+" : badge}
        </Badge>
      )}
      {icon}
      <span className="text-xs font-medium text-center">{label}</span>
    </button>
  );
}
