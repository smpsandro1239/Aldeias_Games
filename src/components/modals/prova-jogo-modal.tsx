"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Copy,
  Share2,
  Trophy,
  Hash,
  Calendar,
  Gamepad2,
  MapPin,
  Clock,
  Loader2,
  Shield,
  MessageCircle,
  Download,
  Eye,
  Hourglass,
  Euro,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

interface ProvaData {
  id: string;
  hash: string;
  tipoProva: "participacao" | "premio";
  jogoNome: string;
  jogoTipo: string;
  aldeia: string;
  valorPago: number;
  premioValor: number | null;
  resultado: string | null;
  ganhador: boolean;
  premioEntregue: boolean;
  aguardaSorteio: boolean;
  sorteado: boolean;
  numerosSelecionados: number[] | null;
  coordenadas: { letra: string; numero: number }[] | null;
  grid: any[] | null;
  data: string;
  nomeCliente: string | null;
  vendedor: string | null;
  verificavel: boolean;
}

interface ProvaJogoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participacaoId?: string;
  /** Pass data directly to avoid extra fetch (e.g. right after creation) */
  initialData?: ProvaData;
}

const VERIFICATION_URL = "https://aldeias-games.vercel.app/verificar";

function getJogoIcon(tipo: string) {
  switch (tipo) {
    case "rifa": return "🎯";
    case "euromilhoes": return "🎲";
    case "poio_da_vaca": return "🐄";
    case "raspadinha": return "🎰";
    default: return "🎮";
  }
}

function getJogoLabel(tipo: string) {
  switch (tipo) {
    case "rifa": return "Rifa";
    case "euromilhoes": return "Euromilhões";
    case "poio_da_vaca": return "Poio da Vaca";
    case "raspadinha": return "Raspadinha";
    default: return tipo;
  }
}

