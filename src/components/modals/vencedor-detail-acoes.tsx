"use client";

import { Button } from "@/components/ui/button";
import { Euro, Award } from "lucide-react";

interface VencedorAcoesProps {
  hashVerificado: boolean;
  onVerificarHash: () => void;
  onConvert: () => void;
  onEntrega: () => void;
}

export function VencedorAcoes({ hashVerificado, onVerificarHash, onConvert, onEntrega }: VencedorAcoesProps) {
  return (
    <div className="mt-4 pt-4 border-t space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${hashVerificado ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium">
            Verificação: {hashVerificado ? 'Validada' : 'Pendente'}
          </span>
        </div>
        {!hashVerificado && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onVerificarHash}
          >
            Verificar Hash
          </Button>
        )}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Aviso:</strong> A entrega de prémios só pode ser realizada após verificação do hash de autenticidade.
          {!hashVerificado && " Clique em 'Verificar Hash' para validar a participação."}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onConvert}
          aria-label="Converter prémio em saldo"
        >
          <Euro className="w-4 h-4 mr-2" aria-hidden="true" />
          Converter em Saldo
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={onEntrega}
          disabled={!hashVerificado}
          aria-label="Marcar prémio como entregue"
        >
          <Award className="w-4 h-4 mr-2" aria-hidden="true" />
          {hashVerificado ? 'Entregar Prémio' : 'Verificar Primeiro'}
        </Button>
      </div>
    </div>
  );
}