'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Copy, Eye, EyeOff, Hash, Ticket, CheckCircle2, Gift, Star, Award,
  Gamepad2, MapPin, Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface Participacao {
  id: string;
  valorPago: number;
  metodoPagamento: string;
  estadoPagamento: string;
  dadosParticipacao?: string;
  ganhador?: boolean;
  jogo: {
    nome: string;
    tipo: string;
    evento: {
      nome: string;
      aldeia: {
        nome: string;
      };
    };
  };
  hashParticipacao?: string;
  hashRaspe?: string;
  dadosVerificacao?: string;
  seedRaspe?: string;
  resultadoRaspe?: string;
  createdAt: string;
}

interface ParsedDados {
  numeros?: number[];
  numero?: number;
  coordenadas?: { letra: string; numero: number }[];
}

function parseDadosParticipacao(raw?: string): ParsedDados | null {
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

function getJogoTipoLabel(tipo: string): string {
  switch (tipo) {
    case 'rifa': return 'Rifa';
    case 'raspadinha': return 'Raspadinha';
    case 'poio_da_vaca': return 'Poio da Vaca';
    case 'euromilhoes': return 'Euromilhões';
    default: return tipo;
  }
}

function getJogoTipoColor(tipo: string): string {
  switch (tipo) {
    case 'rifa': return 'bg-blue-500/20 text-blue-400';
    case 'raspadinha': return 'bg-purple-500/20 text-purple-400';
    case 'poio_da_vaca': return 'bg-amber-500/20 text-amber-400';
    case 'euromilhoes': return 'bg-green-500/20 text-green-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
}

function getJogoAccent(tipo: string): string {
  switch (tipo) {
    case 'rifa': return 'from-blue-500/60 to-blue-500/10';
    case 'raspadinha': return 'from-purple-500/60 to-purple-500/10';
    case 'poio_da_vaca': return 'from-amber-500/60 to-amber-500/10';
    case 'euromilhoes': return 'from-green-500/60 to-green-500/10';
    default: return 'from-gray-500/60 to-gray-500/10';
  }
}

function getJogoChip(tipo: string): string {
  switch (tipo) {
    case 'rifa': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'raspadinha': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'poio_da_vaca': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'euromilhoes': return 'bg-green-500/10 text-green-500 border-green-500/20';
    default: return 'bg-primary/10 text-primary border-primary/20';
  }
}

function getJogoIcon(tipo: string) {
  switch (tipo) {
    case 'rifa': return Star;
    case 'raspadinha': return Gift;
    case 'poio_da_vaca': return Gamepad2;
    case 'euromilhoes': return Award;
    default: return Ticket;
  }
}

function formatNumero(num: number): string {
  return num.toString().padStart(2, '0');
}

function formatCoordenada(c: { letra: string; numero: number }): string {
  return `${c.letra}${c.numero}`;
}

function parseDadosVerificacao(raw?: string): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

function getHash(p: Participacao): string | null {
  if (p.hashRaspe) return p.hashRaspe;
  if (p.hashParticipacao) return p.hashParticipacao;
  return null;
}

function getPaymentLabel(metodo: string): string {
  switch (metodo) {
    case 'saldo': return 'Saldo';
    case 'dinheiro': return 'Dinheiro';
    case 'mbway': return 'MB Way';
    case 'stripe': return 'Cartão';
    case 'transferencia': return 'Transferência';
    default: return metodo;
  }
}

export default function ParticipacoesClient() {
  const [showHashes, setShowHashes] = useState<Record<string, boolean>>({});

  const { data: participacoes, isLoading, error } = useQuery({
    queryKey: ['participacoes'],
    queryFn: async () => {
      const response = await fetch('/api/participacoes');
      if (!response.ok) throw new Error('Erro ao carregar participações');
      return response.json();
    },
  });

  const toggleHashVisibility = (id: string) => {
    setShowHashes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-surface-container rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }
  if (error) return <div className="text-destructive text-center py-8">Erro ao carregar participações</div>;

  const items = participacoes?.data as Participacao[] | undefined;

  return (
    <div className="space-y-4">
      {(!items || items.length === 0) ? (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center flex flex-col items-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Ticket className="h-8 w-8 text-primary/50" />
            </div>
            <p className="text-sm font-medium text-foreground">Ainda não tens participações registadas</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Participa num jogo e os teus números aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        items.map((participacao) => {
          const hash = getHash(participacao);
          const dados = parseDadosParticipacao(participacao.dadosParticipacao);
          const verificacao = parseDadosVerificacao(participacao.dadosVerificacao);
          const numeros = dados?.numeros || (dados?.numero !== undefined ? [dados.numero] : undefined);
          const coordenadas = dados?.coordenadas;
          const isRaspadinha = participacao.jogo.tipo === 'raspadinha';
          const isConcluido = participacao.estadoPagamento === 'concluido';
          const isGanhador = participacao.ganhador;
          const Icon = getJogoIcon(participacao.jogo.tipo);

          return (
            <Card
              key={participacao.id}
              className={`overflow-hidden ${isGanhador ? 'border-yellow-500/40 shadow-[0_0_24px_-8px_rgba(234,179,8,0.35)]' : ''}`}
            >
              <div className={`h-1 bg-gradient-to-r ${getJogoAccent(participacao.jogo.tipo)}`} />
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg border ${getJogoChip(participacao.jogo.tipo)}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">{participacao.jogo.nome}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getJogoTipoColor(participacao.jogo.tipo)}`}>
                      {getJogoTipoLabel(participacao.jogo.tipo)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isGanhador && (
                      <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Vencedor
                      </Badge>
                    )}
                    <Badge variant={isConcluido ? 'default' : 'secondary'}>
                      {isConcluido ? 'Pago' : 'Pendente'}
                    </Badge>
                  </div>
                </div>

                {/* Context info */}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 bg-surface-container/60 rounded-lg px-2.5 py-1.5 min-w-0">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{participacao.jogo.evento.nome}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-surface-container/60 rounded-lg px-2.5 py-1.5 min-w-0">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{participacao.jogo.evento.aldeia.nome}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-surface-container/60 rounded-lg px-2.5 py-1.5">
                    <span className="text-muted-foreground/60">Valor:</span>
                    <span className="font-semibold">€{participacao.valorPago.toFixed(2)}</span>
                    <span className="text-muted-foreground/60">({getPaymentLabel(participacao.metodoPagamento)})</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-surface-container/60 rounded-lg px-2.5 py-1.5">
                    <span className="text-muted-foreground/60">Data:</span>
                    <span>
                      {new Date(participacao.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Played numbers */}
                {numeros && numeros.length > 0 && (
                  <div className="border-t pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-primary/10 p-1 rounded-md">
                        <Ticket className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-xs font-semibold">Números Jogados</span>
                      <span className="text-[10px] text-muted-foreground">({numeros.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {numeros.map((num) => (
                        <span
                          key={num}
                          className={`inline-flex items-center justify-center min-w-[2rem] h-8 px-2 text-xs font-mono font-bold rounded-lg border ${getJogoChip(participacao.jogo.tipo)}`}
                        >
                          {formatNumero(num)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coordinates (Poio da Vaca) */}
                {coordenadas && coordenadas.length > 0 && (
                  <div className="border-t pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-amber-500/10 p-1 rounded-md">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <span className="text-xs font-semibold">Coordenadas</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {coordenadas.map((c, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center justify-center min-w-[2.5rem] h-8 px-2 bg-amber-500/10 text-amber-500 text-xs font-mono font-bold rounded-lg border border-amber-500/20"
                        >
                          {formatCoordenada(c)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raspadinha result */}
                {isRaspadinha && participacao.resultadoRaspe && (
                  <div className="border-t pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold">Resultado Raspadinha</span>
                    </div>
                    <pre className="bg-surface-container p-3 rounded-lg text-xs font-mono overflow-auto max-h-24">
                      {participacao.resultadoRaspe}
                    </pre>
                  </div>
                )}

                {/* Hash de verificação */}
                {hash && (
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1 rounded-md">
                          <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <span className="text-xs font-semibold">Hash de Verificação</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => toggleHashVisibility(participacao.id)}
                        >
                          {showHashes[participacao.id] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => copyToClipboard(hash)}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {showHashes[participacao.id] ? (
                      <div className="bg-surface-container p-3 rounded-lg font-mono text-xs break-all text-muted-foreground">
                        {hash}
                      </div>
                    ) : (
                      <div className="bg-surface-container p-3 rounded-lg font-mono text-xs text-muted-foreground/60">
                        {hash.substring(0, 12)}...{'•'.repeat(Math.max(0, hash.length - 12))}
                      </div>
                    )}
                  </div>
                )}

                {/* Verification data */}
                {verificacao && (
                  <div className="border-t pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-muted-foreground">Dados de Verificação</span>
                    </div>
                    <pre className="bg-surface-container p-3 rounded-lg text-xs font-mono overflow-auto max-h-24 text-muted-foreground">
                      {JSON.stringify(verificacao, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
