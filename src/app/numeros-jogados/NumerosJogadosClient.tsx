'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Hash,
  Ticket,
  Eye,
  EyeOff,
  Copy,
  Search,
  ChevronLeft,
  ChevronRight,
  Trophy,
  MapPin,
  Calendar,
  User,
  Filter,
  Loader2,
  Gamepad2,
  Star,
  Gift,
  Award,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api-client';

interface JogoInfo {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  sorteado: boolean;
  dataSorteio: string | null;
  evento: {
    id: string;
    nome: string;
    aldeia: { id: string; nome: string; slug: string };
  };
}

interface UserInfo {
  id: string;
  nome: string;
  email: string;
}

interface NumeroVendido {
  numero: number;
}

interface Participacao {
  id: string;
  valorPago: number;
  metodoPagamento: string;
  estadoPagamento: string;
  dadosParticipacao: string;
  hashParticipacao: string | null;
  hashRaspe: string | null;
  dadosVerificacao: string | null;
  seedRaspe: string | null;
  resultadoRaspe: string | null;
  revelado: boolean;
  ganhador: boolean;
  premioEntregue: boolean;
  nomeCliente: string | null;
  telefoneCliente: string | null;
  emailCliente: string | null;
  createdAt: string;
  vendedorId: string | null;
  userId: string | null;
  jogo: JogoInfo;
  vendedor: UserInfo | null;
  user: UserInfo | null;
  numerosVendidos: NumeroVendido[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface AldeiaOption {
  id: string;
  nome: string;
}

function parseDados(raw: string): { numeros?: number[]; coordenadas?: { letra: string; numero: number }[] } | null {
  try { return JSON.parse(raw); } catch { return null; }
}

function formatNumero(num: number): string {
  return num.toString().padStart(3, '0');
}

function formatCoordenada(c: { letra: string; numero: number }): string {
  return `${c.letra}${c.numero}`;
}

function getHash(p: Participacao): string | null {
  return p.hashRaspe || p.hashParticipacao || null;
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
    case 'rifa': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'raspadinha': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'poio_da_vaca': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'euromilhoes': return 'bg-green-500/20 text-green-400 border-green-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
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

function getPaymentLabel(metodo: string): string {
  switch (metodo) {
    case 'saldo': return 'Saldo';
    case 'dinheiro': return 'Dinheiro';
    case 'mbway': return 'MB Way';
    case 'stripe': return 'Cartão';
    case 'transferencia': return 'Transferência';
    case 'vendedor': return 'Vendedor';
    default: return metodo;
  }
}

export default function NumerosJogadosClient() {
  const { user } = useAuth();
  const role = user?.role;

  const [participacoes, setParticipacoes] = useState<Participacao[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showHashes, setShowHashes] = useState<Record<string, boolean>>({});

  const [search, setSearch] = useState('');
  const [jogoTipo, setJogoTipo] = useState<string>('all');
  const [aldeiaFilter, setAldeiaFilter] = useState<string>('all');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [ganhadorFilter, setGanhadorFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [aldeias, setAldeias] = useState<AldeiaOption[]>([]);

  const showAldeiaFilter = role === 'super_admin';
  const showVendedorInfo = role === 'super_admin' || role === 'aldeia_admin';

  const fetchAldeias = useCallback(async () => {
    if (role !== 'super_admin') return;
    try {
      const res = await apiRequest('/api/aldeias');
      if (res.ok) {
        const data = await res.json();
        const items = data.data || data.aldeias || data || [];
        setAldeias(Array.isArray(items) ? items.map((a: AldeiaOption) => ({ id: a.id, nome: a.nome })) : []);
      }
    } catch (e) {
      console.error('Erro ao buscar aldeias:', e);
    }
  }, [role]);

  const fetchParticipacoes = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (jogoTipo !== 'all') params.set('jogoTipo', jogoTipo);
      if (aldeiaFilter !== 'all') params.set('aldeiaId', aldeiaFilter);
      if (estadoFilter !== 'all') params.set('estadoPagamento', estadoFilter);
      if (ganhadorFilter !== 'all') params.set('ganhador', ganhadorFilter);

      const res = await apiRequest(`/api/numeros-jogados?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao carregar');
      }
      const data = await res.json();
      setParticipacoes(data.data || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error(err);
      setFetchError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, jogoTipo, aldeiaFilter, estadoFilter, ganhadorFilter]);

  useEffect(() => { fetchAldeias(); }, [fetchAldeias]);
  useEffect(() => { fetchParticipacoes(); }, [fetchParticipacoes]);

  useEffect(() => { setCurrentPage(1); }, [search, jogoTipo, aldeiaFilter, estadoFilter, ganhadorFilter]);

  const toggleHash = (id: string) => {
    setShowHashes((p) => ({ ...p, [id]: !p[id] }));
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success('Hash copiada');
  };

  const getJogadorLabel = (p: Participacao): string => {
    if (p.user?.nome) return p.user.nome;
    if (p.nomeCliente) return p.nomeCliente;
    if (p.emailCliente) return p.emailCliente || '—';
    if (p.user?.email) return p.user.email;
    return '—';
  };

  const hasActiveFilters = search || jogoTipo !== 'all' || aldeiaFilter !== 'all' || estadoFilter !== 'all' || ganhadorFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="bg-card border-outline-variant/10 overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-outline-variant/10">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-1.5 rounded-lg">
              <Filter className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold">Filtros</span>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2 text-muted-foreground hover:text-destructive"
              onClick={() => {
                setSearch('');
                setJogoTipo('all');
                setAldeiaFilter('all');
                setEstadoFilter('all');
                setGanhadorFilter('all');
              }}
            >
              Limpar
            </Button>
          )}
        </div>
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por hash, nome, email ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className={`grid gap-2 ${showAldeiaFilter ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
            <Select value={jogoTipo} onValueChange={setJogoTipo}>
              <SelectTrigger className="w-full">
                <Gamepad2 className="h-3.5 w-3.5 mr-2 text-muted-foreground flex-shrink-0" />
                <SelectValue placeholder="Tipo de Jogo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Jogos</SelectItem>
                <SelectItem value="rifa">Rifa</SelectItem>
                <SelectItem value="raspadinha">Raspadinha</SelectItem>
                <SelectItem value="poio_da_vaca">Poio da Vaca</SelectItem>
                <SelectItem value="euromilhoes">Euromilhões</SelectItem>
              </SelectContent>
            </Select>

            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="concluido">Pago</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ganhadorFilter} onValueChange={setGanhadorFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Ganhador</SelectItem>
                <SelectItem value="false">Não Ganhador</SelectItem>
              </SelectContent>
            </Select>

            {showAldeiaFilter && (
              <Select value={aldeiaFilter} onValueChange={setAldeiaFilter}>
                <SelectTrigger className="w-full">
                  <MapPin className="h-3.5 w-3.5 mr-2 text-muted-foreground flex-shrink-0" />
                  <SelectValue placeholder="Aldeia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Aldeias</SelectItem>
                  {aldeias.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats bar */}
      {pagination && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <Badge variant="secondary" className="text-[11px] font-medium">
            {pagination.total} resultado{pagination.total !== 1 ? 's' : ''}
          </Badge>
          <span>Página {pagination.page} de {pagination.totalPages}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* Empty */}
      {!loading && !fetchError && participacoes.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center flex flex-col items-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Ticket className="h-8 w-8 text-primary/50" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {hasActiveFilters ? 'Nenhum resultado encontrado' : 'Ainda não tem números jogados'}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {hasActiveFilters
                ? 'Experimente remover alguns filtros para alargar a pesquisa.'
                : 'Os números que comprar ou vender aparecerão aqui.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {!loading && fetchError && (
        <Card className="border-destructive/30">
          <CardContent className="py-12 text-center flex flex-col items-center">
            <div className="bg-destructive/10 p-4 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-sm font-medium text-destructive">{fetchError}</p>
          </CardContent>
        </Card>
      )}

      {/* Cards */}
      {!loading && participacoes.map((p) => {
        const dados = parseDados(p.dadosParticipacao);
        const numeros = dados?.numeros;
        const coordenadas = dados?.coordenadas;
        const hash = getHash(p);
        const isRaspadinha = p.jogo.tipo === 'raspadinha';
        const Icon = getJogoIcon(p.jogo.tipo);

        return (
          <Card
            key={p.id}
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
                  <span className="truncate">{getJogadorLabel(p)}</span>
                </div>
              </div>

              {/* Vendedor info */}
              {showVendedorInfo && p.vendedor && (
                <div className="text-xs text-muted-foreground">
                  <span className="text-muted-foreground/60">Vendido por: </span>
                  <span className="font-medium">{p.vendedor.nome || p.vendedor.email}</span>
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
                        {showHashes[p.id] ? hash : hash.substring(0, 16) + '...'}
                      </span>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => toggleHash(p.id)}>
                        {showHashes[p.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => copyHash(hash)}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasPrev}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasNext}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Próxima
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
