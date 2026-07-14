"use client";
import { apiRequest } from '@/lib/api-client';
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Banknote, Send, History, Wallet, RefreshCw, Check, X, Clock } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

interface CashboxData {
  saldo: number;
  transacoes: Array<{
    id: string;
    tipo: string;
    valor: number;
    descricao: string;
    referencia: string | null;
    createdAt: string;
  }>;
}

interface DepositoData {
  id: string;
  valor: number;
  descricao: string | null;
  estado: string;
  createdAt: string;
  confirmadoAt: string | null;
  vendedor: { nome: string };
  confirmadoPor: { nome: string } | null;
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'vendedor': return 'Vendedor';
    case 'aldeia_admin': return 'Admin da Aldeia';
    case 'super_admin': return 'Super Admin';
    default: return 'Utilizador';
  }
}

export function VendedorCashbox({ token, userRole }: { token: string; userRole?: string }) {
  const [cashbox, setCashbox] = useState<CashboxData | null>(null);
  const [depositos, setDepositos] = useState<DepositoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositoModalOpen, setDepositoModalOpen] = useState(false);
  const [valorDeposito, setValorDeposito] = useState("");

  const roleLabel = getRoleLabel(userRole || 'vendedor');

  const fetchData = async () => {
    try {
      const [cashRes, depRes] = await Promise.all([
        apiRequest("/api/vendedor/cashbox", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiRequest("/api/cofre/pedido-deposito", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (cashRes.ok) {
        const data = await cashRes.json();
        setCashbox(data.data);
      }
      if (depRes.ok) {
        const data = await depRes.json();
        setDepositos(data.data);
      }
    } catch (error) {
      toast.error("Erro ao carregar dados da caixa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleDepositar = async () => {
    const valor = parseFloat(valorDeposito);
    if (!valor || valor <= 0) {
      toast.error("Insira um valor válido");
      return;
    }
    if (cashbox && valor > cashbox.saldo) {
      toast.error(`Valor máximo: ${formatCurrency(cashbox.saldo)}`);
      return;
    }

    try {
      const res = await apiRequest("/api/cofre/pedido-deposito", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          valor,
          descricao: `Depósito manual de ${valor}€ por ${roleLabel}`,
        })
      });

      if (res.ok) {
        toast.success("Pedido de depósito enviado ao administrador!");
        setDepositoModalOpen(false);
        setValorDeposito("");
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao criar pedido");
      }
    } catch (error) {
      toast.error("Erro ao criar pedido de depósito");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20 border-green-200/50 dark:border-green-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Saldo na Caixa ({roleLabel})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900 dark:text-green-100">
              {formatCurrency(cashbox?.saldo || 0)}
            </p>
            <p className="text-xs text-green-700/80 dark:text-green-300/80 mt-1">
              Dinheiro físico em tua posse
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/5 dark:to-primary/10 border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-primary flex items-center gap-2">
              <Banknote className="w-4 h-4" />
              Depositar no Cofre
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Quando entregares o dinheiro físico ao responsável, cria um pedido de depósito.
            </p>
            {cashbox && cashbox.saldo > 0 && (
              <Button
                className="w-full"
                onClick={() => setDepositoModalOpen(true)}
              >
                <Send className="w-4 h-4 mr-2" />
                Pedir Depósito ({formatCurrency(cashbox.saldo)})
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Movimentações da Caixa
            </CardTitle>
            <CardDescription>
              Últimas 50 operações registadas
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {!cashbox || cashbox.transacoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma movimentação ainda</p>
              <p className="text-xs mt-1">As vendas confirmadas aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cashbox.transacoes.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.tipo === 'RECEBIDO_DO_JOGADOR'
                        ? 'bg-green-500/20'
                        : tx.tipo === 'LEVANTAMENTO_COFRE'
                          ? 'bg-purple-500/20'
                          : 'bg-blue-500/20'
                    }`}>
                      {tx.tipo === 'RECEBIDO_DO_JOGADOR'
                        ? <Check className="w-4 h-4 text-green-600" />
                        : tx.tipo === 'LEVANTAMENTO_COFRE'
                          ? <Banknote className="w-4 h-4 text-purple-600" />
                          : <Banknote className="w-4 h-4 text-blue-600" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(tx.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      tx.tipo === 'RECEBIDO_DO_JOGADOR' || tx.tipo === 'LEVANTAMENTO_COFRE'
                        ? 'text-green-600'
                        : 'text-blue-600'
                    }`}>
                      {tx.tipo === 'DEPOSITADO_NO_COFRE' ? '-' : '+'}
                      {formatCurrency(tx.valor)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Pedidos de Depósito no Cofre
          </CardTitle>
          <CardDescription>
            Estado dos teus pedidos de depósito para o cofre da aldeia
          </CardDescription>
        </CardHeader>
        <CardContent>
          {depositos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Banknote className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum pedido de depósito</p>
            </div>
          ) : (
            <div className="space-y-3">
              {depositos.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl"
                >
                  <div>
                    <p className="font-bold text-lg">{formatCurrency(dep.valor)}</p>
                    <p className="text-xs text-muted-foreground">
                      {dep.descricao || 'Depósito'}
                    </p>
                    {dep.confirmadoPor && (
                      <p className="text-xs text-muted-foreground">
                        Confirmado por: {dep.confirmadoPor.nome}
                      </p>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <Badge className={
                      dep.estado === 'confirmado' ? 'bg-primary' :
                      dep.estado === 'rejeitado' ? 'bg-destructive' :
                      'bg-accent'
                    }>
                      {dep.estado === 'confirmado' && <Check className="w-3 h-3 mr-1 inline" />}
                      {dep.estado === 'rejeitado' && <X className="w-3 h-3 mr-1 inline" />}
                      {dep.estado === 'pendente' && <Clock className="w-3 h-3 mr-1 inline" />}
                      {dep.estado.toUpperCase()}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(dep.createdAt)}
                    </p>
                    {dep.confirmadoAt && (
                      <p className="text-xs text-muted-foreground">
                        Confirmado: {formatDateTime(dep.confirmadoAt)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={depositoModalOpen} onOpenChange={setDepositoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Depositar no Cofre da Aldeia</DialogTitle>
            <DialogDescription>
              Regista a entrega do dinheiro físico ao administrador da aldeia.
              Após confirmação pelo administrador, o valor será creditado no cofre.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Saldo Disponível na Caixa</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(cashbox?.saldo || 0)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valorDeposito">Valor a Depositar (€)</Label>
              <Input
                id="valorDeposito"
                type="number"
                step="0.01"
                min="0.01"
                max={cashbox?.saldo || 0}
                value={valorDeposito}
                onChange={(e) => setValorDeposito(e.target.value)}
                placeholder="0.00"
              />
              {valorDeposito && parseFloat(valorDeposito) > (cashbox?.saldo || 0) && (
                <p className="text-xs text-destructive">Valor excede o saldo disponível</p>
              )}
            </div>
            <div className="text-xs text-muted-foreground bg-accent/10 p-3 rounded-lg border border-accent/20">
              <p className="font-medium text-accent mb-1">Nota:</p>
              <p>Este pedido ficará pendente até o administrador da aldeia confirmar a receção do dinheiro físico.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositoModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDepositar}>
              <Send className="w-4 h-4 mr-2" />
              Solicitar Depósito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
