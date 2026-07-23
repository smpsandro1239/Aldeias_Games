"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Wallet, Percent, Target } from "lucide-react";
import { VendedorStats } from "../types";

interface ComissoesTabProps {
  vendedoresStats: VendedorStats[];
  setSelectedUser: (user: any) => void;
  setUserModalOpen: (open: boolean) => void;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}

export function ComissoesTab({
  vendedoresStats,
  setSelectedUser,
  setUserModalOpen,
}: ComissoesTabProps) {
  const totalComissoesGanhas = vendedoresStats.reduce((sum, vs: any) => sum + (vs.comissaoGanhas || 0), 0);
  const totalJaPago = vendedoresStats.reduce((sum, vs: any) => sum + (vs.jaPago || 0), 0);
  const totalSaldoAberto = vendedoresStats.reduce((sum, vs: any) => sum + (vs.saldoAberto || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Comissões & Desempenho
        </h2>
      </div>

      {vendedoresStats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Ganho</p>
                <p className="text-lg font-bold">{formatCurrency(totalComissoesGanhas)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Wallet className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Já Pago</p>
                <p className="text-lg font-bold">{formatCurrency(totalJaPago)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <DollarSign className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo Aberto</p>
                <p className="text-lg font-bold">{formatCurrency(totalSaldoAberto)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {vendedoresStats.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <DollarSign className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sem vendedores</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Adicione vendedores à sua organização para ver as estatísticas de
              desempenho e comissões.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {vendedoresStats.map((vs) => {
            const v = vs as any;
            return (
              <Card key={vs.id} className="hover:bg-accent/5 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div
                    onClick={() => {
                      setSelectedUser({ ...vs, role: 'vendedor' });
                      setUserModalOpen(true);
                    }}
                  >
                    <div className="flex flex-wrap gap-2 items-center mb-3">
                      <h3 className="font-semibold text-lg">{vs.nome}</h3>
                      <Badge variant="outline" className="gap-1">
                        <Percent className="h-3 w-3" />
                        {v.comissaoPercentual || 5}%
                      </Badge>
                      <Badge variant="secondary">{v.totalVendas || 0} vendas</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Volume Total</p>
                        <p className="font-medium">{formatCurrency(v.volumeTotal || 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Comissão Ganha</p>
                        <p className="font-medium text-green-600 dark:text-green-400">{formatCurrency(v.comissaoGanhas || 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Já Pago</p>
                        <p className="font-medium">{formatCurrency(v.jaPago || 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Saldo Aberto</p>
                        <p className="font-medium text-amber-600 dark:text-amber-400">{formatCurrency(v.saldoAberto || 0)}</p>
                      </div>
                    </div>
                    {v.metaVendas > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Target className="h-3 w-3" />
                        <span>Meta: {formatCurrency(v.metaVendas)}</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[200px]">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(100, ((v.volumeTotal || 0) / v.metaVendas) * 100)}%` }}
                          />
                        </div>
                        <span>{Math.round(((v.volumeTotal || 0) / v.metaVendas) * 100)}%</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
