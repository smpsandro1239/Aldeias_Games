# Design: Dashboard do Jogador — Visual Unificado e Filtro por Aldeia (Versão Atualizada)

**Data:** 2026-04-03
**Estado:** Proposta (aguardando revisão)

## Problema

1. O `/clientedashboard` mostra jogos com visual antigo (Cards shadcn/ui), enquanto `/jogos` tem visual dark theme moderno com animações.
2. Jogadores com role `user` veem TODOS os jogos de TODAS as aldeias — não há filtro por aldeia.
3. Jogadores sem aldeia definida devem ser obrigados a escolher uma antes de ver jogos.
4. **Novo:** Apenas o super_administrador pode ver jogos de todas as aldeias; todos os outros papéis devem estar vinculados a uma aldeia específica.

## Decisões de Design

- Extrair o visual de `/jogos` num componente reutilizável `GameList`
- Filtrar jogos na API pela `aldeiaId` do utilizador (apenas para roles `user`, `vendedor`, `aldeia_admin`)
- Jogador sem aldeia: vê mensagem a pedir para escolher aldeia
- Wizard de seleção de aldeia no primeiro login + opção de trocar no perfil
- Manter `/jogos` como página pública (mostra todos os jogos)
- **Importante:** Remover completamente o campo `aldeiaPrincipalId`, usando apenas `aldeiaId` para todos os papéis exceto `super_admin`

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

**Linha 103-126** — adicionar filtro para todas as roles exceto super_admin:

```typescript
if (user) {
  if (user.role === 'aldeia_admin') {
    // existente — já usa aldeiaId para filtrar eventos da sua aldeia
  } else if (user.role === 'vendedor') {
    // existente — já usa aldeiaId para filtrar eventos da sua aldeia
  } else if (user.role === 'user') {
    // ALTERADO: usar aldeiaId em vez de aldeiaPrincipalId
    if (user.aldeiaId) {
      where.evento = { aldeiaId: user.aldeiaId };
    } else {
      // Sem aldeia = sem jogos (deve ser solicitado escolher aldeia)
      return NextResponse.json(
        createPaginatedResponse([], 0, page, limit)
      );
    }
  }
} else {
  // Não autenticado — comportamento atual (jogos públicos)
  where.estado = 'aberto';
  where.evento = {
    publico: true,
  };
}
```

### POST `/api/auth/login` — `src/app/api/auth/login/route.ts`

O login retorna atualmente o objeto `user` com `aldeiaId`. Alterações:

1. **Remover** `aldeiaPrincipalId` da resposta (não existe mais no schema)
2. Adicionar flag `precisaAldeia` na resposta

```typescript
// Resposta atualizada do login
return NextResponse.json({
  success: true,
  message: 'Login bem-sucedido',
  user: {
    id: user.id,
    email: user.email,
    nome: user.nome,
    telefone: user.telefone,
    role: user.role,
    aldeiaId: user.aldeiaId as string | null,  // Pode ser null para super_admin
    aldeia: user.aldeia,
    notificacoesEmail: user.notificacoesEmail,
  },
  precisaAldeia: 
    user.role !== 'super_admin' && !user.aldeiaId,  // NOVO — true se não é super_admin e não tem aldeia
  token,
});
```

### PATCH `/api/users/perfil` — `src/app/api/users/perfil/route.ts`

Já existe e suporta `aldeiaId`. Quando define `aldeiaId`, não precisa copiar para outro campo (já que `aldeiaPrincipalId` foi removido).

```typescript
// LINHA 126-129 - MANTIDA (já está correta para aldeiaId)
if (data.aldeiaId) {
  updateData.aldeiaId = data.aldeiaId;
}
```

### Nota sobre `getFullUserFromRequest`

Esta função (usada no GET `/api/jogos` e outros endpoints) já retorna o objeto user com `aldeiaId` — sem alterações necessárias.

---

## 3. Fluxo UI

### 3.1 Login com aldeia definida (roles não-super_admin)

```
Login → resposta com precisaAldeia: false → guardar user (com aldeiaId) em localStorage
  → /clientedashboard → tab "Jogar" mostra jogos da aldeia
```

### 3.2 Login sem aldeia (primeiro login - roles não-super_admin)

```
Login → resposta com precisaAldeia: true → guardar user em localStorage
  → Modal Wizard de Seleção de Aldeia (não pode ser dispensado)
  → Jogador escolhe aldeia → PATCH /api/users/perfil { aldeiaId }
  → Atualizar user em localStorage com nova aldeiaId
  → /clientedashboard com jogos filtrados
```

### 3.3 Login como super_admin

```
Login → resposta com precisaAldeia: false (sempre false para super_admin)
  → Acesso total a todos os jogos sem restrição de aldeia
```

### 3.4 Wizard de Seleção de Aldeia

Componente: `src/components/modals/aldeia-wizard-modal.tsx` (novo)

