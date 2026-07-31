'use client';
import { apiRequest } from '@/lib/api-client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VerificacaoResult {
  valido: boolean;
  participacao?: {
    id: string;
    jogo: string;
    tipoJogo: string;
    valorPago: number;
    createdAt: string;
    dadosVerificacao?: any;
    resultado?: any;
    cliente?: string;
    telefone?: string;
    premioEntregue: boolean;
    aldeia?: string;
  };
  mensagem: string;
}

export default function VerificarHashClient() {
  const [hash, setHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificacaoResult | null>(null);

  const handleVerify = async () => {
    if (!hash.trim()) {
      toast.error('Insira um hash para verificar');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/participacoes/verificar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hash: hash.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erro ao verificar hash');
        return;
      }

      setResult(data);
      toast.success(data.mensagem);
    } catch (error) {
      toast.error('Erro de conexão');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Verificação de Hash</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="hash">Hash de Verificação</Label>
            <Input
              id="hash"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              placeholder="Cole o hash aqui..."
              className="font-mono"
            />
          </div>
          <Button
            onClick={handleVerify}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Verificar Hash
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.valido ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              Resultado da Verificação
              <Badge variant={result.valido ? 'default' : 'destructive'}>
                {result.valido ? 'Válido' : 'Inválido'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">{result.mensagem}</p>

            {result.participacao && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Participação ID:</span> {result.participacao.id}
                </div>
                <div>
                  <span className="font-medium">Jogo:</span> {result.participacao.jogo}
                </div>
                <div>
                  <span className="font-medium">Tipo:</span> {result.participacao.tipoJogo}
                </div>
                <div>
                  <span className="font-medium">Valor:</span> €{result.participacao.valorPago}
                </div>
                <div>
                  <span className="font-medium">Data:</span> {new Date(result.participacao.createdAt).toLocaleDateString('pt-PT')}
                </div>
                <div>
                  <span className="font-medium">Cliente:</span> {result.participacao.cliente || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Telefone:</span> {result.participacao.telefone || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Aldeia:</span> {result.participacao.aldeia || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Prêmio Entregue:</span>
                  <Badge variant={result.participacao.premioEntregue ? 'default' : 'secondary'}>
                    {result.participacao.premioEntregue ? 'Sim' : 'Não'}
                  </Badge>
                </div>
              </div>
            )}

            {result.participacao?.dadosVerificacao && (
              <div>
                <span className="font-medium">Dados de Verificação:</span>
                <pre className="bg-gray-50 p-3 rounded text-xs mt-2 overflow-auto">
                  {JSON.stringify(result.participacao.dadosVerificacao, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}