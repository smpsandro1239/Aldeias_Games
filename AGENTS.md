# Aldeias Games — Project Guide for AI Agents

## Deploy Workflow (Vercel)

### Pre-deploy Checklist
1. **Prisma versions pinned**: `package.json` must have exact versions `"prisma": "6.19.3"` and `"@prisma/client": "6.19.3"` (no caret).
2. **postinstall script**: `npx --yes prisma@6.19.3 generate` (NOT `node node_modules/.bin/prisma generate` — `.bin/prisma` does not exist on Vercel).
3. **vercel.json buildCommand**: `node scripts/gen-postgres-schema.js && npx prisma@6.19.3 generate --schema=prisma/schema.postgres.prisma && rm -rf .next && next build` (gera client **postgresql** — o schema do repo é sqlite, que não liga à Neon; `rm -rf .next` limpa cache stale).
4. **TypeScript/React types** in `dependencies` (not `devDependencies`) — Vercel cannot find them in devDependencies.
5. **Git author**: `git config user.name sandropereira` / `git config user.email 94222305+smpsandro1239@users.noreply.github.com` — must match GitHub account for Vercel author identification.
6. **No module-scope throws in lib files**: `src/lib/auth.ts` and `src/lib/csrf.ts` use lazy validation (`getSecret()` function) — NEVER `throw` at module scope for env vars, otherwise the build crashes during page data collection.
7. **No stale files in .next cache**: Vercel restores build cache from previous deployments. If files were deleted, they may reappear. The `rm -rf .next` in buildCommand prevents this.

### Common Build Errors & Fixes

| Error | Fix |
|-------|-----|
| `Prisma 7 installed by npx` | Pin versions in `package.json` and `vercel.json` to `6.19.3` |
| `params: { id: string }` → `params: Promise<{ id: string }>` | Next.js 16 requires async params in route handlers |
| `Field does not exist in type` (missing schema field) | Add field to `prisma/schema.prisma`, run `prisma db push` |
| `Cannot find name 'apiRequest'` | Add `import { apiRequest } from "@/lib/api-client"` |
| `location is not defined` (non-blocking) | Caused by 3rd-party lib accessing `location` at module scope during SSR. Build still succeeds. |
| `Turbopack not supported on win32` | Local Windows cannot run Turbopack — use `npx next build --webpack` locally or rely on Vercel (Linux) for Turbopack builds |
| `JWT_SECRET é obrigatório` during build | Fix: use lazy validation in `auth.ts`/`csrf.ts` (function `getSecret()`, not module-scope throw). If this error appears, it means a lib file throws at import time during static page generation. |
| Stale files in build (e.g. deleted pages reappear) | Vercel build cache restores old `.next` directory. Fix: `rm -rf .next` in buildCommand, or manually clear cache in Vercel dashboard (Settings → Build & Development → Redeploy → Clear build cache). |

### PowerShell Notes (Windows)
- `git commit -m "msg"` fails in PowerShell due to quote handling. Use `cmd /c` with temp file:
  ```cmd
  echo commit message> %TEMP%\commit_msg.txt
  git commit -F %TEMP%\commit_msg.txt
  ```
- Alternatively: `git add -A && git commit -F C:\Users\smpsa\AppData\Local\Temp\commit_msg.txt`
- Heredocs (`<<<`) and `<<` are NOT supported in PowerShell. Use `cmd /c` + temp files.

### Commit Flow
- **Obrigatório**: no final de cada tarefa fazer SEMPRE commit + push (instrução do utilizador).
- Mensagens de commit SEMPRE em **pt-PT**, formato `type: descrição` (ex.: `feat: ...`, `fix: ...`, `chore: ...`).
```bash
git add -A
git commit -m "type: description"
git push origin main
```
Wait for Vercel build (~2 min). If it fails, read the error, fix, commit again.

### Schema Changes
1. Edit `prisma/schema.prisma`
2. Run locally: `node node_modules/prisma/build/index.js db push` (or `npx prisma@6.19.3 db push`)
3. If adding a relation field, ensure both sides of the relation exist
4. If the seed file references new fields, update `prisma/seed-full.ts`
5. Test seed: `npx tsx prisma/seed-full.ts`

### Dual Schema — SQLite (dev) / Postgres (Vercel)
- `prisma/schema.prisma` tem `provider = "sqlite"` (dev local + testes Vitest com `prisma/dev.db`)
- A Vercel usa **Postgres/Neon**: o build deriva `prisma/schema.postgres.prisma` (gitignored) via `scripts/gen-postgres-schema.js` (só troca o provider) e faz `prisma generate --schema=...`
- **Alterar o schema** implica correr `db push` também na BD de produção (Neon):
  `DATABASE_URL="<neon>" npx prisma@6.19.3 db push --schema=prisma/schema.postgres.prisma --skip-generate`
- **Cuidado com tipos provider-dependentes**: `JsonFilter.path` é `string` no sqlite e `string[]` no postgres — o typecheck da Vercel falha se usares `path: "$.x"` (filtra em JS, como no webhook MBWay)
- `TipoJogo.tombola` é legacy (dados antigos na prod antes do rename para euromilhoes) — **não remover** do enum sem migrar/limpar dados
- Endpoints Neon: o pooler liga com `?sslmode=require` (sem `channel_binding=require` no Prisma CLI); o endpoint direto pode dar P1001 de outras redes

### Local Build (Windows)
Turbopack does not work on Windows. Use instead:
```
npx next build --webpack
```

### Webhook Idempotency (Stripe + MBWay)
- `WebhookEvent` model in Prisma schema with unique constraint on `(provider, eventId)`
- `src/lib/webhook-helpers.ts` exports `claimWebhookEvent()` and `completeWebhookEvent()`
- **Stripe webhook** (`/api/stripe/webhook`): Claims `event.id` atomically before processing, returns 200 + `"duplicate"` if already seen
- **MBWay webhook** (`/api/mbway/webhook`): Claims `transactionId` atomically before processing
- Both mark events as `completed` or `failed` after processing
- Flow: `claimWebhookEvent(provider, eventId)` → returns `true` if first time → process → `completeWebhookEvent(provider, eventId, "completed")`
- Unique constraint violation (`P2002`) = duplicate event → skip

### Regras de Segurança & Atomicidade (v3.13.0)
- **Proxy auth-first**: valida JWT + CSRF (origin) ANTES do rate-limit. Nunca reposicionar — rotas protegidas falham open sem auth
- **CSRF também em rotas públicas autenticadas** (`POST /api/participacoes` inclui verificador de cookie)
- **Nunca usar `include: { user: true }`** — usar `select` sem `password`/`vaultPin` (feito em 10 endpoints)
- **IDs sensíveis vêm do JWT/sessão, nunca do body**: `vendedorId` em participações/apostas, `userId` em wallet/carregamento. Body pode ser forjado
- **Dinheiro exige `EXECUTE_VENDA`** (role vendedor/admin) — user normal não pode vender em dinheiro
- **Debits de saldo**: guard `saldo >= valor` dentro de `$transaction` (nunca saldo negativo)
- **Claim de prémio**: guard `premioEntregue=false` nos 4 branches (pagar_cliente/cofre/jogar_novamente/carteira) — anti double-claim
- **Depósitos/levantamentos/confirmações**: `$transaction` + guard `estado='pendente'` — anti duplo crédito
- **Webhooks**: processar toda a lógica dentro da `$transaction` do claim + guard de stock
- Route legacy `PUT /api/cofre/pedido-deposito/[id]` (com bug `pedido.id`) foi substituída por `confirmar-deposito` — não reutilizar

### Super Admin Cofre (Visão Global)
- `GET /api/superadmin/cofre` — consolidated data across all villages (vault balances, pending deposits, recent movements)
- `/superadmindashboard/cofre` — Super Admin page with global overview, per-village cards, pending deposits tab, global movements feed
- A tab "Cofre" exists in both `aldeia_admin` and `super_admin` dashboards linking to `/admindashboard/cofre` and `/superadmindashboard/cofre` respectively.

### Cashbox / Vault System (Rastreabilidade)
Three pockets track physical money flow:
- **Vendedor.Cashbox** — cash in the seller's possession (incremented on cash sales and top-up confirmation)
- **Vault** — village general cashbox (credited when admin confirms seller deposit)
- **Player.Wallet** — digital balance

