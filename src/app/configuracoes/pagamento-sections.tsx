"use client";

import { CreditCard, Phone, Building2, Wallet, Check, AlertTriangle, User } from "lucide-react";
import type { MetodoPagamentoDefault, MetodosAceitesState } from "./configuracoes-types";

interface PagamentoSectionsProps {
  formData: {
    permitirStripe: boolean;
    permitirMBWay: boolean;
  };
  setFormData: (data: any) => void;
  metodosPagamentoAceites: MetodosAceitesState;
  setMetodosPagamentoAceites: (data: any) => void;
  defaultMethods: MetodoPagamentoDefault;
  setDefaultMethods: (data: any) => void;
}

function ToggleRow({ icon, label, desc, enabled, onToggle, note }: {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  enabled: boolean;
  onToggle: () => void;
  note?: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="font-medium text-accent">{label}</p>
          {desc && <p className="text-xs text-muted-foreground/60">{desc}</p>}
          {note && <p className="text-xs text-primary">{note}</p>}
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
      >
        <div className={`w-5 h-5 bg-foreground rounded-full transition-transform ${enabled ? "translate-x-6" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

export function PagamentoSections(props: PagamentoSectionsProps) {
  const { formData, setFormData, metodosPagamentoAceites, setMetodosPagamentoAceites, defaultMethods, setDefaultMethods } = props;

  return (
    <>
      <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/10">
        <h3 className="font-serif text-accent font-bold mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5" /> Métodos Ativos
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <span className="text-xl">💵</span>
              </div>
              <div>
                <p className="font-medium text-accent">Dinheiro</p>
                <p className="text-xs text-muted-foreground/60">Sempre disponível</p>
              </div>
            </div>
            <Check className="w-5 h-5 text-primary" />
          </div>

          <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <p className="font-medium text-accent">Saldo Aldeias</p>
                <p className="text-xs text-muted-foreground/60">Sem custos</p>
              </div>
            </div>
            <Check className="w-5 h-5 text-primary" />
          </div>

          <ToggleRow
            icon={<CreditCard className="w-5 h-5 text-primary" />}
            label="Stripe (Cartão)"
            desc="1.5% + €0.25 por transação"
            enabled={formData.permitirStripe}
            onToggle={() => setFormData({ ...formData, permitirStripe: !formData.permitirStripe })}
          />

          <ToggleRow
            icon={<Phone className="w-5 h-5 text-primary" />}
            label="MBWay"
            desc="~1-2% por transação"
            enabled={formData.permitirMBWay}
            onToggle={() => setFormData({ ...formData, permitirMBWay: !formData.permitirMBWay })}
          />
        </div>

        <div className="mt-6 border-t border-outline-variant/20 pt-6">
          <h3 className="font-serif text-accent font-bold mb-2 flex items-center gap-2">
            <Check className="w-5 h-5" /> Métodos de Pagamento Aceites
          </h3>
          <p className="text-xs text-muted-foreground/60 mb-4">
            Configure quais métodos de pagamento estão disponíveis em toda a aldeia. Métodos desativados não serão apresentados a nenhum utilizador.
          </p>

          <div className="space-y-3">
            <ToggleRow icon={<span className="text-xl">💵</span>} label="Dinheiro" desc="Pagamento presencial" enabled={metodosPagamentoAceites.dinheiro} onToggle={() => setMetodosPagamentoAceites({ ...metodosPagamentoAceites, dinheiro: !metodosPagamentoAceites.dinheiro })} />
            <ToggleRow icon={<span className="text-xl">💰</span>} label="Saldo Aldeias" desc="Carteira digital" enabled={metodosPagamentoAceites.saldo} onToggle={() => setMetodosPagamentoAceites({ ...metodosPagamentoAceites, saldo: !metodosPagamentoAceites.saldo })} />
            <ToggleRow icon={<Phone className="w-5 h-5 text-primary" />} label="MBWay" desc="Pagamento via telemóvel" enabled={metodosPagamentoAceites.mbway} onToggle={() => setMetodosPagamentoAceites({ ...metodosPagamentoAceites, mbway: !metodosPagamentoAceites.mbway })} />
            <ToggleRow icon={<CreditCard className="w-5 h-5 text-primary" />} label="Stripe (Cartão)" desc="Cartão de crédito/débito" enabled={metodosPagamentoAceites.stripe} onToggle={() => setMetodosPagamentoAceites({ ...metodosPagamentoAceites, stripe: !metodosPagamentoAceites.stripe })} />
            <ToggleRow icon={<Building2 className="w-5 h-5 text-primary" />} label="Transferência Bancária" desc="Transferência IBAN" enabled={metodosPagamentoAceites.transferencia} onToggle={() => setMetodosPagamentoAceites({ ...metodosPagamentoAceites, transferencia: !metodosPagamentoAceites.transferencia })} />
            <ToggleRow icon={<User className="w-5 h-5 text-primary" />} label="Vendedor (Carregamento)" desc="Carregamento presencial com vendedor" enabled={metodosPagamentoAceites.vendedor} onToggle={() => setMetodosPagamentoAceites({ ...metodosPagamentoAceites, vendedor: !metodosPagamentoAceites.vendedor })} />
          </div>

          <div className="mt-3 p-3 bg-accent/10 border border-accent/20 rounded-xl">
            <p className="text-xs text-accent flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <strong>Importante:</strong> Métodos desativados não serão apresentados a nenhum utilizador na aldeia, incluindo carregamento de saldo e pagamento de jogos.
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-outline-variant/20 pt-6">
          <h3 className="font-serif text-accent font-bold mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5" /> Predefinição para Novos Jogos
          </h3>
          <p className="text-xs text-muted-foreground/60 mb-4">
            Escolha quais métodos de pagamento vêm pré-selecionados ao criar um novo jogo.
          </p>

          <div className="space-y-3">
            <ToggleRow icon={<span className="text-xl">💵</span>} label="Dinheiro" desc="Sempre disponível" enabled={defaultMethods.dinheiro} onToggle={() => setDefaultMethods({ ...defaultMethods, dinheiro: !defaultMethods.dinheiro })} />
            <ToggleRow icon={<span className="text-xl">💰</span>} label="Saldo Aldeias" desc="Sem custos" enabled={defaultMethods.saldo} onToggle={() => setDefaultMethods({ ...defaultMethods, saldo: !defaultMethods.saldo })} />
            {formData.permitirStripe && <ToggleRow icon={<CreditCard className="w-5 h-5 text-primary" />} label="Cartão (Stripe)" enabled={defaultMethods.stripe} onToggle={() => setDefaultMethods({ ...defaultMethods, stripe: !defaultMethods.stripe })} />}
            {formData.permitirMBWay && <ToggleRow icon={<Phone className="w-5 h-5 text-primary" />} label="MBWay" enabled={defaultMethods.mbway} onToggle={() => setDefaultMethods({ ...defaultMethods, mbway: !defaultMethods.mbway })} />}
            <ToggleRow icon={<Building2 className="w-5 h-5 text-primary" />} label="Transferência" enabled={defaultMethods.transferencia} onToggle={() => setDefaultMethods({ ...defaultMethods, transferencia: !defaultMethods.transferencia })} />
          </div>
        </div>

        {(formData.permitirStripe || formData.permitirMBWay) && (
          <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-xl space-y-2">
            <p className="text-xs text-accent flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <strong>Aviso:</strong> Ao ativar estes métodos, terão custos por transação.
            </p>
            {formData.permitirStripe && <p className="text-xs text-accent/80 pl-6">• Stripe: ~2.9% + €0.30 por transação</p>}
            {formData.permitirMBWay && <p className="text-xs text-accent/80 pl-6">• MBWay: ~1.5% + €0.25 por transação</p>}
            <p className="text-xs text-primary pl-6 pt-1">💡 Recomendamos Dinheiro e Saldo Aldeias para maximizar receitas (sem comissões).</p>
          </div>
        )}
      </div>
    </>
  );
}
