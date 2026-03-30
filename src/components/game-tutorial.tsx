"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Gamepad2,
  Sparkles,
  Ticket,
  Trophy,
  Check,
  HelpCircle
} from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  image?: string;
  icon: React.ReactNode;
}

interface GameTutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameType: "rifa" | "tombola" | "poio_da_vaca" | "raspadinha";
  onComplete?: () => void;
}

const TUTORIALS: Record<string, TutorialStep[]> = {
  rifa: [
    {
      id: "welcome",
      title: "Bem-vindo à Rifas!",
      description: "As rifas são uma forma tradicional e emocionante de participar. Escolhe os teus números e espera pelo sorteio!",
      icon: <Ticket className="h-8 w-8" />,
    },
    {
      id: "select",
      title: "Escolhe os teus números",
      description: "Seleciona quantos números quiseres. Cada número custa o valor indicado. Quanto mais números, mais chances de ganhar!",
      icon: <Ticket className="h-8 w-8" />,
    },
    {
      id: "pay",
      title: "Efetua o pagamento",
      description: "Podes pagar com MBWay, cartão de crédito ou saldo da carteira. O pagamento é rápido e seguro!",
      icon: <Gamepad2 className="h-8 w-8" />,
    },
    {
      id: "wait",
      title: "Aguarda pelo sorteio",
      description: "O sorteio é realizado na data indicada. Os vencedores são notificados e podem reclamar o prémio!",
      icon: <Trophy className="h-8 w-8" />,
    },
  ],
  tombola: [
    {
      id: "welcome",
      title: "Bem-vindo à Tombola!",
      description: "A tombolada é um jogo clássico português com múltiplos prémios. Cada número pode ganhar!",
      icon: <Trophy className="h-8 w-8" />,
    },
    {
      id: "select",
      title: "Escolhe os teus números",
      description: "Seleciona os teus números da sorte. Podes comprar múltiplos bilhetes para aumentar as chances!",
      icon: <Ticket className="h-8 w-8" />,
    },
    {
      id: "pay",
      title: "Efetua o pagamento",
      description: "O pagamento é processado de forma segura. Recebes um comprovativo por email.",
      icon: <Gamepad2 className="h-8 w-8" />,
    },
    {
      id: "win",
      title: "Celebra as vitórias!",
      description: "A tombolada tem vários prémios. Quanto mais números tiveres, mais hipóteses de ganhar!",
      icon: <Sparkles className="h-8 w-8" />,
    },
  ],
  poio_da_vaca: [
    {
      id: "welcome",
      title: "Bem-vindo ao Poio da Vaca!",
      description: "O jogo tradicional português! Escolhe coordenadas na grelha e tenta encontrar a vaca escondida.",
      icon: <Gamepad2 className="h-8 w-8" />,
    },
    {
      id: "grid",
      title: "A grelha de jogo",
      description: "O campo está dividido em letras (A-E) e números (1-20). Cada quadrado custa o valor indicado.",
      icon: <Ticket className="h-8 w-8" />,
    },
    {
      id: "select",
      title: "Seleciona as coordenadas",
      description: "Clica ou toca nos quadrados que quiseres marcar. Podes selecionar múltiplos para aumentar as chances!",
      icon: <Ticket className="h-8 w-8" />,
    },
    {
      id: "pay",
      title: "Efetua o pagamento",
      description: "O custo total é o número de quadrados selecionados vezes o preço por quadrado.",
      icon: <Gamepad2 className="h-8 w-8" />,
    },
    {
      id: "wait",
      title: "Aguarda pelo resultado",
      description: "O sorteio revela onde está a vaca. Se tiveres marcado esse quadrado, GANHASTE!",
      icon: <Trophy className="h-8 w-8" />,
    },
  ],
  raspadinha: [
    {
      id: "welcome",
      title: "Bem-vindo às Raspadinhas!",
      description: "As raspadinhas são jogos instantâneos. Compra, raspa e descobre se ganhaste!",
      icon: <Sparkles className="h-8 w-8" />,
    },
    {
      id: "buy",
      title: "Compra a tua raspadinha",
      description: "Seleciona a quantidade que quiseres e efetua o pagamento. Cada raspadinha custa o valor indicado.",
      icon: <Gamepad2 className="h-8 w-8" />,
    },
    {
      id: "scratch",
      title: "Rapa o cartão",
      description: "Usa o dedo ou o cursor para rapar a camada prateada. Descobre se tens um prémio!",
      icon: <Sparkles className="h-8 w-8" />,
    },
    {
      id: "win",
      title: "Celebra!",
      description: "Se ganhaste, parabéns! Podes reclamar o prémio ou convertê-lo em saldo na tua carteira.",
      icon: <Trophy className="h-8 w-8" />,
    },
  ],
};

export function GameTutorial({ open, onOpenChange, gameType, onComplete }: GameTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = TUTORIALS[gameType] || TUTORIALS.rifa;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Save that user has seen tutorial
    if (typeof window !== "undefined") {
      localStorage.setItem(`tutorial_${gameType}_seen`, "true");
    }
    onComplete?.();
    onOpenChange(false);
  };

  const handleSkip = () => {
    handleComplete();
  };

  const currentTutorial = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1f1b19] border-[#ff734b]/20 p-0 max-w-md overflow-hidden">
        {/* Header with progress */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-[#9cefff]" />
              <span className="text-xs text-[#9cefff] uppercase tracking-wider">
                Tutorial
              </span>
            </div>
            <button
              onClick={handleSkip}
              className="text-xs text-[#e0bfb7] hover:text-white transition-colors"
            >
              Saltar
            </button>
          </div>
          
          <Progress value={progress} className="h-1 bg-[#2e2928]" />
          
          <div className="flex justify-center gap-1 mt-3">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentStep
                    ? "w-6 bg-[#ff734b]"
                    : index < currentStep
                    ? "w-1.5 bg-[#ff734b]"
                    : "w-1.5 bg-[#58413b]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="px-6 pb-6"
          >
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10 }}
                className="w-20 h-20 bg-gradient-to-br from-[#ff734b]/20 to-[#ff4488]/20 rounded-3xl flex items-center justify-center border border-[#ff734b]/20"
              >
                <div className="text-[#ff734b]">
                  {currentTutorial.icon}
                </div>
              </motion.div>
            </div>

            {/* Title & Description */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-3">
                {currentTutorial.title}
              </h2>
              <p className="text-[#e0bfb7] leading-relaxed">
                {currentTutorial.description}
              </p>
            </div>

            {/* Decorative dots */}
            <div className="flex justify-center gap-2 mb-6">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  animate={{
                    scale: index === currentStep ? 1.2 : 1,
                    opacity: index === currentStep ? 1 : 0.3,
                  }}
                  className="w-2 h-2 rounded-full bg-[#ff734b]"
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3">
          {currentStep > 0 ? (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 border-[#ff734b]/30 text-[#ff734b]"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
          ) : (
            <div className="flex-1" />
          )}
          
          <Button
            onClick={handleNext}
            className="flex-1 bg-[#ff734b] hover:bg-[#ff734b]/90 text-[#110d0c] font-bold"
          >
            {currentStep === steps.length - 1 ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Começar a Jogar
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper hook to check if tutorial was seen
export function useTutorialSeen(gameType: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`tutorial_${gameType}_seen`) === "true";
}

// Helper to mark tutorial as seen
export function markTutorialSeen(gameType: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(`tutorial_${gameType}_seen`, "true");
  }
}
