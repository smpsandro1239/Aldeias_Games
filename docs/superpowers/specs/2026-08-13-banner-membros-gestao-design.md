# Banner + Gestão de Membros por Aldeia — Design

**Data:** 2026-08-13
**Estado:** Aprovado
**Base:** `docs/superpowers/plans/2026-08-13-melhorias-aldeias.md` (iteração anterior, concluída)

## 1. Banner da aldeia (onde é aplicado)

Atualmente `bannerUrl` só é guardado e visto como preview na Config — não é renderizado em lado nenhum.

**1.1 Detalhe da aldeia (`aldeia-header.tsx`)**

Hero no topo da página de detalhe: imagem de fundo `bannerUrl` com overlay escuro e o conteúdo do header atual por cima.

- Se `aldeia.bannerUrl` existir: div com `backgroundImage: url(...)` (`background-size: cover`, `background-position: center`), overlay `bg-black/50`, conteúdo (botão Voltar, logo, nome, badges, botão Novo Evento) por cima, com `relative z-10`.
- Fallback: layout atual (sem fundo), mantendo o gradiente/bg padrão da página.
- Padding: banner `rounded-2xl overflow-hidden p-5 md:p-6`.

**1.2 Cards de `/aldeias` (listagem)**

- Se `bannerUrl` existir: capa no topo do card (altura `h-20 sm:h-24`), `object-cover`, em cima da barra de gradiente atual (`h-1` removida quando há banner).
- Fallback: barra de gradiente atual (`h-1`).

**1.3 Tipos**

- `Aldeia` (interface da listagem em `src/app/aldeias/page.tsx`): adicionar `bannerUrl?: string` — o `GET /api/aldeias` já devolve o campo (spread).

## 2. Gestão de Membros — registar, procurar, editar

**Objetivo:** a tab Membros do detalhe da aldeia passa a permitir (1) procurar utilizadores existentes em todo o sistema e adicioná-los à aldeia, (2) criar contas novas ligadas à aldeia, (3) editar nome/email de membros. A atribuição de funções já existe (Select por membro).

### 2.1 API

**`POST /api/aldeias/[id]/membros/registar`** — criar utilizador + ligar à aldeia

- Auth: `getUserFromRequest` (401 se não autenticado).
- Permissão: mesma do POST membros atual — lidador (`aldeia.admins`), moderador (`userAldeiaRoles` com `MODERADOR`) ou `super_admin` (403 caso contrário).
- Body (zod):
  ```ts
  const registrarSchema = z.object({
    nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: passwordSchema, // reutilizar de src/lib/validations.ts (min 12 + maiúscula/minúscula/número/especial)
    role: z.enum(['ALDEIA_ADMIN', 'MODERADOR', 'COLABORADOR', 'MEMBRO']).default('MEMBRO'),
  })
  ```
- Fluxo (numa `$transaction`):
  1. `prisma.user.findUnique({ where: { email } })` → se existir, 409 `Email já registado`.
  2. Criar `User` com `password: await hashPassword(password)`, `role: 'user'`, `aldeiaId` (a aldeia onde está a registar), `saldo: 0`.
  3. Criar `UserAldeiaRole` (userId novo, aldeiaId, roleId do `Role` com `name = role` — 400 se role não existir).
  4. `AuditLog` com `action: 'CRIAR_MEMBRO_ALDEIA'`, `resource: 'User'`, `resourceId: novoUser.id`, metadata com `targetUserId`, `targetUserNome`, `addedRole`.
- Resposta 201: `{ user: { id, nome, email, role }, userAldeiaRole }`.
- Erros: email duplicado → 409 com mensagem clara (o frontend oferece "adicionar à aldeia" em vez de criar).

**`GET /api/aldeias/[id]/membros/search?q=...`** — procurar utilizadores globais

- Auth: autenticado.
- Permissão: lidador/moderador/super_admin (mesma regra).
- Query: `q` (string, obrigatória, min 2 chars → senão 400), `limit` (default 10, max 20).
- Where: `nome contains q OR email contains q` (case-insensitive — SQLite `contains` é case-insensitive; Postgres idem via Prisma `mode: 'insensitive'` — usar `mode: 'insensitive'` para ser seguro nas duas), **excluindo** utilizadores que já são membros da aldeia (`NOT userAldeiaRoles: { some: { aldeiaId } }`), `role != 'super_admin'` (super admins não se ligam a aldeias).
- Select: `{ id, nome, email, role, telefone, aldeiaId }`.
- Resposta 200: `{ users: [...] }`.

**`PATCH /api/aldeias/[id]/membros/[userId]`** — editar nome/email de um membro

