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
- **Vendedor.Cashbox** — cash in the seller's possession (incremented on top-up confirmation)
- **Vault** — village general cashbox (credited when admin confirms seller deposit)
- **Player.Wallet** — digital balance

Flow:
1. Seller confirms top-up → `Player.Wallet += valor` + `Vendedor.Cashbox += valor`
2. Seller delivers cash to village admin → creates `PedidoDepositoCofre` (pending)
3. Admin confirms → `Vendedor.Cashbox -= valor` + `Vault += valor`

Every operation is recorded with `criadoPor`, `confirmadoPor`, timestamps, and cross-references.

API Endpoints:
- `PUT /api/carregamento/[id]` — modified to also increment seller cashbox
- `GET /api/vendedor/cashbox` — seller's cashbox balance + transactions
- `POST /api/cofre/pedido-deposito` — create deposit request
- `GET /api/cofre/pedido-deposito` — list deposit requests (seller sees own, admin sees village)
- `PUT /api/cofre/pedido-deposito/[id]` — confirm/reject deposit
- `GET /api/cofre/historico` — vault transaction history (admin/super_admin)

Pages:
- `/admindashboard/cofre` — admin manages deposit requests + vault history
- Seller dashboard "Caixa" tab — seller sees cashbox + creates deposit requests

### Key Files
- `package.json` — scripts, dependencies, prisma version
- `vercel.json` — build command
- `prisma/schema.prisma` — database schema
- `prisma/seed-full.ts` — comprehensive seed
- `next.config.js` — Next.js config (no Sentry config exists)
