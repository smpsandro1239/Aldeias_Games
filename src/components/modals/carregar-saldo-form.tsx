"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Euro, Wallet, Phone, Building2, AlertTriangle, Copy, User, ChevronDown } from "lucide-react";
import { CarregarSaldoState, PAYMENT_METHODS, PaymentMethod, Vendedor } from "./carregar-saldo-types";
import { safeParseFloat } from "./carregar-saldo-hooks";

interface CarregarSaldoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: CarregarSaldoState;
  metodosPagamentoAceites: string[];
  onMetodoChange: (metodo: PaymentMethod) => void;
  onValorChange: (valor: string) => void;
  onDescricaoChange: (descricao: string) => void;
  onToggleVendedor: () => void;
  onVendedorSelect: (vendedor: Vendedor) => void;
  onCopiarIBAN: () => void;
  onCarregar: () => void;
}

export function CarregarSaldoForm({
  open,
  onOpenChange,
  state,
  metodosPagamentoAceites,
  onMetodoChange,
  onValorChange,
  onDescricaoChange,
  onToggleVendedor,
  onVendedorSelect,
  onCopiarIBAN,
  onCarregar,
}: CarregarSaldoFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-surface-container border border-outline-variant/10 p-0 overflow-hidden" aria-describedby="carregar-saldo-description">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-headline text-xl flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" aria-hidden="true" />
            Carregar Saldo
          </DialogTitle>
          <p id="carregar-saldo-description" className="sr-only">Modal para carregar saldo usando diferentes métodos de pagamento</p>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4 overflow-y-auto max-h-[60vh] pr-2">
          <div className="bg-surface-container-high rounded-xl p-4 text-center">
            <p className="text-xs text-on-surface-variant">Saldo Atual</p>
            <p className="font-headline text-3xl text-primary">{state.saldo.toFixed(2)}€</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor">Valor a Carregar *</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" aria-hidden="true" />
              <Input
                id="valor"
                type="number"
                min="1"
                step="0.50"
                value={state.valor}
                onChange={(e) => onValorChange(e.target.value)}
                placeholder="0.00"
                className="pl-10 text-xl"
                aria-describedby="valor-error"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Método de Recebimento *</Label>
            {metodosPagamentoAceites.length === 0 ? (
              <div className="p-4 rounded-xl bg-destructive/10 border border-red-500/20 text-center">
                <p className="text-sm text-red-400">Nenhum método de pagamento disponível. Contacte o administrador.</p>
              </div>
            ) : (
            <div className="grid gap-2" role="radiogroup" aria-label="Selecionar método de pagamento">
              {metodosPagamentoAceites.includes(PAYMENT_METHODS.DINHEIRO) && (
                <button
                  type="button"
                  onClick={() => onMetodoChange(PAYMENT_METHODS.DINHEIRO)}
                  className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                    state.metodoCarregamento === PAYMENT_METHODS.DINHEIRO
                      ? "bg-primary/20 text-green-400 border border-green-600/30"
                      : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                  }`}
                  role="radio"
                  aria-checked={state.metodoCarregamento === PAYMENT_METHODS.DINHEIRO}
                  aria-label="Método Dinheiro - Recebido presencialmente"
                >
                  <Euro className="w-5 h-5" aria-hidden="true" />
                  <div className="text-left">
                    <p className="font-medium">Dinheiro</p>
                    <p className="text-xs opacity-60">Recebido presencialmente</p>
                  </div>
                </button>
              )}

              {metodosPagamentoAceites.includes(PAYMENT_METHODS.MBWAY) && (
                <button
                  type="button"
                  onClick={() => onMetodoChange(PAYMENT_METHODS.MBWAY)}
                  className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                    state.metodoCarregamento === PAYMENT_METHODS.MBWAY
                      ? "bg-purple-600/20 text-primary border border-purple-600/30"
                      : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                  }`}
                  role="radio"
                  aria-checked={state.metodoCarregamento === PAYMENT_METHODS.MBWAY}
                  aria-label="Método MBWay - Recebido via MBWay"
                >
                  <Phone className="w-5 h-5" aria-hidden="true" />
                  <div className="text-left">
                    <p className="font-medium">MBWay</p>
                    <p className="text-xs opacity-60">Recebido via MBWay</p>
                  </div>
                </button>
              )}

              {metodosPagamentoAceites.includes(PAYMENT_METHODS.TRANSFERENCIA) && (
                <button
                  type="button"
                  onClick={() => onMetodoChange(PAYMENT_METHODS.TRANSFERENCIA)}
                  className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                    state.metodoCarregamento === PAYMENT_METHODS.TRANSFERENCIA
                      ? "bg-blue-600/20 text-primary border border-blue-600/30"
                      : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                  }`}
                  role="radio"
                  aria-checked={state.metodoCarregamento === PAYMENT_METHODS.TRANSFERENCIA}
                  aria-label="Método Transferência - Transferência bancária"
                >
                  <Building2 className="w-5 h-5" aria-hidden="true" />
                  <div className="text-left">
                    <p className="font-medium">Transferência</p>
                    <p className="text-xs opacity-60">Transferência bancária</p>
                  </div>
                </button>
              )}

              {metodosPagamentoAceites.includes(PAYMENT_METHODS.VENDEDOR) && (
                <button
                  type="button"
                  onClick={() => onMetodoChange(PAYMENT_METHODS.VENDEDOR)}
                  className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                    state.metodoCarregamento === PAYMENT_METHODS.VENDEDOR
                      ? "bg-accent/20 text-orange-400 border border-orange-600/30"
                      : "bg-surface-container-low text-muted-foreground hover:bg-surface-container-high"
                  }`}
                  role="radio"
                  aria-checked={state.metodoCarregamento === PAYMENT_METHODS.VENDEDOR}
                  aria-label="Método Pedir ao Vendedor - O vendedor traz o dinheiro"
                >
                  <User className="w-5 h-5" aria-hidden="true" />
                  <div className="text-left">
                    <p className="font-medium">Pedir ao Vendedor</p>
                    <p className="text-xs opacity-60">O vendedor traz o dinheiro</p>
                  </div>
                </button>
              )}
            </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendedor-select">Vendedor Responsável *</Label>
            <p className="text-xs text-on-surface-variant">
              Selecione o vendedor que está presente para processar o carregamento
            </p>
            <div className="relative">
              <button
                id="vendedor-select"
                type="button"
                onClick={onToggleVendedor}
                className="w-full p-4 rounded-xl bg-surface-container-low text-left flex items-center justify-between"
                aria-expanded={state.vendedorDropdownOpen}
                aria-haspopup="listbox"
                aria-describedby="vendedor-error"
              >
                <span>{state.selectedVendedor?.nome || "Selecione um vendedor"}</span>
                <ChevronDown className="w-5 h-5" aria-hidden="true" />
              </button>
              {state.vendedorDropdownOpen && (
                <div className="absolute z-10 w-full bg-surface-container-high border border-outline-variant/10 rounded-xl mt-1 max-h-48 overflow-y-auto" role="listbox" aria-labelledby="vendedor-select">
                  {state.vendedores.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => onVendedorSelect(v)}
                      className="w-full p-3 text-left hover:bg-surface-container-low flex items-center gap-2"
                      role="option"
                      aria-selected={state.selectedVendedor?.id === v.id}
                    >
                      <User className="w-4 h-4" aria-hidden="true" />
                      {v.nome}
                    </button>
                  ))}
                </div>
              )}
              {!state.selectedVendedor && (
                <p id="vendedor-error" className="text-sm text-red-500 mt-1" role="alert">
                  Selecione um vendedor para processar o carregamento
                </p>
              )}
            </div>
          </div>

          {state.metodoCarregamento === PAYMENT_METHODS.TRANSFERENCIA && state.dadosConta.iban && (
            <div className="bg-secondary/10 border border-blue-500/20 rounded-xl p-3 space-y-2">
              <p className="text-xs text-primary font-medium">Dados para Transferência:</p>
              <div className="flex items-center justify-between bg-surface-container-low p-2 rounded-lg">
                <span className="text-xs font-mono">{state.dadosConta.iban}</span>
                <button onClick={onCopiarIBAN} className="p-1 hover:bg-surface-container-high rounded" aria-label="Copiar IBAN para área de transferência">
                  <Copy className="w-4 h-4 text-primary" aria-hidden="true" />
                </button>
              </div>
              {state.dadosConta.nomeTitularConta && (
                <p className="text-xs text-on-surface-variant">Titular: {state.dadosConta.nomeTitularConta}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Input
              id="descricao"
              value={state.descricao}
              onChange={(e) => onDescricaoChange(e.target.value)}
              placeholder="Ex: Venda na festa de São João"
            />
          </div>

          <div className="bg-destructive/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-xs text-red-400 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              Transparência Obrigatória
            </p>
            <p className="text-xs text-red-400/80 mt-1">
              Ao confirmar, todos os administradores e super administradores serão notificados por email e WhatsApp com os detalhes deste carregamento.
            </p>
          </div>

          <Button
            onClick={onCarregar}
            disabled={state.loading || !state.valor || safeParseFloat(state.valor) <= 0 || !state.selectedVendedor}
            className="w-full py-6"
            aria-label={`Criar pedido de carregamento de ${state.valor || "0"} euros`}
          >
            {state.loading ? "A processar..." : `Criar Pedido (${state.valor || "0"}€)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}