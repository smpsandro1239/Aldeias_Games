"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Building2, Calendar, Gamepad2, Gift, CreditCard, Users,
  Check, ChevronRight, ChevronLeft, ArrowRight,
} from "lucide-react";
import { useSetupWizard } from "./use-setup-wizard";
import { SetupWizardSteps } from "./setup-wizard-steps";
import { SetupWizardProps } from "./setup-wizard-types";

const STEPS = [
  { id: "aldeia", label: "Aldeia", icon: Building2 },
  { id: "evento", label: "Evento", icon: Calendar },
  { id: "jogo", label: "Jogo", icon: Gamepad2 },
  { id: "premios", label: "Prémios", icon: Gift },
  { id: "pagamentos", label: "Pagamentos", icon: CreditCard },
  { id: "vendedores", label: "Vendedores", icon: Users },
];

export function SetupWizard({ open, onOpenChange, onComplete }: SetupWizardProps) {
  const {
    currentStep, loading,
    aldeiaData, setAldeiaData,
    eventoData, setEventoData,
    jogoData, setJogoData,
    vendedores, addVendedor, removeVendedor, updateVendedor,
    handleNext, handleBack, handleFinish,
    progress,
  } = useSetupWizard(onComplete, onOpenChange);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface-container border-primary/20 p-0 max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface-container z-10 p-6 pb-4">
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

          <div className="flex justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isComplete = index < currentStep;
              return (
                <div key={step.id} className={`flex flex-col items-center ${index <= currentStep ? "text-primary" : "text-outline-variant"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isComplete ? "bg-primary text-primary-foreground" : isActive ? "bg-primary/20 border-2 border-primary" : "bg-surface-container-low"}`}>
                    {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SetupWizardSteps
                currentStep={currentStep}
                aldeiaData={aldeiaData}
                setAldeiaData={setAldeiaData}
                eventoData={eventoData}
                setEventoData={setEventoData}
                jogoData={jogoData}
                setJogoData={setJogoData}
                vendedores={vendedores}
                addVendedor={addVendedor}
                removeVendedor={removeVendedor}
                updateVendedor={updateVendedor}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="sticky bottom-0 bg-surface-container p-6 pt-4 border-t border-outline-variant/20">
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack} className="flex-1 border-primary/30 text-primary">
                <ChevronLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <Button onClick={handleNext} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                Próximo <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={loading || !aldeiaData.nome || !eventoData.nome || !jogoData.nome || !jogoData.premioNome}
                className="flex-1 bg-primary hover:bg-primary text-foreground font-bold"
              >
                {loading ? (
                  <><Check className="h-4 w-4 mr-2" /> A criar...</>
                ) : (
                  <>Concluir <ArrowRight className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
