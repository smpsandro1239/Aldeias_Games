# Design: Dashboard do Jogador — Visual Unificado e Filtro por Aldeia

**Data:** 2026-04-02
**Estado:** Aprovado

## Problema

1. O `/clientedashboard` mostra jogos com visual antigo (Cards shadcn/ui), enquanto `/jogos` tem visual dark theme moderno com animações.
2. Jogadores com role `user` veem TODOS os jogos de TODAS as aldeias — não há filtro por aldeia.
3. Jogadores sem aldeia definida devem ser obrigados a escolher uma antes de ver jogos.

## Decisões de Design

- Extrair o visual de `/jogos` num componente reutilizável `GameList`
- Filtrar jogos na API pela `aldeiaPrincipalId` do jogador
- Jogador sem aldeia: vê mensagem a pedir para escolher aldeia
- Wizard de seleção de aldeia no primeiro login + opção de trocar no perfil
- Manter `/jogos` como página pública (mostra todos os jogos)

---

## 1. Componente `GameList` — `src/components/games/game-list.tsx`

Componente de apresentação (sem lógica de fetch ou navegação).

### Props

```typescript
interface GameListProps {
  jogos: Jogo[]
  onJogoClick: (jogo: Jogo) => void
  loading?: boolean
  title?: string        // Default: "Os Nossos Jogos"
  emptyMessage?: string // Default: "Nenhum jogo disponível"
  emptySubtext?: string // Default: "Volte mais tarde!"
  showAldeia?: boolean  // Mostrar nome da aldeia no card (default: true)
}
```

### Interface `Jogo`

```typescript
interface Jogo {
  id: string
  nome: string
  tipo: "poio_da_vaca" | "rifa" | "tombola" | "raspadinha"
  preco: number
  stockAtual: number
  estado: string
  evento?: {
    nome: string
    aldeia?: { nome: string }
  }
}
```

### Visual

Extraído de `src/app/jogos/page.tsx` (linhas 108-206):
- Background `#110d0c`, texto `#eae0de`, accent `#ff734b`
- Cards com `bg-[#1f1b19]`, border `#58413b/20`, rounded-2xl
- Ícones por tipo de jogo (Sparkles, Leaf, Ticket, Trophy)
- Animações framer-motion (fade in, stagger por index)
- Loader com `Loader2` animate-spin

### Onde é usado

| Local | Contexto |
|---|---|
| `src/app/jogos/page.tsx` | Página pública — mostra todos os jogos |
| `src/features/cliente/cliente-dashboard.tsx` | Tab "Jogar" — jogos filtrados pela aldeia |

---

## 2. Alterações na API

### GET `/api/jogos` — `src/app/api/jogos/route.ts`

**Linha 103-126** — adicionar filtro para role `user`:

```typescript
if (user) {
  if (user.role === 'aldeia_admin') {
    // existente — sem alterações
  } else if (user.role === 'vendedor') {
    // existente — sem alterações
  } else if (user.role === 'user') {
    if (user.aldeiaPrincipalId) {
      where.evento = { aldeiaId: user.aldeiaPrincipalId };
    } else {
      // Sem aldeia = sem jogos
      return NextResponse.json(
        createPaginatedResponse([], 0, page, limit)
      );
    }
  }
} else {
  // Não autenticado — comportamento atual (jogos públicos)
}
```

### PATCH `/api/users/perfil` — `src/app/api/users/perfil/route.ts`

Já existe e suporta `aldeiaPrincipalId` (linha 126-129). Quando define `aldeiaPrincipalId`, também copia o valor para `aldeiaId`. Sem alterações necessárias neste endpoint.

### POST `/api/auth/login` — `src/app/api/auth/login/route.ts`

O login retorna atualmente o objeto `user` com `aldeiaId` mas **sem** `aldeiaPrincipalId`. Alterações:

1. Adicionar `aldeiaPrincipalId` ao objeto `user` na resposta (linha 164-174)
2. Adicionar flag `precisaAldeia` na resposta

```typescript
// Resposta atualizada do login (linha 161)
return NextResponse.json({
  success: true,
  message: 'Login bem-sucedido',
  user: {
    id: user.id,
    email: user.email,
    nome: user.nome,
    telefone: user.telefone,
    role: user.role,
    aldeiaId: user.aldeiaId as string,
    aldeiaPrincipalId: user.aldeiaPrincipalId,  // NOVO
    aldeia: user.aldeia,
    notificacoesEmail: user.notificacoesEmail,
  },
  precisaAldeia: !user.aldeiaPrincipalId,  // NOVO — true se não tem aldeia
  token,
});
```

Nota: `getFullUserFromRequest` (usado no GET `/api/jogos`) já retorna todos os campos do user, incluindo `aldeiaPrincipalId` — sem alterações necessárias.

---

