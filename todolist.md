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
| 2.8 | [IMPL] Billing Portal Stripe | ✅ FEITO | Gestão de planos + API |
| 2.9 | [IMPL] Upgrade/Downgrade de planos | ✅ FEITO | UI + API + Stripe |

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

---

## 📊 Fase 4: Analytics & Relatórios

### 🟡 Dashboard com Dados Reais

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 4.1 | [FIX] Gráficos com dados reais da BD | ✅ FEITO | Remover dados fake |
| 4.3 | [IMPL] Filtros de data | ✅ FEITO | Por período |

### 🟢 Exportação

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 4.4 | [IMPL] Exportar participantes para PDF (UI) | ✅ FEITO | export.ts criado |
| 4.5 | [IMPL] Exportar participantes para Excel (UI) | ✅ FEITO | export.ts criado |

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
| 5.4 | [IMPL] Password reset por email | ✅ FEITO | Token por email |
| 5.5 | [IMPL] 2FA (opcional) | ✅ FEITO | TOTP |

---

## 💰 Fase 6: Sistema de Vendas

### 🟢 POS & Vendas

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 6.1 | [IMPL] POS Offline (localStorage) | ✅ FEITO | Vendas sem internet |
| 6.2 | [IMPL] Sincronização automática | ✅ FEITO | Quando online |
| 6.3 | [IMPL] QR Code para pagamento | ✅ FEITO | QRCode component existente |
| 6.4 | [IMPL] Comprovativo PDF (receipt) | ✅ FEITO | exportBilhetePDF em export.ts |

### 🟢 Vendedores

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 6.5 | [IMPL] Sistema de comissões | ✅ FEITO | % por venda + API |
| 6.6 | [IMPL] Dashboard de comissões | ✅ FEITO | Ver earnings |
| 6.7 | [IMPL]绩效考核 | ✅ FEITO | Bónus por meta |

---

## 🏷️ Fase 7: Funcionalidades Extras

### 🟢 Landing Pages

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 7.1 | [IMPL] Landing page por aldeia (completa) | ✅ FEITO | /aldeia/[slug] criado |
| 7.2 | [IMPL] Links de partilha para redes | ✅ FEITO | Gerar link único |
| 7.3 | [IMPL] QR Code por evento | ✅ FEITO | Para scanning |

### 🟢 Outras

| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 7.4 | [IMPL] Multi-idioma (EN/ES) | ✅ FEITO | i18n com PT/EN/ES |
| 7.5 | [IMPL] Backup/Restore DB | ✅ FEITO | Manual |

---

## 🧪 Fase 8: Testes de Roles

### 🟠 Testes Funcionais
| # | Tarefa | Estado | Notas |
|---|--------|--------|-------|
| 8.1 | [TEST] Testar funcionalidades do Super Admin | ✅ FEITO | Dashboard, Aldeias, Users |
| 8.2 | [TEST] Testar funcionalidades do Aldeia Admin | ✅ FEITO | Eventos, Jogos, Vendedores |
| 8.3 | [TEST] Testar funcionalidades do Vendedor | ✅ FEITO | POS, Histórico, Comissões |
| 8.4 | [TEST] Testar funcionalidades do Jogador | ✅ FEITO | Jogar, Carteira, Histórico |
| 8.5 | [TEST] Validar restrições de acesso (RBAC) | ✅ FEITO | Cross-role access check |
| 8.6 | [TEST] Documentar bugs encontrados em TEST_PLAN.md | ✅ FEITO | Relatório de erros |

---

## 📋 Resumo de Progresso

```
FASE 1 - Bug Fixes:      ██████████ 100% (8/8)
FASE 2 - Pagamentos:     ██████████ 100% (10/10)
FASE 3 - UX/UI:          ██████████ 100% (7/7)
FASE 4 - Analytics:      ██████████ 100% (5/5)
FASE 5 - Utilizadores:   ██████████ 100% (5/5)
FASE 6 - Vendas:         ██████████ 100% (7/7)
FASE 7 - Extras:         ██████████ 100% (6/6)
FASE 8 - Role Testing:   ██████████ 100% (6/6)

TOTAL: ██████████ 100%
```

---

*Última actualização: 03/04/2026*  
*Projeto: Aldeias Games v3.14.0 - 92% completo*

---

## 🏗️ Fase 7: Refatorar monólitos restantes

| # | Ficheiro | Linhas | Estratégia | Estado |
|---|----------|--------|-----------|--------|
| 7.1 | create-evento-modal.tsx | 833 | Extrair passos (evento + jogos) para componentes; lógica de recorrência para hook | ⏳ |
| 7.2 | vendedor-dashboard.tsx | 733 | Extrair widgets: cabeçalho com estatísticas, quick actions, tabs content | ⏳ |
| 7.3 | RbacUserTable.tsx | 613 | Extrair colunas, filtros, modais de edição de roles/permissões | ⏳ |

## 🧪 Fase 8: Cobertura de testes (real-DB + E2E)

| # | Teste | Prioridade | Estado |
|---|-------|-----------|--------|
| 8.1 | Euromilhões: grelhas, bloqueio antes do sorteio, processRecorrentes cron | Alta | ⏳ |
| 8.2 | Cashbox/Vendedor: depósito, levantamento, histórico, reconciliação | Alta | ⏳ |
| 8.3 | Vault PIN: setup, verificação, rate-limit | Média | ⏳ |
| 8.4 | Pending Changes: aprovação/rejeição (IBAN, titular) | Média | ⏳ |
| 8.5 | Webhook replay: reprocessamento failed/processing | Baixa | ⏳ |
| 8.6 | Verificar público: página /verificar com hash | Baixa | ⏳ |

## 🏛️ Fase 9: RGPD e Compliance

| # | Tarefa | Estado |
|---|--------|--------|
| 9.1 | Anonimização automática (cron 365 dias) nomeCliente/telefoneCliente/emailCliente | ⏳ |
| 9.2 | Política de retenção + doc docs/DPA.md | ⏳ |
| 9.3 | Purga automática de dados anonimizados (cron) | ⏳ |

## 🏗️ Fase 10: Infraestrutura e P3

| # | Tarefa | Estado |
|---|--------|--------|
| 10.1 | Migrar logoBase64/imagemBase64 para Vercel Blob; remover campos do schema | ⏳ |
| 10.2 | Backup real para storage externo (Blob/S3) com restore | ⏳ |
| 10.3 | SAF-T PT (exportação fiscal) | ⏳ |
| 10.4 | OpenAPI formal com zod-to-openapi (109 endpoints) | ⏳ |
| 10.5 | Sentry server-side (instrument.ts + alerts) | ⏳ |

## 🔒 Pendente (depois das fases)

| # | Tarefa | Estado |
|---|--------|--------|
| P1 | Resolver vulnerabilidades npm audit (5 moderate, 7 high, 1 critical) | ⏳ |

*Última actualização: 07/08/2026*
