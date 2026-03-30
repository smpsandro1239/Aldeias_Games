# Design: Sistema de Pagamentos Global

**Data:** 2026-03-31  
**Autor:** AI Assistant  
**Status:** Aprovado

---

## 1. Visão Geral

Criar um sistema de pagamentos global e reutilizável para todos os jogos, eliminando duplicação de código e simplificando a manutenção. O componente será usado em qualquer página que necessite de processar pagamentos.

## 2. Objetivos

- Componente de pagamento genérico (`PaymentSelector`) reutilizável em todos os jogos
- Lógica de permissões центраlizada baseada em roles
- Avisos claros sobre comissões ao configurar métodos de pagamento
- Interface simples e consistente

## 3. Arquitetura

### 3.1 Componente Principal

**Ficheiro:** `src/components/payment/payment-selector.tsx`

```typescript
interface PaymentSelectorProps {
  amount: number;
  onSuccess: (method: MetodoPagamento, transactionId?: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  showLabels?: boolean;
}

type MetodoPagamento = 'mbway' | 'dinheiro' | 'stripe' | 'transferencia' | 'saldo';
```

### 3.2 Permissões por Role

| Role | Dinheiro | Saldo | MBWay | Stripe |
|------|----------|-------|-------|--------|
| user | ✅ | ✅ | ❌ | ❌ |
| vendedor | ✅ | ✅ | ❌ | ❌ |
| aldeia_admin | ✅ | ✅ | ✅* | ✅* |
| super_admin | ✅ | ✅ | ✅ | ✅ |

*Só se ativado nas configurações da aldeia

### 3.3 Lógica de Comissões

**Ficheiro:** `src/lib/payment-commissions.ts`

```typescript
export const PAYMENT_COMMISSIONS = {
  mbway: { percent: 1.5, fixed: 0.25, label: '~1.5% + €0.25' },
  stripe: { percent: 2.9, fixed: 0.30, label: '~2.9% + €0.30' },
  dinheiro: { percent: 0, fixed: 0, label: 'Sem comissão' },
  saldo: { percent: 0, fixed: 0, label: 'Sem comissão' },
  transferencia: { percent: 0, fixed: 0, label: 'Sem comissão' },
};

export function getAvailableMethods(userRole: string, aldeiaSettings?: AldeiaSettings): MetodoPagamento[] {
  const baseMethods: MetodoPagamento[] = ['dinheiro', 'saldo'];
  
  if (userRole === 'super_admin') {
    return [...baseMethods, 'mbway', 'stripe'];
  }
  
  if (userRole === 'aldeia_admin' && aldeiaSettings) {
    if (aldeiaSettings.permitirMBWay) baseMethods.push('mbway');
    if (aldeiaSettings.permitirStripe) baseMethods.push('stripe');
  }
  
  return baseMethods;
}
```

## 4. Componentes UI

### 4.1 PaymentSelector

- Cards para cada método disponível
- Ícones representativos
- Indicação de "Sem comissão" vs método com taxa
- Estado de loading durante processamento

### 4.2 PaymentMethodsSettings

**Localização:** `src/components/admin/payment-methods-settings.tsx`

- Toggle para MBWay e Stripe
- Aviso de comissão ao ativar
- Recomendação de Dinheiro/Saldo

## 5. Fluxo de Dados

```
User clica em Pagar
    ↓
PaymentSelector.renderiza métodos disponíveis
    ↓
User seleciona método
    ↓
[Saldo] → Verificar saldo → Debitar → Confirmar
[Dinheiro] → Registar venda "pendente" → Mostrar confirmação
[MBWay/Stripe] → Chamar API → Redirect/Modal → Webhook → Confirmar
```

## 6. Ficheiros a Criar/Modificar

### Criar
- `src/components/payment/payment-selector.tsx`
- `src/components/payment/payment-card.tsx`
- `src/components/admin/payment-methods-settings.tsx`
- `src/lib/payment-commissions.ts`

### Modificar
- `src/app/jogos/poio-da-vaca/page.tsx` - usar PaymentSelector
- `src/app/jogos/rifa/page.tsx` - usar PaymentSelector
- `src/app/configuracoes/page.tsx` - integrar PaymentMethodsSettings
- `src/types/project.ts` - adicionar tipagem se necessário

## 7. Testes

- Verificar que métodos corretos aparecem por role
- Verificar que saldo é deduzido corretamente
- Verificar que avisos de comissão aparecem na config
- Verificar que todos os jogos usam o mesmo componente

## 8. Notas de Implementação

- Usar contexto de autenticação para obter role do user
- Buscar configurações da aldeia se aldeia_admin
- Manter estado local de métodos selecionados para melhor UX