## 3. Fluxo UI

### 3.1 Login com aldeia definida

```
Login → resposta com precisaAldeia: false → guardar user (com aldeiaPrincipalId) em localStorage
  → /clientedashboard → tab "Jogar" mostra jogos da aldeia
```

### 3.2 Login sem aldeia (primeiro login)

```
Login → resposta com precisaAldeia: true → guardar user em localStorage
  → Modal Wizard de Seleção de Aldeia (não pode ser dispensado)
  → Jogador escolhe aldeia → PATCH /api/users/perfil { aldeiaPrincipalId }
  → Atualizar user em localStorage com nova aldeiaPrincipalId
  → /clientedashboard com jogos filtrados
```

### 3.3 Wizard de Seleção de Aldeia

Componente: `src/components/modals/aldeia-wizard-modal.tsx` (novo)

- Modal overlay com backdrop
- Título: "Escolhe a tua Aldeia"
- Lista scrollável de aldeias (fetch de `/api/aldeias`)
- Cada item: nome da aldeia + tipo de organização
- Seleção por tap/click (destaque visual no selecionado)
- Botão "Confirmar" (desativado sem seleção)
- Não pode ser fechado sem selecionar (sem botão X/fechar)

### 3.4 Trocar Aldeia no Perfil

Na página `/perfil` ou modal de perfil:
- Secção "A Minha Aldeia" com seletor dropdown
- Ao trocar, chama PATCH `/api/users/perfil` com `{ aldeiaPrincipalId: "..." }`
- Atualizar `user` em localStorage com a nova `aldeiaPrincipalId`
- Toast de confirmação
- Jogos atualizam-se na próxima carga do dashboard

### 3.5 Dashboard — Tab Jogar

Se o jogador tem `aldeiaPrincipalId`:
```
Cabeçalho: "Jogos da [Nome da Aldeia]"
  ↓
<GameList
  jogos={jogos}
  onJogoClick={handleJogar}
  loading={loading}
  title="Jogos da Aldeia X"
  emptyMessage="Nenhum jogo disponível"
  emptySubtext="Não há jogos ativos na tua aldeia de momento."
/>
```

Se o jogador **não** tem `aldeiaPrincipalId` (ex: voltou sem completar wizard):
```
Mensagem centralizada:
  "Escolhe uma aldeia para ver os jogos disponíveis."
  [Botão: "Escolher Aldeia"] → abre wizard
```

### 3.6 Página `/jogos` (pública)

Comportamento atual mantido. Apenas troca o visual inline pelo componente `GameList`:
```typescript
<GameList
  jogos={jogos}
  onJogoClick={handleJogoClick}
  loading={loading}
  title="Os Nossos Jogos"
  showAldeia={true}
/>
```

---

## 4. Ficheiros a alterar

| Ficheiro | Ação |
|---|---|
| `src/components/games/game-list.tsx` | **Criar** — componente GameList |
| `src/components/modals/aldeia-wizard-modal.tsx` | **Criar** — wizard de seleção de aldeia |
| `src/app/jogos/page.tsx` | **Modificar** — usar GameList em vez de visual inline |
| `src/features/cliente/cliente-dashboard.tsx` | **Modificar** — tab Jogar usa GameList + tratar semAldeia |
| `src/app/api/jogos/route.ts` | **Modificar** — adicionar filtro por aldeiaPrincipalId |
| `src/app/api/auth/login/route.ts` | **Modificar** — adicionar aldeiaPrincipalId + flag precisaAldeia ao user na resposta |
| `src/app/api/users/perfil/route.ts` | **Sem alterações** — já suporta aldeiaPrincipalId via PATCH |

---

## 5. Casos extremos

- **Jogador sem aldeia:** vê mensagem no dashboard, pode abrir wizard de seleção
- **Aldeia sem jogos:** mensagem "Nenhum jogo disponível na tua aldeia de momento"
- **Aldeia eliminada/desativada:** tratar no fetch — se aldeia não existe, tratar como sem aldeia
- **Admin/Vendedor que também é jogador:** o filtro usa `aldeiaPrincipalId`, não `aldeiaId` (que é a aldeia de gestão)
- **Página `/jogos` pública:** mostra todos os jogos sem filtro (comportamento atual)

---

## 6. Testes

- Verificar que GET `/api/jogos?ativos=true` com token de user com `aldeiaPrincipalId` só retorna jogos dessa aldeia
- Verificar que GET `/api/jogos?ativos=true` com token de user sem `aldeiaPrincipalId` retorna lista vazia
- Verificar que GET `/api/jogos?ativos=true` sem token retorna jogos públicos
- Verificar que o wizard de aldeia aparece no primeiro login quando `precisaAldeia: true`
- Verificar que trocar aldeia no perfil atualiza os jogos visíveis no dashboard