export function ProvaJogoModal({
  open,
  onOpenChange,
  participacaoId,
  initialData,
}: ProvaJogoModalProps) {
  const [data, setData] = useState<ProvaData | null>(initialData || null);
  const [loading, setLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const fetchData = useCallback(async () => {
    if (!participacaoId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/participacoes/${participacaoId}/prova`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      toast.error("Erro ao carregar prova");
    } finally {
      setLoading(false);
    }
  }, [participacaoId]);

  useEffect(() => {
    if (open && participacaoId && !initialData) {
      fetchData();
    } else if (initialData) {
      setData(initialData);
    }
  }, [open, participacaoId, initialData, fetchData]);

  const verificationUrl = data?.hash
    ? `${VERIFICATION_URL}?hash=${data.hash}`
    : "";

  const copyHash = async () => {
    if (!data?.hash) return;
    try {
      await navigator.clipboard.writeText(data.hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
      toast.success("Hash copiada!");
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const shareWhatsApp = () => {
    if (!data) return;
    const status = data.ganhador
      ? `Prémio: ${data.premioValor ? formatCurrency(data.premioValor) : data.resultado} (Ganhou ✅)`
      : data.aguardaSorteio
      ? "Estado: Aguardando sorteio ⏳"
      : "Estado: Participação registada";

    const msg =
      `🎮 Prova de Jogo — Aldeias Games\n\n` +
      `Jogo: ${data.jogoNome}\n` +
      `Data: ${new Date(data.data).toLocaleString("pt-PT")}\n` +
      `${status}\n\n` +
      `Hash de verificação: ${data.hash}\n\n` +
      `🔗 Verificar: ${verificationUrl}`;

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const downloadQR = () => {
    const svgEl = document.querySelector("#prova-qr-code svg") as SVGElement | null;
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 300, 300);
      const size = 240;
      const offset = 30;
      ctx.drawImage(img, offset, offset, size, size);
      ctx.fillStyle = "#000000";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(data?.hash?.slice(0, 32) || "", 150, 290);
      const link = document.createElement("a");
      link.download = `prova-${data?.id || "jogo"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("QR Code descarregado!");
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const renderNumeros = () => {
    if (!data) return null;

    if (data.numerosSelecionados && data.numerosSelecionados.length > 0) {
      return (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Números Escolhidos</p>
          <div className="flex flex-wrap gap-1.5">
            {data.numerosSelecionados.map((n) => (
              <span
                key={n}
                className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/20"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      );
    }

    if (data.coordenadas && data.coordenadas.length > 0) {
      return (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Coordenadas</p>
          <div className="flex flex-wrap gap-1.5">
            {data.coordenadas.map((c, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/20"
              >
                {c.letra}{c.numero}
              </span>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-surface-container border-primary/20 max-h-[90vh] overflow-y-auto z-[60]">
        <DialogHeader className="bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-green-600/10 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-emerald-500/20">
          <DialogTitle className="flex items-center gap-2 text-center justify-center text-xl">
            {data?.ganhador ? (
              <div className="bg-amber-500/20 p-2 rounded-lg">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
            ) : (
              <div className="bg-emerald-600/20 p-2 rounded-lg">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
            )}
            {data?.ganhador ? "Jogo Premiado!" : "Prova de Jogo"}
          </DialogTitle>
        </DialogHeader>

        {loading && !data && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {data && (
          <div className="space-y-5 py-2">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="text-4xl">{getJogoIcon(data.jogoTipo)}</div>
              <h3 className="text-lg font-bold">{data.jogoNome}</h3>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {getJogoLabel(data.jogoTipo)}
                </Badge>
                {data.ganhador && (
                  <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30 text-xs">
                    <Trophy className="h-3 w-3 mr-1" /> PRÉMIO
                  </Badge>
                )}
                {data.aguardaSorteio && (
                  <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30 text-xs">
                    <Hourglass className="h-3 w-3 mr-1" /> Aguarda Sorteio
                  </Badge>
                )}
                {data.verificavel && (
                  <Badge className="bg-green-500/20 text-green-700 border-green-500/30 text-xs">
                    <Check className="h-3 w-3 mr-1" /> Verificável
                  </Badge>
                )}
              </div>
            </div>

            {/* QR Code */}
            {data.hash && (
              <div className="flex flex-col items-center gap-3">
                <div
                  id="prova-qr-code"
                  className="bg-white p-3 rounded-2xl shadow-lg border border-outline-variant/20"
                >
                  <QRCodeSVG
                    value={verificationUrl}
                    size={200}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  Escaneie para verificar autenticidade
                </p>
              </div>
            )}

            {/* Hash */}
            {data.hash && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-primary">
                    Hash de Verificação
                  </span>
                </div>
                <div className="bg-black/5 dark:bg-white/5 p-2.5 rounded-lg font-mono text-[10px] break-all leading-relaxed select-all">
                  {data.hash}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyHash}
                  className="w-full border-primary/30 text-xs"
                >
                  {copiedHash ? (
                    <Check className="h-3.5 w-3.5 mr-2" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 mr-2" />
                  )}
                  {copiedHash ? "Copiado!" : "Copiar Hash"}
                </Button>
              </div>
            )}

            {/* Detalhes */}
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/10">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Euro className="h-3.5 w-3.5" /> Valor Pago
                </span>
                <span className="text-sm font-bold text-primary">
                  {formatCurrency(data.valorPago)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/10">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Data
                </span>
                <span className="text-xs">
                  {formatDateTime(data.data)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/10">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Aldeia
                </span>
                <span className="text-xs font-medium">{data.aldeia}</span>
              </div>

              {data.nomeCliente && (
                <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/10">
                  <span className="text-xs text-muted-foreground">Jogador</span>
                  <span className="text-xs font-medium">{data.nomeCliente}</span>
                </div>
              )}

              {data.ganhador && data.premioValor && (
                <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/10">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-amber-500" /> Prémio
                  </span>
                  <span className="text-sm font-bold text-amber-500">
                    {formatCurrency(data.premioValor)}
                  </span>
                </div>
              )}

              {data.premioEntregue && (
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-xs text-muted-foreground">Estado</span>
                  <Badge className="bg-green-500/20 text-green-700 text-xs">
                    <Check className="h-3 w-3 mr-1" /> Prémio Entregue
                  </Badge>
                </div>
              )}

              {data.aguardaSorteio && (
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-xs text-muted-foreground">Sorteio</span>
                  <Badge className="bg-blue-500/20 text-blue-700 text-xs">
                    <Clock className="h-3 w-3 mr-1" /> Aguardando
                  </Badge>
                </div>
              )}
            </div>

            {/* Números / Coordenadas */}
            {renderNumeros()}

            {/* Grid (raspadinha) */}
            {data.grid && data.grid.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Grid Resultado</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {data.grid.map((prize: any, i: number) => (
                    <div
                      key={i}
                      className={`text-center p-2 rounded-lg text-xs font-medium ${
                        data.ganhador && prize.nome === data.resultado
                          ? "bg-amber-500/20 text-amber-700 border border-amber-500/30"
                          : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {prize.icon || prize.nome}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shareWhatsApp}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-600"
              >
                <MessageCircle className="h-4 w-4 mr-1.5" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQR}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1.5" />
                QR Code
              </Button>
            </div>

            {/* Disclaimer */}
            <div className="text-center text-[10px] text-muted-foreground space-y-0.5 pt-1">
              <p>Esta prova confirma que a participação foi registada pelo sistema.</p>
              <p>Cada participação tem um hash único e verificável.</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