Flow completo de vendas de rua:
```
1. Vendedor vende rifa/raspadinha a cliente em dinheiro
   → POST /api/participacoes (metodoPagamento: 'dinheiro')
   → VendedorCashbox += valor (tipo: RECEBIDO_DO_JOGADOR)
   → Participacao criada com nomeCliente, telefoneCliente, emailCliente

2. Cliente ganha prémio → vendedor paga em dinheiro ao cliente
   → POST /api/participacoes/[id]/claim-premio (claimType: 'pagar_cliente')
   → VendedorCashbox -= valor (tipo: PAGO_AO_JOGADOR)

3. Vendedor deposita excedente no cofre da aldeia
   → POST /api/cofre/pedido-deposito (cria pedido pendente)
   → Admin confirma: PUT /api/cofre/pedido-deposito/[id]
   → VendedorCashbox -= valor, Vault += valor

4. Admin retira do cofre para despesas
   → POST /api/cofre/levantamento (cria pedido pendente)
   → Outro admin confirma: PUT /api/cofre/levantamento/[id]
   → Vault -= valor
   → Todos os vendedores da aldeia são notificados
```

Regras de aprovação de levantamento:
- Se existe mais de 1 admin na aldeia, o admin que criou NÃO pode aprovar sozinho (precisa de outro admin)
- Se só existe 1 admin, pode auto-aprovar (não há outro disponível)
- Ao confirmar, todos os vendedores da aldeia recebem notificação com valor, motivo e quem autorizou

CashboxTipo enum values:
- `RECEBIDO_DO_JOGADOR` — dinheiro recebido do jogador (venda ou carregamento)
- `DEPOSITADO_NO_COFRE` — depositado no cofre da aldeia
- `LEVANTAMENTO_COFRE` — levantamento do cofre
- `PAGO_AO_JOGADOR` — prémio pago ao cliente em dinheiro

API Endpoints:
- `PUT /api/carregamento/[id]` — confirmar carregamento → incrementa caixa do vendedor
- `POST /api/participacoes` — criar participação → incrementa caixa se pagamento em dinheiro
- `POST /api/participacoes/[id]/claim-premio` — reclamar prémio (claimType: carteira/cofre/jogar_novamente/pagar_cliente)
- `GET /api/vendedor/cashbox` — saldo e transações da caixa do vendedor
- `POST /api/cofre/pedido-deposito` — criar pedido de depósito
- `GET /api/cofre/pedido-deposito` — listar pedidos de depósito
- `PUT /api/cofre/pedido-deposito/[id]` — confirmar/rejeitar depósito
- `POST /api/cofre/levantamento` — criar pedido de levantamento
- `PUT /api/cofre/levantamento/[id]` — confirmar/rejeitar levantamento
- `GET /api/cofre/historico` — histórico de transações do vault

### Cofre Admin — Widgets Extraídos (Refactor)
- `admin-cofre.tsx` é agora uma orquestração fina (estado, fetch, handlers) — todo o JSX foi extraído para `src/components/dashboard/`
- Widgets (padrão presentacional, props-driven — como `quick-action.tsx`):
  - `cofre-header.tsx` — hero banner com botão voltar (usa `aldeiaId` do searchParams)
  - `cofre-stats-cards.tsx` — 3 cards (Saldo do Cofre, Pedidos Pendentes, Total Levantado)
  - `cofre-quick-actions.tsx` — 4 `QuickAction` (Depositar, Levantar, Reconciliação, Movimentos)
  - `cofre-pendentes-tab.tsx` — tab Pendentes (levantamentos + depósitos pendentes + empty state)
  - `cofre-confirmados-tab.tsx` — tab Depósitos confirmados
  - `cofre-levantamentos-tab.tsx` — tab Levantamentos (pendentes de aprovação + histórico)
  - `cofre-confirm-modals.tsx` — os 4 `ConfirmModal`; **gere os motivos de rejeição localmente** (parent só controla os ids `confirmDepId`/`rejectDepId`/`confirmLevId`/`rejectLevId`)
- Diferença de comportamento preservada: na tab "Pendentes" aprovar levantamento abre modal de confirmação (`setConfirmLevId`); na tab "Levantamentos" aprova diretamente (`handleConfirmarLevantamento`)
- Tipos partilhados continuam em `admin-cofre-types.ts` (importados pelos widgets)
- Diálogos `CofreDepositDialog`/`CofreWithdrawalDialog` e `CofreTransactionHistory` já viviam em `src/features/admin/`

### Super Admin Cofre + Reconciliação — Widgets Extraídos (Refactor)
- Mesmo padrão aplicado a `superadmin-cofre.tsx` (386→~200 linhas) e `reconciliacao-cofre.tsx` (428→~160 linhas)
- Widgets super admin (em `src/components/dashboard/`):
  - `super-cofre-header.tsx` — banner azul da visão global
  - `super-cofre-stats-cards.tsx` — 3 cards (Total nos Cofres, Pendentes, Média por Aldeia)
  - `super-cofre-toolbar.tsx` — pesquisa + Visão Financeira + CSV + refresh
  - `super-cofre-aldeias-tab.tsx` — tab Aldeias (cards por aldeia + últimos movimentos)
  - `super-cofre-pendentes-tab.tsx` — tab Pendentes (pedidos com botão Confirmar)
  - `super-cofre-movimentos-tab.tsx` — feed global de movimentos
- Widgets reconciliação (em `src/components/dashboard/`):
  - `reconciliacao-header.tsx` — banner âmbar com Exportar CSV + Atualizar
  - `reconciliacao-summary-cards.tsx` — 4 cards de resumo (Recebido, Depositado, Cashbox, Pendentes)
  - `reconciliacao-equation.tsx` — equação de verificação Recebido = Depositado + Saldo (badge OK/Discrepância)
  - `reconciliacao-filters.tsx` — badges de aldeias + pesquisa de vendedor
  - `reconciliacao-vendedores-table.tsx` — tabela expandível por vendedor (transações); gere `selectedVendedor` localmente
  - `reconciliacao-pendentes-card.tsx` — pendentes que afetam a reconciliação
- Tipos partilhados: `superadmin-cofre-types.ts` e `reconciliacao-cofre-types.ts` (em `src/features/admin/`)
- `reconciliacao-cofre.tsx`: removido dead code `getToken` (retornava `""` sempre)

### Role-Based Prize Claiming
Utilizadores normais (`user`) reclamam prémios para a carteira.
Vendedores e administradores (`vendedor`, `aldeia_admin`, `super_admin`) têm 3 opções:
- **Pagar ao Cliente** (`pagar_cliente`) — desconta da caixa, dinheiro vai diretamente ao cliente
- **Entregar ao Cofre** (`cofre`) — desconta da caixa, cria PedidoDepositoCofre pendente
- **Usar para Jogar Novamente** (`jogar_novamente`) — credita no saldo do vendedor para jogar

### Player Data Confirmation (Vendedores)
Componente: `src/components/modals/player-data-confirm-modal.tsx`
Quando um vendedor/admin abre um jogo, se os dados (nome, telefone, email) coincidem com os seus próprios:
- Aparece modal a perguntar se quer jogar com os seus dados ou inserir dados do cliente
- Se insere dados do cliente → `playerDataModified = true`, não volta a perguntar nessa sessão
- Ao jogar novamente (`handleComprarNova`), os dados são rebotados para os do utilizador e volta a perguntar

Pages:
- `/admindashboard/cofre` — admin gere pedidos de depósito + histórico do vault
- `/admindashboard/cofre/reconciliacao` — reconciliação caixa vs vault por vendedor
- Seller dashboard "Caixa" tab — vendedor vê caixa + cria pedidos de depósito

### Export CSV
- Utility: `src/lib/export-utils.ts` — `generateCSV()`, `downloadCSV()` (with BOM for Excel)
- Export buttons in: `admin-cofre.tsx` (histórico do cofre), `reconciliacao-cofre.tsx` (vendedores), `superadmin-cofre.tsx` (aldeias global)

