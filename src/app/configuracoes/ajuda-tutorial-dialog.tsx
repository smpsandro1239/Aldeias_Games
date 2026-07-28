"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AjudaTutorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AjudaTutorialDialog({ open, onOpenChange }: AjudaTutorialDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-surface-container border border-primary/10">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-accent">Tutorial: Métodos de Pagamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <section>
            <h3 className="font-bold text-accent mb-2">1. Dinheiro (Grátis ✅)</h3>
            <p className="text-sm text-muted-foreground">
              O vendedor recebe dinheiro vivo e carrega o saldo na app. Tudo fica registado automaticamente.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-accent mb-2">2. Saldo Aldeias (Grátis ✅)</h3>
            <p className="text-sm text-muted-foreground">
              Os jogadores podem ter saldo na plataforma. Os vendedores carregam saldo quando recebem pagamento.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-accent mb-2">3. Transferência Bancária</h3>
            <p className="text-sm text-muted-foreground">
              Configure os dados bancários. O cliente faz a transferência e o vendedor confirma o recebimento.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-primary mb-2">4. Stripe (1.5% + €0.25)</h3>
            <p className="text-sm text-muted-foreground">
              Permite pagamentos com cartão de crédito/débito. Para ativar:
            </p>
            <ul className="text-sm text-muted-foreground/80 mt-2 space-y-1 ml-4">
              <li>1. Criar conta em <strong>stripe.com/pt</strong></li>
              <li>2. Obter as chaves API (Publishable e Secret)</li>
              <li>3. Ativar no admin da aldeia</li>
              <li>4. Configurar no ficheiro .env do servidor</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-primary mb-2">5. MBWay (~1-2%)</h3>
            <p className="text-sm text-muted-foreground">
              Pagamento via telemóvel. Para ativar:
            </p>
            <ul className="text-sm text-muted-foreground/80 mt-2 space-y-1 ml-4">
              <li>1. Registar em <strong>lemonway.com</strong> ou <strong>paybyrd.com</strong></li>
              <li>2. Completar verificação de identidade</li>
              <li>3. Obter credenciais API</li>
              <li>4. Ativar no admin da aldeia</li>
            </ul>
          </section>

          <section className="bg-accent/10 border border-accent/20 rounded-xl p-4">
            <h3 className="font-bold text-accent mb-2">💡 Recomendação</h3>
            <p className="text-sm text-muted-foreground">
              Para maximizar a angariação de fundos, use principalmente <strong>Dinheiro</strong> e <strong>Saldo</strong> (sem custos). Ative Stripe/MBWay apenas se clientes insistirem, pois as comissões reduzem os fundos angariados.
            </p>
          </section>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
