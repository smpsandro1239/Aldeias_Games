import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, ArrowUpRight, ArrowDownRight, Clock, Receipt, Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Transacao, Evento } from "@/features/admin/components/types";

interface SuperRecentActivityProps {
  transacoes: Transacao[];
  eventos: Evento[];
  onVerTudoTransacoes: () => void;
  onVerTudoEventos: () => void;
}

export function SuperRecentActivity({
  transacoes,
  eventos,
  onVerTudoTransacoes,
  onVerTudoEventos,
}: SuperRecentActivityProps) {
  if (transacoes.length === 0 && eventos.length === 0) return null;

  return (
    <div>
      <h2 className="font-serif text-lg font-semibold text-accent mb-3 flex items-center gap-2">
        <Clock className="h-5 w-5" /> Atividade Recente
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        {transacoes.length > 0 && (
          <Card className="bg-surface-container-low border-outline-variant/10 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/5 to-transparent px-4 py-3 flex items-center justify-between border-b border-outline-variant/5">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Últimas Transações</h3>
              </div>
              <button onClick={onVerTudoTransacoes} className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-medium">
                Ver tudo <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <CardContent className="p-3">
              <div className="space-y-1">
                {transacoes.slice(0, 5).map((t) => {
                  const isCredit = t.tipo === 'carregamento' || t.tipo === 'deposito';
                  return (
                    <div key={t.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCredit ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                          {isCredit
                            ? <ArrowUpRight className={`h-4 w-4 ${isCredit ? 'text-emerald-500' : 'text-red-500'}`} />
                            : <ArrowDownRight className="h-4 w-4 text-red-500" />
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-accent truncate">{t.user?.nome || "Sistema"}</p>
                          <p className="text-xs text-muted-foreground truncate">{t.descricao || t.tipo}</p>
                        </div>
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <span className={`text-sm font-bold ${isCredit ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isCredit ? '+' : '-'}{formatCurrency(Math.abs(t.valor))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
        {eventos.length > 0 && (
          <Card className="bg-surface-container-low border-outline-variant/10 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500/5 to-transparent px-4 py-3 flex items-center justify-between border-b border-outline-variant/5">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-semibold">Últimos Eventos</h3>
              </div>
              <button onClick={onVerTudoEventos} className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-medium">
                Ver tudo <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <CardContent className="p-3">
              <div className="space-y-1">
                {eventos.slice(0, 5).map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-accent truncate">{e.nome}</p>
                        <p className="text-xs text-muted-foreground">{e.aldeia?.nome || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={e.estado === "ativo" ? "default" : "secondary"} className={`text-xs capitalize ${e.estado === "ativo" ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20" : ""}`}>
                        {e.estado}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
