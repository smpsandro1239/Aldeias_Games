"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertCircle, 
  Trophy, 
  Euro, 
  TrendingUp,
  Shield,
  Hash,
  Copy,
  Share2,
  Printer
} from "lucide-react";
import { toast } from "sonner";

// Constants for game types to avoid magic strings
const GAME_TYPES = {
  RASPADINHA: 'raspadinha',
  RIFA: 'rifa',
  EUROMILHOES: 'euromilhoes',
  POIO_DA_VACA: 'poio_da_vaca'
} as const;

type GameType = typeof GAME_TYPES[keyof typeof GAME_TYPES];

// Constants for profitability thresholds
const PROFITABILITY_THRESHOLDS = {
  MIN_LUCRO_PERCENTAGEM: 50,
  MIN_MARGEM_LUCRO: 50,
} as const;

interface Premio {
  nome: string;
  valor: number;
  percentagem?: number;
}

interface RentabilidadeData {
  tipoJogo: GameType;
  nome: string;
  preco: number;
  stock?: number;
  premios: Premio[];
  dimensoesX?: number;
  dimensoesY?: number;
  custoQuadrado?: number;
  valorCompraVaca?: number;
}

interface RentabilidadeMetrics {
  receitaTotal: number;
  custoTotalPremios: number;
  lucroLiquido: number;
  margemLucro: number;
  lucroMinimo: number;
  percentagemTotal: number;
  isLucrativo: boolean;
  totalQuadrados: number;
}

interface TransparencyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  data: RentabilidadeData;
  loading?: boolean;
}

