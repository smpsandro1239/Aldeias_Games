"use client";
import { ShieldCheck } from "lucide-react";

export function SuperCofreHeader() {
  return (
    <div className="relative bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-indigo-500/10 rounded-3xl p-6 border border-blue-500/10">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold">Cofre — Visão Global</h1>
          <p className="text-muted-foreground font-medium">
            Todas as aldeias, todos os cofres, total transparência
          </p>
        </div>
      </div>
    </div>
  );
}
