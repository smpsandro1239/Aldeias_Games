# Análise Detalhada: Aldeias Games

## 📊 Status do Projeto

**Versão:** 3.11.0  
**Stack:** Next.js 16, React 19, TypeScript, Prisma, TailwindCSS  
**Última Atualização:** 23/03/2026

---

## ✅ 1. O que foi Realizado (Entregue)

### Gestão e Infraestrutura
- **Dashboards por Role**: Redirecionamento inteligente para Super Admin, Admin Aldeia, Vendedor e Jogador.
- **CRUD Completo**: Interface funcional para gerir Aldeias, Utilizadores, Eventos e Jogos via modais.
- **Segurança de Sorteio**: Implementação de algoritmo auditável (SHA-256) com seeds para garantir a imparcialidade.
- **Design System UI-UX Pro Max**: Estilo Retro-Futurism com gradientes violet/rosa e fontes Russo One + Chakra Petch

### Jogo de Rifas (Funcionalidades Avançadas)
- **Múltiplos Prémios**: Interface para adicionar vários prémios com opção de valor alternativo em dinheiro.
- **Métodos de Sorteio**: Suporte para sorteio interno (App) ou externo (ex: EuroMilhões), permitindo introduzir resultados manuais de lotarias oficiais.
- **Venda Manual Robusta**: Obrigatoriedade de registo de nome e contacto (telefone/email) para participações vendidas por vendedores.

### Motores de Jogo
- **Poio da Vaca**: Sistema de grelha (Letra + Número).
- **Rifas/Tombola**: Seleção de números em intervalo configurável.
- **Raspadinhas**: Lógica de probabilidade configurável com "revelação" via modal.

### Funcionalidades Recentemente Implementadas
- **Wallet com Cashback (5%)**: Sistema de carteira com cashback automático em compras
- **Histórico de Ganhos Global**:API `/api/wallet` com campo `historicoPremios`
- **Ajuste de Saldo Admin**: Endpoint `/api/wallet/adjust` para administradores creditarem saldo
- **Animação de Sorteio**: LotteryAnimation com efeitos visuais
- **Notificações Reais**: Serviços de email (nodemailer) e SMS (Twilio/AWS SNS)
- **Conversão Prémio -> Saldo**: Botão no Dashboard Admin para converter prémios em saldo
- **Melhorias UX**: Componente Skeleton para estados de carregamento
- **Resultados Externos**: Interface para introduzIR resultados de lotarias oficiais
- **Dashboard Analytics**: Gráficos com Recharts (evolução mensal, pizza de jogos, top vendedores)
- **Landing Pages Dinâmicas**: Rota `/aldeia/[slug]` para páginas públicas de aldeias
- **Exportação PDF/Excel**: Funções em `src/lib/export.ts`
- **Páginas Legais**: `/termos` e `/privacidade`

---

## ❌ 2. Bugs e Erros Conhecidos

### 🔴 Bugs Críticos

| # | Bug | Localização | Descrição |
|---|-----|-------------|-----------|
| 1 | **Stock Race Condition** | `src/app/api/participacoes/route.ts` | O loop de criação não usa transação atómica, podendo criar overselling |
| 2 | **Cashback aplicado a errado** | `src/app/api/participacoes/route.ts:262` | Cashback sempre aplicado ao user autenticado, mesmo em vendas para clientes anónimos |
| 3 | **Poio Da Vaca sem validação** | `src/features/cliente/cliente-dashboard.tsx:408` | `numerosOcupados` é sempre `[]`, não verifica números já ocupados |
| 4 | **Prompt nativo usado** | `src/features/admin/admin-dashboard.tsx:455` | Usa `prompt()` nativo - má prática UX e não funciona em mobile |

### 🟠 Bugs de Segurança

| # | Bug | Localização | Descrição |
|---|-----|-------------|-----------|
| 5 | **Validação fraca telefone** | `src/lib/validations.ts:175` | Regex permite qualquer número após +3519 |
| 6 | **Password min 6 chars** | `src/lib/validations.ts:9,15` | Mínimo muito fraco para passwords |
| 7 | **Sem verificação de email** | `src/app/api/auth/register/route.ts` | Campo existe mas nunca é verificado |

### 🟡 Bugs Funcionais

| # | Bug | Localização | Descrição |
|---|-----|-------------|-----------|
| 8 | **Stripe não implementado** | `src/app/api/pagamentos/stripe/route.ts` | Rota existe mas não faz chamadas reais |
| 9 | **MBWay não implementado** | `src/app/api/pagamentos/mbway/route.ts` | Rota existe mas não faz chamadas reais |
| 10 | **Analytics dados fake** | `src/features/admin/analytics-dashboard.tsx:111-123` | Gráficos usam valores percentuais fixos |
| 11 | **PoioVaca sem números ocupados** | `src/features/cliente/cliente-dashboard.tsx` | Não carrega nem valida números já ocupados |
| 12 | **Confirm nativo usado** | `src/features/admin/admin-dashboard.tsx` | Usa `confirm()` nativo em vez de modal |

---

## 🚨 3. Funcionalidades Incompletas

### Sistema de Pagamentos ❌
- Stripe Checkout - Não há redirect para Stripe
- Stripe Subscriptions - Modelo Plano existe mas sem integração
- MBWay Real - Rota existe mas sem implementação API
- Webhooks - Não há processamento de webhooks
- Reembolsos - Não existe funcionalidade

### Sistema de Notificações ❌
- Push Notifications - Modelo existe mas não há service worker
- Email Verification - Campo existe mas nunca é verificado
- Templates de Email - Só há função básica sendWinnerEmail