### Audit & Segurança
- `AuditLog` model com índices para performance; mapeamento `@@map("audit_logs")`
- Audit logging automático nos endpoints de cofre (criar/confirmar/rejeitar depósito)
- `GET /api/admin/audit-logs` — unified audit feed (LogAcesso + AuditLog) com filtros
- `GET /api/admin/logs` — super_admin/aldeia_admin logs feed com auditoria + acessos
- `AuditoriaTab` melhorada com filtros (todos/acessos/auditoria), pesquisa, badges por tipo
- Três bibliotecas de audit existentes: `@/lib/audit` (jogos), `@/lib/auditLog` (CRUD), `@/lib/audit-log` (console-only super_admin)

### Notifications System
- `Notificacao` model already exists with `tipo` (TipoNotificacao enum), `titulo`, `mensagem`, `lida`, `userId`
- Types added: `deposito_criado`, `deposito_confirmado`, `deposito_rejeitado`
- API: `GET /api/notificacoes` (list + pagination + unread count), `POST` (create), `PATCH` (mark all read)
- `PUT /api/notificacoes/[id]` (mark single read), `DELETE /api/notificacoes/[id]`
- `NotificationBell` component at `src/components/notification-bell.tsx` — polls every 30s, shows badge, opens modal
- `NotificationsModal` at `src/components/modals/notifications-modal.tsx` — filterable list with mark-read/delete
- Notifications auto-created on: deposit request (→ admins), deposit confirm (→ seller), deposit reject (→ seller)
- NotificationBell integrated in AdminDashboard header (visible for both `aldeia_admin` and `super_admin`)

### Key Files
- `package.json` — scripts, dependencies, prisma version
- `vercel.json` — build command (includes `rm -rf .next` for cache cleanup)
- `prisma/schema.prisma` — database schema
- `prisma/seed-full.ts` — comprehensive seed
- `next.config.js` — Next.js config; Sentry está integrado no client (`sentry-init.tsx`) e no server (`src/instrument.ts`, guardado por DSN — sem DSN o build não falha)
- `src/lib/auth.ts` — JWT auth with lazy `getSecret()` validation
- `src/lib/csrf.ts` — CSRF with lazy `getSecret()` validation

### Raspadinha — maxGanhadores (Limite de Prémios)
- `configuracao.maxGanhadores` (number, opcional) — limita o número total de ganhadores do jogo
- **Não bloqueia a venda**: quando o limite é atingido, o jogo **continua aberto** e gera receita normalmente
- Participações subsequentes são criadas mas **todas perdem** — `determineRaspadinhaOutcome(config, forceLoss=true)` força `hasWin: false`
- A grid continua a mostrar prémios como filler (para efeito visual), mas nenhum prémio com valor forma 3-símbolos-iguais
- Flag `_limiteAtingido` é passada de `validate()` para `prepareData()` via objecto `data` (campo `[key: string]: unknown`)
- `validate()` define `(data as Record<string, unknown>)._limiteAtingido = true` quando `ganhadoresCount >= maxGanhadores` — não rejeita a participação
- `prepareData()` lê a flag e chama `determineRaspadinhaOutcome(config, forceLoss)` 
- `postCreate()` **não fecha o jogo** — apenas notifica admins e vendedor quando o limite é atingido
- Notificação inclui: nome do último ganhador, nome do vendedor, valor do prémio, e mensagem que o jogo continua aberto
- Configuração no modal admin: toggle "Limitar número total de ganhadores" + input numérico (guardado em `configuracao.maxGanhadores`)
- Testes: `src/__tests__/unit/raspadinha.test.ts` (25 testes incluindo validação do forceLoss, grid, probabilidades)

### Raspadinha — maxPremioTotal (Pool de Prémios)
- `configuracao.maxPremioTotal` (number, opcional) — limita o valor total de prémios distribuídos no jogo
- **Não bloqueia a venda**: quando o pool é esgotado, o jogo continua aberto e gera receita
- Participações subsequentes são criadas mas **todas perdem** — `determineRaspadinhaOutcome(config, forceLoss=true)` força `hasWin: false`
- Cálculo do pool: soma dos `premioValor` de todas as participações ganhadoras existentes no jogo
- `validate()` calcula `totalPremiosDistribuidos` e compara com `maxPremioTotal` — define `_poolEsgotado = true` se excedido
- `prepareData()` lê a flag e chama `determineRaspadinhaOutcome(config, forceLoss)`
- Configuração no modal admin: toggle "Limitar valor total de prémios (pool)" + input numérico em euros (guardado em `configuracao.maxPremioTotal`)
- Pode ser combinado com `maxGanhadores` (ambos os limites funcionam independentemente)

### Raspadinha — Pool de Prémios (Sorteio sem Reposição)
- **Objetivo**: garantir que saem EXATAMENTE os prémios configurados na criação (`round(stock × percentagem/100)` de cada prémio), em posições aleatórias — nem mais, nem menos (o modelo estatístico antigo podia dar mais/menos em stocks pequenos)
- **Geração** (`POST /api/jogos`): `buildRaspadinhaPool(premios, stock)` cria o array de nomes (cópias de cada prémio + "Sem prémio" até perfazer o stock), baralhado com Fisher-Yates criptográfico (`crypto.randomInt`), guardado em `configuracao.pool` (só para tipo `raspadinha`; trim se arredondamento exceder o stock)
- **Consumo** (`validateInTransaction` do handler raspadinha): dentro da `$transaction` (linha do jogo já locked pelo `updateMany` de stock → serializado), lê a config **fresca** via `tx.jogo.findUnique`, sorteia `quantidade` itens com `drawFromPool` (`crypto.randomInt(0, pool.length)` + `splice`), guarda os resultados em `data._poolResults` e grava o pool restante em `configuracao` antes de criar a participação
- **`prepareData`**: usa `_poolResults[existing.length]` por bilhete (suporta `quantidade > 1`)
- **Fallback**: jogos antigos sem `pool` → comportamento estatístico antigo (`determineRaspadinhaOutcome` com probabilidade independente) — mantido para compatibilidade
- **Limites**: com `maxGanhadores`/`maxPremioTotal` atingidos, perde-se SEM consumir o pool (os prémios não sorteados ficam no pool; nunca se ultrapassa a config)
- **Nota**: o pool NÃO é regenerado no edit (PUT) do jogo — regerar perderia o estado consumido (risco de prémios duplicados)
- Testes: `unit/raspadinha-critical.test.ts` (contagens do pool, draw, exatidão pós-stock) + `integration/real-db/raspadinha-pool.test.ts` (100 bilhetes → exatamente 8×"2 Euro" + 2×"5 Euro", pool a 0, perdas após esgotamento, distribuição não sequencial)

### Pool Secreto — API Pública Nunca Expõe o Pool (M5)
- **Regra de segurança**: `configuracao.pool` (e `probabilidadeVitoria`/`odds`) são removidos de QUALQUER resposta pública — revelaria exatamente que prémios ainda faltam sair
- **Onde é removido** (destructuring `{ pool, probabilidadeVitoria, odds, ...safe }`):
  - `GET /api/jogos/[id]` (`src/app/api/jogos/[id]/route.ts`) — jogo individual (páginas de jogo)
  - `GET /api/jogos` (lista, `src/app/api/jogos/route.ts`) — listagens públicas
  - `GET /api/jogos/[id]/detail` (`detail/route.ts`) — config safe, MAS mantém `poolRestante` (soma por prémio, computada a partir do pool ANTES de o remover — nunca o array em si)
- **Badge "Prémios restantes: X/Y"** (`/jogos/raspadinha-premium`): visível só para `super_admin`/`aldeia_admin`/`vendedor`; lê `GET /api/jogos/[id]/detail` → `poolRestante` (soma `qtd`) + `stockInicial` como total; estado `poolInfo` + `useEffect` próprios na page (não no hook)
- **CUIDADO**: no `detail/route.ts` o `poolRestante` é calculado a partir de `poolRaw` capturado ANTES do destructuring — nunca de `config.pool` (já removido), senão devolve `[]` sempre
- **Estatísticas** (`GET /api/jogos/[id]/estatisticas`): `topNumeros` (frequência, top 10), `topCoordenadas` (poio, normaliza `{x,y}` legacy → letra), `poolRestante` (raspadinha), `vendasPorDia` (data → {quantidade, total}); acesso: super_admin + aldeia_admin/vendedor **da aldeia do jogo** (403 cross-aldeia)
- **CSV export** (`GET /api/jogos/[id]/exportar?inicio=&fim=`): participações do jogo com BOM (`\uFEFF` + `generateCSV`) para Excel, filtro de datas (valida `YYYY-MM-DD`), header `X-SafT-Count`; mesmo scope de permissões
- **NOTA para testes**: `res.text()` descodifica e REMOVE o BOM UTF-8 — verificar BOM via `arrayBuffer()` (bytes `ef bb bf`)
- Testes: `integration/real-db/jogos-estatisticas.test.ts` (7: top números, pool restante, 403 cross-aldeia, CSV+BOM+filtro datas, safeConfig GET individual+lista, detail com poolRestante sem pool)

