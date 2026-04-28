"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Leaf, Ticket, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { playSound } from "@/lib/audio-utils";

interface Evento {
  id: string;
  nome: string;
}

interface GameQuickActionsProps {
  eventos: Evento[];
  onOpenModal: (tipo: "poio_da_vaca" | "rifa" | "raspadinha") => void;
}

export function GameQuickActions({ eventos, onOpenModal }: GameQuickActionsProps) {
  const handleCreate = (tipo: "poio_da_vaca" | "rifa" | "raspadinha") => {
    if (!eventos.length) {
      playSound('error');
      toast.error("Crie um evento primeiro");
      return;
    }
    playSound('success');
    onOpenModal(tipo);
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      <Button 
        variant="outline"
        className="h-auto py-4 flex flex-col items-center gap-2 border-primary/30 hover:bg-primary/10"
        onClick={() => handleCreate("poio_da_vaca")}
      >
        <Leaf className="h-6 w-6 text-primary" />
        <div className="text-center">
          <p className="font-semibold text-sm">Poio da Vaca</p>
          <p className="text-xs text-muted-foreground">Grelha tradicional</p>
        </div>
      </Button>
      <Button 
        variant="outline"
        className="h-auto py-4 flex flex-col items-center gap-2 border-secondary/30 hover:bg-secondary/10"
        onClick={() => handleCreate("rifa")}
      >
        <Ticket className="h-6 w-6 text-secondary" />
        <div className="text-center">
          <p className="font-semibold text-sm">Rifa</p>
          <p className="text-xs text-muted-foreground">Números sorteados</p>
        </div>
      </Button>
      <Button 
        variant="outline"
        className="h-auto py-4 flex flex-col items-center gap-2 border-tertiary/30 hover:bg-tertiary/10"
        onClick={() => handleCreate("raspadinha")}
      >
        <Sparkles className="h-6 w-6 text-tertiary" />
        <div className="text-center">
          <p className="font-semibold text-sm">Raspadinha</p>
          <p className="text-xs text-muted-foreground">Raspar e ganhar</p>
        </div>
      </Button>
    </div>
  );
}
