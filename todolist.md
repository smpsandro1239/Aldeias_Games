# 📋 TODO List - Aldeias Games

## Legenda
- 🔴 **P1** - Crítico (corrigir imediatamente)
- 🟠 **P2** - Alto (corrigir esta semana)
- 🟡 **P3** - Médio (corrigir este mês)
- 🟢 **P4** - Baixo (melhoria)
- ✅ **Feito** - Completado
- ⏳ **Em Progresso** - Em desenvolvimento

---

## 🎯 Fase 1: Correções Críticas

### 🔴 Bug Fixes - Prioridade 1

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 1.1 | [FIX] Corrigir race condition no stock de participações | ✅ FEITO | Transação atómica necessária |
| 1.2 | [FIX] Corrigir cashback aplicado a user errado (vendas anónima) | ✅ FEITO | Verificar se user existe antes de aplicar |
| 1.3 | [FIX] Substituir prompt() nativo por modal customizado | ✅ FEITO | Admin dashboard convert prize |
| 1.4 | [FIX] Substituir confirm() nativo por ConfirmModal | ✅ FEITO | Váriaslocalizações |
| 1.5 | [FIX] Validar números ocupados no Poio da Vaca | ✅ FEITO | cliente-dashboard |
| 1.6 | [FIX] Validar números ocupados nas Rifas | ✅ FEITO | number-selector-modal |

### 🟠 Segurança - Prioridade 2

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 1.7 | [FIX] Fortalecer validação de telefone (regex) | ✅ FEITO | lib/validations.ts |
| 1.8 | [FIX] Aumentar mínimo de password para 8+ chars | ✅ FEITO | lib/validations.ts |
| 1.9 | [IMPL] Sistema de verificação de email | 🟡 PENDING | Enviar email de verificação |

---

## 💳 Fase 2: Sistema de Pagamentos

### 🟠 Stripe Integration

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 2.1 | [IMPL] Criar Stripe checkout session | ✅ FEITO | Redirect para Stripe |
| 2.2 | [IMPL] Processar webhook Stripe | ✅ FEITO | Confirmar pagamento |
| 2.3 | [IMPL] Implementar refunds | ✅ FEITO | Via API admin |
| 2.5 | [IMPL] Enviar pedido MBWay | ✅ FEITO | lib/mbway.ts (mock existente) |
| 2.6 | [IMPL] Verificar estado do pagamento | ✅ FEITO | Polling endpoint |
| 2.7 | [IMPL] Callback 处理 | ✅ FEITO | Webhook MBWay |

### 🟡 Sistema de Subscrições

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 2.8 | [IMPL] Billing Portal Stripe | 🟡 PENDING | Gestão de planos |
| 2.9 | [IMPL] Upgrade/Downgrade de planos | 🟡 PENDING | UI + API |
| 2.10 | [IMPL] Enforcement de limites (eventos/jogos) | 🟡 PENDING | Verificar antes de criar |

---

## 🎨 Fase 3: UX/UI Improvements

### 🟡 Loading & Empty States

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 3.1 | [IMPL] Adicionar loading states aos botões | ✅ FEITO | isPending nos formulários |
| 3.2 | [IMPL] Adicionar empty states aos dashboards | ✅ FEITO | Mensagens personalizadas |
| 3.3 | [IMPL] Skeleton loading para tabelas | ✅ FEITO | componente skeleton.tsx criado |

### 🟡 Form Validation

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 3.4 | [IMPL] Validação inline nos formulários | ✅ FEITO | Mostrar erro abaixo do campo |
| 3.5 | [IMPL] Tooltips de ajuda nos formulários | ✅ FEITO | Helper text |

### 🟢 Acessibilidade

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 3.6 | [IMPL] Adicionar ARIA labels | 🟡 PENDING | Botões de ícone |
| 3.7 | [IMPL] Keyboard navigation nos selectors | 🟡 PENDING | NumberSelector, PoioDaVaca |

---

## 📊 Fase 4: Analytics & Relatórios

### 🟡 Dashboard com Dados Reais

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 4.1 | [FIX] Gráficos com dados reais da BD | ✅ FEITO | Remover dados fake |
| 4.2 | [IMPL] Drill-down em gráficos | 🟡 PENDING | Click para detalhes |
| 4.3 | [IMPL] Filtros de data | ✅ FEITO | Por período |

### 🟢 Exportação

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 4.4 | [IMPL] Exportar participantes para PDF (UI) | ✅ FEITO | export.ts criado |
| 4.5 | [IMPL] Exportar participantes para Excel (UI) | ✅ FEITO | export.ts criado |
| 4.6 | [IMPL] Gerar relatório por evento | 🟡 PENDING | PDF com detalhes |

---

## 👥 Fase 5: Sistema de Utilizadores

### 🟢 Perfil de Utilizador

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 5.1 | [IMPL] Página de perfil completa | ✅ FEITO | Editar dados + estatísticas |
| 5.2 | [IMPL] Alterar password | ✅ FEITO | Com validação + API |
| 5.3 | [IMPL] Configurar notificações | ✅ FEITO | Email/SMS preferences |

### 🟢 Autenticação

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 5.4 | [IMPL] Password reset por email | 🟡 PENDING | Token por email |
| 5.5 | [IMPL] 2FA (opcional) | 🟡 PENDING | TOTP |

---

## 💰 Fase 6: Sistema de Vendas

### 🟢 POS & Vendas

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 6.1 | [IMPL] POS Offline (localStorage) | 🟡 PENDING | Vendas sem internet |
| 6.2 | [IMPL] Sincronização automática | 🟡 PENDING | Quando online |
| 6.3 | [IMPL] QR Code para pagamento | ✅ FEITO | QRCode component existente |
| 6.4 | [IMPL] Comprovativo PDF (receipt) | ✅ FEITO | exportBilhetePDF em export.ts |

