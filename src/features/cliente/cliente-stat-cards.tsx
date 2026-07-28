"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatItem {
  icon: LucideIcon;
  label: string;
  value: number | string;
  bgClass: string;
  textClass: string;
  isCurrency?: boolean;
}

interface ClienteStatCardsProps {
  stats: StatItem[];
}

export function ClienteStatCards({ stats }: ClienteStatCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="card-hover bg-card/50 border-white/10 backdrop-blur-sm p-3 md:p-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground truncate">{stat.label}</CardTitle>
            <div className={`p-1.5 md:p-2 rounded-lg ${stat.bgClass} shrink-0`}>
              <stat.icon className={`h-3 w-3 md:h-4 md:w-4 ${stat.textClass}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-gaming font-bold text-foreground truncate">
              {stat.isCurrency ? formatCurrency(stat.value as number) : stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
