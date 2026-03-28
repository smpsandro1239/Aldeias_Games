# Guia Completo: Métodos de Pagamento

## Visão Geral

O Aldeias Games foi desenvolvido com foco na **transparência total**. Todos os pagamentos são registados e todos os administradores são notificados automaticamente.

---

## Métodos de Pagamento Disponíveis

### 1. Dinheiro 💵 (Grátis)
- O vendedor recebe dinheiro vivo
- Carrega o saldo na app após receber
- **Custo**: €0

### 2. Saldo Aldeias 💰 (Grátis)
- Jogadores podem ter saldo na plataforma
- Vendedores carregam saldo quando recebem
- **Custo**: €0

### 3. Transferência Bancária 🏦 (Grátis)
- Configure os dados bancários na app
- Cliente faz transferência
- Vendedor confirma e carrega saldo
- **Custo**: €0 (pode ter custo do banco do cliente)

### 4. Stripe 💳 (1.5% + €0.25)
- Pagamentos com cartão
- Ativação opcional
- **Custo**: 1.5% + €0.25 por transação

### 5. MBWay 📱 (~1-2%)
- Pagamento via telemóvel
- Ativação opcional
- **Custo**: ~1-2% por transação

---

## Configurações por Aldeia

Cada aldeia/organização pode configurar:

| Campo | Descrição |
|-------|-----------|
| `permitirStripe` | Ativar/desativar pagamentos com cartão |
| `permitirMBWay` | Ativar/desativar pagamentos MBWay |
| `iban` | IBAN para transferências |
| `nomeTitularConta` | Nome do titular da conta |

**Por predefinição**: Apenas Dinheiro e Saldo estão ativos (sem custos)

---

## Fluxo: Vendedor Carrega Saldo

Quando um vendedor carrega saldo:

1. **Seleciona o método** (Dinheiro/MBWay/Transferência)
2. **Insere o valor**
3. **Confirma o carregamento**

**Resultado**:
- Saldo do vendedor é atualizado
- Todos os admins são notificados
- Registo completo guardado:
  - Nome do vendedor
  - Email e telefone
  - Dados da conta (se aplicável)
  - Data e hora
  - Evento/Aldeia

---

## Como Ativar Stripe

### Passo 1: Criar Conta
1. Vai para [stripe.com/pt](https://stripe.com/pt)
2. Clica em "Começar agora"
3. Regista-te com email profissional
4. Completa a verificação de identidade

### Passo 2: Obter Chaves API
1. Faz login no Dashboard Stripe
2. Vai para **Developers** → **API Keys**
3. Copia:
   - **Publishable Key**: `pk_test_...` ou `pk_live_...`
   - **Secret Key**: `sk_test_...` ou `sk_live_...`

### Passo 3: Configurar no Servidor
No ficheiro `.env`:
```
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Passo 4: Ativar na App
1. Vai a **Configurações** na app
2. Ativa "Stripe (Cartão)"
3. Confirma que aceitas as comissões

---

## Como Ativar MBWay

### Opção A: Lemonway (Recomendado)

1. **Registar**
   - Vai para [lemonway.com/pt](https://lemonway.com/pt)
   - Clica em "Começar"
   - Preenche os dados da empresa/freguesia

2. **Verificação** (2-5 dias)
   - Certidão de registo comercial
   - Comprovativo de IBAN
   - BI/Passaporte do responsável

3. **Obter Credenciais**
   - Dashboard → **Configurações** → **API**
   - Copia **Merchant ID** e **API Key**

4. **Configurar**
   ```
   LEMONWAY_MERCHANT_ID=...
   LEMONWAY_API_KEY=...
   LEMONWAY_ENDPOINT=https://sandbox-api.lemonway.fr
   ```

### Opção B: Paybyrd (Alternativa)

1. Vai para [paybyrd.com](https://paybyrd.com)
2. Regista-te
3. Ativa MBWay nas configurações
4. Obtém credenciais API

---

## Recomendações

### Para Maximizar Fondos Angariados:

✅ **Usar Dinheiro** - Sem custos  
✅ **Usar Saldo** - Sem custos  
✅ **Transferência Bancária** - Sem custos da nossa parte  

⚠️ **Stripe** - Apenas se cliente insistir  
⚠️ **MBWay** - Apenas se cliente insistir  

### Porquê?
Cada 1% de comissão significa 1% menos para a causa!
Exemplo: €1000 angariados com 1% de comissão = €10 perdidos

---

## Transparência

Todos os carregamentos de saldo geram:
- Notificação a todos os administradores
- Registo completo na base de dados
- Histórico consultável

Isto garante que não há falhas e tudo fica limpo e rastreável.

---

## Perguntas Frequentes

**Posso desativar um método depois de ativar?**
> Sim, basta ir a Configurações e desligar.

**O que acontece se ativar Stripe mas não tiver credenciais?**
> O método aparecerá aos clientes mas o pagamento não funcionará.

**Os clientes conseguem ver os dados bancários?**
> Apenas se configuredos e apenas para transferência bancária.

**Posso ter vários IBANs?**
> Por agora, apenas um IBAN por aldeia.
