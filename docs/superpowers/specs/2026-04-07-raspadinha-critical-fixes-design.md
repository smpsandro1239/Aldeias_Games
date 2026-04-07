# Raspadinha Game — Critical Fixes Design Spec

**Date**: 2026-04-07
**Status**: Approved — Ready for Implementation

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
  → Sees game info + price + "Jogar por {preco}€" button
  → Clicks "Jogar" → POST /api/participacoes
    → Server: validates stock, processes payment, determines outcome (probabilistic)
    → Server: generates deterministic grid around outcome
    → Returns: participationId + grid layout (9 slots)
  → Client renders server-provided grid
  → Player scratches → reveals prizes
  → If 3+ matching → POST /api/participacoes/:id/claim-premio
    → Server: validates, credits user.saldo, creates Transacao, marks premioEntregue
    → Returns: success + credited amount
  → Confetti + "Receber Prémio" shows credited amount
  → If payment fails → error toast, no participation created, player can retry

If player refreshes after payment → page checks localStorage for pending participacaoId, resumes from there.
```

---

## Section 1: Payment Before Scratch

### Changes to `raspadinha-premium/page.tsx`

**New state**:
- `participacaoReady: boolean` — true after payment succeeds, unlocks scratch canvas
- `paymentLoading: boolean` — shows loading state during payment
- `premioClaimed: boolean` — prevents double claim

**New flow**:
1. Page loads, fetches jogo data
2. Shows game info + "Jogar por {preco}€" button (canvas hidden, shows lock icon)
3. On click → POST `/api/participacoes` with `jogoId`, `metodoPagamento: "dinheiro"`, `quantidade: 1`
4. On success → stores `participacaoId` and `grid` from response, sets `participacaoReady = true`, shows brief "Cartela comprada!" animation (0.5s)
5. Canvas renders with server-provided grid, scratching unlocked
6. On payment failure → toast error, no participation created, player can retry
7. Remove the payment call from inside `scratchSlot` (lines 347-374)

**UI states**:
- Not paid: "Jogar por 2€" button, canvas area shows lock icon + "Compre para jogar"
- Payment loading: spinner + "A processar pagamento..."
- Payment success: brief "Cartela comprada!" animation (0.5s fade), then canvas active
- Paid: scratch canvas active
- All revealed: "Comprar Nova" button → resets to "Not paid" state
- Payment error: toast + button re-enabled

**Resume after refresh**:
- Store `participacaoId` and `grid` in `sessionStorage`
- On page load, check sessionStorage for pending participation
- If found, fetch participation from API to verify, resume scratch state

### Changes to `participacoes/route.ts` (POST)

Add grid generation for raspadinha tipo:

When `jogo.tipo === "raspadinha"`:
1. Call `determineRaspadinhaOutcome()` — probabilistic win/loss decision
2. Call `buildGridFromOutcome()` — generate 9-slot grid around the decided outcome
3. Store grid + winningPrize explicitly in `dadosParticipacao`
4. Return grid in response: `{ success, participacao: { id, grid, hasWin } }`

---

## Section 2: Client/Server Prize Sync (Probabilistic)

### Core Principle

**Outcome is decided at payment time, not at scratch time.** The scratch is purely visual/teatral. This follows industry standard for online scratch cards.

### Step 1: Probabilistic Outcome Determination

```typescript
function determineRaspadinhaOutcome(config: any): { 
  hasWin: boolean; 
  winningPrize: any | null;
} {
  const premios = config.premios || [];
  
  // Use crypto-secure random
  const randomBytes = crypto.randomBytes(4);
  const roll = randomBytes.readUInt32BE(0) / 0xFFFFFFFF; // 0.0 to 1.0
  
  // Build cumulative probability ranges from config percentagens
  let cumulative = 0;
  for (const premio of premios) {
    const prob = (premio.percentagem || 0) / 100;
    cumulative += prob;
    if (roll < cumulative) {
      return { hasWin: true, winningPrize: premio };
    }
  }
  
  // No win — roll fell outside all prize ranges
  return { hasWin: false, winningPrize: null };
}
```

**Example**: If config has 3 prizes with percentagens 2%, 5%, 10%:
- Total win probability = 17%
- 83% of cards lose (no 3+ matching symbols)
- This matches the admin-configured RTP

### Step 2: Grid Construction Around Outcome

```typescript
function buildGridFromOutcome(
  outcome: { hasWin: boolean; winningPrize: any | null },
  config: any
): any[] {
  const premios = config.premios || [];
  const grid: any[] = [];
  
  if (outcome.hasWin && outcome.winningPrize) {
    // Winning card: place 3× winning prize + 6 non-matching fillers
    const winningPrize = outcome.winningPrize;
    
    // 3 slots = winning prize (guaranteed match)
    for (let i = 0; i < 3; i++) grid.push({ ...winningPrize });
    
    // 6 slots = random prizes, but ensure no accidental 3-match
    const otherPrizes = premios.filter((p: any) => p.nome !== winningPrize.nome);
    const fillerPool = otherPrizes.length > 0 ? otherPrizes : premios;
    
    for (let i = 0; i < 6; i++) {
      const pick = fillerPool[Math.floor(Math.random() * fillerPool.length)];
      grid.push({ ...pick });
    }
    
    // Validate: count each prize name, ensure only the winning one has 3+
    const counts = new Map<string, number>();
    grid.forEach((p) => counts.set(p.nome, (counts.get(p.nome) || 0) + 1));
    
    // If any non-winning prize accidentally got 3+, swap one out
    for (const [nome, count] of counts) {
      if (nome !== winningPrize.nome && count >= 3) {
        const idx = grid.findIndex((p) => p.nome === nome);
        if (idx !== -1) {
          grid[idx] = { ...fillerPool[Math.floor(Math.random() * fillerPool.length)] };
        }
      }
    }
  } else {
    // Losing card: no prize appears 3+ times
    // Strategy: distribute prizes so max count of any single prize is 2
    const maxPerPrize = 2;
    const counts = new Map<string, number>();
    
    for (let i = 0; i < 9; i++) {
      // Pick a prize that hasn't reached max count yet
      let attempts = 0;
      while (attempts < 20) {
        const pick = premios[Math.floor(Math.random() * premios.length)];
        const currentCount = counts.get(pick.nome) || 0;
        if (currentCount < maxPerPrize) {
          grid.push({ ...pick });
          counts.set(pick.nome, currentCount + 1);
          break;
        }
        attempts++;
      }
      // Fallback: if all prizes at max, pick any (shouldn't happen with 3+ prize tiers)
      if (i >= grid.length) {
        grid.push({ ...premios[0] });
      }
    }
  }
  
  // Fisher-Yates shuffle
  for (let i = grid.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [grid[i], grid[j]] = [grid[j], grid[i]];
  }
  
  return grid;
}
```

### Step 3: Store in Participation

```typescript
const dadosParticipacao = {
  grid,
  winningPrize: outcome.hasWin ? outcome.winningPrize : null,
  hasWin: outcome.hasWin,
  generatedAt: new Date().toISOString(),
  rngSeed: crypto.randomBytes(16).toString('hex'), // For audit
};
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

