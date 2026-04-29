"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Transacao } from "../types";

interface TransacoesTabProps {
  transacoes: Transacao[];
}

export function TransacoesTab({ transacoes }: TransacoesTabProps) {
  const [transacaoSearch, setTransacaoSearch] = useState("");
  const [transacaoPage, setTransacaoPage] = useState(1);

  const filteredTransacoes = useMemo(() => {
    const searchLower = transacaoSearch.toLowerCase();
    return transacoes.filter(t => {
      if (!searchLower) return true;
      return (
        t.tipo?.toLowerCase().includes(searchLower) ||
        t.descricao?.toLowerCase().includes(searchLower) ||
        t.user?.nome?.toLowerCase().includes(searchLower) ||
        t.user?.email?.toLowerCase().includes(searchLower) ||
        (t.metodoPagamento || "").toLowerCase().includes(searchLower)
      );
    });
  }, [transacoes, transacaoSearch]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold">Transações da Plataforma</h2>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <div className="flex-1 max-w-md">
          <Label htmlFor="transacaoSearch" className="sr-only">
            Pesquisar transação
          </Label>
          <Input
            id="transacaoSearch"
            placeholder="Pesquisar por tipo, descrição, usuário ou método..."
            value={transacaoSearch}
            onChange={(e) => {
              setTransacaoSearch(e.target.value);
              setTransacaoPage(1);
            }}
          />
        </div>
      </div>

      {/* Lista */}
      {filteredTransacoes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <CreditCard className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sem transações</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              As transações aparecem aqui quando os utilizadores carregam saldo ou participam em jogos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTransacoes
            .slice((transacaoPage - 1) * 10, transacaoPage * 10)
            .map((t) => (
              <Card key={t.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <h3 className="font-semibold">{t.tipo}</h3>
                      <Badge variant="outline">{t.estado || "concluido"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t.descricao || "-"} • User: {t.user?.nome || t.user?.email || t.userId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(t.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{formatCurrency(t.valor)}</div>
                    <p className="text-xs text-muted-foreground">
                      {t.metodoPagamento || "saldo"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Paginação */}
      {filteredTransacoes.length > 10 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Mostrando {(transacaoPage - 1) * 10 + 1} a {Math.min(transacaoPage * 10, filteredTransacoes.length)} de {filteredTransacoes.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={transacaoPage === 1}
              onClick={() => setTransacaoPage(transacaoPage - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={transacaoPage * 10 >= filteredTransacoes.length}
              onClick={() => setTransacaoPage(transacaoPage + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