### Dashboard e Analytics ⚠️
- Gráficos com dados reais - Usa dados percentuais fake
- Drill-down - Não há clique em gráficos para detalhes
- Export PDF - jspdf importado mas não usado no frontend

### Gestão de Vendedores ❌
- Sistema de Comissões - Campo existe mas sem gestão
-绩效考核 - Não há bónus por performance
- Relatórios por Vendedor - Só mostra últimas vendas

---

## 🎨 4. Melhorias de UX/UI

### Experiência do Utilizador
- **Empty States** - Não há mensagens quando não há dados
- **Loading States** - Botões não mostram estado de loading
- **Form Validation** - Feedback visual inadequado para erros
- **Confirm Delete** - Usa confirm() nativo

### Interface Mobile
- **POS Mobile** - Poderia ser mais otimizado
- **Touch Interactions** - Suporte touch básico na raspadinha

### Acessibilidade
- **ARIA Labels** - Faltam labels em botões de ícone
- **Keyboard Navigation** - Não há keyboard navigation em selectors
- **Screen Reader** - Faltam descrições em elementos interativos

---

## 📋 5. Funcionalidades que Faltam

### Sistema SaaS/Multi-tenant
- [ ] Gestão de Planos - UI para criar/editar planos com limites
- [ ] Enforcement de Limites - Verificar limites de eventos/jogos/participações
- [ ] Billing Portal - Portal Stripe para clientes gerirem subscrições
- [ ] Upgrade/Downgrade - Fluxo para mudar de plano

### Sistema de Utilizadores
- [ ] Perfil de Utilizador - Página completa de perfil com settings
- [ ] Gestão de Conta - Alterar password, email, notificações
- [ ] 2FA - Autenticação de dois fatores
- [ ] Password Reset - Recuperação de password

### Sistema de Vendas
- [ ] POS Offline - Vendas offline com sincronização posterior
- [ ] QR Code Payment - Gerar QR para clientes scanners
- [ ] Receipts - Comprovativos de venda em PDF
- [ ] Venda por Links - Links para partilha em redes sociais

### Sistema de Relatórios
- [ ] Export Excel - Exportar dados para Excel (API existe, UI não)
- [ ] Relatórios PDF - Gerar relatórios em PDF
- [ ] Dashboards Custom - Criar dashboards personalizáveis

### Outras
- [ ] Multi-idioma - Suporte a português/inglés/espanhol
- [ ] Audit Logs UI - Visualizar logs de acesso
- [ ] Backup/Restore - Sistema de backup

---

## 🛠️ 6. Código Técnico que Pode Ser Melhorado

### Arquitetura
- **Lógica em Routes** - Extrair para service layer
- **Validações Duplicadas** - Centralizar validações
- **Types any** - Múltiplos ficheiros usam `any`, criar tipos específicos

### TypeScript
- **Many `any`** - admin-dashboard, cliente-dashboard, API routes
- **Interfaces duplicadas** - page.tsx, hooks
- **Missing types** - use-auth.ts, use-eventos.ts

### Performance
- **Queries N+1** - participacoes/route.ts:78-116
- **No caching** - API routes
- **Sem pagination** - algumas rotas

### Testes
- **Sem testes unitários** - Crítico
- **Sem testes de integração** - Crítico
- **Jest configurado mas vazio** - package.json

---

## 📈 7. Ficheiros com Mais Problemas

1. `src/app/api/participacoes/route.ts` - 3+ bugs críticos (stock, cashback)
2. `src/features/admin/analytics-dashboard.tsx` - Dados fake nos gráficos
3. `src/features/cliente/cliente-dashboard.tsx` - Validação inexistente
4. `src/components/modals/payment-modal.tsx` - Implementação incompleta
5. `prisma/schema.prisma` - Relações inconsistentes (premioId vs premios)

---

## 🎯 8. Prioridades de Trabalho

### Fase 1 - Correções Críticas (Semana 1)
1. 🔴 Corrigir race condition no stock
2. 🔴 Corrigir cashback aplicado a pessoa errada
3. 🔴 Substituir prompt()/confirm() nativos por modais

### Fase 2 - Funcionalidades de Pagamento (Semanas 2-3)
4. 🟠 Implementar Stripe checkout completo
5. 🟠 Implementar MBWay real
6. 🟠 Adicionar webhooks

### Fase 3 - UX/UI (Semanas 3-4)
7. 🟡 Adicionar empty states
8. 🟡 Adicionar loading states
9. 🟡 Corrigir validação de phone
10. 🟡 Melhorar analytics com dados reais

### Fase 4 - Funcionalidades Novas (Semanas 4-6)
11. 🟢 Sistema de comissões
12. 🟢 Perfil de utilizador completo
13. 🟢 POS offline
14. 🟢 Export Excel frontend

---

## 📝 9. Técnologia Usada

- **Frontend:** Next.js 16, React 19, TypeScript, TailwindCSS, Framer Motion, Recharts
- **Backend:** Next.js API Routes, Prisma (SQLite)
- **Auth:** JWT (jose), bcryptjs
- **Payments:** Stripe, MBWay (mock)
- **Email:** Nodemailer
- **SMS:** Twilio, AWS SNS
- **Testing:** Jest (configurado mas não implementado)

---

## ✅ Conclusão

O projeto tem uma base sólida e escalável. O foco agora deve ser:
1. **Corrigir bugs críticos** (stock, cashback)
2. **Completar pagamentos** (Stripe, MBWay)
3. **Melhorar UX** (loading states, empty states)
4. **Adicionar testes**

O sistema funciona, mas precisa de "encantar" o utilizador final para garantir o sucesso das festas e eventos.