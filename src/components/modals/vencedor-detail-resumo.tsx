"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Trophy, Award } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Vencedor, WonPrize } from "./vencedor-detail-types";

interface VencedorResumoProps {
  vencedor: Vencedor;
  nomeExibicao: string;
  emailExibicao: string;
  telefoneExibicao: string;
  wonPrize: WonPrize | null;
}

export function VencedorResumo({ vencedor, nomeExibicao, emailExibicao, telefoneExibicao, wonPrize }: VencedorResumoProps) {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{nomeExibicao}</h3>
            {emailExibicao && <p className="text-sm text-muted-foreground" aria-label={`Email: ${emailExibicao}`}>{emailExibicao}</p>}
            {telefoneExibicao && <p className="text-sm text-muted-foreground" aria-label={`Telefone: ${telefoneExibicao}`}>{telefoneExibicao}</p>}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-accent/10 text-accent">
                <Trophy className="w-3 h-3 mr-1" aria-hidden="true" />
                {vencedor.jogo?.nome}
              </Badge>
              {vencedor.premioEntregue ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500" aria-label="Prémio entregue ou convertido">
                  <Award className="w-3 h-3 mr-1" aria-hidden="true" />
                  Prémio Entregue/Convertido
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600" aria-label="Prémio pendente">
                  Pendente
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-primary" aria-label={`Valor do prémio: ${formatCurrency(wonPrize?.valor ?? 0)}`}>
              {formatCurrency(wonPrize?.valor ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">{wonPrize?.nome ? `Prémio: ${wonPrize.nome}` : "Valor do prémio"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}