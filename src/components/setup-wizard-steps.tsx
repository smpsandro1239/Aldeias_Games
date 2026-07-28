"use client";

import { motion } from "framer-motion";
import { Building2, Calendar, Gamepad2, Gift, CreditCard, Smartphone, Users, User, Sparkles, MapPin, Phone, Mail, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { AldeiaData, EventoData, JogoData } from "./setup-wizard-types";
import { TIPOS_ORGANIZACAO, TIPOS_JOGO } from "./setup-wizard-types";

interface SetupWizardStepsProps {
  currentStep: number;
  aldeiaData: AldeiaData;
  setAldeiaData: (data: AldeiaData) => void;
  eventoData: EventoData;
  setEventoData: (data: EventoData) => void;
  jogoData: JogoData;
  setJogoData: (data: JogoData) => void;
  vendedores: Array<{ nome: string; email: string }>;
  addVendedor: () => void;
  removeVendedor: (index: number) => void;
  updateVendedor: (index: number, field: "nome" | "email", value: string) => void;
}

export function SetupWizardSteps(props: SetupWizardStepsProps) {
  const { currentStep, aldeiaData, setAldeiaData, eventoData, setEventoData, jogoData, setJogoData, vendedores, addVendedor, removeVendedor, updateVendedor } = props;

  return (
    <>
      {currentStep === 0 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-primary" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Sobre a tua Organização</h2>
            <p className="text-muted-foreground">Vamos começar com os dados básicos da tua aldeia ou organização</p>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Nome da Organização *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input placeholder="Ex: Junta de Freguesia de Aldeia" value={aldeiaData.nome} onChange={(e) => setAldeiaData({ ...aldeiaData, nome: e.target.value })} className="pl-10 bg-surface-container-low border-transparent text-foreground" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Tipo de Organização</Label>
              <div className="grid grid-cols-2 gap-2">
                {TIPOS_ORGANIZACAO.map((tipo) => (
                  <button key={tipo.id} onClick={() => setAldeiaData({ ...aldeiaData, tipoOrganizacao: tipo.id })}
                    className={`p-3 rounded-xl text-left transition-all ${aldeiaData.tipoOrganizacao === tipo.id ? "bg-primary text-primary-foreground" : "bg-surface-container-low text-foreground hover:bg-muted/30"}`}>
                    <span className="text-sm font-medium">{tipo.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input placeholder="912 345 678" value={aldeiaData.telefone} onChange={(e) => setAldeiaData({ ...aldeiaData, telefone: e.target.value })} className="pl-10 bg-surface-container-low border-transparent text-foreground" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input type="email" placeholder="contacto@email.pt" value={aldeiaData.email} onChange={(e) => setAldeiaData({ ...aldeiaData, email: e.target.value })} className="pl-10 bg-surface-container-low border-transparent text-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Criar Primeiro Evento</h2>
            <p className="text-muted-foreground">Define o evento de angariação de fundos</p>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Nome do Evento *</Label>
              <Input placeholder="Ex: Festa de São João 2026" value={eventoData.nome} onChange={(e) => setEventoData({ ...eventoData, nome: e.target.value })} className="bg-surface-container-low border-transparent text-foreground" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Descrição</Label>
              <Input placeholder="Breve descrição do evento" value={eventoData.descricao} onChange={(e) => setEventoData({ ...eventoData, descricao: e.target.value })} className="bg-surface-container-low border-transparent text-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Data de Início</Label>
                <Input type="date" value={eventoData.dataInicio} onChange={(e) => setEventoData({ ...eventoData, dataInicio: e.target.value })} className="bg-surface-container-low border-transparent text-foreground" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Data de Fim</Label>
                <Input type="date" value={eventoData.dataFim} onChange={(e) => setEventoData({ ...eventoData, dataFim: e.target.value })} className="bg-surface-container-low border-transparent text-foreground" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Meta de Angariação (€)</Label>
              <Input type="number" placeholder="5000" value={eventoData.objectivoAngariacao || ""} onChange={(e) => setEventoData({ ...eventoData, objectivoAngariacao: parseFloat(e.target.value) || 0 })} className="bg-surface-container-low border-transparent text-foreground" />
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Gamepad2 className="w-8 h-8 text-primary" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Escolhe o Jogo</h2>
            <p className="text-muted-foreground">Seleciona o tipo de jogo para o teu evento</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {TIPOS_JOGO.map((tipo) => (
              <button key={tipo.id} onClick={() => setJogoData({ ...jogoData, tipo: tipo.id })}
                className={`p-4 rounded-xl text-left transition-all border-2 ${jogoData.tipo === tipo.id ? "border-primary bg-primary/10" : "border-outline-variant/20 bg-surface-container hover:border-primary/30"}`}>
                <Sparkles className="h-5 w-5 text-primary mb-2" />
                <p className="font-bold text-foreground">{tipo.label}</p>
                <p className="text-xs text-muted-foreground">{tipo.desc}</p>
              </button>
            ))}
          </div>
          <div className="space-y-4 pt-4 border-t border-outline-variant/20">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Nome do Jogo *</Label>
              <Input placeholder="Ex: Rifas da Festa" value={jogoData.nome} onChange={(e) => setJogoData({ ...jogoData, nome: e.target.value })} className="bg-surface-container-low border-transparent text-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Preço por Participação (€)</Label>
                <Input type="number" step="0.5" min="0.5" value={jogoData.preco} onChange={(e) => setJogoData({ ...jogoData, preco: parseFloat(e.target.value) || 2 })} className="bg-surface-container-low border-transparent text-foreground" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Nº de Bilhetes</Label>
                <Input type="number" value={jogoData.stockInicial} onChange={(e) => setJogoData({ ...jogoData, stockInicial: parseInt(e.target.value) || 100 })} className="bg-surface-container-low border-transparent text-foreground" />
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-primary" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Define o Prémio</h2>
            <p className="text-muted-foreground">Que prémio vais sortear?</p>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Nome do Prémio *</Label>
              <Input placeholder="Ex: Vale de 50€ em compras" value={jogoData.premioNome} onChange={(e) => setJogoData({ ...jogoData, premioNome: e.target.value })} className="bg-surface-container-low border-transparent text-foreground" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Valor em Dinheiro (alternativa)</Label>
              <Input type="number" placeholder="Se preferir dar dinheiro em vez do prémio físico" value={jogoData.premioValor || ""} onChange={(e) => setJogoData({ ...jogoData, premioValor: parseFloat(e.target.value) || 0 })} className="bg-surface-container-low border-transparent text-foreground" />
              <p className="text-xs text-muted-foreground mt-1">Podes indicar o valor em euros como alternativa ao prémio físico</p>
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
      )}

      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-primary" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Métodos de Pagamento</h2>
            <p className="text-muted-foreground">Escolhe como os jogadores vão pagar</p>
          </div>
          <div className="space-y-3">
            {[
              { id: "dinheiro", icon: <span className="text-2xl">💵</span>, label: "Dinheiro", desc: "Pagamento presencial ao vendedor" },
              { id: "mbway", icon: <Smartphone className="h-6 w-6" />, label: "MBWay", desc: "Pagamento via telemóvel" },
              { id: "stripe", icon: <CreditCard className="h-6 w-6" />, label: "Cartão", desc: "Visa, Mastercard, etc." },
            ].map((metodo) => (
              <div key={metodo.id} className="p-4 rounded-xl bg-surface-container-low flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-xl text-primary">{metodo.icon}</div>
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
          <p className="text-xs text-muted-foreground text-center">Podes configurar MBWay e Stripe mais tarde nas definições</p>
        </div>
      )}

      {currentStep === 5 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
                    <button onClick={() => removeVendedor(index)} className="text-destructive text-xs hover:underline">Remover</button>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    <Input placeholder="Nome" value={vendedor.nome} onChange={(e) => updateVendedor(index, "nome", e.target.value)} className="pl-10 bg-surface-container-low border-transparent text-foreground" />
                  </div>
                  <Input type="email" placeholder="Email" value={vendedor.email} onChange={(e) => updateVendedor(index, "email", e.target.value)} className="bg-surface-container-low border-transparent text-foreground" />
                </div>
              </div>
            ))}
          </div>
          <Button onClick={addVendedor} variant="outline" className="w-full border-dashed border-primary/30 text-primary">
            <Users className="h-4 w-4 mr-2" /> Adicionar Vendedor
          </Button>
        </div>
      )}
    </>
  );
}
