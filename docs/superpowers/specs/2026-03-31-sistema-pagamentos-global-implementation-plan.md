# Plano: Sistema de Pagamentos Global

## Tarefa 1: Criar lib de comissões e permissões

1. Criar `src/lib/payment-commissions.ts`
   - Definir PAYMENT_COMMISSIONS com percentagens
   - Criar função getAvailableMethods(userRole, aldeiaSettings)
   - Criar função formatCommission(method)

**Verificar:** Ficheiro criado com exports corretos

## Tarefa 2: Criar componente PaymentCard

2. Criar `src/components/payment/payment-card.tsx`
   - Props: method, selected, onClick, disabled, commission
   - Ícone + nome + indicação de comissão
   - Estado selected com border glow

**Verificar:** Componente renderiza sem erros

## Tarefa 3: Criar componente PaymentSelector

3. Criar `src/components/payment/payment-selector.tsx`
   - Importar PaymentCard
   - Usar getAvailableMethods baseado no user do contexto
   - Renderizar lista de métodos disponíveis
   - Handler para seleção

**Verificar:** Componente mostra métodos corretos por role

## Tarefa 4: Criar componente PaymentMethodsSettings

4. Criar `src/components/admin/payment-methods-settings.tsx`
   - Toggles para MBWay e Stripe
   - Aviso de comissão ao ativar (usar PAYMENT_COMMISSIONS)
   - Botão guardar

**Verificar:** Configuração guarda na aldeia

## Tarefa 5: Integrar na página Poio da Vaca

5. Modificar `src/app/jogos/poio-da-vaca/page.tsx`
   - Substituir lógica de pagamento local por PaymentSelector
   - Mapear onSuccess para lógica existente

**Verificar:** Página funciona, pagamento funciona

## Tarefa 6: Integrar na página Rifa

6. Modificar `src/app/jogos/rifa/page.tsx`
   - Substituir lógica de pagamento local por PaymentSelector

**Verificar:** Página funciona, pagamento funciona

## Tarefa 7: Integrar nas configurações

7. Modificar `src/app/configuracoes/page.tsx`
   - Adicionar PaymentMethodsSettings na secção de pagamentos

**Verificar:** Configurações aparecem e guardam

## Tarefa 8: Commit e deploy

8. Commit com todas as alterações
9. Push para GitHub
10. Deploy Vercel

**Verificar:** Deploy succeeds sem erros