### Verificação Pública de Raspadinhas
- `/verificar-raspadinha` — página pública para qualquer pessoa verificar o resultado de uma raspadinha
- Não requer autenticação — basta introduzir o hash da participação
- `GET /api/verificar-publico?hash=...` — endpoint público (sem auth) que valida e retorna resultado
- Retorna: estado (ganhou/perdeu), prémio (se ganhou), data, tipo de jogo
- Botão "Verificar" no BottomNav para utilizadores não autenticados
- **Hash autêntico**: sha256(`${seedRaspe}:${resultadoRaspe}:${uniqueSalt}:${generatedAt}`) — `generatedAt` deve ser EXATAMENTE o mesmo `timestamp` usado no hash (bug corrigido: antes eram dois `new Date().toISOString()` independentes, o que fazia verificação falhar por milissegundos)

### RGPD — Anonimização e Purga Automática (v3.14.0)
- `src/lib/rgpd.ts` — `anonymizeParticipacoes()` e `purgeOldData()` (funções puras testáveis)
- **Anonimização**: participações com `createdAt > 365 dias` → `nomeCliente`/`telefoneCliente`/`emailCliente` ficam `null` (idempotente) + `AuditLog` `RGPD_ANONIMIZACAO`
- **Purga**: `WebhookEvent` completed > 365 dias + `Notificacao` lidas > 180 dias (nunca toca webhooks `failed`/`processing`) + `AuditLog` `RGPD_PURGA`
- Cron jobs em `vercel.json`: `/api/rgpd/anonimizacao` (seg 03:00 UTC) e `/api/rgpd/purga` (seg 04:00 UTC), autenticados com `CRON_SECRET` (header `x-cron-secret`)
- Política de retenção: `docs/DPA.md` (períodos por categoria; 365d clientes, 10 anos fiscal, 180d notificações)

### SAF-T PT (Exportação Fiscal)
- `src/lib/saf-t.ts` — `buildSafeTXml()` (função pura, XML v1.04_01 com Header + MasterFiles + SalesInvoices) e `buildSafTFromDb()` (consulta vendas `estadoPagamento: 'concluido'` no período, por aldeia; `cliente` = `nomeCliente` ou `user.nome`)
- `GET /api/admin/saf-t?inicio=YYYY-MM-DD&fim=YYYY-MM-DD&aldeiaId=&nif=` — super_admin (qualquer aldeia) ou aldeia_admin (só a sua); devolve XML com headers `Content-Disposition` + `X-SafT-Count`/`X-SafT-Total`
- Escape XML (`&amp;`, `&lt;`...); NIF default `999999999` se não fornecido (aldeias sem NIF no schema)

### Vault PIN System (Segurança do Cofre)
- Campos no model `User`: `vaultPin` (String, hashed), `vaultPinEnabled` (Boolean)
- PIN serve para aceder ao saldo do cofre — vendedores e admins configuram o PIN próprio
- Fluxo:
  1. Setup: POST `/api/users/vault-pin` com `action: 'setup'`, `pin`, `password` (verificação de password)
  2. Verificação: POST com `action: 'verify'`, `pin` — retorna saldo da aldeia (ou todas as aldeias para super_admin)
  3. PIN deve ter 4-6 dígitos, armazenado com bcrypt (via `hashPassword`)
- Modal: `src/components/modals/vault-pin-modal.tsx` — suporta setup (configurar PIN), view (ver saldo), e verify (verificar PIN)
- Super admin vê todas as aldeias com saldo individual e total consolidado
- `aldeia_admin` e `vendedor` veem apenas a sua aldeia
- PIN obrigatório para aceder ao saldo do cofre no dashboard do vendedor e na aba Cofre do admin

### Reposição de PIN pelo Admin (Admin Reset)
- Endpoint: `POST /api/users/vault-pin` com `action: 'admin-reset'` + `targetUserId`
- `super_admin` pode repor PIN de qualquer utilizador
- `aldeia_admin` só pode repor PIN de utilizadores da sua aldeia
- Ao repor: `vaultPin = null`, `vaultPinEnabled = false`
- Notificação enviada ao utilizador a informar que o PIN foi reposto
- UI: botão KeyRound (icon de chave) amarelo no `UsersTab` ao lado de Editar/Eliminar — visível apenas quando `vaultPinEnabled === true`

### Auto-Seed (Inicialização Automática)
- `src/lib/db-init.ts` — `ensureSeeded()` verifica se a DB tem dados e executa seed se vazia
- `src/app/api/seed/route.ts` — endpoint GET (status) + POST (trigger seed)
- `src/components/seed-initializer.tsx` — componente client que dispara POST /api/seed no mount
- Integrado no `src/app/layout.tsx` — `ensureSeeded()` roda server-side em cada page load
-解决了 cenário de cold start no Vercel onde a DB pode estar vazia

### Navigation Role-Based
- `src/components/layout-header.tsx` — desktop header e hamburger menu adaptados por role:
  - `super_admin`: Dashboard, Aldeias, Jogos, Cofre, RBAC
  - `aldeia_admin`: Dashboard, Eventos, Jogos, Cofre
  - `vendedor`: Dashboard, Jogos, Caixa
  - `user`: Início, Jogos, Participações
  - Não autenticado: Início, Jogos
- `src/components/bottom-nav.tsx` — BottomNav mobile adaptado por role:
  - Todos os roles autenticados: Início, Jogos, Participações
  - `super_admin`: + Aldeias, Dashboard
  - `aldeia_admin`: + Eventos, Dashboard
  - `vendedor`: + Caixa
  - Não autenticado: Início, Jogos, Verificar

### Dark/Light Mode Toggle (Correção)
- Toggle de tema (sol/lua) em `src/components/layout-header.tsx` — desktop e mobile
- Usa `next-themes` com `attribute="class"` (adicional classe `.dark` ou `.light` no `<html>`)
- **Problema corrigido**: `tailwind.config.js` tinha cores hardcoded do tema escuro — `bg-background` sempre resolvia para o valor estático escuro, ignorando a troca de variáveis CSS
- **Correção**: `tailwind.config.js` agora usa referências CSS (`hsl(var(--background))`) em vez de valores estáticos
- **Correção**: Adicionado `@variant dark (&:where(.dark, .dark *));` em `globals.css` para suportar variant `dark:` com toggling por classe (Tailwind v4)
- CSS variables em `globals.css`: `:root` = tema escuro (default), `.light` = tema claro
- `suppressHydrationWarning` no `<html>` para evitar hydration mismatch do next-themes

### Notificações — Tipos de Levantamento
- `TipoNotificacao` enum inclui tipos dedicados para levantamentos:
  - `levantamento_criado` — quando um admin cria pedido de levantamento (notifica outros admins)
  - `levantamento_confirmado` — quando levantamento é aprovado (notifica criador + todos os vendedores da aldeia)
  - `levantamento_rejeitado` — quando levantamento é rejeitado (notifica criador)
- Antes usava `tipo: 'sistema'` para tudo — agora cada estado tem o seu tipo para filtragem e UI

### Jogos Page — Agrupamento por Aldeia → Evento → Jogos
- `/jogos/page.tsx` — reescrita com agrupamento hierárquico accordion
- Fluxo: `GET /api/jogos?ativos=true` → agrupa por `evento.aldeia.id` → dentro de cada aldeia, agrupa por `evento.id`
- UI: Aldeia (chevron expand/collapse) → Evento (chevron expand/collapse) → Lista de Jogos (cards clicáveis)
- Aldeias são expandidas por padrão no primeiro load; eventos começam colapsados
- Cada jogo card mostra: ícone por tipo, nome, tipo, preço, stock disponível
- Click num jogo navega para a rota correta: `/jogos/{tipo}?id={jogo.id}`
- `GAME_ROUTES` mapping: `raspadinha` → `/jogos/raspadinha-premium`, `rifa` → `/jogos/rifa`, `euromilhoes` → `/jogos/euromilhoes`, `poio_da_vaca` → `/jogos/poio-da-vaca`
- Game analytics tracking via `useGameAnalytics` hook em cada click
- Componentes usados: `LayoutHeader` (wrapper), ícones lucide-react (MapPin, Calendar, ChevronDown/Right)