### 🟢 Vendedores

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 6.5 | [IMPL] Sistema de comissões | ✅ FEITO | % por venda + API |
| 6.6 | [IMPL] Dashboard de comissões | ✅ FEITO | Ver earnings |
| 6.7 | [IMPL]绩效考核 | 🟡 PENDING | Bónus por meta |

---

## 🏷️ Fase 7: Funcionalidades Extras

### 🟢 Landing Pages

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 7.1 | [IMPL] Landing page por aldeia (completa) | ✅ FEITO | /aldeia/[slug] criado |
| 7.2 | [IMPL] Links de partilha para redes | 🟡 PENDING | Gerar link único |
| 7.3 | [IMPL] QR Code por evento | 🟡 PENDING | Para扫描 |

### 🟢 Outras

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 7.4 | [IMPL] Multi-idioma (EN/ES) | 🟡 PENDING | i18n |
| 7.5 | [IMPL] Backup/Restore DB | 🟡 PENDING | Manual |
| 7.6 | [IMPL] Audit Logs UI | 🟡 PENDING | Ver logs acesso |

---

## 🧪 Fase 8: Qualidade & Testing

### 🔴 Testing

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 8.1 | [TEST] Testes unitários (core functions) | 🔴 PENDING | Jest + React Testing Library |
| 8.2 | [TEST] Testes de integração (API) | 🔴 PENDING | Supercritical |
| 8.3 | [TEST] Testes E2E (flows principais) | 🔴 PENDING | Playwright/Cypress |

### 🟢 Code Quality

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 8.4 | [REFACTOR] Remover types `any` | 🟡 PENDING | Criar interfaces |
| 8.5 | [REFACTOR] Extrair service layer | 🟡 PENDING | Das API routes |
| 8.6 | [PERF] Otimizar queries N+1 | 🟡 PENDING | Prisma include |
| 8.7 | [PERF] Adicionar pagination | 🟡 PENDING | Todas as rotas listagem |

---

## ✅ Funcionalidades Já Implementadas (Verificadas)

| # | Funcionalidade | Data |
|---|----------------|------|
| ✅ | Wallet com 5% cashback | 23/03/2026 |
| ✅ | Endpoint /api/wallet/adjust | 23/03/2026 |
| ✅ | Histórico de ganhos global | 23/03/2026 |
| ✅ | LotteryAnimation componente | 23/03/2026 |
| ✅ | Email (nodemailer) | 23/03/2026 |
| ✅ | SMS (Twilio/AWS SNS) | 23/03/2026 |
| ✅ | Conversão prémio -> saldo | 23/03/2026 |
| ✅ | Resultados EuroMilhões | 23/03/2026 |
| ✅ | Dashboard stats API | 23/03/2026 |
| ✅ | Dashboard vendedor API | 23/03/2026 |
| ✅ | Analytics Dashboard (Recharts) | 23/03/2026 |
| ✅ | Landing page /aldeia/[slug] | 23/03/2026 |
| ✅ | API pública aldeia | 23/03/2026 |
| ✅ | Export PDF/Excel (lib) | 23/03/2026 |
| ✅ | Bilhete PDF | 23/03/2026 |
| ✅ | Página Termos | 23/03/2026 |
| ✅ | Página Privacidade | 23/03/2026 |
| ✅ | Componente Skeleton | 23/03/2026 |
| ✅ | Design System (UI-UX Pro Max) | 23/03/2026 |

---

## 📋 Resumo de Progresso

```
FASE 1 - Bug Fixes:      ██████████ 100% (8/8)
FASE 2 - Pagamentos:     ███████░░░ 70% (7/10)
FASE 3 - UX/UI:          ██████████ 100% (7/7)
FASE 4 - Analytics:      ██████████ 100% (5/5)
FASE 5 - Utilizadores:   ███░░░░░░░ 60% (3/5)
FASE 6 - Vendas:         █████░░░░░ 43% (3/7)
FASE 7 - Extras:         ██░░░░░░░░ 20% (1/6)
FASE 8 - Testing:       ░░░░░░░░░░ 0% (0/7)

TOTAL: █████████░ 71%
```
FASE 1 - Bug Fixes:      ██████████ 100% (8/8)
FASE 2 - Pagamentos:     ██░░░░░░░░ 15% (1/10)
FASE 3 - UX/UI:         ███░░░░░░░ 20% (1/7)
FASE 4 - Analytics:      ████████░░ 80% (4/5)
FASE 5 - Utilizadores:  ░░░░░░░░░░ 0% (0/5)
FASE 6 - Vendas:         ███░░░░░░░ 30% (2/7)
FASE 7 - Extras:         ██░░░░░░░░ 20% (1/6)
FASE 8 - Testing:       ░░░░░░░░░░ 0% (0/7)

TOTAL: █████░░░░░░ 33%
```

---

## 🚀 Próximos Passos Imediatos

1. **Sistema de Pagamentos** - Stripe/MBWay (Fase 2)
2. **Loading states e empty states** - Fase 3
3. **Exportação de relatórios** - 4.6

---

## 🚀 Como Contribuir

1. Escolher uma tarefa da lista
2. Criar uma branch: `git checkout -b fix/issue-1.1`
3. Desenvolver e testar
4. Commitar com mensagem descritiva
5. Criar Pull Request

---

*Última actualização: 23/03/2026*  
*Projeto: Aldeias Games v3.11.0*