"use client";

import { useRouter } from "next/navigation";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LayoutHeader } from "@/components/layout-header";

export default function PagamentoCanceladoPage() {
  const router = useRouter();

  const handleGoBack = () => {
    router.push("/");
  };

  return (
    <LayoutHeader>
       <div className="min-h-screen bg-surface-container flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Pagamento Cancelado</h1>
          <p className="text-muted-foreground mb-6">
            O pagamento foi cancelado. O saldo não foi creditado.
          </p>
          <Button
            onClick={handleGoBack}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    </LayoutHeader>
  );
}