- Modal overlay com backdrop
- Título: "Escolhe a tua Aldeia"
- Lista scrollável de aldeias (fetch de `/api/aldeias`)
- Cada item: nome da aldeia + tipo de organização
- Seleção por tap/click (destaque visual no selecionado)
- Botão "Confirmar" (desativado sem seleção)
- Não pode ser fechado sem selecionar (sem botão X/fechar)

### 3.5 Trocar Aldeia no Perfil

Na página `/perfil` ou modal de perfil:
- Secção "A Minha Aldeia" com seletor dropdown
- Ao trocar, chama PATCH `/api/users/perfil` com `{ aldeiaId: "..." }`
- Atualizar `user` em localStorage com a nova `aldeiaId`
- Toast de confirmação
- Jogos atualizam-se na próxima carga do dashboard

### 3.6 Dashboard — Tab Jogar

Se o utilizador tem `aldeiaId` (e não é super_admin):
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

Se o utilizador **não** tem `aldeiaId` (e não é super_admin):
```
Mensagem centralizada:
  "Escolhe uma aldeia para ver os jogos disponíveis."
  [Botão: "Escolher Aldeia"] → abre wizard
```

Se o utilizador é **super_admin**:
```
Cabeçalho: "Todos os Jogos"
  ↓
<GameList
  jogos={jogos}  // Todos os jogos sem filtro
  onJogoClick={handleJogar}
  loading={loading}
  title="Todos os Jogos"
  emptyMessage="Nenhum jogo disponível"
  emptySubtext="Volte mais tarde!"
/>
```

### 3.7 Página `/jogos` (pública)

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
| `src/app/api/jogos/route.ts` | **Modificar** — adicionar filtro por aldeiaId (remover referência a aldeiaPrincipalId) |
| `src/app/api/auth/login/route.ts` | **Modificar** — remover aldeiaPrincipalId + adicionar flag precisaAldeia |
| `src/app/api/users/perfil/route.ts` | **Modificar** — garantir que usa apenas aldeiaId (já suporta) |
| `prisma/schema.prisma` | **Modificar** — remover campo aldeiaPrincipalId, tornar aldeiaId obrigatório para não-super_admin |

---

## 5. Validações a Adicionar

### 5.1 Criação de Utilizadores (`src/app/api/users/route.ts` POST)

Adicionar validação para impedir criação de vendedor/admin de aldeia sem aldeiaId:

```typescript
// Após validação do schema, antes de criar o usuário:
if (
  (data.role === 'vendedor' || data.role === 'aldeia_admin') && 
  !data.aldeiaId
) {
  return NextResponse.json(
    { error: 'Vendedores e administradores de aldeia devem estar vinculados a uma aldeia' },
    { status: 400 }
  );
}
```

### 5.2 Atualização de Utilizadores (`src/app/api/users/[id]/route.ts` PATCH)

Similar validação na atualização:

```typescript
// Após validação do schema, antes de atualizar o usuário:
if (
  ((data.role === 'vendedor' || data.role === 'aldeia_admin') && 
  !data.aldeiaId) ||
  (user.role !== 'super_admin' && !data.aldeiaId && user.aldeiaId)
) {
  return NextResponse.json(
    { error: 'Utilizadores não-super_admin devem ter uma aldeia vinculada' },
    { status: 400 }
  );
}
```

---

## 6. Casos extremos

- **Utilizador sem aldeia (roles não-super_admin):** vê mensagem no dashboard, pode abrir wizard de seleção
- **Super_admin sem aldeia definida:** pode ver todos os jogos (comportamento intencional)
- **Aldeia sem jogos:** mensagem "Nenhum jogo disponível na tua aldeia de momento"
- **Aldeia eliminada/desativada:** tratar no fetch — se aldeia não existe, tratar como sem aldeia
- **Utilizador que é tanto vendedor/admin quanto jogador:** usa a mesma `aldeiaId` para fins de visualização de jogos e permissões administrativas
- **Página `/jogos` pública:** mostra todos os jogos sem filtro (comportamento atual)

---

## 7. Testes

- Verificar que GET `/api/jogos?ativos=true` com token de user com `aldeiaId` só retorna jogos dessa aldeia
- Verificar que GET `/api/jogos?ativos=true` com token de user sem `aldeiaId` (role não-super_admin) retorna lista vazia
- Verificar que GET `/api/jogos?ativos=true` com token de super_admin retorna jogos de todas as aldeias
- Verificar que GET `/api/jogos?ativos=true` sem token retorna jogos públicos
- Verificar que o wizard de aldeia aparece no primeiro login quando `precisaAldeia: true` (para roles não-super_admin)
- Verificar que trocar aldeia no perfil atualiza os jogos visíveis no dashboard
- Verificar que tentativa de criar vendedor/admin sem aldeiaId retorna erro 400
- Verificar que super_admin pode ser criado sem aldeiaId