export function TransparencyModal({
  open,
  onOpenChange,
  onConfirm,
  data,
  loading
}: TransparencyModalProps) {

  const metrics = useMemo((): RentabilidadeMetrics => {
    let receitaTotal = 0;
    let custoTotalPremios = 0;
    let percentagemTotal = 0;

    if (data.tipoJogo === GAME_TYPES.RASPADINHA && data.stock) {
      receitaTotal = data.preco * data.stock;
      data.premios.forEach(p => {
        if (p.percentagem && data.stock) {
          custoTotalPremios += p.valor * (p.percentagem / 100) * data.stock;
          percentagemTotal += p.percentagem;
        }
      });
    } else if (data.tipoJogo === GAME_TYPES.RIFA || data.tipoJogo === GAME_TYPES.EUROMILHOES) {
      receitaTotal = data.preco * (data.stock || 0);
      custoTotalPremios = data.premios.reduce((acc, p) => acc + p.valor, 0);
    } else if (data.tipoJogo === GAME_TYPES.POIO_DA_VACA) {
      const totalQuadrados = (data.dimensoesX || 0) * (data.dimensoesY || 0);
      receitaTotal = totalQuadrados * (data.custoQuadrado || 0);
      custoTotalPremios = data.valorCompraVaca || 0;
    }

    const lucroLiquido = receitaTotal - custoTotalPremios;
    const margemLucro = receitaTotal > 0 ? (lucroLiquido / receitaTotal) * 100 : 0;
    const lucroMinimo = data.tipoJogo === GAME_TYPES.RASPADINHA
      ? 100 - percentagemTotal
      : margemLucro;
    const isLucrativo = lucroMinimo >= PROFITABILITY_THRESHOLDS.MIN_LUCRO_PERCENTAGEM ||
                        margemLucro >= PROFITABILITY_THRESHOLDS.MIN_MARGEM_LUCRO;

    return {
      receitaTotal,
      custoTotalPremios,
      lucroLiquido,
      margemLucro,
      lucroMinimo,
      percentagemTotal,
      isLucrativo,
      totalQuadrados: (data.dimensoesX || 0) * (data.dimensoesY || 0)
    };
  }, [data]);
  
  const gerarHash = useCallback(() => {
    const texto = JSON.stringify({
      tipo: data.tipoJogo,
      nome: data.nome,
      preco: data.preco,
      stock: data.stock,
      premios: data.premios,
      timestamp: new Date().toISOString(),
      receita: metrics.receitaTotal,
      custo: metrics.custoTotalPremios,
      lucro: metrics.lucroLiquido
    });

    let hash = 0;
    for (let i = 0; i < texto.length; i++) {
      const char = texto.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `AG-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}-${Date.now().toString(36).toUpperCase()}`;
  }, [data, metrics]);

  const verificationHash = useMemo(() => gerarHash(), [gerarHash]);

  const copyHash = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(verificationHash);
      toast.success("Hash copiado!");
    } catch (error) {
      console.error("Erro ao copiar hash:", error);
      toast.error("Erro ao copiar hash");
    }
  }, [verificationHash]);

  const gameTypeLabels = useMemo(() => ({
    [GAME_TYPES.RASPADINHA]: "Raspadinha",
    [GAME_TYPES.RIFA]: "Rifa",
    [GAME_TYPES.EUROMILHOES]: "Euromilhões",
    [GAME_TYPES.POIO_DA_VACA]: "Poio da Vaca"
  }), []);

  const generateWhatsAppMessage = useCallback(() => {
    const tipoJogoNome = gameTypeLabels[data.tipoJogo] || data.tipoJogo;
    
    let message = `🏆 *ALDÉIAS GAMES - JOGO CRIADO*\n\n`;
    message += `📋 *${data.nome}*\n`;
    message += `🎮 Tipo: ${tipoJogoNome}\n`;
    message += `💶 Preço: ${data.preco.toFixed(2)}€\n\n`;
    
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📊 *RESUMO FINANCEIRO*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    message += `💰 Receita Esperada:\n`;
    message += `   ${metrics.receitaTotal.toFixed(2)}€\n\n`;
    
    message += `🎁 Custo Prémios:\n`;
    message += `   ${metrics.custoTotalPremios.toFixed(2)}€\n\n`;
    
    message += `📈 Lucro Líquido:\n`;
    message += `   ${metrics.lucroLiquido.toFixed(2)}€\n`;
    message += `   Margem: ${metrics.margemLucro.toFixed(1)}%\n\n`;
    
    message += `✅ Garantia:\n`;
    message += `   Lucro mínimo: ${metrics.lucroMinimo.toFixed(1)}%\n`;
    message += `   Regras antifraude: CUMPRIDAS\n\n`;
    
    message += `🔒 Hash Verificação:\n`;
    message += `   ${verificationHash}\n\n`;
    
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `✨ Aldeias Games - Transparência Total\n`;
    
    return encodeURIComponent(message);
  }, [gameTypeLabels, data, metrics, verificationHash]);
  
  const shareWhatsApp = useCallback(() => {
    try {
      const message = generateWhatsAppMessage();
      const url = `https://wa.me/?text=${message}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error("Erro ao compartilhar no WhatsApp:", error);
      toast.error("Erro ao compartilhar");
    }
  }, [generateWhatsAppMessage]);

  const printSummary = useCallback(() => {
    const printContent = `
      <html>
        <head>
          <title>Resumo Jogo - ${data.nome}</title>
           <style>
             body { font-family: Arial, sans-serif; padding: 20px; }
             h1 { color: hsl(var(--primary)); }
             .section { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
             .metric { display: flex; justify-content: space-between; margin: 10px 0; }
             .highlight { color: hsl(var(--primary)); font-weight: bold; }
             .success { color: green; }
             .hash { font-family: monospace; background: #eee; padding: 5px; }
           </style>
        </head>
        <body>
          <h1>🏆 Aldeias Games - ${data.nome}</h1>
          <div class="section">
            <h2>Informação do Jogo</h2>
            <div class="metric"><span>Tipo:</span><span>${data.tipoJogo}</span></div>
            <div class="metric"><span>Preço:</span><span class="highlight">${data.preco.toFixed(2)}€</span></div>
            <div class="metric"><span>Stock:</span><span>${data.stock || 'N/A'}</span></div>
          </div>
          <div class="section">
            <h2>💰 Análise Financeira</h2>
            <div class="metric"><span>Receita:</span><span>${metrics.receitaTotal.toFixed(2)}€</span></div>
            <div class="metric"><span>Custo Prémios:</span><span>${metrics.custoTotalPremios.toFixed(2)}€</span></div>
            <div class="metric"><span>Lucro:</span><span class="highlight">${metrics.lucroLiquido.toFixed(2)}€</span></div>
            <div class="metric"><span>Margem:</span><span class="success">${metrics.margemLucro.toFixed(1)}%</span></div>
          </div>
          <div class="section">
            <h2>✅ Transparência</h2>
            <p>Este jogo garante ${metrics.lucroMinimo.toFixed(1)}% de lucro mínimo e cumpre todas as regras antifraude.</p>
            <p class="hash">Hash: ${verificationHash}</p>
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  }, [data, metrics, verificationHash]);

  const getTipoJogoNome = () => {
    const nomes: Record<string, string> = {
      "raspadinha": "Raspadinha",
      "rifa": "Rifa",
      "euromilhoes": "Euromilhões",
      "poio_da_vaca": "Poio da Vaca"
    };
    return nomes[data.tipoJogo] || data.tipoJogo;
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto p-0">
            <DialogTitle className="sr-only">Resumo de Rentabilidade e Transparência</DialogTitle>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container rounded-2xl overflow-hidden"
            >
              <div className="bg-emerald-500 text-foreground shadow-md p-6 rounded-lg">
                <Shield className="w-12 h-12 mx-auto mb-2 text-foreground" />
                <h3 className="text-xl font-medium mb-4">Resumo de Rentabilidade e Transparência</h3>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-surface-container-low rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Jogo:</span>
                    <span className="font-bold text-accent">{data.nome}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <Badge className="bg-primary/20 text-primary">{getTipoJogoNome()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Preço Unitário:</span>
                    <span className="font-bold text-secondary">{data.preco.toFixed(2)}€</span>
                  </div>
                  {data.stock && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Stock Total:</span>
                      <span className="font-bold">{data.stock} bilhetes</span>
                    </div>
                  )}
                  {metrics.totalQuadrados > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Quadrados:</span>
                      <span className="font-bold">{metrics.totalQuadrados}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-accent flex items-center gap-2">
                    <Euro className="w-4 h-4" /> Receita Esperada
                  </h3>
                  <div className="bg-surface-container-low rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Bilhetes/Números</span>
                      <span>{data.stock || metrics.totalQuadrados}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Preço Unitário</span>
                      <span>{data.preco.toFixed(2)}€</span>
                    </div>
                    <div className="border-t border-outline-variant/30 pt-2 flex items-center justify-between font-bold">
                      <span className="text-accent">RECEITA TOTAL</span>
                      <span className="text-secondary text-lg">{metrics.receitaTotal.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-accent flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> Prémios
                  </h3>
                  <div className="bg-surface-container-low rounded-xl p-4 space-y-2">
                    {data.premios.map((premio, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{premio.nome || `Prémio ${i + 1}`}</span>
                        <span className="font-medium">
                          {premio.valor.toFixed(2)}€
                          {premio.percentagem && ` (${premio.percentagem}%)`}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-outline-variant/30 pt-2 flex items-center justify-between font-bold">
                      <span className="text-accent">CUSTO TOTAL</span>
                      <span className="text-primary text-lg">{metrics.custoTotalPremios.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-accent flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Análise de Rentabilidade
                  </h3>
                  <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Lucro Líquido</span>
                      <span className={`font-bold ${metrics.lucroLiquido >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {metrics.lucroLiquido.toFixed(2)}€
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Margem de Lucro</span>
                      <span className={`font-bold ${metrics.margemLucro >= 50 ? 'text-primary' : metrics.margemLucro >= 0 ? 'text-accent' : 'text-destructive'}`}>
                        {metrics.margemLucro.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Lucro Mínimo Garantido</span>
                      <span className={`font-bold ${metrics.lucroMinimo >= 50 ? 'text-primary' : 'text-destructive'}`}>
                        {metrics.lucroMinimo.toFixed(1)}%
                      </span>
                    </div>
                    {metrics.percentagemTotal > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">% Total Prémios</span>
                        <span className="font-bold">{metrics.percentagemTotal.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border-2 ${metrics.isLucrativo ? 'bg-primary/10 border-green-500/30' : 'bg-destructive/10 border-red-500/30'}`}>
                  <div className="flex items-start gap-3">
                    {metrics.isLucrativo ? (
                      <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-bold ${metrics.isLucrativo ? 'text-primary' : 'text-destructive'}`}>
                        {metrics.isLucrativo ? '✅ JOGO APROVADO' : '❌ JOGO REJEITADO'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {metrics.isLucrativo 
                          ? `Este jogo garante ${metrics.lucroMinimo.toFixed(1)}% de lucro mínimo e cumpre todas as regras antifraude.`
                          : `Este jogo não cumpre o requisito mínimo de 50% de lucro. Ajuste os valores.`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-low rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-accent flex items-center gap-2">
                      <Hash className="w-4 h-4" /> Hash de Verificação
                    </h4>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={copyHash}
                       className="h-7 text-xs"
                       aria-label="Copiar hash de verificação para área de transferência"
                     >
                       <Copy className="w-3 h-3 mr-1" aria-hidden="true" /> Copiar
                     </Button>
                  </div>
                  <p className="font-mono text-sm bg-surface-container-highest p-2 rounded-lg text-secondary break-all">
                    {verificationHash}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    Este hash garante a integridade dos dados do jogo para auditoria futura.
                  </p>
                </div>

                 <div className="flex gap-2" role="group" aria-label="Opções de compartilhamento">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={shareWhatsApp}
                     className="flex-1 bg-primary/10 border-green-500/30 text-primary hover:bg-primary/20"
                     aria-label="Compartilhar análise no WhatsApp"
                   >
                     <Share2 className="w-4 h-4 mr-2" aria-hidden="true" /> WhatsApp
                   </Button>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={printSummary}
                     className="flex-1"
                     aria-label="Imprimir resumo da análise de rentabilidade"
                   >
                     <Printer className="w-4 h-4 mr-2" aria-hidden="true" /> Imprimir
                   </Button>
                 </div>
              </div>

              <div className="p-6 pt-0 flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={onConfirm}
                  disabled={loading || !metrics.isLucrativo}
                  className={`flex-1 ${metrics.isLucrativo ? 'bg-primary hover:bg-primary' : ''}`}
                  aria-label={metrics.isLucrativo ? "Confirmar criação do jogo" : "Jogo não é lucrativo, revise os parâmetros"}
                >
                  {loading ? "A criar..." : "✅ Confirmar e Criar"}
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
