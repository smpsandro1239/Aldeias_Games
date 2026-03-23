"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  Calendar,
  Users,
  MapPin,
  Phone,
  Mail,
  Share2,
  Gift,
  Gamepad2,
  ChevronRight,
  Sparkles,
  PartyPopper,
  Loader2,
  QrCode
} from "lucide-react";

interface Jogo {
  id: string;
  nome: string;
  tipo: string;
  preco: number;
  stock: number;
  participacoes: number;
}

interface Evento {
  id: string;
  nome: string;
  descricao?: string;
  imagem?: string;
  dataInicio: string;
  dataFim: string;
  jogos: Jogo[];
}

interface AldeiaData {
  nome: string;
  descricao?: string;
  logo?: string;
  contactos: {
    telefone?: string;
    email?: string;
    morada?: string;
  };
  eventos: Evento[];
}

function AldeiaPageContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "vitoria-verde";
  const [data, setData] = useState<AldeiaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedJogo, setSelectedJogo] = useState<Jogo | null>(null);
  const [participarOpen, setParticiparOpen] = useState(false);
  const [numerosSelecionados, setNumerosSelecionados] = useState<string[]>([]);
  const [dadosCliente, setDadosCliente] = useState({ nome: "", telefone: "", email: "" });

  useEffect(() => {
    fetch(`/api/public/aldeia/${slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const handleParticipar = (jogo: Jogo) => {
    setSelectedJogo(jogo);
    setParticiparOpen(true);
    setNumerosSelecionados([]);
  };

  const toggleNumero = (num: string) => {
    if (numerosSelecionados.includes(num)) {
      setNumerosSelecionados(numerosSelecionados.filter((n) => n !== num));
    } else if (numerosSelecionados.length < (selectedJogo?.tipo === 'raspadinha' ? 1 : 5)) {
      setNumerosSelecionados([...numerosSelecionados, num]);
    }
  };

  const getTipoJogoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      rifa: "Rifa",
      tombola: "Tombola",
      poio_da_vaca: "Poio da Vaca",
      raspadinha: "Raspadinha",
    };
    return labels[tipo] || tipo;
  };

  const getTipoJogoIcon = (tipo: string) => {
    switch (tipo) {
      case "raspadinha":
        return <Gift className="h-5 w-5" />;
      case "poio_da_vaca":
        return <MapPin className="h-5 w-5" />;
      default:
        return <Ticket className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-12 w-12 text-white" />
        </motion.div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500">
        <Card className="max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <PartyPopper className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
            <h1 className="text-2xl font-bold mb-2">Ops!</h1>
            <p className="text-muted-foreground">Esta organização não foi encontrada.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNC0xNHoiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />
        
        <header className="relative z-10 px-4 py-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              {data.logo ? (
                <img src={data.logo} alt={data.nome} className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Gamepad2 className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">{data.nome}</h1>
                <p className="text-white/70 text-sm">{data.eventos.length} evento(s) ativo(s)</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="relative z-10 px-4 pb-12">
          <div className="max-w-4xl mx-auto space-y-6">
            {data.descricao && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-white/90"
              >
                {data.descricao}
              </motion.div>
            )}

            {data.contactos.telefone && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap gap-3"
              >
                <a
                  href={`tel:${data.contactos.telefone}`}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full px-4 py-2 text-white transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  <span className="text-sm font-medium">{data.contactos.telefone}</span>
                </a>
                {data.contactos.email && (
                  <a
                    href={`mailto:${data.contactos.email}`}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full px-4 py-2 text-white transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    <span className="text-sm font-medium">{data.contactos.email}</span>
                  </a>
                )}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {data.eventos.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <PartyPopper className="h-16 w-16 mx-auto mb-4 text-white/50" />
                  <p className="text-white/70">De momento não há eventos disponíveis.</p>
                  <p className="text-white/50 text-sm mt-2">Volte em breve!</p>
                </motion.div>
              ) : (
                data.eventos.map((evento, index) => (
                  <motion.div
                    key={evento.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden border-0 shadow-2xl">
                      {evento.imagem && (
                        <div className="h-32 bg-gradient-to-r from-violet-500 to-pink-500 relative">
                          <img
                            src={evento.imagem}
                            alt={evento.nome}
                            className="absolute inset-0 w-full h-full object-cover opacity-50"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-yellow-500" />
                              {evento.nome}
                            </CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(evento.dataInicio).toLocaleDateString("pt-PT")} -{" "}
                              {new Date(evento.dataFim).toLocaleDateString("pt-PT")}
                            </div>
                          </div>
                        </div>
                        {evento.descricao && (
                          <p className="text-sm text-muted-foreground mt-2">{evento.descricao}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3">
                          {evento.jogos.map((jogo) => (
                            <motion.div
                              key={jogo.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-100 hover:border-violet-300 transition-all cursor-pointer"
                              onClick={() => handleParticipar(jogo)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
                                  {getTipoJogoIcon(jogo.tipo)}
                                </div>
                                <div>
                                  <p className="font-bold text-sm">{jogo.nome}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-xs">
                                      {getTipoJogoLabel(jogo.tipo)}
                                    </Badge>
                                    <span>{jogo.participacoes} participantes</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-lg text-violet-600">{jogo.preco}€</p>
                                <p className="text-xs text-muted-foreground">{jogo.stock} disponíveis</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        {evento.jogos.length === 0 && (
                          <p className="text-center text-muted-foreground py-4">
                            Sem jogos disponíveis neste momento.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <Dialog open={participarOpen} onOpenChange={setParticiparOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Participar - {selectedJogo?.nome}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center p-4 bg-muted rounded-xl">
              <p className="text-sm text-muted-foreground">Preço por participação</p>
              <p className="text-2xl font-black text-violet-600">{selectedJogo?.preco}€</p>
            </div>

            {selectedJogo?.tipo !== 'raspadinha' && (
              <div>
                <Label>Selecione o(s) número(s)</Label>
                <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-y-auto p-2">
                  {Array.from({ length: Math.min(selectedJogo?.stock || 100, 50) }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      onClick={() => toggleNumero(num.toString())}
                      className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                        numerosSelecionados.includes(num.toString())
                          ? "bg-violet-600 text-white"
                          : "bg-muted hover:bg-violet-100"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Selecionados: {numerosSelecionados.length}/{selectedJogo?.tipo === 'poio_da_vaca' ? '1' : '5'}
                </p>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  placeholder="O seu nome"
                  value={dadosCliente.nome}
                  onChange={(e) => setDadosCliente({ ...dadosCliente, nome: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="912 345 678"
                  value={dadosCliente.telefone}
                  onChange={(e) => setDadosCliente({ ...dadosCliente, telefone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setParticiparOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-violet-600 hover:bg-violet-700"
              disabled={!dadosCliente.nome || !dadosCliente.telefone || numerosSelecionados.length === 0}
              onClick={() => {
                toast.success("Funcionalidade em desenvolvimento");
                setParticiparOpen(false);
              }}
            >
              Participar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AldeiaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500">
        <Loader2 className="h-12 w-12 text-white animate-spin" />
      </div>
    }>
      <AldeiaPageContent />
    </Suspense>
  );
}