**Rate limiting**: 5 claims per minute per user (prevent abuse)

**Logic**:
1. Find participation by ID, include user and jogo
2. Verify participation exists
3. Verify `participacao.userId === request.userId` (owner check)
4. Verify `participacao.premioEntregue === false` (not yet claimed) — idempotency gate
5. Verify `participacao.tipo === "raspadinha"` (only for scratch cards)
6. Read `dadosParticipacao.grid` and count occurrences of each prize by `nome`
7. Find any prize with count >= 3 → this is the winning prize
8. If no prize has 3+ matches → return `{ success: false, reason: "no_win" }` with 400
9. Validate prize value matches `dadosParticipacao.winningPrize.valorDinheiroAlternative`
10. Credit `user.saldo += prize.valorDinheiroAlternative`
11. Create `Transacao`: `{ tipo: "premio_dinheiro", valor: prizeValue, userId, participacaoId, descricao: "Prémio raspadinha: {prize.nome}" }`
12. Update participation: `premioEntregue: true`, `ganhador: true`
13. Create `AlteracaoParticipacao` audit log with previous/new values
14. Return: `{ success: true, creditedAmount: number, newSaldo: number, prizeName: string }`

**Idempotency**: If `premioEntregue === true`, return `{ success: true, alreadyClaimed: true, creditedAmount, newSaldo }` without double-crediting.

### Client changes (`raspadinha-premium/page.tsx`)

- When 3+ matching prizes detected → call `POST /api/participacoes/{participacaoId}/claim-premio`
- On success → update win modal to show "Crédito de X€ adicionado à sua carteira!"
- Store `premioClaimed` state to prevent double calls
- On error → show "Erro ao receber prémio. Contacte o suporte." with retry button

---

## Section 4: Reveal Endpoint

### Decision: Remove dependency on missing endpoint

`ScratchCard.tsx` calls `/api/jogos/revelar-raspadinha` which doesn't exist.

**Decision**: Option B — `ScratchCard` component becomes fully dumb. It receives grid via props, fires `onWin` callback, makes no API calls. Single source of truth stays at `/api/participacoes`.

### Changes to `ScratchCard.tsx`

