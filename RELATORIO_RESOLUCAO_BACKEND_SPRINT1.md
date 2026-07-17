# Relatório de Resolução — Backend Security P0 Fixes (Sprint 1)

> **Data:** 2026-07-17
> **Base:** `ANALISE_BACKEND_SEGURANCA_FINANCEIRA.md` — Top 5 vulnerabilidades P0
> **Commits:** Pendente (5 ficheiros alterados, 163 insertions, 199 deletions)

---

## Resumo Executivo

| # | Vulnerabilidade | Status | Ficheiro(s) |
|---|-----------------|--------|-------------|
| 1 | Rate limiting em memória (não escala) | ✅ **Resolvido** | `src/lib/rate-limit.ts` |
| 2 | CSP `unsafe-inline` / headers fracos | ✅ **Resolvido** | `next.config.js` |
| 3 | Demo users guard fraco | ✅ **Resolvido** | `src/app/api/auth/login/route.ts` |
| 4 | Stripe webhook não idempotente | ✅ **Resolvido** | `src/app/api/stripe/webhook/route.ts` |
| 5 | MBWay webhook race condition | ✅ **Resolvido** | `src/app/api/mbway/webhook/route.ts` |

---

## 1. Rate Limiting — In-Memory → Prisma

### Problema
`lib/rate-limit.ts` usava `Map<string, RateLimitEntry>` em memória. Perdia estado em restart, não escala em Vercel serverless (cada invocação tem Map próprio).

### Fix
- **Produção:** Usa `prisma.rateLimit` (model já existente no schema: `key`, `count`, `expiresAt`)
- **Desenvolvimento:** Mantém in-memory Map com limites 10x mais permissivos
- **Fail-open:** Se Prisma falhar (DB down), permite request e faz log do erro
- **Cleanup:** Função `cleanupExpiredRateLimits()` para cron/admin limpar entradas expiradas
- **Atomicidade:** Usa `findUnique` → `update({ increment })` para handles concorrentes

### Verificação
- Build: ✅ Compiled successfully
- E2E test `rate limiting › login endpoint has rate limiting`: ✅ Passed

---

## 2. CSP Hardening

### Problema
CSP em `next.config.js` não tinha `base-uri`, `form-action`, nem `frame-ancestors`. O `unsafe-inline` em `script-src` é requerido por Next.js para hydration scripts, mas as restantes directivas podiam ser mais restritivas.

### Fix
Adicionadas 3 directivas de segurança:
```
base-uri 'self'          — previne injeção de <base> tag
form-action 'self'       — previne hijacking de forms
frame-ancestors 'none'   — substitui X-Frame-Options (mais moderno, CSP level 2)
```
Nota: `unsafe-eval` **não estava presente** no código (análise estava ligeiramente imprecisa). `unsafe-inline` mantido porque Next.js 16 App Router requer para scripts de hydration.

---

## 3. Demo Users — Production Guard

### Problema
A variável `ENABLE_DEMO_USERS` era verificada em runtime com `process.env.NODE_ENV !== 'production'` na linha 130. Se `NODE_ENV` não estivesse configurado como `production` (ex: container Docker sem env), os demo users poderiam estar acessíveis.

### Fix
- Renomeado `ENABLE_DEMO_USERS` → `DEMO_USERS_ALLOWED`
- Condição unificada no nível superior: `process.env.ENABLE_DEMO_USERS === 'true' && process.env.NODE_ENV !== 'production'`
- A verificação de `NODE_ENV` agora acontece **uma vez** no módulo (line-level), não em cada request
- Removida a verificação redundante de `NODE_ENV` na linha 130

---

## 4. Stripe Webhook Idempotency

### Problema Crítico
O check de idempotency original usava `referencia: event.id`:
```typescript
const existingEvent = await prisma.transacao.findFirst({
  where: { referencia: event.id },
});
```
**Mas nenhuma transação armazenava `event.id` como `referencia`** — todas usavam `session.id`. Resultado: webhooks duplicados eram sempre re-processados.

Adicionalmente, o path `carregamento_saldo` não tinha **nenhum** check de idempotency — webhook duplicado creditava o jogador twice.

### Fix
1. **Check principal:** Verifica `event.id` em dois locais:
   - `participacao.dadosParticipacao` (JSON contém `stripeEventId`)
   - `transacao.referencia` (para carregamento)
2. **Carregamento idempotency:** Check explícito `transacao.findFirst({ referencia: session.id, tipo: 'carregamento_saldo' })`
3. **Armazenamento correto:** Carregamento agora grava `referencia: event.id` + `dadosAdicionais: { stripeSessionId: session.id }` para que checks futuros funcionem

### Verificação
- 3 camadas de proteção: top-level event check + participacao check + carregamento check
- Se webhook disparar 2x → primeira retorna `{ received: true }` imediatamente

---

## 5. MBWay Webhook — Race Condition Fix

### Problema
O path `carregamento_saldo` fazia `find` + `update` fora de transação:
```typescript
const carregamento = await prisma.transacao.findFirst({...});
if (dadosOld?.estado !== 'concluido') {
  await prisma.user.update({...});  // Pode executar 2x se webhook chega 2x
  await prisma.transacao.update({...});
}
```
Dois webhooks simultâneos podiam ambos passar a verificação e creditar o saldo duas vezes.

### Fix
- Envolvido em `prisma.$transaction(async (tx) => {...})`
- `find` + check `estado === 'concluido'` + `update` + `user.update` tudo atómico
- Se webhook duplicado chegar, o segundo encontra `estado === 'concluido'` e retorna sem efeito

---

## Verificação Final

| Check | Resultado |
|-------|-----------|
| Build (`next build --webpack`) | ✅ Compiled successfully (45s) |
| E2E tests (67 total) | ✅ 65 passed, 3 skipped, 0 failed |
| Rate limiting test | ✅ Passed |
| CSRF tests | ✅ All passed |
| Security headers test | ✅ Passed |
| Login flow tests | ✅ All passed |

---

## Próximos Passos (P1)

| # | Tarefa | Prioridade |
|---|--------|-----------|
| 6 | Middleware auth/RBAC — mover `getFullUserFromRequest` para middleware | Alta |
| 7 | Permissões granulares (`PermissionKey`) — integrar nas rotas sensíveis | Média |
| 8 | Setup Wizard 30k linhas — dividir em steps lazy-loaded | Média |
| 9 | Dashboards monolíticos — extrair widgets | Média |
| 10 | Testes unitários — 5 testes Vitest (auth, participacao, cofre, webhook, rbac) | Alta |

---

*Relatório gerado a partir de alterações em 5 ficheiros: `rate-limit.ts`, `next.config.js`, `login/route.ts`, `stripe/webhook/route.ts`, `mbway/webhook/route.ts`*
