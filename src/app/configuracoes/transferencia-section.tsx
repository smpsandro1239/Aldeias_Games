"use client";

import { Building2, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TransferenciaSectionProps {
  formData: {
    iban: string;
    nomeTitularConta: string;
  };
  setFormData: (data: any) => void;
  copiarIBAN: () => void;
}

export function TransferenciaSection({ formData, setFormData, copiarIBAN }: TransferenciaSectionProps) {
  return (
    <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10">
      <h3 className="font-serif text-accent font-bold mb-4 flex items-center gap-2">
        <Building2 className="w-5 h-5" /> Dados para Transferência
      </h3>

      <p className="text-xs text-muted-foreground/60 mb-4">
        Estes dados serão mostrados aos clientes que quiserem fazer transferência bancária.
      </p>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Nome do Titular da Conta</Label>
          <Input
            value={formData.nomeTitularConta}
            onChange={(e) => setFormData({ ...formData, nomeTitularConta: e.target.value })}
            placeholder="Ex: Junta de Freguesia de Vila Verde"
            className="bg-surface-container-low border-outline-variant/20"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">IBAN</Label>
          <div className="flex gap-2">
            <Input
              value={formData.iban}
              onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
              placeholder="PT50 0000 0000 0000 0000 00"
              className="bg-surface-container-low border-outline-variant/20 font-mono"
            />
            {formData.iban && (
              <button onClick={copiarIBAN} className="p-3 bg-surface-container-low rounded-lg hover:bg-muted/30">
                <Copy className="w-5 h-5 text-primary" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
