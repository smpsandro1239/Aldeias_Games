"use client";
import { ArrowLeft } from "lucide-react";

export function CofreHeader({ aldeiaId }: { aldeiaId?: string }) {
  return (
    <div className="relative bg-gradient-to-r from-green-500/10 via-green-500/5 to-emerald-500/10 rounded-3xl p-6 border border-green-500/10">
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={() => window.location.href = aldeiaId ? `/admindashboard?aldeiaId=${aldeiaId}` : "/admindashboard"}
          className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center hover:bg-green-500/30 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-green-600" />
        </button>
        <div>
          <h1 className="text-3xl font-serif font-bold">Gestão do Cofre</h1>
          <p className="text-muted-foreground font-medium">
            Transparência total na movimentação de fundos da aldeia
          </p>
        </div>
      </div>
    </div>
  );
}
