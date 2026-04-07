# Raspadinha Game — Critical Fixes Design Spec

**Date**: 2026-04-07
**Status**: Draft — Pending Review

## Problem Statement

The raspadinha (scratch card) game has 4 critical issues:

1. **Payment after scratch** — Participation/payment is created AFTER the player scratches (at 60% threshold), meaning players can play without paying.
2. **Client/server prize disconnect** — The client generates a random 9-slot grid independently from the server's deterministic result. A player might "win" on the client but the server has a different result.
3. **No automated prize payout** — When a player wins, nothing happens with the money. The prize value stays in `jogo.totalAngariado`, and the player receives nothing automatically.
4. **Missing reveal endpoint** — `ScratchCard.tsx` calls `/api/jogos/revelar-raspadinha` which doesn't exist.

## Architecture Overview

### Current Flow (Broken)

```
Player opens /jogos/raspadinha-premium?id=X
  → Client generates random 9-slot grid (initSlots)
  → Player scratches canvas
  → At 60% scratch, creates participation with metodoPagamento="dinheiro"
  → Client checks for 3+ matching prizes → shows confetti
  → "Receber Prémio" button only closes modal
  → NO money moves
```

### Target Flow (Fixed)

```
Player opens /jogos/raspadinha-premium?id=X
  → Sees game info + price + "Jogar" button
  → Clicks "Jogar" → POST /api/participacoes
    → Server: validates stock, processes payment, generates deterministic grid
    → Returns: participationId + grid layout (9 slots)
  → Client renders server-provided grid
  → Player scratches → reveals prizes
  → If 3+ matching → POST /api/participacoes/:id/claim-premio
    → Server: validates, credits user.saldo, creates Transacao, marks premioEntregue
    → Returns: success + credited amount
  → Confetti + "Receber Prémio" shows credited amount
```

---

## Section 1: Payment Before Scratch

### Changes to `raspadinha-premium/page.tsx`

**New state**:
- `participacaoReady: boolean` — true after payment succeeds, unlocks scratch canvas
- `paymentLoading: boolean` — shows loading state during payment

**New flow**:
1. Page loads, fetches jogo data
2. Shows game info + "Jogar por {preco}€" button (canvas hidden/locked)
3. On click → POST `/api/participacoes` with `jogoId`, `metodoPagamento: "dinheiro"`, `quantidade: 1`
4. On success → stores `participacaoId`, `grid` from response, sets `participacaoReady = true`
5. Canvas renders with server-provided grid
6. Remove the payment call from inside `scratchSlot` (lines 347-374)

**UI states**:
- Not paid: "Jogar por 2€" button, canvas shows lock icon
- Payment loading: spinner
- Paid: scratch canvas active
- All revealed: "Comprar Nova" button

### Changes to `participacoes/route.ts` (POST)

Add grid generation for raspadinha tipo:

When `jogo.tipo === "raspadinha"`:
1. Call `determineRaspadinhaResult()` to get the winning prize
2. Generate 9-slot grid: 3× winning prize + 6 random from config
3. Shuffle grid
4. Store grid in `dadosParticipacao`
5. Return grid in response: `{ success, participacao: { id, grid } }`

---

## Section 2: Client/Server Prize Sync

### Server-side grid generation (in `participacoes/route.ts`)

```typescript
function generateRaspadinhaGrid(config: any, winningResult: string): any[] {
  const premios = config.premios || [];
  const winningPrize = premios.find((p: any) => p.nome === winningResult) || premios[0];
  
  const grid: any[] = [];
  // 3 slots = winning prize
  for (let i = 0; i < 3; i++) grid.push(winningPrize);
  
  // 6 slots = random from config
  for (let i = 3; i < 9; i++) {
    grid.push(premios[Math.floor(Math.random() * premios.length)]);
  }
  
  // Shuffle
  for (let i = grid.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [grid[i], grid[j]] = [grid[j], grid[i]];
  }
  
  return grid;
}
```

### Client changes (`raspadinha-premium/page.tsx`)

