'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Hash,
  Ticket,
  Eye,
  EyeOff,
  Copy,
  Trophy,
  MapPin,
  Calendar,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import {
  Participacao,
  formatNumero,
  formatCoordenada,
  getHash,
  getJogadorContact,
  getJogoAccent,
  getJogoChip,
  getJogoIcon,
  getJogoTipoColor,
  getJogoTipoLabel,
  getPaymentLabel,
  parseDados,
} from './numeros-jogados-types';

interface NumerosJogadosCardProps {
  p: Participacao;
  hashVisivel: boolean;
  showVendedorInfo: boolean;
  onToggleHash: (id: string) => void;
  onCopyHash: (hash: string) => void;
}

export function NumerosJogadosCard({ p, hashVisivel, showVendedorInfo, onToggleHash, onCopyHash }: NumerosJogadosCardProps) {
  const dados = parseDados(p.dadosParticipacao);
  const numeros = dados?.numeros;
  const coordenadas = dados?.coordenadas;
  const hash = getHash(p);
  const jogador = getJogadorContact(p);
  const isRaspadinha = p.jogo.tipo === 'raspadinha';
  const Icon = getJogoIcon(p.jogo.tipo);

  return (
    <Card
      className={`overflow-hidden ${p.ganhador ? 'border-yellow-500/40 shadow-[0_0_24px_-8px_rgba(234,179,8,0.35)]' : ''}`}
    >
      <div className={`h-1 bg-gradient-to-r ${getJogoAccent(p.jogo.tipo)}`} />
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`p-1.5 rounded-lg border ${getJogoChip(p.jogo.tipo)}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm">{p.jogo.nome}</span>
            <Badge className={`text-[10px] font-bold ${getJogoTipoColor(p.jogo.tipo)}`}>
              {getJogoTipoLabel(p.jogo.tipo)}
            </Badge>
            {p.ganhador && (
              <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-[10px]">
                <Trophy className="w-3 h-3 mr-1" />
                Ganhador
              </Badge>
            )}
            <Badge variant={p.estadoPagamento === 'concluido' ? 'default' : 'secondary'} className="text-[10px]">
              {p.estadoPagamento === 'concluido' ? 'Pago' : 'Pendente'}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(p.createdAt).toLocaleDateString('pt-PT', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </div>

        {/* Context info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="flex items-center gap-2 bg-surface-container/60 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{p.jogo.evento.aldeia.nome}</span>
          </div>
          <div className="flex items-center gap-2 bg-surface-container/60 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground min-w-0">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{p.jogo.evento.nome}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container/60 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-muted-foreground/60">Valor:</span>
            <span className="font-semibold">€{p.valorPago.toFixed(2)}</span>
            <span className="text-muted-foreground/60">({getPaymentLabel(p.metodoPagamento)})</span>
          </div>
          <div className="flex items-center gap-2 bg-surface-container/60 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground min-w-0">
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{jogador.nome}</span>
          </div>
        </div>

        {/* Jogador contact info */}
        {(jogador.email || jogador.telefone) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {jogador.email && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Mail className="w-3 h-3 text-muted-foreground/60 flex-shrink-0" />
                <span className="truncate">{jogador.email}</span>
              </div>
            )}
            {jogador.telefone && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Phone className="w-3 h-3 text-muted-foreground/60 flex-shrink-0" />
                <span className="truncate">{jogador.telefone}</span>
              </div>
            )}
          </div>
        )}

        {/* Vendedor info */}
        {showVendedorInfo && p.vendedor && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-muted-foreground/60 flex-shrink-0">Vendido por:</span>
              <span className="font-medium truncate">{p.vendedor.nome || p.vendedor.email}</span>
            </div>
            {p.vendedor.email && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Mail className="w-3 h-3 text-muted-foreground/60 flex-shrink-0" />
                <span className="truncate">{p.vendedor.email}</span>
              </div>
            )}
            {p.vendedor.telefone && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Phone className="w-3 h-3 text-muted-foreground/60 flex-shrink-0" />
                <span className="truncate">{p.vendedor.telefone}</span>
              </div>
            )}
          </div>
        )}

        {/* Números */}
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
                  className={`inline-flex items-center justify-center min-w-[2.5rem] h-8 px-2 text-xs font-mono font-bold rounded-lg border ${getJogoChip(p.jogo.tipo)}`}
                >
                  {formatNumero(num)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* NumerosVendidos (for rifa — individual sold numbers) */}
        {!numeros && p.numerosVendidos.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 p-1 rounded-md">
                <Ticket className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs font-semibold">Números</span>
              <span className="text-[10px] text-muted-foreground">({p.numerosVendidos.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {p.numerosVendidos.map((nv) => (
                <span
                  key={nv.numero}
                  className={`inline-flex items-center justify-center min-w-[2.5rem] h-8 px-2 text-xs font-mono font-bold rounded-lg border ${getJogoChip(p.jogo.tipo)}`}
                >
                  {formatNumero(nv.numero)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Coordenadas */}
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
        {isRaspadinha && p.resultadoRaspe && (
          <div className="border-t pt-3">
            <span className="text-xs font-semibold text-muted-foreground">Resultado Raspadinha</span>
            <pre className="bg-surface-container p-2 rounded-lg text-[10px] font-mono overflow-auto max-h-16 mt-1">
              {p.resultadoRaspe}
            </pre>
          </div>
        )}

        {/* Hash */}
        {hash && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between gap-2 bg-surface-container/50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <Hash className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs font-mono text-muted-foreground/70 truncate">
                  {hashVisivel ? hash : hash.substring(0, 16) + '...'}
                </span>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onToggleHash(p.id)}>
                  {hashVisivel ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onCopyHash(hash)}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}