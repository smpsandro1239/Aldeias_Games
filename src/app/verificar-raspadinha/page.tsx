'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Search, Check, X, Loader2, Hash, Calendar, Gamepad2, MapPin } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { LayoutHeader } from "@/components/layout-header";

interface VerificationResult {
  valido: boolean;
  mensagem: string;
  participacao?: {
    id: string;
    jogo: string;
    tipoJogo: string;
    aldeia: string;
    valorPago: number;
    data: string;
    ganhador: boolean;
    premioEntregue: boolean;
    resultado: string | null;
  };
}

export default function VerificarRaspadinhaPage() {
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = async () => {
    if (!hash.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/verificar-publico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash: hash.trim() }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ valido: false, mensagem: "Erro ao verificar. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutHeader>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-bold mb-2">Verificar Participação</h1>
          <p className="text-muted-foreground">
            Insere o hash da tua participação para confirmar que é autêntica e não foi adulterada.
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                  placeholder="Cole o hash da participação..."
                  className="pl-10 font-mono text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
              </div>
              <Button onClick={handleVerify} disabled={loading || !hash.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                Verificar
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card className={result.valido ? "border-green-500/30" : "border-red-500/30"}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${result.valido ? "bg-green-500/20" : "bg-red-500/20"}`}>
                  {result.valido ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" />}
                </div>
                <div>
                  <CardTitle className={result.valido ? "text-green-700" : "text-red-700"}>
                    {result.valido ? "Válida" : "Inválida"}
                  </CardTitle>
                  <CardDescription>{result.mensagem}</CardDescription>
                </div>
              </div>
            </CardHeader>
            {result.participacao && (
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Jogo:</span>
                    <span className="font-medium">{result.participacao.jogo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{result.participacao.tipoJogo}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Aldeia:</span>
                    <span className="font-medium">{result.participacao.aldeia}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-medium ml-1">{formatCurrency(result.participacao.valorPago)}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Data:</span>
                    <span className="font-medium">{formatDateTime(result.participacao.data)}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  {result.participacao.ganhador && (
                    <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
                      <Check className="w-3 h-3 mr-1" /> GANHADOR
                    </Badge>
                  )}
                  {result.participacao.premioEntregue && (
                    <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">
                      PRÉMIO ENTREGUE
                    </Badge>
                  )}
                  {!result.participacao.ganhador && (
                    <Badge variant="secondary">SEM PRÉMIO</Badge>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        <div className="mt-8 text-center text-xs text-muted-foreground space-y-1">
          <p>Esta verificação confirma que o hash foi gerado pelo sistema e não foi adulterado.</p>
          <p>Cada participação tem um hash único gerado antes do jogo ser revelado.</p>
        </div>
        </div>
      </div>
    </LayoutHeader>
  );
}