- Remove `initSlots()` and `initDefaultSlots()` — no longer generate locally
- After payment success, use `response.participacao.grid` to populate slots
- Grid format: `[{ nome, valorDinheiroAlternative, ... }, ...]` (9 items)
- Each slot: `{ id, revealed: false, prize, scratchPercent: 0 }`

---

## Section 3: Automated Prize Payout

### New endpoint: `POST /api/participacoes/[id]/claim-premio`

**Authorization**: Only the participation owner (user who created it)

**Logic**:
1. Find participation by ID
2. Verify `participacao.userId === request.userId`
3. Verify `participacao.ganhador === true` (was won)
4. Verify `participacao.premioEntregue === false` (not yet claimed)
5. Find the winning prize from `dadosParticipacao.grid` (3+ matching)
6. Credit `user.saldo += prize.valorDinheiroAlternative`
7. Create `Transacao`: `{ tipo: "premio_dinheiro", valor: prizeValue, userId, participacaoId }`
8. Update participation: `premioEntregue: true`
9. Create `AlteracaoParticipacao` audit log
10. Return: `{ success, creditedAmount, newSaldo }`

**Idempotency**: If `premioEntregue === true`, return current state without double-crediting.

### Client changes (`raspadinha-premium/page.tsx`)

- When 3+ matching prizes detected → call `POST /api/participacoes/{participacaoId}/claim-premio`
- On success → update win modal to show "Crédito de X€ adicionado à sua carteira!"
- Store `premioClaimed` state to prevent double calls

---

## Section 4: Reveal Endpoint

### Decision: Remove dependency on missing endpoint

`ScratchCard.tsx` calls `/api/jogos/revelar-raspadinha` which doesn't exist. Two options:

**Option A**: Create the endpoint
**Option B**: Update `ScratchCard.tsx` to use the participation-based flow

**Decision**: Option B — no duplicate logic. The `ScratchCard` component should receive the result via props/callback from the parent, not call its own API. This keeps the single source of truth at `/api/participacoes`.

### Changes to `ScratchCard.tsx`

- Add `skipApiCall: true` prop (already exists, just use it consistently)
- Parent component handles participation creation and passes result to ScratchCard
- ScratchCard only handles the visual scratch interaction

---

## Section 5: Security Hardening

### Audit trail
- Every prize claim logged to `AlteracaoParticipacao`:
  - `participacaoId`, `userId`, `campoAlterado: "premioEntregue"`, `valorAnterior: false`, `valorNovo: true`
  - `ipAddress`, `userAgent`

### Validation
- Participation must exist and belong to requesting user
- Prize can only be claimed once (idempotent via `premioEntregue` check)
- Prize value must match what's stored in `dadosParticipacao.grid`
- No modification of prize value allowed

### Admin visibility
- Admin dashboard shows pending vs claimed prizes
- `premioEntregue` flag visible in participation list

---

## Files to Modify

| File | Changes |
|---|---|
| `src/app/api/participacoes/route.ts` | Add grid generation in POST, return grid in response |
| `src/app/api/participacoes/[id]/claim-premio/route.ts` | **NEW** — Prize claim endpoint |
| `src/app/jogos/raspadinha-premium/page.tsx` | Payment-first flow, server grid, prize claim |
| `src/components/modals/create-jogo-modal.tsx` | No changes (already generates prizes correctly) |
| `src/components/games/ScratchCard.tsx` | Use skipApiCall, receive result from parent |

## Data Flow

```
POST /api/participacoes
  Input: { jogoId, metodoPagamento, quantidade }
  Output: { success, participacao: { id, grid: [{...}, ...] } }

POST /api/participacoes/:id/claim-premio
  Input: {} (uses participacaoId from URL)
  Output: { success, creditedAmount: number, newSaldo: number }
```

## Testing Checklist

- [ ] Player cannot scratch without paying first
- [ ] Grid layout matches server-determined result
- [ ] Winning prize is credited to wallet automatically
- [ ] Prize can only be claimed once (idempotent)
- [ ] Non-owner cannot claim prize
- [ ] Audit log created on prize claim
- [ ] Admin can see premioEntregue status
- [ ] Scratch percentage only increases, never decreases
- [ ] Sound syncs with scratch movement
