"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  Calendar, 
  Gamepad2, 
  Users, 
  Check, 
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Gift,
  CreditCard,
  Smartphone,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  User
} from "lucide-react";
import { toast } from "sonner";

interface SetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  token: string;
  aldeiaId?: string;
}

interface AldeiaData {
  nome: string;
  tipoOrganizacao: string;
  telefone: string;
  email: string;
  morada: string;
}

interface EventoData {
  nome: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  objectivoAngariacao: number;
}

interface JogoData {
  nome: string;
  tipo: string;
  descricao: string;
  preco: number;
  premioNome: string;
  premioValor: number;
  stockInicial: number;
}

const STEPS = [
  { id: "aldeia", label: "Aldeia", icon: Building2 },
  { id: "evento", label: "Evento", icon: Calendar },
  { id: "jogo", label: "Jogo", icon: Gamepad2 },
  { id: "premios", label: "Prémios", icon: Gift },
  { id: "pagamentos", label: "Pagamentos", icon: CreditCard },
  { id: "vendedores", label: "Vendedores", icon: Users },
];

const TIPOS_ORGANIZACAO = [
  { id: "aldeia", label: "Aldeia/Freguesia" },
  { id: "escola", label: "Escola" },
  { id: "associacao_pais", label: "Associação de Pais" },
  { id: "clube", label: "Clube/Associação" },
];

const TIPOS_JOGO = [
  { id: "rifa", label: "Rifa", desc: "Sorteio de números" },
  { id: "tombola", label: "Tombola", desc: "Múltiplos prémios" },
  { id: "poio_da_vaca", label: "Poio da Vaca", desc: "Tabuleiro tradicional" },
  { id: "raspadinha", label: "Raspadinha", desc: "Cartões instantâneos" },
];

