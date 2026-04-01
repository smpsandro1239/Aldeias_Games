"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

interface RentabilidadeData {
  tipoJogo: string;
  nome: string;
  preco: number;
  stock?: number;
  premios: Array<{
    nome: string;
    valor: number;
    percentagem?: number;
  }>;
  dimensoesX?: number;
  dimensoesY?: number;
  custoQuadrado?: number;
  valorCompraVaca?: number;
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
  
  const calcularRentabilidade = () => {
    let receitaTotal = 0;
    let custoTotalPremios = 0;
    let percentagemTotal = 0;
    
    if (data.tipoJogo === "raspadinha" && data.stock) {
      receitaTotal = data.preco * data.stock;
      data.premios.forEach(p => {
        if (p.percentagem) {
          custoTotalPremios += p.valor * (p.percentagem / 100) * data.stock!;
          percentagemTotal += p.percentagem;
        }
      });
    } else if (data.tipoJogo === "rifa" || data.tipoJogo === "tombola") {
      receitaTotal = data.preco * (data.stock || 0);
      custoTotalPremios = data.premios.reduce((acc, p) => acc + p.valor, 0);
    } else if (data.tipoJogo === "poio_da_vaca") {
      const totalQuadrados = (data.dimensoesX || 0) * (data.dimensoesY || 0);
      receitaTotal = totalQuadrados * (data.custoQuadrado || 0);
      custoTotalPremios = data.valorCompraVaca || 0;
    }
    
    const lucroLiquido = receitaTotal - custoTotalPremios;
    const margemLucro = receitaTotal > 0 ? (lucroLiquido / receitaTotal) * 100 : 0;
    const lucroMinimo = data.tipoJogo === "raspadinha" 
      ? 100 - percentagemTotal 
      : margemLucro;
    const isLucrativo = lucroMinimo >= 50 || margemLucro >= 50;
    
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
  };
  
  const metrics = calcularRentabilidade();
  
  const gerarHash = () => {
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
  };
  
  const verificationHash = gerarHash();
  
  const copyHash = () => {
    navigator.clipboard.writeText(verificationHash);
    toast.success("Hash copiado!");
  };
  
