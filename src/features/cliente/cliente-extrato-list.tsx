"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Receipt, Banknote, Gift, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ClientePagination } from "./cliente-pagination";

interface ClienteExtratoListProps {
  extratoItems: any[];
  paginatedExtrato: any[];
  extratoPage: number;
  setExtratoPage: (page: number) => void;
}

export function ClienteExtratoList({ extratoItems, paginatedExtrato, extratoPage, setExtratoPage }: ClienteExtratoListProps) {
  return (
    <Card className="bg-surface-container border-outline-variant/20">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Receipt className="h-5 w-5 text-secondary" />
          Extrato de Movimentos
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Consulte o histórico de carregamentos, prémios convertidos e cashbacks recebidos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {extratoItems.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Banknote className="h-10 w-10 opacity-20" />
            <p>Sem movimentos recentes</p>
          </div>
        ) : (
          <>
            <div className="space-y-0">
              {paginatedExtrato.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-foreground/5 transition-colors">
                  <div className="flex items-center gap-4">
                    {t.tipo === "cashback" ? (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Gift className="h-5 w-5 text-primary" />
                      </div>
                    ) : t.valor > 0 ? (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <ArrowUpRight className="h-5 w-5 text-secondary" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                        <ArrowDownLeft className="h-5 w-5 text-destructive" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{t.descricao || "Transação"}</p>
                      <p className="text-xs text-muted-foreground/50 mt-1">
                        {formatDate(t.createdAt)} • Tipo: {t.tipo?.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold text-lg ${t.valor > 0 ? "text-primary" : "text-foreground"}`}>
                      {t.valor > 0 ? "+" : ""}{formatCurrency(t.valor)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {extratoItems.length > 10 && (
              <ClientePagination
                page={extratoPage}
                setPage={setExtratoPage}
                totalItems={extratoItems.length}
                itemsPerPage={10}
                label="movimentos"
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