export function SetupWizard({ open, onOpenChange, onComplete, token, aldeiaId }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [aldeiaData, setAldeiaData] = useState<AldeiaData>({
    nome: "",
    tipoOrganizacao: "aldeia",
    telefone: "",
    email: "",
    morada: "",
  });

  const [eventoData, setEventoData] = useState<EventoData>({
    nome: "",
    descricao: "",
    dataInicio: "",
    dataFim: "",
    objectivoAngariacao: 0,
  });

  const [jogoData, setJogoData] = useState<JogoData>({
    nome: "",
    tipo: "rifa",
    descricao: "",
    preco: 2,
    premioNome: "",
    premioValor: 0,
    stockInicial: 100,
  });

  const [vendedores, setVendedores] = useState<{ nome: string; email: string }[]>([
    { nome: "", email: "" }
  ]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addVendedor = () => {
    setVendedores([...vendedores, { nome: "", email: "" }]);
  };

  const removeVendedor = (index: number) => {
    setVendedores(vendedores.filter((_, i) => i !== index));
  };

  const updateVendedor = (index: number, field: "nome" | "email", value: string) => {
    const updated = [...vendedores];
    updated[index][field] = value;
    setVendedores(updated);
  };

  const handleFinish = async () => {
    setLoading(true);
    
    try {
      // Create aldeia
      const aldeiaRes = await fetch("/api/aldeias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(aldeiaData),
      });

      if (!aldeiaRes.ok) {
        throw new Error("Erro ao criar aldeia");
      }

      const aldeiaJson = await aldeiaRes.json();
      const aldeiaIdResult = aldeiaJson.data?.id;

      // Create evento
      const eventoRes = await fetch("/api/eventos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...eventoData,
          aldeiaId: aldeiaIdResult,
          estado: "ativo",
        }),
      });

      if (!eventoRes.ok) {
        throw new Error("Erro ao criar evento");
      }

      const eventoJson = await eventoRes.json();
      const eventoIdResult = eventoJson.data?.id;

      // Create jogo
      const jogoRes = await fetch("/api/jogos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...jogoData,
          eventoId: eventoIdResult,
          stockAtual: jogoData.stockInicial,
          configuracao: getJogoConfiguracao(jogoData.tipo),
          estado: "aberto",
        }),
      });

      if (!jogoRes.ok) {
        throw new Error("Erro ao criar jogo");
      }

      // Create premio
      const premioRes = await fetch("/api/premios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: jogoData.premioNome,
          valorDinheiroAlternative: jogoData.premioValor,
          aldeiaId: aldeiaIdResult,
        }),
      });

      // Create vendedores
      for (const v of vendedores) {
        if (v.nome && v.email) {
          await fetch("/api/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              ...v,
              role: "vendedor",
              aldeiaId: aldeiaIdResult,
            }),
          });
        }
      }

      toast.success("Configuração concluída com sucesso!");
      onComplete();
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao completar configuração");
    } finally {
      setLoading(false);
    }
  };

  const getJogoConfiguracao = (tipo: string) => {
    switch (tipo) {
      case "rifa":
      case "tombola":
        return JSON.stringify({ numeroInicial: 1, numeroFinal: jogoData.stockInicial });
      case "poio_da_vaca":
        return JSON.stringify({ letras: ["A", "B", "C", "D", "E"], numerosPorLetra: 20 });
      case "raspadinha":
        return JSON.stringify({ probabilidades: { premium: 0.05, normal: 0.15, sempremio: 0.8 } });
      default:
        return JSON.stringify({});
    }
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case "aldeia":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-[#ff734b]/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <Building2 className="w-8 h-8 text-[#ff734b]" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Sobre a tua Organização</h2>
              <p className="text-[#e0bfb7]">Vamos começar com os dados básicos da tua aldeia ou organização</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-[#e0bfb7] uppercase tracking-wider mb-2 block">
                  Nome da Organização *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ff734b]" />
                  <Input
                    placeholder="Ex: Junta de Freguesia de Aldeia"
                    value={aldeiaData.nome}
                    onChange={(e) => setAldeiaData({ ...aldeiaData, nome: e.target.value })}
                    className="pl-10 bg-[#2e2928] border-transparent text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#e0bfb7] uppercase tracking-wider mb-2 block">
                  Tipo de Organização
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {TIPOS_ORGANIZACAO.map((tipo) => (
                    <button
                      key={tipo.id}
                      onClick={() => setAldeiaData({ ...aldeiaData, tipoOrganizacao: tipo.id })}
                      className={`p-3 rounded-xl text-left transition-all ${
                        aldeiaData.tipoOrganizacao === tipo.id
                          ? "bg-[#ff734b] text-[#110d0c]"
                          : "bg-[#2e2928] text-white hover:bg-[#58413b]/30"
                      }`}
                    >
                      <span className="text-sm font-medium">{tipo.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#e0bfb7] uppercase tracking-wider mb-2 block">
                    Telefone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ff734b]" />
                    <Input
                      placeholder="912 345 678"
                      value={aldeiaData.telefone}
                      onChange={(e) => setAldeiaData({ ...aldeiaData, telefone: e.target.value })}
                      className="pl-10 bg-[#2e2928] border-transparent text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-[#e0bfb7] uppercase tracking-wider mb-2 block">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ff734b]" />
                    <Input
                      type="email"
                      placeholder="contacto@email.pt"
                      value={aldeiaData.email}
                      onChange={(e) => setAldeiaData({ ...aldeiaData, email: e.target.value })}
                      className="pl-10 bg-[#2e2928] border-transparent text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "evento":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-[#ff734b]/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <Calendar className="w-8 h-8 text-[#ff734b]" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Criar Primeiro Evento</h2>
              <p className="text-[#e0bfb7]">Define o evento de angariação de fundos</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-[#e0bfb7] uppercase tracking-wider mb-2 block">
                  Nome do Evento *
                </Label>
                <Input
                  placeholder="Ex: Festa de São João 2026"
                  value={eventoData.nome}
                  onChange={(e) => setEventoData({ ...eventoData, nome: e.target.value })}
                  className="bg-[#2e2928] border-transparent text-white"
                />
              </div>

              <div>
                <Label className="text-xs text-[#e0bfb7] uppercase tracking-wider mb-2 block">
                  Descrição
                </Label>
                <Input
                  placeholder="Breve descrição do evento"
                  value={eventoData.descricao}
                  onChange={(e) => setEventoData({ ...eventoData, descricao: e.target.value })}
                  className="bg-[#2e2928] border-transparent text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#e0bfb7] uppercase tracking-wider mb-2 block">
                    Data de Início
                  </Label>
                  <Input
                    type="date"
                    value={eventoData.dataInicio}
                    onChange={(e) => setEventoData({ ...eventoData, dataInicio: e.target.value })}
                    className="bg-[#2e2928] border-transparent text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#e0bfb7] uppercase tracking-wider mb-2 block">
                    Data de Fim
                  </Label>
                  <Input
                    type="date"
                    value={eventoData.dataFim}
                    onChange={(e) => setEventoData({ ...eventoData, dataFim: e.target.value })}
                    className="bg-[#2e2928] border-transparent text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#e0bfb7] uppercase tracking-wider mb-2 block">
                  Meta de Angariação (€)
                </Label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={eventoData.objectivoAngariacao || ""}
                  onChange={(e) => setEventoData({ ...eventoData, objectivoAngariacao: parseFloat(e.target.value) || 0 })}
                  className="bg-[#2e2928] border-transparent text-white"
                />
              </div>
            </div>
          </div>
        );

      case "jogo":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-[#ff734b]/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <Gamepad2 className="w-8 h-8 text-[#ff734b]" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Escolhe o Jogo</h2>
              <p className="text-[#e0bfb7]">Seleciona o tipo de jogo para o teu evento</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {TIPOS_JOGO.map((tipo) => (
                <button
                  key={tipo.id}
                  onClick={() => setJogoData({ ...jogoData, tipo: tipo.id })}
                  className={`p-4 rounded-xl text-left transition-all border-2 ${
                    jogoData.tipo === tipo.id
                      ? "border-[#ff734b] bg-[#ff734b]/10"
                      : "border-[#58413b]/20 bg-[#1f1b19] hover:border-[#ff734b]/30"
                  }`}
                >
                  <Sparkles className="h-5 w-5 text-[#ff734b] mb-2" />
                  <p className="font-bold text-white">{tipo.label}</p>
                  <p className="text-xs text-[#e0bfb7]">{tipo.desc}</p>
                </button>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-[#58413b]/20">
              <div>
                <Label className="text-xs text-[#e0bfb7] uppercase tracking-wider mb-2 block">
                  Nome do Jogo *
                </Label>
                <Input
                  placeholder="Ex: Rifas da Festa"
                  value={jogoData.nome}
                  onChange={(e) => setJogoData({ ...jogoData, nome: e.target.value })}
                  className="bg-[#2e2928] border-transparent text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-[#e0bfb7] uppercase tracking-wider mb-2 block">
                    Preço por Participação (€)
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={jogoData.preco}
                    onChange={(e) => setJogoData({ ...jogoData, preco: parseFloat(e.target.value) || 2 })}
                    className="bg-[#2e2928] border-transparent text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#e0bfb7] uppercase tracking-wider mb-2 block">
                    Nº de Bilhetes
                  </Label>
                  <Input
                    type="number"
                    value={jogoData.stockInicial}
                    onChange={(e) => setJogoData({ ...jogoData, stockInicial: parseInt(e.target.value) || 100 })}
                    className="bg-[#2e2928] border-transparent text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "premios":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-[#ff734b]/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <Gift className="w-8 h-8 text-[#ff734b]" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Define o Prémio</h2>
              <p className="text-[#e0bfb7]">Que prémio vais sortear?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-[#e0bfb7] uppercase tracking-wider mb-2 block">
                  Nome do Prémio *
                </Label>
                <Input
                  placeholder="Ex: Vale de 50€ em compras"
                  value={jogoData.premioNome}
                  onChange={(e) => setJogoData({ ...jogoData, premioNome: e.target.value })}
                  className="bg-[#2e2928] border-transparent text-white"
                />
              </div>

              <div>
                <Label className="text-xs text-[#e0bfb7] uppercase tracking-wider mb-2 block">
                  Valor em Dinheiro (alternativa)
                </Label>
                <Input
                  type="number"
                  placeholder="Se preferir dar dinheiro em vez do prémio físico"
                  value={jogoData.premioValor || ""}
                  onChange={(e) => setJogoData({ ...jogoData, premioValor: parseFloat(e.target.value) || 0 })}
                  className="bg-[#2e2928] border-transparent text-white"
                />
                <p className="text-xs text-[#e0bfb7] mt-1">
                  Podes indicar o valor em euros como alternativa ao prémio físico
                </p>
              </div>

              <div className="bg-[#2e2928] rounded-xl p-4">
                <p className="text-sm text-[#e0bfb7] mb-2">Resumo do Jogo:</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-[#ff734b]">•</span> {jogoData.nome || "Nome do jogo"}</p>
                  <p><span className="text-[#ff734b]">•</span> Preço: {formatCurrency(jogoData.preco)}</p>
                  <p><span className="text-[#ff734b]">•</span> Prémio: {jogoData.premioNome || "Por definir"}</p>
                  <p><span className="text-[#ff734b]">•</span> Receita potencial: {formatCurrency(jogoData.preco * jogoData.stockInicial)}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "pagamentos":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-[#ff734b]/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <CreditCard className="w-8 h-8 text-[#ff734b]" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Métodos de Pagamento</h2>
              <p className="text-[#e0bfb7]">Escolhe como os jogadores vão pagar</p>
            </div>

            <div className="space-y-3">
              {[
                { id: "dinheiro", icon: "💵", label: "Dinheiro", desc: "Pagamento presencial ao vendedor" },
                { id: "mbway", icon: <Smartphone className="h-6 w-6" />, label: "MBWay", desc: "Pagamento via telemóvel" },
                { id: "stripe", icon: <CreditCard className="h-6 w-6" />, label: "Cartão", desc: "Visa, Mastercard, etc." },
              ].map((metodo) => (
                <div
                  key={metodo.id}
                  className="p-4 rounded-xl bg-[#2e2928] flex items-center gap-4"
                >
                  <div className="p-3 bg-[#ff734b]/20 rounded-xl text-[#ff734b]">
                    {metodo.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white">{metodo.label}</p>
                    <p className="text-xs text-[#e0bfb7]">{metodo.desc}</p>
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 border-green-500 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-[#e0bfb7] text-center">
              Podes configurar MBWay e Stripe mais tarde nas definições
            </p>
          </div>
        );

      case "vendedores":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-[#ff734b]/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <Users className="w-8 h-8 text-[#ff734b]" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Convida Vendedores</h2>
              <p className="text-[#e0bfb7]">Adiciona a tua equipa de vendas (opcional)</p>
            </div>

            <div className="space-y-3">
              {vendedores.map((vendedor, index) => (
                <div key={index} className="bg-[#1f1b19] rounded-xl p-4 border border-[#58413b]/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-[#e0bfb7]">Vendedor {index + 1}</span>
                    {vendedores.length > 1 && (
                      <button
                        onClick={() => removeVendedor(index)}
                        className="text-red-500 text-xs hover:underline"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ff734b]" />
                      <Input
                        placeholder="Nome"
                        value={vendedor.nome}
                        onChange={(e) => updateVendedor(index, "nome", e.target.value)}
                        className="pl-10 bg-[#2e2928] border-transparent text-white"
                      />
                    </div>
                    <Input
                      type="email"
                      placeholder="Email"
                      value={vendedor.email}
                      onChange={(e) => updateVendedor(index, "email", e.target.value)}
                      className="bg-[#2e2928] border-transparent text-white"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={addVendedor}
              variant="outline"
              className="w-full border-dashed border-[#ff734b]/30 text-[#ff734b]"
            >
              <ChevronRight className="h-4 w-4 mr-2" />
              Adicionar Vendedor
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1f1b19] border-[#ff734b]/20 p-0 max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1f1b19] z-10 p-6 pb-4">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-[#e0bfb7]">
                Passo {currentStep + 1} de {STEPS.length}
              </span>
              <span className="text-xs text-[#ff734b] font-medium">
                {STEPS[currentStep].label}
              </span>
            </div>
            <Progress value={progress} className="h-1 bg-[#2e2928]" />
          </div>

          {/* Steps indicator */}
          <div className="flex justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isComplete = index < currentStep;
              
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${
                    index <= currentStep ? "text-[#ff734b]" : "text-[#58413b]"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isComplete
                        ? "bg-[#ff734b] text-[#110d0c]"
                        : isActive
                        ? "bg-[#ff734b]/20 border-2 border-[#ff734b]"
                        : "bg-[#2e2928]"
                    }`}
                  >
                    {isComplete ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#1f1b19] p-6 pt-4 border-t border-[#58413b]/20">
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 border-[#ff734b]/30 text-[#ff734b]"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                className="flex-1 bg-[#ff734b] hover:bg-[#ff734b]/90 text-[#110d0c] font-bold"
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={loading || !aldeiaData.nome || !eventoData.nome || !jogoData.nome || !jogoData.premioNome}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold"
              >
                {loading ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    A criar...
                  </>
                ) : (
                  <>
                    Concluir
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}
