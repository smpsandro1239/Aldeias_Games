"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet, Users, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { VendedorRec } from "@/features/admin/reconciliacao-cofre-types";

export function ReconciliacaoVendedoresTable({ vendedores }: { vendedores: VendedorRec[] }) {
  const [selectedVendedor, setSelectedVendedor] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Vendedores
        </CardTitle>
        <CardDescription>
          {vendedores.length} vendedor{ vendedores.length !== 1 ? 'es' : '' } — {vendedores.filter(v => Math.abs(v.discrepancia) > 0.01).length} com discrepância
        </CardDescription>
      </CardHeader>
      <CardContent>
        {vendedores.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum vendedor encontrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {vendedores.map((v) => (
              <div
                key={v.id}
                className="rounded-xl border border-outline-variant/20 overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors text-left"
                  onClick={() => setSelectedVendedor(selectedVendedor === v.id ? null : v.id)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{v.nome}</p>
                      {Math.abs(v.discrepancia) > 0.01 && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Discrepância
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{v.email}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      <span className="text-green-600">{formatCurrency(v.totalRecebido)}</span>
                      {' '}recebido
                    </span>
                    <span className="text-muted-foreground">
                      <span className="text-blue-600">{formatCurrency(v.totalDepositado)}</span>
                      {' '}depositado
                    </span>
                    <span className="font-bold">
                      Saldo: {formatCurrency(v.saldoCashbox)}
                    </span>
                    {Math.abs(v.discrepancia) > 0.01 && (
                      <span className="text-destructive font-bold">
                        {v.discrepancia > 0 ? '+' : ''}{formatCurrency(v.discrepancia)}
                      </span>
                    )}
                  </div>
                </button>

                {selectedVendedor === v.id && (
                  <div className="border-t border-outline-variant/20 bg-surface-container-low/50 p-4">
                    <p className="text-sm font-medium mb-3">Transações recentes</p>
                    {v.transacoes.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhuma transação</p>
                    ) : (
                      <div className="space-y-1">
                        {v.transacoes.map(t => (
                          <div key={t.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-surface-container-low">
                            <div className="flex items-center gap-2">
                              {t.tipo === 'RECEBIDO_DO_JOGADOR' ? (
                                <TrendingUp className="w-3 h-3 text-green-500" />
                              ) : (
                                <TrendingDown className="w-3 h-3 text-blue-500" />
                              )}
                              <span>{t.descricao}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={t.tipo === 'RECEBIDO_DO_JOGADOR' ? 'text-green-600' : 'text-blue-600'}>
                                {t.tipo === 'RECEBIDO_DO_JOGADOR' ? '+' : '-'}{formatCurrency(t.valor)}
                              </span>
                              <span className="text-muted-foreground">{formatDateTime(t.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 text-xs text-muted-foreground border-t border-outline-variant/10 pt-3">
                      <p>Saldo esperado: {formatCurrency(v.saldoEsperado)}</p>
                      <p>Saldo real: {formatCurrency(v.saldoCashbox)}</p>
                      <p className={Math.abs(v.discrepancia) > 0.01 ? 'text-destructive font-semibold' : 'text-green-600'}>
                        Discrepância: {v.discrepancia > 0 ? '+' : ''}{formatCurrency(v.discrepancia)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
