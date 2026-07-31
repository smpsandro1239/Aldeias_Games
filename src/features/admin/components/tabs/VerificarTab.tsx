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

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Como obter o hash?</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• O cliente apresenta o código hash (geralmente impresso no bilhete)</li>
              <li>• O hash é um código alfanumérico único de 64 caracteres</li>
              <li>• Pode ser escaneado via QR code ou digitado manualmente</li>
            </ul>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">⚠️ Importante</h4>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Sempre verifique o hash antes de entregar qualquer prémio!</strong> Esta verificação garante
              que o bilhete é autêntico e não foi falsificado.
            </p>
          </div>

          <Button onClick={() => setVerificarHashOpen(true)}>
            <Hash className="h-4 w-4 mr-2" />
            Verificar Hash
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📋 Tutorial: Como Verificar um Bilhete</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
              <div>
                <h5 className="font-semibold">Receba o bilhete do cliente</h5>
                <p className="text-sm text-muted-foreground">O cliente apresenta o bilhete físico ou mostra o código hash no telemóvel.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
              <div>
                <h5 className="font-semibold">Localize o código hash</h5>
                <p className="text-sm text-muted-foreground">Procure por um código longo (64 caracteres) geralmente impresso na parte inferior do bilhete.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
              <div>
                <h5 className="font-semibold">Abra o verificador</h5>
                <p className="text-sm text-muted-foreground">Clique no botão "Verificar Hash" acima para abrir o modal de verificação.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
              <div>
                <h5 className="font-semibold">Insira o hash</h5>
                <p className="text-sm text-muted-foreground">Cole ou insira o código hash completo no campo de entrada. Pressione Enter ou clique na lupa.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">5</div>
              <div>
                <h5 className="font-semibold">Analise o resultado</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><span className="text-green-600">✅ Verde:</span> Hash válido - pode entregar prémio</li>
                  <li><span className="text-red-600">❌ Vermelho:</span> Hash inválido - recuse entrega</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">6</div>
              <div>
                <h5 className="font-semibold">Valide informações adicionais</h5>
                <p className="text-sm text-muted-foreground">Compare nome/telefone do cliente com os dados mostrados no resultado.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">7</div>
              <div>
                <h5 className="font-semibold">Entregue o prémio (se válido)</h5>
                <p className="text-sm text-muted-foreground">Após confirmação, entregue o prémio e marque como "entregue" se aplicável.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
