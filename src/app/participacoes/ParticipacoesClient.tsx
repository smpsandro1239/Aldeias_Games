'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface Participacao {
  id: string;
  valorPago: number;
  metodoPagamento: string;
  estadoPagamento: string;
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
    setShowHashes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Hash copiado para a área de transferência');
  };

  const getHash = (participacao: Participacao) => {
    if (participacao.hashRaspe) {
      return participacao.hashRaspe;
    }
    if (participacao.hashParticipacao) {
      return participacao.hashParticipacao;
    }
    return null;
  };

  const getVerificacaoData = (participacao: Participacao) => {
    if (participacao.dadosVerificacao) {
      try {
        return JSON.parse(participacao.dadosVerificacao);
      } catch {
        return null;
      }
    }
    return null;
  };

  if (isLoading) return <div>Carregando participações...</div>;
  if (error) return <div className="text-red-500">Erro ao carregar participações</div>;

  return (
    <div className="space-y-6">
      {participacoes?.data?.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">Você ainda não tem participações.</p>
          </CardContent>
        </Card>
      ) : (
        participacoes?.data?.map((participacao: Participacao) => {
          const hash = getHash(participacao);
          const verificacaoData = getVerificacaoData(participacao);

          return (
            <Card key={participacao.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{participacao.jogo.nome}</span>
                  <Badge variant={participacao.estadoPagamento === 'concluido' ? 'default' : 'secondary'}>
                    {participacao.estadoPagamento === 'concluido' ? 'Pago' : 'Pendente'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Evento:</span> {participacao.jogo.evento.nome}
                  </div>
                  <div>
                    <span className="font-medium">Aldeia:</span> {participacao.jogo.evento.aldeia.nome}
                  </div>
                  <div>
                    <span className="font-medium">Tipo:</span> {participacao.jogo.tipo}
                  </div>
                  <div>
                    <span className="font-medium">Valor:</span> €{participacao.valorPago}
                  </div>
                  <div>
                    <span className="font-medium">Data:</span> {new Date(participacao.createdAt).toLocaleDateString('pt-PT')}
                  </div>
                  {participacao.resultadoRaspe && (
                    <div>
                      <span className="font-medium">Resultado:</span> {participacao.resultadoRaspe}
                    </div>
                  )}
                </div>

                {hash && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Hash de Verificação:</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleHashVisibility(participacao.id)}
                        >
                          {showHashes[participacao.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(hash)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {showHashes[participacao.id] && (
                      <div className="bg-gray-50 p-3 rounded font-mono text-xs break-all">
                        {hash}
                      </div>
                    )}
                  </div>
                )}

                {verificacaoData && (
                  <div className="border-t pt-4">
                    <span className="font-medium">Dados de Verificação:</span>
                    <pre className="bg-gray-50 p-3 rounded text-xs mt-2 overflow-auto">
                      {JSON.stringify(verificacaoData, null, 2)}
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