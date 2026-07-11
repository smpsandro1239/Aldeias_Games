"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Copy,
  Download,
  QrCode,
  Hash,
  Trophy,
  Calendar,
  DollarSign,
  Smartphone
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface ParticipacaoConfirmacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participacao: {
    id: string;
    valorPago: number;
    createdAt: string;
    jogo: {
      nome: string;
      tipo: string;
    };
    hashParticipacao?: string;
    hashRaspe?: string;
    dadosParticipacao?: any;
  } | null;
}

export function ParticipacaoConfirmacaoModal({
  open,
  onOpenChange,
  participacao
}: ParticipacaoConfirmacaoModalProps) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const hash = participacao?.hashParticipacao || participacao?.hashRaspe;
  const participacaoId = participacao?.id;

  const copyToClipboard = async (text: string, type: 'hash' | 'id') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'hash') {
        setCopiedHash(true);
        setTimeout(() => setCopiedHash(false), 2000);
      } else {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      }
      toast.success(`${type === 'hash' ? 'Hash' : 'ID'} copiado!`);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const downloadQRCode = () => {
    // Criar um QR code simples com o hash
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");

    if (ctx && hash) {
      // Fundo branco
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 300, 300);

      // Texto do hash no centro (simplificado)
      ctx.fillStyle = "#000000";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";

      const hashLines = hash.match(/.{1,20}/g) || [];
      hashLines.forEach((line, index) => {
        ctx.fillText(line, 150, 120 + (index * 15));
      });

      // Borda
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 280, 280);

      // Download
      const link = document.createElement("a");
      link.download = `bilhete-${participacaoId || 'participacao'}.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast.success("QR Code descarregado!");
    }
  };

  const getJogoIcon = (tipo: string) => {
    switch (tipo) {
      case 'rifa': return '🎯';
      case 'euromilhoes': return '🎲';
      case 'poio_da_vaca': return '🐄';
      case 'raspadinha': return '🎰';
      default: return '🎮';
    }
  };

  const getJogoNome = (tipo: string) => {
    switch (tipo) {
      case 'rifa': return 'Rifa';
      case 'euromilhoes': return 'Euromilhões';
      case 'poio_da_vaca': return 'Poio da Vaca';
      case 'raspadinha': return 'Raspadinha';
      default: return tipo;
    }
  };

  if (!participacao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-surface-container border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            <CheckCircle className="h-6 w-6 text-primary" />
            Participação Confirmada!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações do Jogo */}
          <div className="text-center space-y-2">
            <div className="text-4xl">{getJogoIcon(participacao.jogo.tipo)}</div>
            <h3 className="text-lg font-bold">{participacao.jogo.nome}</h3>
            <Badge variant="secondary" className="text-xs">
              {getJogoNome(participacao.jogo.tipo)}
            </Badge>
          </div>

          {/* Detalhes da Participação */}
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valor Pago
              </span>
              <span className="font-bold text-primary">
                {formatCurrency(participacao.valorPago)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data da Participação
              </span>
              <span className="text-sm">
                {new Date(participacao.createdAt).toLocaleString("pt-PT")}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground flex items-center gap-2">
                <Hash className="h-4 w-4" />
                ID da Participação
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(participacao.id, 'id')}
                className="h-6 px-2 text-xs"
              >
                {copiedId ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {/* Hash de Verificação */}
          {hash && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                <span className="font-semibold text-primary">Código de Verificação</span>
              </div>

              <div className="bg-black/5 p-3 rounded font-mono text-xs break-all">
                {hash}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(hash, 'hash')}
                  className="flex-1 border-primary/30"
                >
                  {copiedHash ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Hash
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadQRCode}
                  className="flex-1 border-primary/30"
                >
                  <Download className="h-4 w-4 mr-2" />
                  QR Code
                </Button>
              </div>
            </div>
          )}

          {/* Instruções sobre Prêmios */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Trophy className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-3">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                  🎯 Como Resgatar seu Prêmio
                </h4>
                <div className="space-y-2">
                  <div className="bg-white/50 dark:bg-black/20 rounded p-2">
                    <h5 className="font-medium text-amber-900 dark:text-amber-100 text-sm">Se você GANHAR:</h5>
                    <ol className="text-xs text-amber-800 dark:text-amber-200 space-y-1 ml-4 mt-1">
                      <li>1. Dirija-se à organização/bilheteria</li>
                      <li>2. Mostre este código de verificação</li>
                      <li>3. Apresente documento de identificação</li>
                      <li>4. Receba seu prêmio após validação</li>
                    </ol>
                  </div>
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded p-2">
                    <h5 className="font-medium text-blue-900 dark:text-blue-100 text-sm">📍 Locais para Resgate:</h5>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 ml-4 mt-1">
                      <li>• Bilheteria da organização</li>
                      <li>• Pontos de venda autorizados</li>
                      <li>• Locais indicados no regulamento</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded p-2">
                  <h5 className="font-medium text-red-900 dark:text-red-100 text-sm">⚠️ Importante:</h5>
                  <ul className="text-xs text-red-800 dark:text-red-200 space-y-1 ml-4 mt-1">
                    <li>• Guarde este código em local seguro</li>
                    <li>• Sem este código, não é possível validar sua participação</li>
                    <li>• Você pode visualizá-lo novamente em "Meus Bilhetes"</li>
                    <li>• Prêmios têm prazo de validade</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Entendi
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Ir para Jogos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}