- Use `skipApiCall: true` prop consistently
- Parent component handles participation creation and passes result
- `ScratchCard` only handles visual scratch interaction + calls `onWin(prize)` callback

---

## Section 5: Security Hardening

### RNG Fairness
- Use `crypto.randomBytes()` (Node.js crypto module) for all randomness — NOT `Math.random()`
- Store `rngSeed` in `dadosParticipacao` for each participation
- Log the roll value and outcome for audit: `{ roll, outcome, prize, timestamp }`

### Audit trail
- Every prize claim logged to `AlteracaoParticipacao`:
  - `participacaoId`, `userId`, `campoAlterado: "premioEntregue"`, `valorAnterior: false`, `valorNovo: true`
  - `ipAddress`, `userAgent`, `timestamp`
- Participation creation logged with RNG seed and outcome

### Validation
- Participation must exist and belong to requesting user
- Prize can only be claimed once (idempotent via `premioEntregue` check)
- Prize value validated against stored `dadosParticipacao.winningPrize`
- Rate limiting on claim endpoint: 5 per minute per user
- No modification of prize value allowed

### Admin visibility
- Admin dashboard shows pending vs claimed prizes
- `premioEntregue` flag visible in participation list
- Admin can view RNG seed and audit trail for any participation

### Compliance notes
- Age verification (18+) should be checked at registration (existing `registerSchema`)
- Responsible gaming: log participation frequency per user for anomaly detection
- All RNG operations use cryptographically secure `crypto.randomBytes()`

---

## Section 6: Edge Cases & Resilience

### Page refresh after payment
- Store `participacaoId` and `grid` in `sessionStorage`
- On page load, check for pending participation
- If found, verify via API and resume scratch state
- If participation doesn't exist or belongs to another user, clear and restart

### Double-click on "Jogar"
- Disable button during payment processing (`paymentLoading` state)
- Server-side: if duplicate request arrives, return existing participation (idempotent by jogoId + userId + timestamp window)

### Double-click on claim prize
- Idempotent via `premioEntregue` check — second call returns already-claimed state
- Client-side: `premioClaimed` state prevents second call

### Partial scratch then leave
- Participation already created (payment done), grid stored
- Player can return and continue scratching (sessionStorage resume)
- Prize claim can happen at any time after all 9 slots revealed

### "Comprar Nova" after finishing
- Resets all state to "Not paid"
- Clears sessionStorage
- Shows "Jogar por X€" button again
- Creates new participation on next click

---

## Files to Modify

| File | Changes |
|---|---|
| `src/app/api/participacoes/route.ts` | Add probabilistic outcome + grid generation in POST, return grid in response, use crypto.randomBytes |
| `src/app/api/participacoes/[id]/claim-premio/route.ts` | **NEW** — Prize claim endpoint with rate limiting, idempotency, audit |
| `src/app/jogos/raspadinha-premium/page.tsx` | Payment-first flow, server grid, prize claim, sessionStorage resume, UI states |
| `src/components/games/ScratchCard.tsx` | Use skipApiCall consistently, receive result from parent, dumb component |

## Data Flow

```
POST /api/participacoes
  Input: { jogoId, metodoPagamento, quantidade }
  Output: { 
    success, 
    participacao: { 
      id, 
      grid: [{ nome, valorDinheiroAlternative, ... }, ...],
      hasWin: boolean
    } 
  }

POST /api/participacoes/:id/claim-premio
  Input: {} (uses participacaoId from URL)
  Output: { 
    success: true, 
    creditedAmount: number, 
    newSaldo: number, 
    prizeName: string 
  }
  OR
  Output: { success: false, reason: "no_win" | "already_claimed" | "not_owner" }
```

## Testing Checklist

- [ ] Player cannot scratch without paying first
- [ ] Grid layout matches server-determined outcome (probabilistic, not always win)
- [ ] Winning prize is credited to wallet automatically
- [ ] Prize can only be claimed once (idempotent)
- [ ] Non-owner cannot claim prize
- [ ] Audit log created on prize claim
- [ ] Admin can see premioEntregue status
- [ ] Scratch percentage only increases, never decreases
- [ ] Sound syncs with scratch movement
- [ ] Page refresh after payment resumes scratch state
- [ ] Double-click on "Jogar" doesn't create duplicate participation
- [ ] Double-click on claim doesn't double-credit
- [ ] Payment failure shows error, allows retry
- [ ] Losing card (no 3+ matches) shows no win modal
- [ ] "Comprar Nova" resets to initial state correctly
- [ ] RNG uses crypto.randomBytes (not Math.random)
- [ ] Rate limiting on claim endpoint works
- [ ] Grid validation prevents accidental 3-match on losing cards
