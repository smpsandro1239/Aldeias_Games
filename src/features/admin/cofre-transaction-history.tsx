"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Check, ArrowUpFromLine, Download } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { generateCSV, downloadCSV, formatDateISO } from "@/lib/export-utils";
import { Pagination } from "@/components/ui/pagination";
import type { VaultTransacao } from "./admin-cofre-types";

interface CofreTransactionHistoryProps {
  transacoes: VaultTransacao[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function CofreTransactionHistory({
  transacoes,
  total,
  page,
  limit,
  onPageChange,
}: CofreTransactionHistoryProps) {
  const handleExportCSV = () => {
    const headers = ['Data', 'Tipo', 'Valor', 'Descrição', 'Estado', 'Criado por', 'Aprovado por'];
    const rows = transacoes.map(tx => [
      formatDateISO(tx.dataCriacao),
      tx.tipo === 'deposito' ? 'Depósito' : tx.tipo === 'levantamento' ? 'Levantamento' : tx.tipo,
      tx.valor.toFixed(2),
      tx.descricao,
      tx.estado,
      tx.criadoPor.nome,
      tx.aprovadoPor?.nome ?? '-',
    ]);
    downloadCSV(generateCSV(headers, rows), `cofre-movimentos-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5" />
            <CardTitle>Movimentos do Cofre</CardTitle>
          </div>
          {total > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          )}
        </div>
        <CardDescription>
          Todas as entradas e saídas registadas no cofre
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transacoes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum movimento registado</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {transacoes.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.tipo === 'deposito'
                        ? 'bg-green-500/20'
                        : 'bg-purple-500/20'
                    }`}>
                      {tx.tipo === 'deposito'
                        ? <Check className="w-4 h-4 text-green-600" />
                        : <ArrowUpFromLine className="w-4 h-4 text-purple-600" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.descricao}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>Criado por: {tx.criadoPor.nome}</span>
                        {tx.aprovadoPor && (
                          <span>{tx.tipo === 'levantamento' ? 'Aprovado' : 'Aprovado'} por: {tx.aprovadoPor.nome}</span>
                        )}
                        <span>{formatDateTime(tx.dataCriacao)}</span>
                        <Badge variant={tx.estado === 'confirmado' ? 'default' : tx.estado === 'pendente' ? 'secondary' : 'destructive'} className="text-xs">
                          {tx.estado.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className={`font-bold ${tx.tipo === 'deposito' ? 'text-green-600' : 'text-purple-600'}`}>
                    {tx.tipo === 'deposito' ? '+' : '-'}{formatCurrency(tx.valor)}
                  </p>
                </div>
              ))}
            </div>
            <Pagination
              page={page}
              total={total}
              limit={limit}
              onPageChange={onPageChange}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
