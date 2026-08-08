'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Ticket,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api-client';
import { AldeiaOption, Pagination, Participacao } from './numeros-jogados-types';
import { NumerosJogadosFilters } from './numeros-jogados-filtros';
import { NumerosJogadosCard } from './numeros-jogados-card';

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

  const hasActiveFilters = !!search || jogoTipo !== 'all' || aldeiaFilter !== 'all' || estadoFilter !== 'all' || ganhadorFilter !== 'all';

  const limparFiltros = () => {
    setSearch('');
    setJogoTipo('all');
    setAldeiaFilter('all');
    setEstadoFilter('all');
    setGanhadorFilter('all');
  };

  return (
    <div className="space-y-4">
      <NumerosJogadosFilters
        search={search}
        jogoTipo={jogoTipo}
        estadoFilter={estadoFilter}
        ganhadorFilter={ganhadorFilter}
        aldeiaFilter={aldeiaFilter}
        aldeias={aldeias}
        showAldeiaFilter={showAldeiaFilter}
        hasActiveFilters={hasActiveFilters}
        onSearch={setSearch}
        onJogoTipo={setJogoTipo}
        onEstado={setEstadoFilter}
        onGanhador={setGanhadorFilter}
        onAldeia={setAldeiaFilter}
        onLimpar={limparFiltros}
      />

      {pagination && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <Badge variant="secondary" className="text-[11px] font-medium">
            {pagination.total} resultado{pagination.total !== 1 ? 's' : ''}
          </Badge>
          <span>Página {pagination.page} de {pagination.totalPages}</span>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

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

      {!loading && participacoes.map((p) => (
        <NumerosJogadosCard
          key={p.id}
          p={p}
          hashVisivel={!!showHashes[p.id]}
          showVendedorInfo={showVendedorInfo}
          onToggleHash={toggleHash}
          onCopyHash={copyHash}
        />
      ))}

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