### API /api/jogos/[id] — Configuração Segura
- **ANTES**: Endpoint retornava jogo SEM `configuracao` (stripped para segurança)
- **AGORA**: Retorna `configuracao` parsed com campos seguros — `odds` e `probabilidadeVitoria` são removidos
- Campos mantidos: `dataSorteio`, `horaSorteio`, `localSorteio`, `numeroInicial`, `numeroFinal`, `numeroBlocos`, `permitirStripe`, `valorPremios`, `premios`, etc.
- Inclui `evento.aldeia` (id, nome, slug) para o frontend mostrar o nome da aldeia
- Inclui `premios` com `valorDinheiroAlternative` para rifa mostrar prémios configurados
- **IMPORTANTE**: Este endpoint é usado pelas páginas de jogo (rifa, raspadinha, etc.) para mostrar dados do jogo ao utilizador

### Rifa — 1 Participação = 1 Número (Odds Corretas + Unicidade)
- **Regra**: cada número comprado é uma **participação separada** — `dadosParticipacao = { numero: N }` (nunca arrays)
- `rifaHandler.prepareData` usa `existing.length` como índice — o route chama `prepareData` uma vez por participação → cada uma recebe o SEU número, hash e `dadosVerificacao { seed, timestamp, numero, uniqueSalt, hash }`
- Hash cobre o número exato: `sha256(seed:JSON.stringify([numero]):salt:timestamp)`
- **Unicidade**: `validateInTransaction` (depois do lock de stock, dentro da `$transaction`) consulta `NumeroVendido`; o constraint **`@@unique([jogoId, numero])`** é o backstop — P2002 reverte a transação inteira (stock/saldo/cashbox)
- Route `/api/participacoes` mapeia `P2002` → 400 "O número já foi vendido (venda concorrente)"
- **Pendentes (MBWay)**: `GET /api/jogos/[id]/numeros-ocupados` inclui `estadoPagamento: 'pendente'` — número pendente fica ocupado até confirmação/timeout
- Consumidores do formato `{numero}` (resolver SEMPRE os 2 formatos — legacy `{numeros: [...]}` e novo `{numero}`):
  - `src/app/api/participacoes/verificar/route.ts` (branch `typeof numero === 'number'`)
  - `src/app/api/verificar-publico/route.ts` e `src/app/api/participacoes/[id]/prova/route.ts` (branch `dadosPart.numero`)
  - `src/app/participacoes/ParticipacoesClient.tsx` (`dados?.numero !== undefined ? [dados.numero] : dados?.numeros`)
- Webhook Stripe já criava 1 participação/número (`numeros: [numerosArray[i]]`) — agora protegido pela constraint
- Sorteio (`/api/sorteios`) já lê `dadosPart.numero ?? dadosPart.numeros?.[0]` — com participações unitárias as odds são corretas
- Testes: `integration/real-db/rifa-correcao.test.ts` (6: divisão por número, P2002, concorrência, sorteio, prova, pendente ocupado)

### Rifa — Fluxo de Confirmação (Corrigido)
- **Bug corrigido**: Após criar participação, `jogo` não era re-fetched → stats (vendidos, angariado, participações) mostravam 0
- **Correção**: `fetchJogo()` é chamado ANTES de `setParticipacaoConfirmada(true)` para garantir dados atualizados
- **Bug corrigido**: API POST `/api/participacoes` retorna `{ participacao: {...} }` mas o frontend lia `data.data`
- **Correção**: Mapeamento corrigido para `data.participacao || data.data` (fallback para compatibilidade)
- **Bug corrigido**: "Grande Prémio" lia `jogo.premio.nome` (singular) mas API retorna `premios` (array)
- **Correção**: Usa `jogo.premios[0].nome` como fallback para `jogo.premio.nome`
- **Bug corrigido**: "Ver Prova de Jogo" não funcionava porque `participacaoCriada` era `undefined` (mapping bug)
- **Correção**: Com mapeamento correto, `participacaoCriada.id` agora é válido e modal `ProvaJogoModal` abre corretamente

### Event Creation — Configuração de Jogos Inline
- `src/components/modals/create-evento-modal.tsx` — formulário de config por jogo selecionado
- Quando um tipo de jogo é selecionado, aparecem campos: Nome, Preço (€), Stock Inicial, Nº Final (só rifa)
- `jogosConfigs` state armazena config por tipo: `{ rifa: { nome, preco, stockInicial, numeroFinal } }`
- Configs são passadas via `submitData.jogosConfigs` para `handleSaveEvento`
- `src/features/admin/hooks/use-admin-crud-handlers.tsx` — `handleSaveEvento` lê `jogosConfigs` e usa nos defaults:
  - Rifa: `numeroFinal` do config, `preco` e `stockInicial` do config
  - Raspadinha: defaults (`premios: []`, `probabilidadeVitoria: 0.3`)
  - Euromilhões: defaults (`numeros: 5`, `estrelas: 2`)
  - Poio da Vaca: sem config extra
- Nome do jogo: `cfg.nome || "${eventoNome} - ${tipo}"` (tipo com underscores substituídos por espaços)
- Modal faz reset de `jogosConfigs` ao fechar e ao submeter com sucesso

### Auth Migration — httpOnly Cookies (Limpeza de Token)
- **PROBLEMA**: Muitos componentes ainda usavam `Authorization: Bearer ${token}` onde `token` era sempre `undefined` (httpOnly cookies)
- **CAUSA**: Migração para httpOnly cookies não removeu todas as referências ao token JWT no client
- **CORREÇÃO**: Removido `token` de todas as props e interfaces — 13 ficheiros alterados:
  - `use-admin-dashboard-data.ts` — removido `token` prop e `[token]` dependency de `getApi`
  - `notification-bell.tsx` — removido `token` prop, usa `apiRequest()` sem Authorization header
  - `dashboard-header.tsx` — removido `token` prop
  - `dashboard-tab-content.tsx` — removido `token` prop
  - `dashboard-modals-layer.tsx` — removido `token` prop
  - `AdminDashboard.tsx` — removido `token` de todas as chamadas
  - `SuperAdminDashboard.tsx` — removido `token` de todas as chamadas
  - `VencedoresTab.tsx` — removido `token` prop
  - `vencedor-detail-modal.tsx` — hooks `useUserData`, `useAldeiaData`, `useHistoricoParticipacoes` usam `apiRequest()` sem token
  - `resultados-externos-modal.tsx` — removido `token` prop
  - `verificar-hash-modal.tsx` — usa `apiRequest()` sem token
  - `create-jogo-modal.tsx` — removido `token` prop (não era usado)
- **`getApi` fix**: Removido `next: { revalidate }` (opção server-side que causa `TypeError: Failed to fetch` no client) e `[token]` dependency
- **REGRA**: Nunca usar `Authorization: Bearer ${token}` em componentes client — `apiRequest()` envia cookies automaticamente (same-origin)
- **MIGRAÇÃO COMPLETA**: Todos os 23 ficheiros client migrados — zero referências `Bearer` restantes em `.tsx`
- Ficheiros migrados: use-admin-dashboard-data, notification-bell, dashboard-header, dashboard-tab-content, dashboard-modals-layer, AdminDashboard, SuperAdminDashboard, VencedoresTab, vencedor-detail-modal, resultados-externos-modal, verificar-hash-modal, create-jogo-modal, superadmin-cofre, admin-cofre, vault-pin-modal, wallet-card, profile-modal, premio-modal, analytics-dashboard, configuracoes, setup-wizard, euromilhoes admin, cliente-dashboard

### Números Jogados — Consulta Unificada
- `/numeros-jogados` — página unificada para todos os roles consultar números jogados
- `GET /api/numeros-jogados` — API com filtering role-based:
  - `super_admin`: vê todos os números de todas as aldeias
  - `aldeia_admin`: vê números dos jogos da sua aldeia
  - `vendedor`: vê números que ele vendeu + os seus próprios
  - `user`: vê os seus próprios números
