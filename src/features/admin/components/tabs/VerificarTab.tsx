"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hash } from "lucide-react";

interface VerificarTabProps {
  setVerificarHashOpen: (open: boolean) => void;
}

export function VerificarTab({ setVerificarHashOpen }: VerificarTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Verificar Participação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Introduza o hash de uma participação para verificar a sua autenticidade antes de entregar o prémio.
            O sistema verificará se o hash corresponde aos registros e permitirá confirmar a entrega.
          </p>
          <Button onClick={() => setVerificarHashOpen(true)}>
            <Hash className="h-4 w-4 mr-2" />
            Verificar Hash
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
