# Aldeias Games — Project Guide for AI Agents

## Deploy Workflow (Vercel)

### Pre-deploy Checklist
1. **Prisma versions pinned**: `package.json` must have exact versions `"prisma": "6.19.3"` and `"@prisma/client": "6.19.3"` (no caret).
2. **postinstall script**: `npx --yes prisma@6.19.3 generate` (NOT `node node_modules/.bin/prisma generate` — `.bin/prisma` does not exist on Vercel).
3. **vercel.json buildCommand**: `npx prisma@6.19.3 generate && rm -rf .next && next build` (must include `rm -rf .next` to clear stale build cache).
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

### Local Build (Windows)
Turbopack does not work on Windows. Use instead:
```
npx next build --webpack
```

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
- `next.config.js` — Next.js config (no Sentry config exists)
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

### Verificação Pública de Raspadinhas
- `/verificar-raspadinha` — página pública para qualquer pessoa verificar o resultado de uma raspadinha
- Não requer autenticação — basta introduzir o hash da participação
- `GET /api/verificar-publico?hash=...` — endpoint público (sem auth) que valida e retorna resultado
- Retorna: estado (ganhou/perdeu), prémio (se ganhou), data, tipo de jogo
- Botão "Verificar" no BottomNav para utilizadores não autenticados

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