- Filtros: jogoTipo, aldeiaId (super_admin only), estadoPagamento, ganhador, search (hash/nome/email/telefone)
- Paginação: page, limit (default 20)
- Dados retornados: participação completa com jogo.evento.aldeia, vendedor info, user info, numerosVendidos
- Frontend: `src/app/numeros-jogados/NumerosJogadosClient.tsx` — filtros, cards com números, hash toggle, paginação
- Page: `src/app/numeros-jogados/page.tsx` — LayoutHeader + BottomNav wrapper (sem RoleGuard — acessível a todos os autenticados)
- Nav links adicionados em: layout-header.tsx NAV_ITEMS (todos os roles), BottomNav (user only), AdminDashboard QuickActions, SuperAdminDashboard QuickActions

### Navigation Unification (Desktop + Mobile)
- Desktop nav (lines 131-163 in layout-header.tsx) was hardcoded per role — NOW uses shared `NAV_ITEMS` constant
- Both desktop nav and mobile hamburger menu use `roleNavItems` computed from `NAV_ITEMS`
- Adding a new nav item only requires editing `NAV_ITEMS` — it propagates to both menus

### Resumo por Aldeia → Gestão da Aldeia
- Cada card do "Resumo por aldeia" (`StatsDetailPanels.renderAldeiasPanel`) é um botão clicável quando `onSelectAldeia` é passado
- `SuperAdminDashboard` liga `onSelectAldeia={handleAbrirAldeia}` → seta `focusAldeiaId` + `setActiveTab("aldeias")`
- `AldeiasTab` recebe `focusAldeiaId` + `onFocusConsumed`: expande a aldeia, faz scroll até `#aldeia-card-{id}` e limpa o foco
- Props são opcionais — o fluxo atravessa `SuperAdminDashboard` → `AldeiasTab` diretamente, e `AdminDashboard` → `DashboardTabContent` → `AldeiasTab`

### Recorrência de Eventos — maxOcorrencias (real no backend)
- **Schema** (`prisma/schema.prisma` model Evento): `maxOcorrencias Int?` (null = ilimitado) + `ocorrenciasCriadas Int @default(0)`
- **POST /api/eventos** persiste `maxOcorrencias` quando `isRecurring`; **PUT /api/eventos/[id]** mantém `maxOcorrencias` no updateData (já não o elimina) e faz reset (`null` + `0`) ao desativar recorrência
- **Cron** (`/api/eventos/process-recurring`): respeita o limite (`ocorrenciasCriadas >= maxOcorrencias` → para e põe `proximaData = null`), para se `eventStart > dataFim`, incrementa `ocorrenciasCriadas` em cada criação e põe `proximaData = null` quando a próxima ocorrência ultrapassa a `dataFim`
- **Modal** (`create-evento-modal.tsx`): pré-visualização em tempo real — nº de ocorrências que cabem até à data de fim, data da última ocorrência, e aviso âmbar quando o limite de ocorrências ultrapassa a data de fim (helpers `computeFirstRecurrenceDate`/`addRecurrence` espelham a lógica do POST/cron)
- **Edit**: `dashboard-modals-layer.tsx` mapeia `selectedEvento.maxOcorrencias` → `initialData.maxOccurrences`; `Evento` type em `types.ts` ganhou `maxOcorrencias`/`ocorrenciasCriadas`

### Jogos Ativos — Painel Agrupado (Aldeia → Evento → Jogos)
- `StatsDetailPanels.renderJogosPanel` reescrito com accordion hierárquico: Aldeia (chevron) → Evento (chevron) → lista de jogos
- Aldeias expandidas por padrão no primeiro load; eventos começam colapsados (mesmo padrão do `/jogos`)
- Cada jogo tem ícone por tipo (`JOGO_META`: rifa=Ticket, raspadinha=Sparkles, euromilhoes=Award, poio_da_vaca=Gamepad2), stock e preço
- Estado local `jogosAldeiasExpandidas`/`jogosEventosExpandidos` + agrupamento `jogosPorAldeiaEvento`

### Prova de Jogo — z-index fix
- `prova-jogo-modal.tsx` DialogContent bumped to `z-[60]` (from z-50) to render above confirmation overlays

### Pending Changes — Sensitive Data Approval Workflow
- **Model**: `PendingAldeiaChange` — tracks IBAN/titular changes requiring approval
- **Global API**: `GET /api/pending-changes` — super_admin sees all, aldeia_admin sees own aldeia only
- **Create API**: `POST /api/aldeias/[id]/pending-changes` — creates pending change, notifies other admins + super_admins, super_admin auto-approves
- **Approve/Reject API**: `POST /api/aldeias/[id]/pending-changes/[changeId]` — `acao: 'aprovar' | 'rejeitar'`, notifies requester
- **Page**: `/pending-changes` — list with estado filter, approve/reject buttons, action dialog with observacoes
- **Navigation**: "Pedidos" link in NAV_ITEMS for super_admin and aldeia_admin; QuickAction "Pedidos Pendentes" in both dashboards
- **Protection**: Super admin auto-approves; single admin can self-approve; multiple admins require cross-approval; self-approval blocked for non-super-admins
- **Audit**: All changes logged with masked values (****XXXX)

### Testing
- Framework: **Vitest** (v4.1.10) com `jsdom` environment, globals habilitados
- Config: `vitest.config.ts` — setup file em `src/__tests__/setup.ts`, path alias `@/*`
- Comando: `npx vitest run` (todos os testes) ou `npx vitest run src/__tests__/unit/<file>.test.ts` (individual)
- Typecheck: `npm run typecheck` (`tsc --noEmit`) — CI falha se tipos não compilarem
- **388 testes** em **33 ficheiros** (unit + integration + API + lib + real-db)
- **Real DB tests**: `src/__tests__/helpers/test-db.ts` cria SQLite temporário (`prisma/test-<pid>-<random>.db`, ficheiro único por ficheiro de teste → seguro em execução paralela) via `prisma db push`, sem mocks. Importante: libs que importam `@/lib/db` (ex.: webhooks, RBAC) devem ser importadas dinamicamente DEPOIS de `setupTestDatabase()` para que `DATABASE_URL` já aponte para o ficheiro de teste
- **Playwright E2E** (10 specs em `e2e/`): `npx playwright test` (requer `npx playwright install` primeiro)
  - **IMPORTANTE — webServer usa produção**: `playwright.config.ts` arranca `npx next start` (NÃO `next dev`). O modo dev deste projeto é instável para E2E: Fast Refresh invalida chunks a meio das navegações → `ChunkLoadError`/`SyntaxError` aleatórios (reproduzido ~50% dos runs). Antes de correr Playwright:
    1. `DATABASE_URL="file:./dev.db" npx next build --webpack` (Turbopack não funciona em win32; o path SQLite é relativo ao diretório do schema, `file:./dev.db` → `prisma/dev.db`)
    2. `npx playwright test`
  - `env` do webServer: `DATABASE_URL=file:./dev.db` (SQLite local; o `.env` aponta postgres que não existe nesta máquina)
  - **API calls no E2E**: `page.request`/`request` (APIRequestContext) NÃO envia `Origin`/`Referer` → o proxy devolve 403 CSRF (`Pedido CSRF inválido — origem não correspondente`) em POST autenticado por cookie. Fix: enviar `Authorization: Bearer <token>` no request (o proxy salta o CSRF quando há Bearer). O cookie `auth-token` ainda é preciso para páginas UI.
  - `login-compra-raspadinha.spec.ts` — login + compra raspadinha com saldo + verificação
  - `cofre-cashbox-flow.spec.ts` — vendedor deposita cashbox + admin confirma depósito
  - `verificacao-publica.spec.ts` — compra raspadinha + verificação pública do hash (autêntico/adulterado/desconhecido)
  - + specs legacy (api-endpoints, csrf, fluxo-completo, game-lifecycle, login-flow, navigation, public-pages) — estado misto em full run (alguns com selectors desatualizados); correr por spec individualmente
  - Suite completa: 59 pass / 8 fail / 3 skip em modo produção (16.9m) — os 8 fail são specs legacy pré-existentes, não regressões
