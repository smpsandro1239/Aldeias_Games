"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LayoutHeader } from "@/components/layout-header";
import { BottomNav } from "@/components/bottom-nav";
import { Loader2 } from "lucide-react";

interface GameDetailLayoutProps {
  title: string;
  subtitle?: string;
  userRole?: string | null;
  loading?: boolean;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

export function GameDetailLayout({
  title,
  subtitle,
  userRole,
  loading = false,
  headerRight,
  children,
}: GameDetailLayoutProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">A carregar jogo...</p>
        </div>
      </div>
    );
  }

  return (
    <LayoutHeader>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-primary/10 flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-surface-container-low rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-primary" />
            </button>
            {subtitle && (
              <span className="font-serif italic text-primary text-sm font-bold">
                {subtitle}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif font-bold text-lg text-accent">{title}</h1>
            {headerRight}
          </div>
        </header>

        <main className="px-4 pt-6 pb-24 max-w-2xl mx-auto space-y-6">
          {children}
        </main>

        <BottomNav role={userRole || undefined} />
      </div>
    </LayoutHeader>
  );
}
