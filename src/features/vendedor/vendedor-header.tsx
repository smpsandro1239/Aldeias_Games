"use client";
import { NotificationBell } from "@/components/notification-bell";

export function VendedorHeader() {
  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-primary/10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-accent">Área do Vendedor</h1>
          <p className="text-sm text-muted-foreground">Regista vendas e acompanha o teu desempenho</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
        </div>
      </div>
    </div>
  );
}