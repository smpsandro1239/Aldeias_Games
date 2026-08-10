# Changelog

Todas as alterações relevantes do projeto estão documentadas neste ficheiro.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-PT/1.1.0/).
O projeto segue [SemVer](https://semver.org/lang/pt-PT/).

## [3.15.1] — 2026-08-10

### Correção crítica em produção (500s + Google OAuth)

- **Causa raiz**: o build da Vercel gerava o Prisma Client com `provider = "sqlite"` (schema do repo), que recusa ligar ao Postgres/Neon (`the URL must start with the protocol file:`) — todas as queries falhavam (500s nas APIs públicas, `unexpected_error` no login com Google, crons 401).
- **Fix**: `scripts/gen-postgres-schema.js` deriva `prisma/schema.postgres.prisma` (provider postgresql, gitignored) e o `buildCommand` da Vercel passou a gerar o client com `--schema=prisma/schema.postgres.prisma`.
- **BD de produção sincronizada**: `db push` na Neon criou 9 tabelas em falta (Vault, VendedorCashbox, RefreshToken, WebhookEvent, PendingAldeiaChange, GrelhaEuromilhoes...) e colunas recentes (maxOcorrencias, maxGanhadores, vaultPin...).
- **`TipoJogo.tombola` mantido** no enum (dados legacy na prod; o drop falhava e o código já não o usa).
- **Filtro JSON provider-agnóstico** no webhook MBWay (`JsonFilter.path` é `string[]` no postgres e `string` no sqlite).
- **Env vars Vercel**: `CRON_SECRET` criada (faltava — crons todos falhavam); `NEXT_PUBLIC_APP_URL`/`NEXT_PUBLIC_BASE_URL` corrigidos para `https://aldeiasgames.vercel.app` (apontavam para o domínio antigo `aldeias-games.vercel.app`); `GOOGLE_REDIRECT_URI` recriada com o valor de produção.

## [3.15.0] — 2026-08-08

### Segurança e Integridade (Tarefas 6–11)

- **Limites de raspadinha dentro da transação**: `maxGanhadores`/`maxPremioTotal` validados no novo hook `GameHandler.validateInTransaction(tx, data, jogo)`, chamado **após** o `updateMany` de stock (lock de linha do jogo serializa vendas concorrentes) e **antes** do loop de participações — eliminada a race condition entre participações simultâneas que ultrapassava os limites.
- **Claim atómico de levantamentos do cofre**: `PUT /api/cofre/levantamento/[id]` (confirmar e rejeitar) usa `updateMany({ where: { id, estado: 'pendente' } })` para claim + guard de saldo `saldo >= valor` no debit do vault. Erros de negócio lançados com sentinelas (`LEVANTAMENTO_JA_PROCESSADO`, `SALDO_INSUFICIENTE_COFRE`) e mapeados para 409/400. `executeWithRetry` só repete erros retryable.
- **JWT_SECRET lazy no proxy**: `getJwtSecret()` resolve `process.env.JWT_SECRET` em request time (antes havia throw em module scope que quebrava o build de páginas estáticas quando a variável faltava).
- **Cron de limpeza de rate-limits**: `/api/rate-limits/cleanup` diário às 02:30 UTC (autenticado com `CRON_SECRET` ± header `x-cron-secret`), remove entradas expiradas da tabela `RateLimit`.
- **Headers de segurança**: CSP agora inclui `object-src 'none'` (dev e prod) e o proxy emite `Cross-Origin-Opener-Policy: same-origin`.
- **Fix `addRecurrence` mensal**: ramo mensal usa `setDate(1)` → `setMonth(+1)` → walk até ao dia da semana alvo. Fim-de-mês (30/31) já não salta o mês nem faz overflow de dias (ex.: 2026-10-30 → 2026-11-06).

### Refactors e Higiene (P1)

- Página da aldeia (`/aldeia/[aldeiaId]`) reescrita de 1165 → 430 linhas com widgets extraídos: `aldeia-overview`, `aldeia-members`, `aldeia-events`, `aldeia-settings`, `aldeia-add-member-dialog`, `aldeia-header` (+ `aldeia-types` com tipos partilhados).

### Testes e CI

- Suite: **412 testes em 35 ficheiros** (novos: race de levantamento em `cofre-flow.test.ts`, suite `validateInTransaction` em `raspadinha.test.ts`, `proxy-lazy-secret.test.ts`, testes de `cleanupExpiredRateLimits`, testes de CSP/COOP em `middleware.test.ts`, testes mensais em `recurrence.test.ts`).
- Cobertura mínima por ficheiro (thresholds por glob: linhas/funções/ramos/statements a 70%) — `npm run coverage` verde.
- Backup real de base de dados em `@vercel/blob` (criar/descarregar/eliminar; v2.7 sem API `download`, usa `get(url, { access: 'private' })`).

## [3.14.0] — 2026-07

### RGPD — Anonimização e Purga Automática

- `src/lib/rgpd.ts`: `anonymizeParticipacoes()` (participações > 365 dias → `nomeCliente`/`telefoneCliente`/`emailCliente` = `null`, idempotente, com `AuditLog` `RGPD_ANONIMIZACAO`) e `purgeOldData()` (webhooks `completed` > 365 dias + notificações lidas > 180 dias; nunca toca webhooks `failed`/`processing`).
- Criterios em `vercel.json`: `seg 03:00 UTC` (`/api/rgpd/anonimizacao`) e `seg 04:00 UTC` (`/api/rgpd/purga`), autenticados com `CRON_SECRET` (header `x-cron-secret`).
- Política de retenção documentada em `docs/DPA.md`.

### SAF-T PT (Exportação Fiscal)

- `src/lib/saf-t.ts`: `buildSafeTXml()` (XML v1.04_01 com Header + MasterFiles + SalesInvoices) e `buildSafTFromDb()` (vendas `estadoPagamento: 'concluido'` no período, por aldeia).
- `GET /api/admin/saf-t?inicio=YYYY-MM-DD&fim=YYYY-MM-DD&aldeiaId=&nif=` — super_admin (qualquer aldeia) ou aldeia_admin (só a sua); headers `Content-Disposition` + `X-SafT-Count`/`X-SafT-Total`.
- Escape XML (`&amp;`, `&lt;`...); NIF default `999999999`.

## [3.13.0] — 2026-06

### Segurança (P0)

- Proxy: auth JWT + CSRF (origin) validados **antes** do rate-limit — rotas protegidas já não "fail-open".
- CSRF por cookie aplicado também em rotas públicas autenticadas (ex.: `POST /api/participacoes`).
- `GET /api/wallet/carregar` filtra PII por role e aldeia (param `aldeiaId` já não é confiado).
- Removido `include: { user: true }` em 10 endpoints (selects sem `password`/`vaultPin`).
- `POST /api/participacoes`: pagamento em dinheiro exige sessão com `EXECUTE_VENDA`; saldo exige sessão.
- `POST /api/apostas`: exige sessão; `vendedorId` vem do JWT (body ignorado); dinheiro exige `EXECUTE_VENDA`.

### Integridade Financeira (R5)

- `cofre/pedido-deposito` POST e confirmar: `$transaction` + guard `estado='pendente'` (anti duplo crédito).
- Confirmação de carregamento: transação + lock atómico; removido route legacy com bug `pedido.id`.
- `claim-premio`: guard `premioEntregue=false` nos 4 branches (anti double-claim).
- Debits de saldo com guard `saldo >= valor` em participações e apostas (nunca negativo).
- Webhooks Stripe/MBWay: todo o processamento em `$transaction` + guard de stock.

### Testes e CI

- 12 novos testes real-DB (`seguranca-pagamentos.test.ts`) — 338 no total.
- Scripts `typecheck`/`lint` gating no CI (sem `continue-on-error`).

### Higiene e UX

- Removidos 30+ ficheiros de backup e código morto.
- `SuperAdminDashboard` 474→322 linhas; `AdminDashboard` 357→303 (widgets em `src/components/dashboard/`).

## [3.12.0] — 2026-05

### Segurança (P1)

- Demo users protegidos por `ENABLE_DEMO_USERS=true` + `NODE_ENV !== 'production'`.
- Registo de utilizador já não emite JWT (requer verificação de email).
- Password validation unificada (12+ chars, maiúscula, minúscula, número, especial).
- Zod schemas em 3 endpoints financeiros (depósitos, levantamentos).
- RGPD: anonimização completa (participações, transactions, logs, tokens).
- Audit logging em sorteios (commit-reveal).
- Fix: Euromilhões string `contains` bug (usa `Array.includes`).

### Arquitetura (P2)

- OpenAPI 3.0 + Swagger UI em `/docs` (25+ endpoints).
- 3 bibliotecas de audit consolidadas em 1 (`audit.ts`).
- Error boundaries em 5 dashboards.
- Rate limiting: suporte a Upstash Redis com fallback in-memory (desde então substituído por Prisma — v3.15.0).
- 16 testes de middleware (auth, CSRF, RBAC, páginas públicas).
- Handlers modulares por tipo de jogo (raspadinha, rifa, poio, euromilhões) + 41 testes unitários.

### Melhorias (P3)

- `poweredByHeader: false` em `next.config.js`.
- Cashback percentual configurável (default 5%, max 50%).
- Cookie consent granular com toggle de analytics.
- Migração `middleware.ts` → `proxy.ts` (Next.js 16).
- Eliminação de 287 erros TypeScript (`: any` → tipos concretos).