- **Base de dados local persistente**: `prisma/dev.db` (gitignored) — seed corrido com admin/123456. `.env.local` (gitignored) define `DATABASE_URL="file:./dev.db"` + `JWT_SECRET` + `CRON_SECRET`. **ATENÇÃO**: paths SQLite relativos resolvem contra o diretório do schema — `file:./dev.db` → `prisma/dev.db`; `file:./prisma/dev.db` criaria `prisma/prisma/dev.db` (bug já corrigido). Nota: a CLI do Prisma NÃO lê `.env.local` — usar `DATABASE_URL="file:./dev.db" npx prisma@6.19.3 <cmd>` explicitamente

#### Ficheiros de teste
| Ficheiro | Testes | Descrição |
|----------|--------|-----------|
| `unit/webhook-idempotency.test.ts` | 10 | `claimWebhookEvent`/`completeWebhookEvent` — fluxo idempotente, duplicatas, erros |
| `unit/rbac.test.ts` | 10 | `requirePermission`, `requireAnyOfPermissions`, `hasRole` (legacy) |
| `unit/auth-security.test.ts` | 14 | Password hashing (bcrypt), JWT tokens, role checking |
| `unit/raspadinha-critical.test.ts` | 11 | `determineRaspadinhaOutcome`, `buildGridFromOutcome`, forceLoss, probabilidades |
| `unit/cofre-operations.test.ts` | 8 | Vault balance, vault transactions, cashbox operations, integridade financeira |
| `unit/raspadinha.test.ts` | 25 | Raspadinha handler completo (prepareData, grid, probabilidades) |
| `unit/game-handlers.test.ts` | 41 | Registry de handlers, raspadinha, rifa, poio da vaca, euromilhões |
| `unit/game-logic.test.ts` | 24 | Rentabilidade, hash de verificação, validações de negócio |
| `integration/game-lifecycle.test.ts` | 35 | Ciclo completo de jogos, stock, sorteio, hash, permissões |
| `integration/real-db/participacao-flow.test.ts` | 1 | Fluxo real contra SQLite: aldeia → evento → jogo → saldo → participação |
| `integration/real-db/cofre-flow.test.ts` | 4 | Fluxo real do cofre: depósito (cashbox→vault), rejeição, levantamento, saldo insuficiente |
| `integration/real-db/webhook-idempotency.test.ts` | 5 | Idempotência real contra SQLite: claim/complete, duplicatas, providers distintos |
| `integration/real-db/rbac-permissions.test.ts` | 5 | RBAC real: roles globais, overrides deny, roles por aldeia |
| `integration/real-db/seguranca-pagamentos.test.ts` | 12 | Segurança de pagamentos real: auth em participações/apostas, vendedorId do JWT, dinheiro exige EXECUTE_VENDA, transações atómicas (depósito, claim-prémio, stock) |
| `unit/recurrence.test.ts` | 12 | Recorrência de eventos: `computeFirstRecurrenceDate`, `addRecurrence`, `computeRecurrencePreview` (diária/semanal/mensal) |
| `integration/real-db/euromilhoes.test.ts` | 14 | Euromilhões real: grelha bloqueada/fechada, numeros 1-50/duplicados/ocupados, preenchida aos 50, cron `processRecorrentes` (401 sem CRON_SECRET, idempotente, numeração, futuro ignorado) |
| `integration/real-db/cashbox-reconciliacao.test.ts` | 2 | Cashbox real: saldo após +100/-10/-40, histórico desc, invariante contabilístico, paginação |
| `integration/real-db/vault-pin.test.ts` | 4 | Vault PIN real: setup hashed (bcrypt), verificação (errado/certo), formato 4-6 dígitos, admin-reset (remove PIN + notificação) |
| `integration/real-db/pending-changes.test.ts` | 4 | Pending Changes real: aprovar aplica IBAN + auditoria mascarada (`****XXXX`), rejeitar com observações + notificação, auto-aprovação super admin, sem re-decisão |
| `integration/real-db/webhook-replay.test.ts` | 4 | Webhook replay real: entrega repetida deduplicada, replay com novo eventId não duplica crédito (guard `referencia`), sessões independentes |
| `integration/real-db/verificacao-publica.test.ts` | 4 | Verificação pública real: hash autêntico valida, hash adulterado falha, sem_premio consistente, hash desconhecido não encontrado |
| `integration/real-db/rgpd.test.ts` | 3 | RGPD real: anonimização >365 dias (null + audit log), idempotência, purga de webhooks completed e notificações lidas antigas |
| `integration/real-db/saf-t.test.ts` | 3 | SAF-T PT real: XML v1.04_01 com header/master files/faturas, só vendas concluídas do período, escape de caracteres XML |
| `api/business-logic.test.ts` | 9 | Stock race conditions, cashback, vendas externas |
| `lib/rate-limit.test.ts` | 4 | Rate limiting com Prisma |
| `lib/validations.test.ts` | 12 | Telefone PT, password, email |
| `lib/utils.test.ts` | 9 | formatCurrency, generateSlug, truncateText |
| `lib/i18n.test.ts` | 9 | Traduções PT/EN/ES |
| `lib/financial-validations.test.ts` | 27 | Schemas de depósito, levantamento, password |
| `validations.test.ts` | 21 | login, register, password, evento, jogo schemas |
| `utils.test.ts` | 16 | formatCurrency, formatDate, generateSlug, etc. |
| `middleware.test.ts` | 16 | Proxy, auth, CSRF, page role protection |
| `auth.test.ts` | 9 | Login, hasRole, 2FA, lockout |

#### Tipos de teste
- **Unit**: Funções puras, handlers de jogo, RBAC, auth, webhooks
- **Integration (mock)**: Ciclos completos de jogo (criar → jogar → sortear → vencedor)
- **Integration (real DB)**: Operações contra SQLite real via `src/__tests__/helpers/test-db.ts` — sem mocks, usa `prisma db push` em temp DB
- **API**: Business logic isolada (stock, cashback, vendas externas)

#### Convenções
- Todos os testes usam `// @vitest-environment node` ou `jsdom` conforme o contexto
- Testes mockados usam `vi.mock()` para Prisma e dependências externas
- Testes de integração real (real-db/) usam helper `test-db.ts` e limpam DB após cada suite
- Testes de probabilidades usam iterações (1000x) com margens alargadas
- Ficheiros de teste em `src/__tests__/unit/`, `src/__tests__/integration/`, `src/__tests__/api/`, `src/__tests__/lib/`, `src/__tests__/integration/real-db/`

## Google OAuth (Login com Google)

### Fluxo
1. User clica "Continuar com o Google" → `GET /api/auth/google`
2. Server gera CSRF state cookie, redireciona para `accounts.google.com`
3. Google redireciona para `GET /api/auth/google/callback?code=...&state=...`
4. Callback handler troca code por tokens, cria/linca user, gera JWT, seta cookie

### Pontos Críticos
- **Callback é GET com query params** — `oauth-handler.ts` usa `request.nextUrl.searchParams` (NÃO `request.formData()`)
- **Redirect URI** deve corresponder exatamente ao registado no Google Cloud Console
- **State cookie** (`google_oauth_state`) verifica CSRF — deve ser enviado com callback

### Vercel Env Vars Necessárias
```
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_REDIRECT_URI=https://aldeiasgames.vercel.app/api/auth/google/callback
```

### Google Cloud Console
URL: https://console.cloud.google.com/apis/credentials (project: aldeiasgames)
- **Authorized redirect URIs** deve incluir TANTO `http://localhost:3000/api/auth/google/callback` (dev) COMO `https://aldeiasgames.vercel.app/api/auth/google/callback` (prod)

### Erro `/?error=unexpected_error`
- Causa mais comum: `oauth-handler.ts` a chamar `request.formData()` em GET — fix: usar `request.nextUrl.searchParams`
- Outra causa: `GOOGLE_REDIRECT_URI` não configurado em Vercel (dynamic fallback usa `request.nextUrl.origin`)
- Verificar logs do servidor para detalhe do erro

## Vercel Cron — Euromilhões Recorrentes
- **Configurado em `vercel.json`** → `crons` → `{ path: "/api/euromilhoes/recorrentes", schedule: "0 22 * * 5" }` (todas as sextas 22:00 UTC, depois do sorteio das 21:30)
- **Vercel envia GET** (não PUT) com header `Authorization: Bearer ${CRON_SECRET}` — o route tem handlers `GET` e `PUT` (mesma função `processarRecorrentes`)
- **Env var obrigatória na Vercel (production)**: `CRON_SECRET` = string secreta. Sem ela, o cron devolve 401.
- Requer **plano Pro** da Vercel (cron jobs não existem no Hobby).
- Nota: `POST` mantém-se para criar jogo recorrente manualmente (admin autenticado).