- Auth: autenticado; permissão: lidador/moderador/super_admin.
- Validar que o `[userId]` é membro da aldeia (`UserAldeiaRole` existe) → 404 se não.
- Body (zod): `{ nome?: string.min(2), email?: z.string().email() }` — pelo menos um campo (400 se vazio).
- Email duplicado por outro user → 409.
- `prisma.user.update({ where: { id: userId }, data: { ...campos } })`.
- `AuditLog` `action: 'EDITAR_MEMBRO_ALDEIA'`, metadata com campos alterados.
- Resposta: `{ user: { id, nome, email } }`.

### 2.2 UI — dialog "Adicionar Membro" (vira gestão completa)

`aldeia-add-member-dialog.tsx` passa a ter **2 modos** com tabs internas:

**Modo "Procurar"**
- Input de pesquisa (debounce ~300ms) que chama `GET .../membros/search?q=`.
- Resultados: lista clicável (avatar + nome + email + role global). Clique seleciona o utilizador.
- Com utilizador selecionado: Select de função (ALL_ROLES) + botão "Adicionar à aldeia" → chama o `POST /api/aldeias/[id]/membros` existente (email + role).
- Se pesquisa sem resultados: linha com botão "Criar novo utilizador" → muda para o modo Criar com o email preenchido.

**Modo "Criar novo"**
- Campos: Nome, Email, Password (com as mesmas regras do registo — min 12 caracteres, maiúscula, minúscula, número, especial), Função (ALL_ROLES).
- Submeter → `POST .../membros/registar`. Erro 409 (email já existe) → aviso + botão "Adicionar à aldeia" que usa o modo Procurar com esse email.
- Reset dos campos ao fechar.

**Editar membro (na lista da tab Membros)**

- Novo botão lápis (`Pencil`) junto do Select de função (visível para admin, exceto o próprio utilizador).
- Abre `MemberEditDialog` (novo, pequeno): nome + email + Save/Cancelar → `PATCH .../membros/[userId]` → `fetchAldeia()`.
- O botão Editar existente na listagem `/aldeias` (dados da aldeia) não é afetado.

### 2.3 Regras de negócio

- Não se pode adicionar/editar `super_admin` (filtro no search; PATCH só para membros).
- Um utilizador não pode editar-se a si próprio (UI esconde o lápis; API não bloqueia — decisão de simplicidade, o self-edit de nome/email é inócuo e o fluxo de aprovação não se aplica a utilizadores).
- Passwords nunca são devolvidas nas respostas.
- Tudo é auditado (AuditLog) — padrão do projeto.

## 3. Ficheiros afetados

- `src/app/aldeia/[aldeiaId]/aldeia-header.tsx` — hero com banner
- `src/app/aldeias/page.tsx` — interface `Aldeia` + capa no card
- `src/app/aldeia/[aldeiaId]/aldeia-add-member-dialog.tsx` — 2 modos (procurar/criar)
- `src/app/aldeia/[aldeiaId]/aldeia-member-edit-dialog.tsx` — NOVO (editar nome/email)
- `src/app/aldeia/[aldeiaId]/aldeia-members.tsx` — botão lápis + ligações do dialog
- `src/app/aldeia/[aldeiaId]/page.tsx` — estado do dialog de edição (ou gerido internamente em members)
- `src/app/api/aldeias/[id]/membros/registar/route.ts` — NOVO
- `src/app/api/aldeias/[id]/membros/search/route.ts` — NOVO
- `src/app/api/aldeias/[id]/membros/[userId]/route.ts` — PATCH (ficheiro já existe para DELETE — adicionar PATCH)
- Testes: `src/__tests__/integration/real-db/membros-gestao.test.ts` — NOVO (registar com hash, email duplicado, search exclui membros/super_admin, PATCH nome/email, permissões 403)

## 4. Testes

Testes reais contra SQLite (`test-db` helper + `vi.mock('@/lib/auth')` como em `seguranca-pagamentos.test.ts`):

1. `POST registar` cria User (password hashed com bcrypt — `await bcrypt.compare`), UserAldeiaRole com a role pedida e AuditLog.
2. `POST registar` com email existente → 409, sem duplicar.
3. `POST registar` por não-lidador (user normal) → 403.
4. `GET search` devolve só utilizadores não-membros, por nome/email contém; exclui super_admin; `q` < 2 chars → 400.
5. `PATCH` edita nome/email e regista AuditLog; email de outro user → 409; membro de outra aldeia (sem UserAldeiaRole) → 404.

## 5. Fora de âmbito

- Edição de telefone/outros dados de utilizador.
- Gestão de permissões RBAC por membro.
- Alteração do fluxo de registo público.
- Reset de password a partir da aldeia.
