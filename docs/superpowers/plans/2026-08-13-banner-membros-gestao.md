# Banner + Gestão de Membros por Aldeia Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar o banner da aldeia no detalhe e nos cards da listagem, e tornar a tab Membros capaz de registar utilizadores, procurar utilizadores globais para adicionar e editar nome/email de membros.

**Architecture:** Três endpoints novos/diferentes em `src/app/api/aldeias/[id]/membros/` (registar, search, PATCH em `[userId]`) com TDD via testes real-db (padrão de `seguranca-pagamentos.test.ts`); banner aplicado no `aldeia-header.tsx` (hero com overlay) e nos cards de `/aldeias`; dialog "Adicionar Membro" com 2 modos (Procurar/Criar) + novo `MemberEditDialog`.

**Tech Stack:** Next.js 16 route handlers, Prisma 6.19.3 (SQLite dev / Postgres Neon prod), zod, bcrypt via `hashPassword` (`src/lib/auth.ts:73`), Vitest real-db, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-08-13-banner-membros-gestao-design.md`

**Convenções obrigatórias:** commits pt-PT + push por tarefa; never heredocs (bash no Windows); não usar `include: { user: true }` novo; passwords nunca em respostas; tudo auditado (`AuditLog`).

---

## Task 1: API — POST /membros/registar (TDD)

**Files:**
- Test: `src/__tests__/integration/real-db/membros-gestao.test.ts` (criar com bloco `registar`)
- Create: `src/app/api/aldeias/[id]/membros/registar/route.ts`

- [ ] **Step 1: Criar ficheiro de teste com o bloco `registar`**

```ts
// @vitest-environment node
import { describe, beforeAll, afterAll, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  setupTestDatabase,
  teardownTestDatabase,
  getPrisma,
} from "../../helpers/test-db";

const mocks = vi.hoisted(() => ({ user: null as any }));

vi.mock("@/lib/auth", () => ({
  getFullUserFromRequest: async () => mocks.user,
  getUserFromRequest: async () =>
    mocks.user
      ? { userId: mocks.user.id, role: mocks.user.role, aldeiaId: mocks.user.aldeiaId ?? null }
      : null,
  hashPassword: async (p: string) => `hashed:${p}`,
  verifyToken: async () =>
    mocks.user
      ? { userId: mocks.user.id, role: mocks.user.role, aldeiaId: mocks.user.aldeiaId ?? null }
      : null,
}));

