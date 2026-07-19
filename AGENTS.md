# Aldeias Games — Project Guide for AI Agents

## Deploy Workflow (Vercel)

### Pre-deploy Checklist
1. **Prisma versions pinned**: `package.json` must have exact versions `"prisma": "6.19.3"` and `"@prisma/client": "6.19.3"` (no caret).
2. **postinstall script**: `npx --yes prisma@6.19.3 generate` (NOT `node node_modules/.bin/prisma generate` — `.bin/prisma` does not exist on Vercel).
3. **vercel.json buildCommand**: `npx prisma@6.19.3 generate && next build` (must match pinned version).
4. **TypeScript/React types** in `dependencies` (not `devDependencies`) — Vercel cannot find them in devDependencies.
5. **Git author**: `git config user.name sandropereira` / `git config user.email 94222305+smpsandro1239@users.noreply.github.com` — must match GitHub account for Vercel author identification.

### Common Build Errors & Fixes

| Error | Fix |
|-------|-----|
| `Prisma 7 installed by npx` | Pin versions in `package.json` and `vercel.json` to `6.19.3` |
| `params: { id: string }` → `params: Promise<{ id: string }>` | Next.js 16 requires async params in route handlers |
| `Field does not exist in type` (missing schema field) | Add field to `prisma/schema.prisma`, run `prisma db push` |
| `Cannot find name 'apiRequest'` | Add `import { apiRequest } from "@/lib/api-client"` |
| `location is not defined` (non-blocking) | Caused by 3rd-party lib accessing `location` at module scope during SSR. Build still succeeds. |
| `Turbopack not supported on win32` | Local Windows cannot run Turbopack — use `npx next build --webpack` locally or rely on Vercel (Linux) for Turbopack builds |

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
- `vercel.json` — build command
- `prisma/schema.prisma` — database schema
- `prisma/seed-full.ts` — comprehensive seed
- `next.config.js` — Next.js config (no Sentry config exists)

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