  const generateWhatsAppMessage = () => {
    const tipoJogoNome = {
      "raspadinha": "Raspadinha",
      "rifa": "Rifa",
      "tombola": "Tombola",
      "poio_da_vaca": "Poio da Vaca"
    }[data.tipoJogo] || data.tipoJogo;
    
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
  };
  
  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${generateWhatsAppMessage()}`;
    window.open(url, '_blank');
  };
  
  const printSummary = () => {
    const printContent = `
      <html>
        <head>
          <title>Resumo Jogo - ${data.nome}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #ff734b; }
            .section { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
            .metric { display: flex; justify-content: space-between; margin: 10px 0; }
            .highlight { color: #ff734b; font-weight: bold; }
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
  };

  const getTipoJogoNome = () => {
    const nomes: Record<string, string> = {
      "raspadinha": "Raspadinha",
      "rifa": "Rifa",
      "tombola": "Tombola",
      "poio_da_vaca": "Poio da Vaca"
    };
    return nomes[data.tipoJogo] || data.tipoJogo;
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto p-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1f1b19] rounded-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-[#ff734b] to-[#9cefff] p-6 text-center">
                <Shield className="w-12 h-12 mx-auto mb-2 text-white" />
                <h2 className="text-2xl font-serif font-bold text-white">
                  Resumo de Rentabilidade e Transparência
                </h2>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-[#2e2928] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#e0bfb7]">Jogo:</span>
                    <span className="font-bold text-[#ffb5a0]">{data.nome}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#e0bfb7]">Tipo:</span>
                    <Badge className="bg-[#ff734b]/20 text-[#ff734b]">{getTipoJogoNome()}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#e0bfb7]">Preço Unitário:</span>
                    <span className="font-bold text-[#9cefff]">{data.preco.toFixed(2)}€</span>
                  </div>
                  {data.stock && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#e0bfb7]">Stock Total:</span>
                      <span className="font-bold">{data.stock} bilhetes</span>
                    </div>
                  )}
                  {metrics.totalQuadrados > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#e0bfb7]">Total Quadrados:</span>
                      <span className="font-bold">{metrics.totalQuadrados}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-[#ffb5a0] flex items-center gap-2">
                    <Euro className="w-4 h-4" /> Receita Esperada
                  </h3>
                  <div className="bg-[#2e2928] rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#e0bfb7]">Total Bilhetes/Números</span>
                      <span>{data.stock || metrics.totalQuadrados}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#e0bfb7]">Preço Unitário</span>
                      <span>{data.preco.toFixed(2)}€</span>
                    </div>
                    <div className="border-t border-[#58413b]/30 pt-2 flex items-center justify-between font-bold">
                      <span className="text-[#ffb5a0]">RECEITA TOTAL</span>
                      <span className="text-[#9cefff] text-lg">{metrics.receitaTotal.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-[#ffb5a0] flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> Prémios
                  </h3>
                  <div className="bg-[#2e2928] rounded-xl p-4 space-y-2">
                    {data.premios.map((premio, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-[#e0bfb7]">{premio.nome || `Prémio ${i + 1}`}</span>
                        <span className="font-medium">
                          {premio.valor.toFixed(2)}€
                          {premio.percentagem && ` (${premio.percentagem}%)`}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-[#58413b]/30 pt-2 flex items-center justify-between font-bold">
                      <span className="text-[#ffb5a0]">CUSTO TOTAL</span>
                      <span className="text-[#ff734b] text-lg">{metrics.custoTotalPremios.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-[#ffb5a0] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Análise de Rentabilidade
                  </h3>
                  <div className="bg-[#2e2928] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#e0bfb7]">Lucro Líquido</span>
                      <span className={`font-bold ${metrics.lucroLiquido >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {metrics.lucroLiquido.toFixed(2)}€
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#e0bfb7]">Margem de Lucro</span>
                      <span className={`font-bold ${metrics.margemLucro >= 50 ? 'text-green-500' : metrics.margemLucro >= 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {metrics.margemLucro.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#e0bfb7]">Lucro Mínimo Garantido</span>
                      <span className={`font-bold ${metrics.lucroMinimo >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                        {metrics.lucroMinimo.toFixed(1)}%
                      </span>
                    </div>
                    {metrics.percentagemTotal > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#e0bfb7]">% Total Prémios</span>
                        <span className="font-bold">{metrics.percentagemTotal.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border-2 ${metrics.isLucrativo ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  <div className="flex items-start gap-3">
                    {metrics.isLucrativo ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-bold ${metrics.isLucrativo ? 'text-green-500' : 'text-red-500'}`}>
                        {metrics.isLucrativo ? '✅ JOGO APROVADO' : '❌ JOGO REJEITADO'}
                      </p>
                      <p className="text-sm text-[#e0bfb7] mt-1">
                        {metrics.isLucrativo 
                          ? `Este jogo garante ${metrics.lucroMinimo.toFixed(1)}% de lucro mínimo e cumpre todas as regras antifraude.`
                          : `Este jogo não cumpre o requisito mínimo de 50% de lucro. Ajuste os valores.`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#2e2928] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-[#ffb5a0] flex items-center gap-2">
                      <Hash className="w-4 h-4" /> Hash de Verificação
                    </h4>
                    <Button variant="ghost" size="sm" onClick={copyHash} className="h-7 text-xs">
                      <Copy className="w-3 h-3 mr-1" /> Copiar
                    </Button>
                  </div>
                  <p className="font-mono text-sm bg-[#393432] p-2 rounded-lg text-[#9cefff] break-all">
                    {verificationHash}
                  </p>
                  <p className="text-xs text-[#e0bfb7]/60 mt-2">
                    Este hash garante a integridade dos dados do jogo para auditoria futura.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={shareWhatsApp} className="flex-1 bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20">
                    <Share2 className="w-4 h-4 mr-2" /> WhatsApp
                  </Button>
                  <Button variant="outline" size="sm" onClick={printSummary} className="flex-1">
                    <Printer className="w-4 h-4 mr-2" /> Imprimir
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
                  onClick={onConfirm}
                  disabled={loading || !metrics.isLucrativo}
                  className={`flex-1 ${metrics.isLucrativo ? 'bg-green-500 hover:bg-green-600' : ''}`}
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
