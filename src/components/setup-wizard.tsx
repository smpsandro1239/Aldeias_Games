"use client";
import { apiRequest } from '@/lib/api-client';

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
      const aldeiaRes = await apiRequest("/api/aldeias", {
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
      const eventoRes = await apiRequest("/api/eventos", {
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
      const jogoRes = await apiRequest("/api/jogos", {
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
      const premioRes = await apiRequest("/api/premios", {
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
          await apiRequest("/api/users", {
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
                className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <Building2 className="w-8 h-8 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Sobre a tua Organização</h2>
              <p className="text-muted-foreground">Vamos começar com os dados básicos da tua aldeia ou organização</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Nome da Organização *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input
                    placeholder="Ex: Junta de Freguesia de Aldeia"
                    value={aldeiaData.nome}
                    onChange={(e) => setAldeiaData({ ...aldeiaData, nome: e.target.value })}
                    className="pl-10 bg-surface-container-low border-transparent text-foreground"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Tipo de Organização
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {TIPOS_ORGANIZACAO.map((tipo) => (
                    <button
                      key={tipo.id}
                      onClick={() => setAldeiaData({ ...aldeiaData, tipoOrganizacao: tipo.id })}
                      className={`p-3 rounded-xl text-left transition-all ${
                        aldeiaData.tipoOrganizacao === tipo.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface-container-low text-foreground hover:bg-muted/30"
                      }`}
                    >
                      <span className="text-sm font-medium">{tipo.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                    Telefone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    <Input
                      placeholder="912 345 678"
                      value={aldeiaData.telefone}
                      onChange={(e) => setAldeiaData({ ...aldeiaData, telefone: e.target.value })}
                      className="pl-10 bg-surface-container-low border-transparent text-foreground"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    <Input
                      type="email"
                      placeholder="contacto@email.pt"
                      value={aldeiaData.email}
                      onChange={(e) => setAldeiaData({ ...aldeiaData, email: e.target.value })}
                      className="pl-10 bg-surface-container-low border-transparent text-foreground"
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
                className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <Calendar className="w-8 h-8 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Criar Primeiro Evento</h2>
              <p className="text-muted-foreground">Define o evento de angariação de fundos</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Nome do Evento *
                </Label>
                <Input
                  placeholder="Ex: Festa de São João 2026"
                  value={eventoData.nome}
                  onChange={(e) => setEventoData({ ...eventoData, nome: e.target.value })}
                  className="bg-surface-container-low border-transparent text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Descrição
                </Label>
                <Input
                  placeholder="Breve descrição do evento"
                  value={eventoData.descricao}
                  onChange={(e) => setEventoData({ ...eventoData, descricao: e.target.value })}
                  className="bg-surface-container-low border-transparent text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                    Data de Início
                  </Label>
                  <Input
                    type="date"
                    value={eventoData.dataInicio}
                    onChange={(e) => setEventoData({ ...eventoData, dataInicio: e.target.value })}
                    className="bg-surface-container-low border-transparent text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                    Data de Fim
                  </Label>
                  <Input
                    type="date"
                    value={eventoData.dataFim}
                    onChange={(e) => setEventoData({ ...eventoData, dataFim: e.target.value })}
                    className="bg-surface-container-low border-transparent text-foreground"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Meta de Angariação (€)
                </Label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={eventoData.objectivoAngariacao || ""}
                  onChange={(e) => setEventoData({ ...eventoData, objectivoAngariacao: parseFloat(e.target.value) || 0 })}
                  className="bg-surface-container-low border-transparent text-foreground"
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
                className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <Gamepad2 className="w-8 h-8 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Escolhe o Jogo</h2>
              <p className="text-muted-foreground">Seleciona o tipo de jogo para o teu evento</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {TIPOS_JOGO.map((tipo) => (
                <button
                  key={tipo.id}
                  onClick={() => setJogoData({ ...jogoData, tipo: tipo.id })}
                  className={`p-4 rounded-xl text-left transition-all border-2 ${
                    jogoData.tipo === tipo.id
                      ? "border-primary bg-primary/10"
                      : "border-outline-variant/20 bg-surface-container hover:border-primary/30"
                  }`}
                >
                  <Sparkles className="h-5 w-5 text-primary mb-2" />
                  <p className="font-bold text-foreground">{tipo.label}</p>
                  <p className="text-xs text-muted-foreground">{tipo.desc}</p>
                </button>
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-outline-variant/20">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Nome do Jogo *
                </Label>
                <Input
                  placeholder="Ex: Rifas da Festa"
                  value={jogoData.nome}
                  onChange={(e) => setJogoData({ ...jogoData, nome: e.target.value })}
                  className="bg-surface-container-low border-transparent text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                    Preço por Participação (€)
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={jogoData.preco}
                    onChange={(e) => setJogoData({ ...jogoData, preco: parseFloat(e.target.value) || 2 })}
                    className="bg-surface-container-low border-transparent text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                    Nº de Bilhetes
                  </Label>
                  <Input
                    type="number"
                    value={jogoData.stockInicial}
                    onChange={(e) => setJogoData({ ...jogoData, stockInicial: parseInt(e.target.value) || 100 })}
                    className="bg-surface-container-low border-transparent text-foreground"
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
                className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <Gift className="w-8 h-8 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Define o Prémio</h2>
              <p className="text-muted-foreground">Que prémio vais sortear?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Nome do Prémio *
                </Label>
                <Input
                  placeholder="Ex: Vale de 50€ em compras"
                  value={jogoData.premioNome}
                  onChange={(e) => setJogoData({ ...jogoData, premioNome: e.target.value })}
                  className="bg-surface-container-low border-transparent text-foreground"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                  Valor em Dinheiro (alternativa)
                </Label>
                <Input
                  type="number"
                  placeholder="Se preferir dar dinheiro em vez do prémio físico"
                  value={jogoData.premioValor || ""}
                  onChange={(e) => setJogoData({ ...jogoData, premioValor: parseFloat(e.target.value) || 0 })}
                  className="bg-surface-container-low border-transparent text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Podes indicar o valor em euros como alternativa ao prémio físico
                </p>
              </div>

              <div className="bg-surface-container-low rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-2">Resumo do Jogo:</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-primary">•</span> {jogoData.nome || "Nome do jogo"}</p>
                  <p><span className="text-primary">•</span> Preço: {formatCurrency(jogoData.preco)}</p>
                  <p><span className="text-primary">•</span> Prémio: {jogoData.premioNome || "Por definir"}</p>
                  <p><span className="text-primary">•</span> Receita potencial: {formatCurrency(jogoData.preco * jogoData.stockInicial)}</p>
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
                className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <CreditCard className="w-8 h-8 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Métodos de Pagamento</h2>
              <p className="text-muted-foreground">Escolhe como os jogadores vão pagar</p>
            </div>

            <div className="space-y-3">
              {[
                { id: "dinheiro", icon: "💵", label: "Dinheiro", desc: "Pagamento presencial ao vendedor" },
                { id: "mbway", icon: <Smartphone className="h-6 w-6" />, label: "MBWay", desc: "Pagamento via telemóvel" },
                { id: "stripe", icon: <CreditCard className="h-6 w-6" />, label: "Cartão", desc: "Visa, Mastercard, etc." },
              ].map((metodo) => (
                <div
                  key={metodo.id}
                  className="p-4 rounded-xl bg-surface-container-low flex items-center gap-4"
                >
                  <div className="p-3 bg-primary/20 rounded-xl text-primary">
                    {metodo.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground">{metodo.label}</p>
                    <p className="text-xs text-muted-foreground">{metodo.desc}</p>
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 border-green-500 flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
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
                className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <Users className="w-8 h-8 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Convida Vendedores</h2>
              <p className="text-muted-foreground">Adiciona a tua equipa de vendas (opcional)</p>
            </div>

            <div className="space-y-3">
              {vendedores.map((vendedor, index) => (
                <div key={index} className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">Vendedor {index + 1}</span>
                    {vendedores.length > 1 && (
                      <button
                        onClick={() => removeVendedor(index)}
                        className="text-destructive text-xs hover:underline"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                      <Input
                        placeholder="Nome"
                        value={vendedor.nome}
                        onChange={(e) => updateVendedor(index, "nome", e.target.value)}
                        className="pl-10 bg-surface-container-low border-transparent text-foreground"
                      />
                    </div>
                    <Input
                      type="email"
                      placeholder="Email"
                      value={vendedor.email}
                      onChange={(e) => updateVendedor(index, "email", e.target.value)}
                      className="bg-surface-container-low border-transparent text-foreground"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={addVendedor}
              variant="outline"
              className="w-full border-dashed border-primary/30 text-primary"
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
      <DialogContent className="bg-surface-container border-primary/20 p-0 max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface-container z-10 p-6 pb-4">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground">
                Passo {currentStep + 1} de {STEPS.length}
              </span>
              <span className="text-xs text-primary font-medium">
                {STEPS[currentStep].label}
              </span>
            </div>
            <Progress value={progress} className="h-1 bg-surface-container-low" />
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
                    index <= currentStep ? "text-primary" : "text-outline-variant"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isComplete
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary/20 border-2 border-primary"
                        : "bg-surface-container-low"
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
        <div className="sticky bottom-0 bg-surface-container p-6 pt-4 border-t border-outline-variant/20">
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 border-primary/30 text-primary"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={loading || !aldeiaData.nome || !eventoData.nome || !jogoData.nome || !jogoData.premioNome}
                className="flex-1 bg-primary hover:bg-primary text-foreground font-bold"
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
