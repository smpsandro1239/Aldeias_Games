'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, MapPin, Gamepad2, Filter } from 'lucide-react';
import { AldeiaOption } from './numeros-jogados-types';

interface NumerosJogadosFiltrosProps {
  search: string;
  jogoTipo: string;
  estadoFilter: string;
  ganhadorFilter: string;
  aldeiaFilter: string;
  aldeias: AldeiaOption[];
  showAldeiaFilter: boolean;
  hasActiveFilters: boolean;
  onSearch: (v: string) => void;
  onJogoTipo: (v: string) => void;
  onEstado: (v: string) => void;
  onGanhador: (v: string) => void;
  onAldeia: (v: string) => void;
  onLimpar: () => void;
}

export function NumerosJogadosFilters(props: NumerosJogadosFiltrosProps) {
  const { search, jogoTipo, estadoFilter, ganhadorFilter, aldeiaFilter, aldeias, showAldeiaFilter, hasActiveFilters, onSearch, onJogoTipo, onEstado, onGanhador, onAldeia, onLimpar } = props;

  return (
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
            onClick={onLimpar}
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
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className={`grid gap-2 ${showAldeiaFilter ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
          <Select value={jogoTipo} onValueChange={onJogoTipo}>
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

          <Select value={estadoFilter} onValueChange={onEstado}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="concluido">Pago</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
            </SelectContent>
          </Select>

          <Select value={ganhadorFilter} onValueChange={onGanhador}>
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
            <Select value={aldeiaFilter} onValueChange={onAldeia}>
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
  );
}