### Euromilhões — 1 Participação = 1 Número (Correção Financeira, M4)
- **Regra**: cada número comprado é uma **participação separada** — `dadosParticipacao = { numero: N }` (como a rifa); o frontend envia `quantidade = numerosSelecionados.length`
- **`prepareData`** usa `existing.length` como índice — o route chama `prepareData` uma vez por participação → cada uma recebe o SEU número, `numerosSelecionados: "[N]"`, `grelhaId` e `dadosVerificacao { seed, timestamp, numero, uniqueSalt, hash }`
- **Rasto financeiro**: valorPago por participação, stock −N, `totalParticipacoes` +N, `totalAngariado` +N×preço, cashbox +N×preço (dinheiro)
- **Guard atómico**: `validateInTransaction` (após lock de stock, dentro da `$transaction`) relê a grelha via `tx.grelhaEuromilhoes.findUnique` e rejeita número ocupado com "já foi vendido" (o route mapeia para 400)
- **Grelha é a autoridade de ocupação** (50 números); `postCreate` marca ocupados e fecha (`estado: 'preenchida'`) aos 50 — sem constraint única (números vivem dentro de JSON)
- **maxNumeros configurável**: `configuracao.maxNumeros` (default 50, clamp 1-50) — validado no handler e respeitado na UI (`use-euromilhoes-game.ts` limita seleção/aleatórios)
- **numeros-ocupados**: aceita `?grelhaId=` — filtra participações por grelha (evita sobreposição entre grelhas do mesmo jogo); a UI passa `grelhaId` da grelha aberta
- **Sorteio da grelha** (`/api/euromilhoes/grelhas/[id]/sortear`): lookup do vencedor lê primeiro `dadosParticipacao.numero` (novo formato), fallback para `numerosSelecionados` (legacy)
- **Vencedor no admin**: `GET /api/participacoes` agora inclui `user` e `vendedor` no select (nome real em vez de "Anónimo" no VencedoresTab)
- Testes: `unit/game-handlers.test.ts` (prepareData unitário, maxNumeros) + `integration/real-db/euromilhoes-correcao.test.ts` (7: rasto financeiro 5 números, cashbox dinheiro, ocupados por grelha, guard atómico, 400 concorrente com reversão, sorteio vencedor unitário, GET com user/vendedor)

### Sorteios — Provably-Fair Commit + Reveal (Correção M3)
- **Schema**: `Jogo.clientSeedCommit String?` + `Sorteio.clientSeedCommit String?` (ambos opcionais — compatibilidade legacy)
- **Commit** (`PATCH /api/sorteios` com `action: 'commit'`): gera `serverSeed`, aceita `clientSeedCommit` opcional (sha256 hex de 64 chars, validado com `isValidSha256Hash`), cria `Sorteio` fase `pendente` com `preCommitHash` + `commitSalt`
- **Reveal** (`POST /api/sorteios`): se o jogo tem `clientSeedCommit`, o `clientSeed` é OBRIGATÓRIO e `hashClientSeed(clientSeed)` tem de bater com o compromisso — senão 400 "não corresponde ao compromisso (adulterada)" / "obrigatória"
- **hashClientSeed** (`src/lib/lottery-utils.ts`): sha256 com prefixo `clientSeed:` — implementação duplicada no cliente (Web Crypto `crypto.subtle` no `SorteioModal`) e no servidor (`crypto` node); têm de coincidir
- **Vencedor por tipo** (POST reveal): euromilhões → número 1-50 via `hashToIndex`, vencedor = participação com `dadosParticipacao.numero` (fallback `numerosSelecionados`); poio → `winningCoord` letra+num, match `c.y === num && config.letras[c.x-1] === letra` (fallback legacy `letra`/`numero`); rifa/outros → índice aleatório
- **dryRun:true** (sandbox): devolve `vencedorId`/`vencedorNome`/`notificados: 0` sem persistir nada (audit via `logSorteio` tipo `teste`) — usado pelo modal "Testar Jogo"
- **Notificações**: reveal real cria notificações `tipo: 'sorteio'` via createMany para participantes com `userId` (resposta inclui `notificados`)
- **VencedorNome**: o include de participações no reveal inclui `user { nome }` + `vendedor { nome }` (nome real no admin)
- **Rate limit**: `sorteios: maxRequests 5/min` por user (prisma-backed) — testes limpam `prisma.rateLimit.deleteMany({})` no beforeEach
- **Não existe `/api/sorteios/[id]`** — commit e reveal são no `/api/sorteios` (PATCH/POST); `/api/sorteios/teste` (branches modernos: rifa `{numero}`+legacy `{numeros}`, euromilhões 1-50, poio coordenadas) e `/api/sorteios/externo` (legacy) continuam para compat
- **UI**: `SorteioModal` v2 (`src/components/modals/sorteio-modal.tsx`) — 3 fases (commit → reveal → done), seed gerada no cliente, toggle dryRun (default true), integrado em `dashboard-modals-layer.tsx` (wrapper Dialog removido)
- Testes: `integration/real-db/sorteios-correcao.test.ts` (8: teste rifa novo/legacy/euromilhões 1..N determinístico, commit+reveal real com notificações, seed adulterada→400, sem seed→400, dryRun sem persistência, commit legacy sem clientSeedCommit)

### Poio da Vaca — Unificação no Fluxo de Participações (Correção M2)
- **Regra**: 1 quadrado = 1 participação — `dadosParticipacao = { coordenadas: [{letra, numero}] }`; o frontend envia `quantidade` mas o route usa SEMPRE `coordenadas.length` (nunca confia no body)
- **Preço efetivo**: `jogo.custoQuadrado || jogo.preco` (route: `precoEfetivo` usado em `valorPago`, `valorTotal`, cashbox) — vendas em dinheiro creditam cashbox N × custoQuadrado
- **Handler v2** (`participacoes/_lib/poio.ts`): aceita `{letra, numero}` (novo) E `{x, y}` (legacy, normalizado via config real: x = coluna 1-based dentro de `letras`); valida letra no campo + `numero` 1..`numerosPorLetra` + duplicados no lote; `validateInTransaction` re-lê ocupação dentro da `$transaction` (guard atómico pós-lock de stock); `prepareData` usa `existing.length` → cada participação fica com a SUA coordenada + hash + `dadosVerificacao`
- **Config auto-gerada**: `src/lib/poio-utils.ts` — `normalizePoioConfig()` deriva `letras`/`numerosPorLetra` de `dimensoesCampo` quando ausentes (jogos legacy sem crash no sorteio); `POST /api/jogos` também gera `letras`/`numerosPorLetra` na criação de poio; helpers `squareIdToCoord`/`coordToSquareId` (column-major: A1=1, A2=11 com x=10)
- **numeros-ocupados**: branch poio — converte coordenadas em ids de quadrado (com config normalizada)
- **Sorteios** (`/api/sorteios` + `/sorteios/teste`): usam `normalizePoioConfig` como fallback; vencedor match `d.letra === letra && d.numero === numero` (novo) ou coordenadas legacy
- **Página pública** (`/jogos/poio-da-vaca`): `use-poio-game.ts` migrado para `/api/participacoes` — ocupação via `numeros-ocupados`, lista via `GET /api/participacoes?jogoId=` (role-filtered), POST com `dadosCliente` + coordenadas; venda externa (com dadosCliente) NÃO recebe cashback (comportamento consistente com rifa/euromilhões)
- **Migração**: `scripts/migrate-apostas-poio.ts` (idempotente, guarda `migradaDeAposta` em dadosVerificacao, não apaga Apostas, ajusta stock/totais do jogo) — `DATABASE_URL="file:./dev.db" npx tsx scripts/migrate-apostas-poio.ts [--dry-run]`
- Testes: `unit/game-handlers.test.ts` (poio unitário: lote, legacy {x,y}, fora do campo, obrigatoriedade) + `integration/real-db/poio-correcao.test.ts` (7: rasto financeiro saldo, legacy {x,y}, fora do campo 400, coordenada vendida 400 com reversão, cashbox dinheiro, ocupados ids, config auto-gerada)