describe("Real DB: Gestão de membros da aldeia", () => {
  let prisma: any;
  let registarPOST: any;
  let aldeia: any;
  let roles: Record<string, string> = {}; // name -> id

  const req = (body: unknown, params: Record<string, string>) =>
    ({
      json: async () => body,
      headers: new Headers(),
      url: "http://test",
      context: { params: Promise.resolve(params) },
    }) as any;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();
    const route = await import("@/app/api/aldeias/[id]/membros/registar/route");
    registarPOST = route.POST;

    aldeia = await prisma.aldeia.create({
      data: { nome: "Aldeia Membros", slug: "aldeia-membros", tipoOrganizacao: "aldeia", email: "m@b.pt" },
    });
    for (const name of ["ALDEIA_ADMIN", "MODERADOR", "COLABORADOR", "MEMBRO"]) {
      const r = await prisma.role.create({ data: { name, description: name } });
      roles[name] = r.id;
    }
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe("POST /membros/registar", () => {
    it("cria utilizador com password hashed + UserAldeiaRole + AuditLog", async () => {
      mocks.user = { id: "super1", role: "super_admin", aldeiaId: null };
      const res = await registarPOST(
        req(
          { nome: "Novo Membro", email: "novo@teste.pt", password: "SenhaMuito#Segura123", role: "COLABORADOR" },
          { id: aldeia.id },
        ),
        { params: Promise.resolve({ id: aldeia.id }) },
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.user.nome).toBe("Novo Membro");
      expect(body.user.email).toBe("novo@teste.pt");
      expect(body.user.password).toBeUndefined();

      const dbUser = await prisma.user.findUnique({ where: { email: "novo@teste.pt" } });
      expect(dbUser.password).toBe("hashed:SenhaMuito#Segura123");
      expect(dbUser.aldeiaId).toBe(aldeia.id);

      const uar = await prisma.userAldeiaRole.findFirst({
        where: { userId: dbUser.id, aldeiaId: aldeia.id },
      });
      expect(uar.roleId).toBe(roles.COLABORADOR);

      const audit = await prisma.auditLog.findFirst({
        where: { action: "CRIAR_MEMBRO_ALDEIA", resourceId: dbUser.id },
      });
      expect(audit).not.toBeNull();
      expect(audit.metadata.addedRole).toBe("COLABORADOR");
    });

    it("devolve 409 com email já registado (sem duplicar)", async () => {
      mocks.user = { id: "super1", role: "super_admin", aldeiaId: null };
      await prisma.user.create({ data: { nome: "Existente", email: "exist@teste.pt", password: "hashed:x", role: "user", saldo: 0 } });
      const res = await registarPOST(
        req(
          { nome: "Outro", email: "exist@teste.pt", password: "SenhaMuito#Segura123", role: "MEMBRO" },
          { id: aldeia.id },
        ),
        { params: Promise.resolve({ id: aldeia.id }) },
      );
      expect(res.status).toBe(409);
      const users = await prisma.user.count({ where: { email: "exist@teste.pt" } });
      expect(users).toBe(1);
    });

    it("devolve 400 com password fraca (mesmas regras do registo)", async () => {
      mocks.user = { id: "super1", role: "super_admin", aldeiaId: null };
      const res = await registarPOST(
        req(
          { nome: "Fraco", email: "fraco@teste.pt", password: "123", role: "MEMBRO" },
          { id: aldeia.id },
        ),
        { params: Promise.resolve({ id: aldeia.id }) },
      );
      expect(res.status).toBe(400);
    });

    it("devolve 403 para utilizador normal", async () => {
      mocks.user = { id: "u1", role: "user", aldeiaId: null };
      const res = await registarPOST(
        req(
          { nome: "Sem Perm", email: "semperm@teste.pt", password: "SenhaMuito#Segura123", role: "MEMBRO" },
          { id: aldeia.id },
        ),
        { params: Promise.resolve({ id: aldeia.id }) },
      );
      expect(res.status).toBe(403);
    });
  });
});
```

Nota: o helper `req` recebe também params — o route lê `context.params`. Para não duplicar, o teste chama `registarPOST(req(...), { params: Promise.resolve({ id: aldeia.id }) })` — o segundo argumento é o `context`. Confirmar assinatura no route implementado.

- [ ] **Step 2: Correr o teste para falhar**

Run: `npx vitest run src/__tests__/integration/real-db/membros-gestao.test.ts`
Expected: FAIL (module not found `/membros/registar/route`).

- [ ] **Step 3: Implementar o route**

Criar `src/app/api/aldeias/[id]/membros/registar/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest, hashPassword } from '@/lib/auth'
import { passwordSchema } from '@/lib/validations'
import { z } from 'zod'

const registrarSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: passwordSchema,
  role: z.enum(['ALDEIA_ADMIN', 'MODERADOR', 'COLABORADOR', 'MEMBRO']).default('MEMBRO'),
})

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const aldeia = await prisma.aldeia.findUnique({
      where: { id },
      include: {
        admins: { select: { id: true } },
        userAldeiaRoles: {
          where: { userId: user.userId },
          include: { role: true },
        },
      },
    })

    if (!aldeia) {
      return NextResponse.json({ error: 'Aldeia não encontrada' }, { status: 404 })
    }

    const isLider = aldeia.admins.some((a: any) => a.id === user.userId)
    const isModerador = aldeia.userAldeiaRoles.some((r: any) => r.role.name === 'MODERADOR')
    const isSuperAdmin = user.role === 'super_admin'

    if (!isLider && !isModerador && !isSuperAdmin) {
      return NextResponse.json({ error: 'Não autorizado para registar membros nesta aldeia' }, { status: 403 })
    }

    const body = await request.json()
    const result = registrarSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: result.error.format() }, { status: 400 })
    }

    const { nome, email, password, role } = result.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email já registado' }, { status: 409 })
    }

    const roleRecord = await prisma.role.findUnique({ where: { name: role } })
    if (!roleRecord) {
      return NextResponse.json({ error: 'Função inválida' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const [novoUser, userAldeiaRole] = await prisma.$transaction([
      prisma.user.create({
        data: {
          nome,
          email,
          password: hashedPassword,
          role: 'user',
          aldeiaId: id,
          saldo: 0,
        },
      }),
      prisma.userAldeiaRole.create({
        data: {
          userId: '', // preenchido após o user existir — ver step 4
          aldeiaId: id,
          roleId: roleRecord.id,
        },
      }),
    ])
  } catch (error) {
    console.error('Error registering member:', error)
    return NextResponse.json({ error: 'Erro ao registar membro' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Corrigir a transação e terminar o route**

A `$transaction` acima tem um placeholder errado (`userId: ''`) — CORRIGIR: primeiro criar o user, depois o userAldeiaRole (a relação `UserAldeiaRole.userId` precisa do id gerado):

```ts
    const novoUser = await prisma.user.create({
      data: { nome, email, password: hashedPassword, role: 'user', aldeiaId: id, saldo: 0 },
    })

    const userAldeiaRole = await prisma.userAldeiaRole.create({
      data: { userId: novoUser.id, aldeiaId: id, roleId: roleRecord.id },
      include: { role: true },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        aldeiaId: id,
        action: 'CRIAR_MEMBRO_ALDEIA',
        resource: 'User',
        resourceId: novoUser.id,
        metadata: {
          targetUserId: novoUser.id,
          targetUserNome: novoUser.nome,
          addedRole: role,
        },
      },
    })

    return NextResponse.json(
      { user: { id: novoUser.id, nome: novoUser.nome, email: novoUser.email, role: novoUser.role }, userAldeiaRole },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error registering member:', error)
    return NextResponse.json({ error: 'Erro ao registar membro' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Correr o teste para passar**

Run: `npx vitest run src/__tests__/integration/real-db/membros-gestao.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/api/aldeias/\[id\]/membros/registar/route.ts src/__tests__/integration/real-db/membros-gestao.test.ts
git commit -m "feat: registar utilizador a partir da aldeia (POST membros/registar com hash e audit)"
git push origin main
```

---

## Task 2: API — GET /membros/search (TDD)

**Files:**
- Modify: `src/__tests__/integration/real-db/membros-gestao.test.ts` (acrescentar bloco `search`)
- Create: `src/app/api/aldeias/[id]/membros/search/route.ts`

- [ ] **Step 1: Acrescentar blocos de teste (fixtures + describe)**

No fim do `beforeAll`, criar utilizadores para o teste de pesquisa:

```ts
    await prisma.user.create({ data: { nome: "Alice Silva", email: "alice@teste.pt", password: "hashed:x", role: "user", saldo: 0 } });
    await prisma.user.create({ data: { nome: "Bruno Costa", email: "bruno@teste.pt", password: "hashed:x", role: "vendedor", saldo: 0 } });
    await prisma.user.create({ data: { nome: "Super Global", email: "super@teste.pt", password: "hashed:x", role: "super_admin", saldo: 0 } });
    await prisma.user.create({ data: { nome: "Membro A", email: "membroa@teste.pt", password: "hashed:x", role: "user", saldo: 0 } });
    // membro a da aldeia:
    const membroA = await prisma.user.findUnique({ where: { email: "membroa@teste.pt" } });
    await prisma.userAldeiaRole.create({ data: { userId: membroA.id, aldeiaId: aldeia.id, roleId: roles.MEMBRO } });
```

Acrescentar o describe no final do ficheiro:

```ts
  describe("GET /membros/search", () => {
    let searchGET: any;

    beforeAll(async () => {
      const route = await import("@/app/api/aldeias/[id]/membros/search/route");
      searchGET = route.GET;
    });

    const reqGET = (q: string | null, params: Record<string, string>) => {
      const url = new URL(`http://test/api/aldeias/${params.id}/membros/search`);
      if (q !== null) url.searchParams.set("q", q);
      return { url: url.toString(), headers: new Headers() } as any;
    };

    it("devolve utilizadores globais que não são membros, por nome", async () => {
      mocks.user = { id: "super1", role: "super_admin", aldeiaId: null };
      const res = await searchGET(reqGET("alice", { id: aldeia.id }), { params: Promise.resolve({ id: aldeia.id }) });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.users.length).toBe(1);
      expect(body.users[0].email).toBe("alice@teste.pt");
    });

    it("procurar por email; não devolve já-membros nem super_admins", async () => {
      mocks.user = { id: "super1", role: "super_admin", aldeiaId: null };
      const res = await searchGET(reqGET("membroa", { id: aldeia.id }), { params: Promise.resolve({ id: aldeia.id }) });
      const body = await res.json();
      expect(body.users.some((u: any) => u.email === "membroa@teste.pt")).toBe(false);

      const resSuper = await searchGET(reqGET("super@teste.pt", { id: aldeia.id }), { params: Promise.resolve({ id: aldeia.id }) });
      const bodySuper = await resSuper.json();
      expect(bodySuper.users.some((u: any) => u.email === "super@teste.pt")).toBe(false);
    });

    it("q com menos de 2 caracteres devolve 400", async () => {
      mocks.user = { id: "super1", role: "super_admin", aldeiaId: null };
      const res = await searchGET(reqGET("a", { id: aldeia.id }), { params: Promise.resolve({ id: aldeia.id }) });
      expect(res.status).toBe(400);
    });

    it("devolve 403 para utilizador normal", async () => {
      mocks.user = { id: "u1", role: "user", aldeiaId: null };
      const res = await searchGET(reqGET("alice", { id: aldeia.id }), { params: Promise.resolve({ id: aldeia.id }) });
      expect(res.status).toBe(403);
    });
  });
```

- [ ] **Step 2: Correr o teste para falhar**

Run: `npx vitest run src/__tests__/integration/real-db/membros-gestao.test.ts`
Expected: FAIL (módulo search não existe).

- [ ] **Step 3: Implementar o route**

Criar `src/app/api/aldeias/[id]/membros/search/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const aldeia = await prisma.aldeia.findUnique({
      where: { id },
      include: {
        admins: { select: { id: true } },
        userAldeiaRoles: {
          where: { userId: user.userId },
          include: { role: true },
        },
      },
    })

    if (!aldeia) {
      return NextResponse.json({ error: 'Aldeia não encontrada' }, { status: 404 })
    }

    const isLider = aldeia.admins.some((a: any) => a.id === user.userId)
    const isModerador = aldeia.userAldeiaRoles.some((r: any) => r.role.name === 'MODERADOR')
    const isSuperAdmin = user.role === 'super_admin'

    if (!isLider && !isModerador && !isSuperAdmin) {
      return NextResponse.json({ error: 'Não autorizado para procurar utilizadores' }, { status: 403 })
    }

    const url = new URL(request.url)
    const q = (url.searchParams.get('q') || '').trim()
    if (q.length < 2) {
      return NextResponse.json({ error: 'Pesquisa deve ter pelo menos 2 caracteres' }, { status: 400 })
    }
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 1), 20)

    const users = await prisma.user.findMany({
      where: {
        role: { not: 'super_admin' },
        NOT: { userAldeiaRoles: { some: { aldeiaId: id } } },
        OR: [
          { nome: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, nome: true, email: true, role: true, telefone: true, aldeiaId: true },
      take: limit,
      orderBy: { nome: 'asc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error searching members:', error)
    return NextResponse.json({ error: 'Erro na pesquisa' }, { status: 500 })
  }
}
```

Nota: `mode: 'insensitive'` é suportado no Postgres; no SQLite o Prisma ignora o mode (contains já é case-insensitive) — seguro nas duas.

- [ ] **Step 4: Correr o teste para passar**

Run: `npx vitest run src/__tests__/integration/real-db/membros-gestao.test.ts`
Expected: PASS (8 tests no total).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/aldeias/\[id\]/membros/search/route.ts src/__tests__/integration/real-db/membros-gestao.test.ts
git commit -m "feat: pesquisa global de utilizadores para adicionar a aldeia (GET membros/search)"
git push origin main
```

---

## Task 3: API — PATCH /membros/[userId] (TDD)

**Files:**
- Modify: `src/__tests__/integration/real-db/membros-gestao.test.ts` (acrescentar bloco `PATCH`)
- Modify: `src/app/api/aldeias/[id]/membros/[userId]/route.ts` (adicionar PATCH ao ficheiro que já tem DELETE)

- [ ] **Step 1: Acrescentar o bloco de teste**

No fim do ficheiro de teste:

```ts
  describe("PATCH /membros/:userId", () => {
    let patchMember: any;

    beforeAll(async () => {
      const route = await import("@/app/api/aldeias/[id]/membros/[userId]/route");
      patchMember = route.PATCH;
    });

    it("edita nome e email de um membro + AuditLog", async () => {
      mocks.user = { id: "super1", role: "super_admin", aldeiaId: null };
      const alice = await prisma.user.findUnique({ where: { email: "alice@teste.pt" } });
      await prisma.userAldeiaRole.create({ data: { userId: alice.id, aldeiaId: aldeia.id, roleId: roles.MEMBRO } });

      const res = await patchMember(
        { json: async () => ({ nome: "Alice M. Silva", email: "alice.silva@teste.pt" }), headers: new Headers(), url: "http://test" } as any,
        { params: Promise.resolve({ id: aldeia.id, userId: alice.id }) },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.nome).toBe("Alice M. Silva");
      expect(body.user.email).toBe("alice.silva@teste.pt");

      const audit = await prisma.auditLog.findFirst({
        where: { action: "EDITAR_MEMBRO_ALDEIA", aldeiaId: aldeia.id },
      });
      expect(audit).not.toBeNull();
      expect(audit.metadata.alteracoes).toContain("nome");
    });

    it("email já usado por outro utilizador devolve 409", async () => {
      mocks.user = { id: "super1", role: "super_admin", aldeiaId: null };
      const alice = await prisma.user.findUnique({ where: { email: "alice.silva@teste.pt" } });
      const res = await patchMember(
        { json: async () => ({ email: "bruno@teste.pt" }), headers: new Headers(), url: "http://test" } as any,
        { params: Promise.resolve({ id: aldeia.id, userId: alice.id }) },
      );
      expect(res.status).toBe(409);
    });

    it("utilizador que não é membro desta aldeia devolve 404", async () => {
      mocks.user = { id: "super1", role: "super_admin", aldeiaId: null };
      const bruno = await prisma.user.findUnique({ where: { email: "bruno@teste.pt" } });
      const res = await patchMember(
        { json: async () => ({ nome: "Bruno X" }), headers: new Headers(), url: "http://test" } as any,
        { params: Promise.resolve({ id: aldeia.id, userId: bruno.id }) },
      );
      expect(res.status).toBe(404);
    });

    it("devolve 403 para utilizador normal", async () => {
      mocks.user = { id: "u1", role: "user", aldeiaId: null };
      const alice = await prisma.user.findUnique({ where: { email: "alice.silva@teste.pt" } });
      const res = await patchMember(
        { json: async () => ({ nome: "X" }), headers: new Headers(), url: "http://test" } as any,
        { params: Promise.resolve({ id: aldeia.id, userId: alice.id }) },
      );
      expect(res.status).toBe(403);
    });
  });
```

- [ ] **Step 2: Correr o teste para falhar**

Run: `npx vitest run src/__tests__/integration/real-db/membros-gestao.test.ts`
Expected: FAIL — `route.PATCH` é undefined (TypeError).

- [ ] **Step 3: Implementar PATCH no route existente**

Em `src/app/api/aldeias/[id]/membros/[userId]/route.ts`, adicionar imports `z` e o schema + handler (manter o DELETE intacto):

```ts
import { z } from 'zod'

const editMemberSchema = z
  .object({
    nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
    email: z.string().email('Email inválido').optional(),
  })
  .refine((data) => data.nome !== undefined || data.email !== undefined, {
    message: 'Pelo menos um campo (nome ou email) é obrigatório',
  })

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string; userId: string }> }) {
  try {
    const { id, userId } = await context.params
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const aldeia = await prisma.aldeia.findUnique({
      where: { id },
      include: {
        admins: { select: { id: true } },
        userAldeiaRoles: {
          where: { userId: user.userId },
          include: { role: true },
        },
      },
    })

    if (!aldeia) {
      return NextResponse.json({ error: 'Aldeia não encontrada' }, { status: 404 })
    }

    const isLider = aldeia.admins.some((admin: any) => admin.id === user.userId)
    const isModerador = aldeia.userAldeiaRoles.some((r: any) => r.role.name === 'MODERADOR')
    const isSuperAdmin = user.role === 'super_admin'

    if (!isLider && !isModerador && !isSuperAdmin) {
      return NextResponse.json({ error: 'Não autorizado para editar membros desta aldeia' }, { status: 403 })
    }

    const membership = await prisma.userAldeiaRole.findFirst({
      where: { aldeiaId: id, userId },
      select: { id: true },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Utilizador não é membro desta aldeia' }, { status: 404 })
    }

    const body = await request.json()
    const result = editMemberSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: result.error.format() }, { status: 400 })
    }
    const { nome, email } = result.data

    if (email) {
      const emailExists = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } },
        select: { id: true },
      })
      if (emailExists) {
        return NextResponse.json({ error: 'Email já registado por outro utilizador' }, { status: 409 })
      }
    }

    const updates: Record<string, string> = {}
    if (nome !== undefined) updates.nome = nome
    if (email !== undefined) updates.email = email

    const targetUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: { id: true, nome: true, email: true },
    })

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        aldeiaId: id,
        action: 'EDITAR_MEMBRO_ALDEIA',
        resource: 'User',
        resourceId: userId,
        metadata: {
          targetUserId: userId,
          targetUserNome: targetUser.nome,
          alteracoes: Object.keys(updates),
        },
      },
    })

    return NextResponse.json({ user: targetUser })
  } catch (error) {
    console.error('Error editing member:', error)
    return NextResponse.json({ error: 'Erro ao editar membro' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Correr o teste para passar**

Run: `npx vitest run src/__tests__/integration/real-db/membros-gestao.test.ts`
Expected: PASS (12 tests no total).

- [ ] **Step 5: Suite completa**

Run: `npx vitest run`
Expected: PASS (429 + 12 novos, sem regressões).

- [ ] **Step 6: Commit**

```bash
git add src/app/api/aldeias/\[id\]/membros/\[userId\]/route.ts src/__tests__/integration/real-db/membros-gestao.test.ts
git commit -m "feat: editar nome e email de membro da aldeia (PATCH membros com audit)"
git push origin main
```

---

## Task 4: Banner — hero no detalhe da aldeia

**Files:**
- Modify: `src/app/aldeia/[aldeiaId]/aldeia-header.tsx`

- [ ] **Step 1: Envolver o header num hero com banner**

Em `src/app/aldeia/[aldeiaId]/aldeia-header.tsx`, substituir o fragmento `<>...</>` pelo seguinte (mantém todo o conteúdo atual; só muda o wrapper):

```tsx
  const hasBanner = !!aldeia.bannerUrl

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${
        hasBanner ? "p-5 md:p-6" : ""
      }`}
    >
      {hasBanner && (
        <>
          <div
            className="absolute inset-0"
            style={{ backgroundImage: `url(${aldeia.bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
          <div className="absolute inset-0 bg-black/50" />
        </>
      )}

      <div className="relative z-10">
        <Button variant="ghost" size="sm" className="mb-4 text-foreground bg-background/20 hover:bg-background/30" onClick={() => router.push("/aldeias")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar às Aldeias
        </Button>

        <div className="flex items-start justify-between mb-6">
          {/* conteúdo atual: logo/identidade + botão Novo Evento, inalterado */}
        </div>
      </div>
    </div>
  )
```

Nota: quando há banner, o botão "Voltar" e o texto ficam claros (overlay escuro) — o conteúdo que estava usado com cores dark deve ficar legível; manter o resto do JSX atual (logo com `bg-primary/10` etc.) dentro do `div.relative.z-10`.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: sem erros (confirmar `aldeia.bannerUrl` existe em `AldeiaData` — sim, `aldeia-types.ts:15`).

- [ ] **Step 3: Commit**

```bash
git add src/app/aldeia/\[aldeiaId\]/aldeia-header.tsx
git commit -m "feat: hero com banner no detalhe da aldeia"
git push origin main
```

---

## Task 5: Banner — capa nos cards de /aldeias

**Files:**
- Modify: `src/app/aldeias/page.tsx` (interface `Aldeia` + card)

- [ ] **Step 1: Adicionar `bannerUrl` à interface**

Em `src/app/aldeias/page.tsx:24-40` (interface `Aldeia`):

```ts
  bannerUrl?: string
```

- [ ] **Step 2: Capa no card**

No card (linha ~381-383), substituir a barra de gradiente `h-1` por capa condicional:

```tsx
                      {aldeia.bannerUrl ? (
                        <div className="h-20 sm:h-24 overflow-hidden">
                          <img
                            src={aldeia.bannerUrl}
                            alt=""
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className={`h-1 bg-gradient-to-r ${TIPO_ACCENT[aldeia.tipoOrganizacao] || "from-primary/60 to-primary/10"}`} />
                      )}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/aldeias/page.tsx
git commit -m "feat: capa com banner nos cards de aldeias"
git push origin main
```

---

## Task 6: Dialog Adicionar Membro — 2 modos (Procurar/Criar)

**Files:**
- Modify: `src/app/aldeia/[aldeiaId]/aldeia-add-member-dialog.tsx` (reescrever)
- Modify: `src/app/aldeia/[aldeiaId]/page.tsx` (handler `handleAddMember` → aceita registo)

- [ ] **Step 1: Reescrever o dialog**

`src/app/aldeia/[aldeiaId]/aldeia-add-member-dialog.tsx` — componente completo (substituir o ficheiro):

```tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Search, UserPlus, Loader2, User } from "lucide-react"
import { toast } from "sonner"
import { ALL_ROLES } from "./aldeia-types"

interface SearchResult {
  id: string
  nome: string
  email: string
  role: string
}

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (email: string, role: string) => Promise<void>
  onRegistar: (data: { nome: string; email: string; password: string; role: string }) => Promise<void>
  aldeiaId: string
}

export function AddMemberDialog({ open, onOpenChange, onAdd, onRegistar, aldeiaId }: AddMemberDialogProps) {
  const [modo, setModo] = useState<"procurar" | "criar">("procurar")
  const [q, setQ] = useState("")
  const [resultados, setResultados] = useState<SearchResult[]>([])
  const [pesquisando, setPesquisando] = useState(false)
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [role, setRole] = useState("MEMBRO")
  const [submitting, setSubmitting] = useState(false)
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorRegistar, setErrorRegistar] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) return
    setModo("procurar"); setQ(""); setResultados([]); setSelected(null)
    setRole("MEMBRO"); setNome(""); setEmail(""); setPassword(""); setErrorRegistar("")
  }, [open])

  useEffect(() => {
    if (modo !== "procurar" || q.trim().length < 2) {
      setResultados([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setPesquisando(true)
      try {
        const res = await fetch(`/api/aldeias/${aldeiaId}/membros/search?q=${encodeURIComponent(q)}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        setResultados(data.users || [])
      } catch {
        setResultados([])
      } finally {
        setPesquisando(false)
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [q, modo, aldeiaId])

  const handleAdicionar = async () => {
    if (!selected || submitting) return
    setSubmitting(true)
    try {
      await onAdd(selected.email, role)
      setSelected(null); setRole("MEMBRO")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCriar = async () => {
    if (submitting) return
    setSubmitting(true)
    setErrorRegistar("")
    try {
      await onRegistar({ nome, email, password, role })
    } catch (e: any) {
      setErrorRegistar(e.message || "Erro ao registar")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Membro</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 rounded-lg bg-surface-container-low p-1">
          <button
            type="button"
            onClick={() => setModo("procurar")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${modo === "procurar" ? "bg-background shadow" : "text-muted-foreground"}`}
          >
            Procurar
          </button>
          <button
            type="button"
            onClick={() => setModo("criar")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${modo === "criar" ? "bg-background shadow" : "text-muted-foreground"}`}
          >
            Criar novo
          </button>
        </div>

        {modo === "procurar" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={e => { setQ(e.target.value); setSelected(null) }}
                placeholder="Procurar por nome ou email..."
                className="pl-10"
              />
            </div>

            {pesquisando && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> A procurar...</p>}

            {!pesquisando && resultados.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border p-1">
                {resultados.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelected(u)}
                    className={`w-full flex items-center gap-3 rounded-lg p-2 text-left transition-colors ${selected?.id === u.id ? "bg-primary/10" : "hover:bg-surface-container-low"}`}
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!pesquisando && q.trim().length >= 2 && resultados.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Sem resultados.{" "}
                <button type="button" className="text-primary underline" onClick={() => { setModo("criar"); setEmail(q.includes("@") ? q : "") }}>
                  Criar novo utilizador
                </button>
              </p>
            )}

            {selected && (
              <div className="rounded-xl border p-3 space-y-3">
                <p className="text-sm"><span className="font-medium">{selected.nome}</span> · {selected.email}</p>
                <div>
                  <Label>Função</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        )}

        {modo === "criar" && (
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 12 caracteres, maiúscula, minúscula, número e símbolo" />
            </div>
            <div>
              <Label>Função</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {errorRegistar && <p className="text-sm text-red-500" role="alert">{errorRegistar}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {modo === "procurar" ? (
            <Button onClick={handleAdicionar} disabled={!selected || submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar à aldeia
            </Button>
          ) : (
            <Button onClick={handleCriar} disabled={submitting || !nome.trim() || !email.trim() || !password}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar e adicionar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: page.tsx — handler de registo**

Em `src/app/aldeia/[aldeiaId]/page.tsx`, adicionar handler e passá-lo ao dialog:

```tsx
  const handleRegistarMembro = async (data: { nome: string; email: string; password: string; role: string }) => {
    try {
      const res = await apiRequest(`/api/aldeias/${aldeiaId}/membros/registar`, {
        method: "POST",
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro")
      }
      toast.success("Utilizador criado e adicionado à aldeia")
      setShowAddMember(false)
      fetchAldeia()
    } catch (e: any) {
      throw e
    }
  }
```

E no `<AddMemberDialog ... />` (linha ~407):

```tsx
      <AddMemberDialog
        open={showAddMember}
        onOpenChange={setShowAddMember}
        onAdd={handleAddMember}
        onRegistar={handleRegistarMembro}
        aldeiaId={aldeiaId}
      />
```

Nota: `handleRegistarMembro` rethrows para o dialog mostrar o erro (409 "Email já registado").

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/aldeia/\[aldeiaId\]/aldeia-add-member-dialog.tsx src/app/aldeia/\[aldeiaId\]/page.tsx
git commit -m "feat: dialogo adicionar membro com procura global e registo de novo utilizador"
git push origin main
```

---

## Task 7: Editar membro — MemberEditDialog + integração

**Files:**
- Create: `src/app/aldeia/[aldeiaId]/aldeia-member-edit-dialog.tsx`
- Modify: `src/app/aldeia/[aldeiaId]/aldeia-members.tsx` (botão lápis + estado/dialog interno)

- [ ] **Step 1: Criar o dialog de edição**

`src/app/aldeia/[aldeiaId]/aldeia-member-edit-dialog.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface MemberEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  membro: { userId: string; nome: string; email: string } | null
  onSave: (userId: string, data: { nome?: string; email?: string }) => Promise<void>
}

export function MemberEditDialog({ open, onOpenChange, membro, onSave }: MemberEditDialogProps) {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open || !membro) return
    setNome(membro.nome)
    setEmail(membro.email)
    setError("")
  }, [open, membro])

  const handleSave = async () => {
    if (!membro || saving) return
    setSaving(true)
    setError("")
    try {
      await onSave(membro.userId, { nome, email })
    } catch (e: any) {
      setError(e.message || "Erro ao guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Membro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-500" role="alert">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !nome.trim() || !email.trim()}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Integrar na tab Membros**

Em `src/app/aldeia/[aldeiaId]/aldeia-members.tsx`:
- Imports: `Pencil` de lucide, `MemberEditDialog`.
- Estado: `const [editTarget, setEditTarget] = useState<{ userId: string; nome: string; email: string } | null>(null)`.
- Prop nova na interface `AldeiaMembersProps`: `onEditMember: (userId: string, data: { nome?: string; email?: string }) => Promise<void>`.
- Na linha do membro, junto do Select de função (visível quando `isAdmin && membro.userId !== currentUserId`):

```tsx
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => setEditTarget({ userId: membro.userId, nome: membro.user.nome, email: membro.user.email })}
                      title="Editar membro"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
```

- Fechar o Card com o dialog:

```tsx
      <MemberEditDialog
        open={!!editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null) }}
        membro={editTarget}
        onSave={async (userId, data) => {
          await onEditMember(userId, data)
          setEditTarget(null)
        }}
      />
```

NOTA: `membro.user.email` — o tipo atual de `userAldeiaRoles` em `aldeia-types.ts:33` é `user: { id, nome, role }` — **adicionar `email: string`** ao tipo:

```ts
    user: { id: string; nome: string; role: string; email: string }
```

(Confirmar que a API GET /api/aldeias/[id] devolve o email do user no include de userAldeiaRoles — se não devolver, adicionar `email: true` ao include em `src/app/api/aldeias/[id]/route.ts` no select de `userAldeiaRoles.user`.)

- [ ] **Step 3: page.tsx — handler PATCH**

Em `src/app/aldeia/[aldeiaId]/page.tsx`:

```tsx
  const handleEditMember = async (userId: string, data: { nome?: string; email?: string }) => {
    try {
      const res = await apiRequest(`/api/aldeias/${aldeiaId}/membros/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro")
      }
      toast.success("Membro atualizado")
      fetchAldeia()
    } catch (e: any) {
      throw e
    }
  }
```

E passar `onEditMember={handleEditMember}` ao `<AldeiaMembers ... />` (linha ~364).

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/app/aldeia/\[aldeiaId\]/aldeia-member-edit-dialog.tsx src/app/aldeia/\[aldeiaId\]/aldeia-members.tsx src/app/aldeia/\[aldeiaId\]/page.tsx src/app/aldeia/\[aldeiaId\]/aldeia-types.ts
git commit -m "feat: editar nome e email de membro na tab membros"
git push origin main
```

---

## Task 8: Verificação final + deploy

**Files:**
- Run, sem alterações de código

- [ ] **Step 1: Suite completa**

Run: `npx vitest run`
Expected: PASS (441 testes ≈ 429 + 12 novos).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 3: Build de produção local**

Run: `DATABASE_URL="file:./dev.db" npx next build --webpack`
Expected: build OK (140 páginas).

- [ ] **Step 4: Commit final + push (deploy Vercel)**

```bash
git add -A
git commit -m "feat: banner de aldeia e gestao de membros (registar, procurar, editar)"
git push origin main
```

- [ ] **Step 5: Verificar deploy (`aldeias_games`, sha do último commit)**

Confirmar via status do GitHub ou https://aldeiasgames.vercel.app (200). Neon não muda nesta iteração (sem alterações de schema).

---

## Self-Review

**1. Cobertura da spec:**
- Banner detalhe → Task 4 ✓; banner cards → Task 5 ✓; tipos → Tasks 4 e 5 ✓
- POST registar (hash, 409, 403, regras de password) → Task 1 ✓
- GET search (global, exclui membros/super_admin, q≥2, limit) → Task 2 ✓
- PATCH (nome/email, 409/404/403, audit) → Task 3 ✓
- Dialog 2 modos + 409 com "adicionar à aldeia" (modo criar sem resultados → oferece criar) → Task 6 ✓ (o fluxo de 409 usa o `errorRegistar`; a oferta de adicionar está no modo procurar sem resultados)
- Editar (lápis + dialog + tipo email) → Task 7 ✓
- Testes globais → Tasks 1-3 + 8 ✓
**2. Placeholders:** nenhum "TBD"; o passo 4 da Task 1 corrige intencionalmente o snippet incompleto do passo 3 — o texto instrui a substituição (não é placeholder, é correção explícita). ✓
**3. Consistência de tipos:** `onRegistar`/`handleRegistarMembro` com mesma assinatura; `MemberEditDialog` membro prop `{ userId, nome, email }` coincide com `editTarget`; `onEditMember`/`handleEditMember` iguais; `teste` usa `role: { not: 'super_admin' }` e UI mostra `u.role` — `SearchResult.role` é string; `passwordSchema` importado de `@/lib/validations` (mesmo usado no registo normal). ✓