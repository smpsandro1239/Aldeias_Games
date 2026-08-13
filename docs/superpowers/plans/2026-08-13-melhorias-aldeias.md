# Melhorias de Aldeias Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar a gestão de aldeias mais útil: cards clicáveis com localidade, tab Participações no detalhe, Geral com contactos/conformidade/checklist, membros pesquisáveis e agrupados, e pagamentos por aldeia (telefoneMBWay, emailPagamentos, métodos aceites).

**Architecture:** Feature increment nos ficheiros existentes: schema ganha 2 campos na Aldeia; `GET /api/participacoes` ganha filtro `aldeiaId` (super_admin global / aldeia_admin só a própria); page de detalhe lê `?tab=` da URL (Suspense + useSearchParams); novos componentes presentacional em `src/app/aldeia/[aldeiaId]/`. TDD apenas onde há lógica de negócio (filtro aldeiaId). O resto é UI com verificação via typecheck + testes existentes.

**Tech Stack:** Next.js 16 (App Router, client components), Prisma 6.19.3 (SQLite dev / Postgres Neon prod), Tailwind v4, shadcn/ui, Vitest (real-db tests com SQLite temporário), lucide-react.

**Spec:** `docs/superpowers/specs/2026-08-13-melhorias-aldeias-design.md`

**Convenções obrigatórias:**
- Commits SEMPRE em pt-PT, formato `type: descrição`; commit+push em cada tarefa (regra do AGENTS.md).
- PowerShell: nunca heredocs; `git commit -F` com ficheiro temporário se necessário.
- Não usar `include: { user: true }` novo; mantém-se o select atual.
- IDs sensíveis vêm do JWT, nunca do body.

---

## Task 1: Schema — telefoneMBWay + emailPagamentos

**Files:**
- Modify: `prisma/schema.prisma` (model Aldeia)
- Modify: `src/app/aldeia/[aldeiaId]/aldeia-types.ts`

- [ ] **Step 1: Adicionar campos ao model Aldeia**

Em `prisma/schema.prisma`, dentro do model `Aldeia`, junto dos campos `iban`/`nomeTitularConta`:

```prisma
  iban                    String?
  nomeTitularConta        String?
  telefoneMBWay           String?
  emailPagamentos         String?
```

- [ ] **Step 2: Aplicar à BD local**

Run: `DATABASE_URL="file:./dev.db" npx prisma@6.19.3 db push`
Expected: `Now using SQLite`, schema sync sem erros (2 colunas novas em `Aldeia`).

- [ ] **Step 3: Atualizar tipo AldeiaData**

Em `src/app/aldeia/[aldeiaId]/aldeia-types.ts:18`, depois de `nomeTitularConta`:

```ts
  telefoneMBWay: string | null
  emailPagamentos: string | null
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/app/aldeia/\[aldeiaId\]/aldeia-types.ts
git commit -m "feat: campos telefoneMBWay e emailPagamentos na aldeia (schema)"
git push origin main
```

---

## Task 2: API — filtro `aldeiaId` em GET /api/participacoes (TDD)

**Files:**
- Test: `src/__tests__/integration/real-db/participacoes-aldeia-filter.test.ts`
- Modify: `src/app/api/participacoes/route.ts:53-95` (bloco de permissões do GET)

Filtro aceite apenas por `super_admin` (global) e `aldeia_admin` (só a própria aldeia — 403 se pedir outra). `vendedor`/`user` → 403. Se `jogoId` e `aldeiaId` forem enviados em conjunto, `aldeiaId` tem precedência.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/__tests__/integration/real-db/participacoes-aldeia-filter.test.ts`:

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
  verifyToken: async () =>
    mocks.user
      ? { userId: mocks.user.id, role: mocks.user.role, aldeiaId: mocks.user.aldeiaId ?? null }
      : null,
}));

describe("Real DB: Filtro aldeiaId em GET /api/participacoes", () => {
  let prisma: any;
  let GET: any;
  let aldeiaA: any, aldeiaB: any, jogoA: any;

  const req = (params: Record<string, string>) =>
    new NextRequest(`http://test/api/participacoes?${new URLSearchParams(params)}`) as any;

  beforeAll(async () => {
    setupTestDatabase();
    prisma = await getPrisma();
    const route = await import("@/app/api/participacoes/route");
    GET = route.GET;

    aldeiaA = await prisma.aldeia.create({
      data: { nome: "Aldeia A", slug: "aldeia-a", tipoOrganizacao: "aldeia", email: "a@b.pt" },
    });
    aldeiaB = await prisma.aldeia.create({
      data: { nome: "Aldeia B", slug: "aldeia-b", tipoOrganizacao: "aldeia", email: "b@b.pt" },
    });
    const evento = await prisma.evento.create({
      data: { nome: "Evento A", aldeiaId: aldeiaA.id, dataInicio: new Date() },
    });
    jogoA = await prisma.jogo.create({
      data: {
        nome: "Rifa A",
        tipo: "rifa",
        preco: 2,
        stock: 100,
        eventoId: evento.id,
        estado: "ativo",
      },
    });
    const jogador = await prisma.user.create({
      data: { nome: "Jogador", email: "j@b.pt", password: "$2b$10$fakehash", role: "user", saldo: 10 },
    });
    await prisma.participacao.create({
      data: { jogoId: jogoA.id, userId: jogador.id, valorPago: 2, estadoPagamento: "concluido", estado: "ativa" },
    });
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it("super_admin vê participações da aldeia pedida (e não de outras)", async () => {
    mocks.user = { id: "super1", role: "super_admin", aldeiaId: null };
    const res = await GET(req({ aldeiaId: aldeiaA.id }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBe(1);

    const resOutra = await GET(req({ aldeiaId: aldeiaB.id }));
    const bodyOutra = await resOutra.json();
    expect(bodyOutra.data.length).toBe(0);
  });

  it("aldeia_admin só pode filtrar a própria aldeia (403 noutra)", async () => {
    mocks.user = { id: "admB", role: "aldeia_admin", aldeiaId: aldeiaB.id };
    const res = await GET(req({ aldeiaId: aldeiaA.id }));
    expect(res.status).toBe(403);

    mocks.user = { id: "admA", role: "aldeia_admin", aldeiaId: aldeiaA.id };
    const resOk = await GET(req({ aldeiaId: aldeiaA.id }));
    expect(resOk.status).toBe(200);
    const body = await resOk.json();
    expect(body.data.length).toBe(1);
  });

  it("vendedor e user recebem 403 com aldeiaId", async () => {
    mocks.user = { id: "v1", role: "vendedor", aldeiaId: aldeiaA.id, saldo: 0 };
    expect((await GET(req({ aldeiaId: aldeiaA.id }))).status).toBe(403);
    mocks.user = { id: "u1", role: "user", aldeiaId: null };
    expect((await GET(req({ aldeiaId: aldeiaA.id }))).status).toBe(403);
  });
});
```

- [ ] **Step 2: Correr o teste para o ver falhar**

Run: `npx vitest run src/__tests__/integration/real-db/participacoes-aldeia-filter.test.ts`
Expected: FAIL — `aldeiaId` ignorado (super_admin vê tudo; 1 vs 1 não distingue) e 403 esperado vem 200.

- [ ] **Step 3: Implementar o filtro**

Em `src/app/api/participacoes/route.ts`, no GET, após o bloco `where` base (linhas ~41-51) e ANTES do bloco de permissões por role (linha 54). Inserir:

```ts
     const aldeiaId = url.searchParams.get('aldeiaId');

     if (aldeiaId) {
       if (user.role === 'super_admin') {
         // Global: filtra participações dos jogos da aldeia pedida
         const jogosData = await prisma.jogo.findMany({
           where: { evento: { aldeiaId } },
           select: { id: true },
         });
         where = {
           ...where,
           jogoId: { in: jogosData.map((j: { id: string }) => j.id) },
         };
       } else if (user.role === 'aldeia_admin') {
         // Admin só pode filtrar a própria aldeia (o branch de role já estreita para a sua)
         if (aldeiaId !== user.aldeiaId) {
           return NextResponse.json(
             { error: 'Não autorizado a consultar participações de outra aldeia' },
             { status: 403 }
           );
         }
       } else {
         // vendedor / user normal não consultam participações de aldeias
         return NextResponse.json(
           { error: 'Não autorizado' },
           { status: 403 }
         );
       }
     }
```

Nota: para `aldeia_admin`, o branch de role existente (linhas 59-81) já limita aos jogos da própria aldeia → não há código extra. Para `super_admin`, o `where` resultante combina (AND implícito) com o `userId` quando ambos enviados (`where.id = userId` no branch existente).

- [ ] **Step 4: Correr o teste para o ver passar**

Run: `npx vitest run src/__tests__/integration/real-db/participacoes-aldeia-filter.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Garantir que o conjunto completo não regrediu**

Run: `npx vitest run`
Expected: PASS (388 + 3 testes).

- [ ] **Step 6: Commit**

```bash
git add src/app/api/participacoes/route.ts src/__tests__/integration/real-db/participacoes-aldeia-filter.test.ts
git commit -m "feat: filtro aldeiaId em GET /api/participacoes (super_admin global, admin so propria aldeia)"
git push origin main
```

---

## Task 3: API — PATCH /api/aldeias/[id] aceita os novos campos

**Files:**
- Modify: `src/app/api/aldeias/[id]/route.ts:18-35` (updateSchema) e `:161` (sensitiveFields)

- [ ] **Step 1: Estender o updateSchema**

Em `src/app/api/aldeias/[id]/route.ts`, no objeto do zod update schema (junto de `iban`/`nomeTitularConta`, linhas 19-20):

```ts
  telefoneMBWay: z.string().optional(),
  emailPagamentos: z.string().optional(),
```

- [ ] **Step 2: Adicionar os campos aos sensitiveFields**

Na linha 161:

```ts
    const sensitiveFields = ['iban', 'nomeTitularConta', 'telefoneMBWay', 'emailPagamentos']
```

Efeito: edição destes campos por não-super-admin passa pelo fluxo de aprovação (PendingAldeiaChange) já existente — sem código extra; o fluxo de decisão (`[changeId]/route.ts`) já aplica `campo` genérico.

- [ ] **Step 3: Typecheck + testes**

Run: `npm run typecheck && npx vitest run src/__tests__/integration/real-db/pending-changes.test.ts`
Expected: ambos PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/aldeias/\[id\]/route.ts
git commit -m "feat: aceitar telefoneMBWay e emailPagamentos no update de aldeia (sensiveis com aprovacao)"
git push origin main
```

---

## Task 4: Listagem /aldeias — cards clicáveis + localidade

**Files:**
- Modify: `src/app/aldeias/page.tsx` (interface Aldeia, card)

Nota: `GET /api/aldeias` devolve `...aldeia` (spread) — `localidade` chega automaticamente ao frontend depois do Task 1.

- [ ] **Step 1: Adicionar localidade à interface**

Em `src/app/aldeias/page.tsx:24-40` (interface `Aldeia`):

```ts
  localidade?: string
```

- [ ] **Step 2: Tornar o card clicável e mostrar localidade**

Substituir o bloco que abre os cards (linha 381):

```tsx
                {aldeias.map((aldeia) => {
                  const Icon = TIPO_ICON[aldeia.tipoOrganizacao] || Building2
                  return (
                    <Card
                      key={aldeia.id}
                      className="group overflow-hidden h-full transition-all hover:shadow-lg hover:border-primary/50 flex flex-col cursor-pointer"
                    >
```

Fechar o card com onClick no `CardContent` (após o `</div>` do "flex items-center justify-between", linha ~458, antes do fecho do `CardContent`):

```tsx
                        <div
                          className="flex-1"
                          onClick={() => router.push(`/aldeia/${aldeia.id}`)}
                          aria-label={`Ver detalhe de ${aldeia.nome}`}
                        >
```

E mover o `onClick` de navegação para o `CardContentChild` — implementação simples: envolver todo o `CardContent` existente (linhas 410-458) com o div acima e remover o botão "Ver" (linhas 452-456), mantendo o botão Editar (que recebe `onClick={(e) => { e.stopPropagation(); setEditingAldeia(aldeia); setIsCreateModalOpen(true); }}` para não navegar).

Mostrar a localidade ao lado do nome (após o CardTitle, linha 390):

```tsx
                              {aldeia.localidade && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3 w-3" /> {aldeia.localidade}
                                </p>
                              )}
```

Nota: `MapPin` já está importado (linha 17); `router` já existe.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: sem erros (Botão "Ver" removido → sem imports mortos; `Eye` continua usado no botão Editar? — se `Eye` ficar sem uso, remover do import da linha 18).

- [ ] **Step 4: Commit**

```bash
git add src/app/aldeias/page.tsx
git commit -m "feat: cards de aldeias clicaveis com localidade"
git push origin main
```

---

## Task 5: Detalhe da aldeia — tab na URL (?tab=) com Suspense

**Files:**
- Modify: `src/app/aldeia/[aldeiaId]/page.tsx`

- [ ] **Step 1: Wrapper com Suspense (useSearchParams exige boundary no prerender)**

Em `src/app/aldeia/[aldeiaId]/page.tsx`:
- Altera `export default function AldeiaDetailPage()` → `function AldeiaDetailContent()`.
- Adiciona no fim do ficheiro o default export:

```tsx
export default function AldeiaDetailPage() {
  return (
    <Suspense fallback={<LoaderScreen message="A carregar aldeia..." />}>
      <AldeiaDetailContent />
    </Suspense>
  )
}
```

- Importa `Suspense` de `react` (linha 3: `import { Suspense, useEffect, useState, useCallback } from "react"`) e `useSearchParams` de `next/navigation` (linha 4).

- [ ] **Step 2: Ler e sincronizar a tab**

Dentro de `AldeiaDetailContent`, junto de `const router = useRouter()`:

```tsx
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
```

Após `const [activeTab, setActiveTab] = useState("overview")` (linha 33):

```tsx
  const VALID_TABS = ["overview", "participacoes", "members", "events", "settings"]
```

E no fim do componente, antes do return final (após o bloco `if (loading)...`), um effect:

```tsx
  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])
```

Nota: colocar o effect antes do `if (loading)` para respeitar regras de hooks (nunca condicional).

Alterar o `onValueChange` do `<Tabs>` (linha 343):

```tsx
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value)
            router.replace(`/aldeia/${aldeiaId}?tab=${value}`, { scroll: false })
          }}
        >
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 4: Smoke manual/prod build**

Run: `npx next build --webpack`
Expected: build conclusiva (sem erro de useSearchParams sem Suspense).

- [ ] **Step 5: Commit**

```bash
git add src/app/aldeia/\[aldeiaId\]/page.tsx
git commit -m "feat: tab do detalhe de aldeia sincronizada com ?tab= na URL"
git push origin main
```

---

## Task 6: Tab Participações (novo componente + integração)

**Files:**
- Create: `src/app/aldeia/[aldeiaId]/aldeia-participacoes.tsx`
- Modify: `src/app/aldeia/[aldeiaId]/page.tsx` (import + TabsTrigger/TabsContent)

- [ ] **Step 1: Criar o componente**

`src/app/aldeia/[aldeiaId]/aldeia-participacoes.tsx`:

```tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Download, Search, Ticket } from "lucide-react"
import { toast } from "sonner"
import { generateCSV, downloadCSV } from "@/lib/export-utils"

interface ParticipacaoRow {
  id: string
  valorPago: number
  metodoPagamento: string
  estadoPagamento: string
  ganhador: boolean
  premioEntregue: boolean
  createdAt: string
  nomeCliente: string | null
  emailCliente: string | null
  telefoneCliente: string | null
  jogo: { nome: string; tipo: string }
}

interface AldeiaParticipacoesProps {
  aldeiaId: string
}

export function AldeiaParticipacoes({ aldeiaId }: AldeiaParticipacoesProps) {
  const [items, setItems] = useState<ParticipacaoRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [ganhador, setGanhador] = useState("all")
  const limit = 50

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        aldeiaId,
        limit: String(limit),
        page: String(page),
      })
      if (search) params.set("search", search)
      if (ganhador === "ganhadores") params.set("ganhador", "true")
      const res = await fetch(`/api/participacoes?${params.toString()}`)
      if (!res.ok) throw new Error("Erro")
      const data = await res.json()
      setItems(data.data || [])
      setTotal(data.pagination?.total ?? 0)
    } catch {
      toast.error("Erro ao carregar participações")
    } finally {
      setLoading(false)
    }
  }, [aldeiaId, page, search, ganhador])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExportCSV = () => {
    const csv = generateCSV(
      ["Data", "Jogo", "Cliente", "Email", "Telefone", "Valor (€)", "Método", "Estado", "Ganhador", "Prémio Entregue"],
      items.map(i => [
        new Date(i.createdAt).toLocaleDateString("pt-PT"),
        i.jogo?.nome || "",
        i.nomeCliente || "",
        i.emailCliente || "",
        i.telefoneCliente || "",
        i.valorPago.toFixed(2),
        i.metodoPagamento,
        i.estadoPagamento,
        i.ganhador ? "Sim" : "Não",
        i.premioEntregue ? "Sim" : "Não",
      ]),
    )
    downloadCSV(csv, `participacoes-aldeia-${aldeiaId.slice(0, 8)}.csv`)
    toast.success("CSV exportado")
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <div>
          <CardTitle className="text-base">Participações</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{total} registo(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExportCSV} disabled={items.length === 0}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Procurar por nome, email ou telefone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={ganhador}
            onChange={e => { setGanhador(e.target.value); setPage(1) }}
            className="h-10 rounded-lg border bg-surface-container-low px-3 text-sm"
          >
            <option value="all">Todos</option>
            <option value="ganhadores">Ganhadores</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhuma participação encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-surface-container-low text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Jogo</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3">Método</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Prémio</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map(i => (
                  <tr key={i.id} className="hover:bg-muted/30">
                    <td className="p-3 whitespace-nowrap">{new Date(i.createdAt).toLocaleDateString("pt-PT")}</td>
                    <td className="p-3">{i.jogo?.nome || "—"}</td>
                    <td className="p-3">
                      <p>{i.nomeCliente || "—"}</p>
                      {(i.emailCliente || i.telefoneCliente) && (
                        <p className="text-xs text-muted-foreground">{i.emailCliente || i.telefoneCliente}</p>
                      )}
                    </td>
                    <td className="p-3 font-medium">{i.valorPago.toFixed(2)}€</td>
                    <td className="p-3 capitalize">{i.metodoPagamento}</td>
                    <td className="p-3 capitalize">{i.estadoPagamento}</td>
                    <td className="p-3">
                      {i.ganhador ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {i.premioEntregue ? "Entregue" : "Pendente"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                Anterior
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                Próxima
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

Nota: o endpoint atual não tem `search` — o filtro é aplicado em cliente sobre `items` no próximo passo (rename `const filteredItems`). Aplicar:

```tsx
  const filteredItems = search.trim()
    ? items.filter(i =>
        (i.nomeCliente || "").toLowerCase().includes(search.toLowerCase()) ||
        (i.emailCliente || "").toLowerCase().includes(search.toLowerCase()) ||
        (i.telefoneCliente || "").toLowerCase().includes(search.toLowerCase())
      )
    : items
```

e usar `filteredItems` no CSV (`items.map` → `filteredItems.map`) e na tabela (`items.map` → `filteredItems.map`).

- [ ] **Step 2: Integrar no page.tsx**

Em `src/app/aldeia/[aldeiaId]/page.tsx`:
- Import: `import { AldeiaParticipacoes } from "./aldeia-participacoes"` e `Ticket` em lucide (linha 14).
- TabsTrigger após "Geral" (linha 346), só para admin:

```tsx
            {isAdmin && (
              <TabsTrigger value="participacoes"><Ticket className="h-4 w-4 mr-2" /> Participações</TabsTrigger>
            )}
```

- TabsContent (após o content de overview):

```tsx
          {isAdmin && (
            <TabsContent value="participacoes">
              <AldeiaParticipacoes aldeiaId={aldeiaId} />
            </TabsContent>
          )}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/aldeia/\[aldeiaId\]/aldeia-participacoes.tsx src/app/aldeia/\[aldeiaId\]/page.tsx
git commit -m "feat: tab participacoes no detalhe de aldeia com CSV e filtros"
git push origin main
```

---

## Task 7: Gerall — cards de contactos, conformidade e checklist

**Files:**
- Modify: `src/app/aldeia/[aldeiaId]/aldeia-overview.tsx`

- [ ] **Step 1: Novo card "Participações" nos stats**

Na grelha de 4 stats (linhas 23-64), após o card "Prémios":

```tsx
        <Card
          className="border-primary/20 cursor-pointer hover:bg-primary/5 hover:border-primary/40 transition-all"
          onClick={() => onTab("participacoes")}
        >
          <CardContent className="pt-6 text-center">
            <Ticket className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-3xl font-bold">{aldeia._count.participacoes}</p>
            <p className="text-sm text-muted-foreground">Participações</p>
          </CardContent>
        </Card>
```

- Import `Ticket` no lucide (linha 6).

Nota: `aldeia._count.participacoes` — adicionar ao tipo em Task 8 (step 3) e ao `GET /api/aldeias/[id]` (include `_count` gains `participacoes: true`). Sem isso, o card mostra undefined — o Task 8 faz o acoplamento. (Fazê-lo já aqui: no `page.tsx` a `_count` vem da API; alterar também `src/app/api/aldeias/[id]/route.ts:44` `select: { userAldeiaRoles: true, eventos: true, jogos: true, premios: true, participacoes: true }`.)

- [ ] **Step 2: Card Contactos**

Após o bloco `descricao`/`admins` (linhas 66-87), adicionar:

```tsx
      <Card className="md:col-span-2">
        <CardHeader><CardTitle className="text-base">Contactos</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {aldeia.telefone && (
            <p className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> {aldeia.telefone}</p>
          )}
          {aldeia.email && (
            <p className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /> {aldeia.email}</p>
          )}
          {aldeia.morada && (
            <p className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /> {aldeia.morada}</p>
          )}
          {aldeia.localidade && (
            <p className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /> {aldeia.localidade}</p>
          )}
          {!aldeia.telefone && !aldeia.email && !aldeia.morada && !aldeia.localidade && (
            <p className="text-sm text-muted-foreground">Sem contactos registados</p>
          )}
        </CardContent>
      </Card>
```

- Imports lucide: `Phone`, `Mail` (MapPin já não está importado — adicionar `MapPin`).

- [ ] **Step 3: Card Conformidade**

Após o card Contactos:

```tsx
      <Card className="md:col-span-2">
        <CardHeader><CardTitle className="text-base">Conformidade</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {aldeia.numeroAlvara && (
            <p className="flex items-center gap-2 text-sm"><FileCheck className="h-4 w-4 text-muted-foreground" /> Nº Alvará: {aldeia.numeroAlvara}</p>
          )}
          <p className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            Autorização Câmara: <Badge variant={aldeia.autorizacaoCM ? "default" : "outline"}>{aldeia.autorizacaoCM ? "Sim" : "Não"}</Badge>
          </p>
          <p className="flex items-center gap-2 text-sm">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            Documentos verificados: <Badge variant={aldeia.documentosVerificados ? "default" : "outline"}>{aldeia.documentosVerificados ? "Sim" : "Não"}</Badge>
          </p>
          {aldeia.tipoOrganizacao === "escola" && aldeia.nomeEscola && (
            <p className="flex items-center gap-2 text-sm"><GraduationCap className="h-4 w-4 text-muted-foreground" /> {aldeia.nomeEscola}</p>
          )}
        </CardContent>
      </Card>
```

- Imports lucide: `FileCheck`, `ShieldCheck`, `ClipboardCheck`, `GraduationCap`.

- [ ] **Step 4: Checklist de verificação (super admin)**

Dentro do card "Administração" existente (linhas 89-109), adicionar separador e uma linha com o estado do checklist:

```tsx
            <div className="border-t pt-4">
              <p className="font-medium mb-2">Checklist de Verificação</p>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  {aldeia.numeroAlvara ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                  Nº alvará {aldeia.numeroAlvara ? `(${aldeia.numeroAlvara})` : "em falta"}
                </p>
                <p className="flex items-center gap-2">
                  {aldeia.autorizacaoCM ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                  Autorização Câmara M.
                </p>
                <p className="flex items-center gap-2">
                  {aldeia.documentosVerificados ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                  Documentos verificados
                </p>
                <p className="flex items-center gap-2">
                  {aldeia.iban ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                  IBAN registado
                </p>
              </div>
            </div>
```

- Imports lucide: `CheckCircle2`, `Circle`.
- `Badge` já importado (linha 4).

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: passa. Se `_count.participacoes` ainda não existir no tipo, o Task 8 corrige — executar Task 8 antes do typecheck se necessário (ordem: Task 8 step 3 adiciona `participacoes` ao `_count` type e à API `[id]`).

- [ ] **Step 6: Commit**

```bash
git add src/app/aldeia/\[aldeiaId\]/aldeia-overview.tsx src/app/api/aldeias/\[id\]/route.ts
git commit -m "feat: geral da aldeia com contactos, conformidade e checklist de verificacao"
git push origin main
```

---

## Task 8: Tipos — _count.participacoes (acoplamento do Task 7)

**Files:**
- Modify: `src/app/aldeia/[aldeiaId]/aldeia-types.ts:37`
- Modify: `src/app/api/aldeias/[id]/route.ts:44`

- [ ] **Step 1: Tipo**

Em `aldeia-types.ts`:

```ts
  _count: { userAldeiaRoles: number; eventos: number; jogos: number; premios: number; participacoes: number }
```

- [ ] **Step 2: API**

Em `src/app/api/aldeias/[id]/route.ts:44`:

```ts
        select: { userAldeiaRoles: true, eventos: true, jogos: true, premios: true, participacoes: true }
```

- [ ] **Step 3: Standalone verificador**

```ts
    expect(Number.isInteger(aldeia._count.participacoes)).toBe(true)
```

→ Não é teste unitário: basta `npm run typecheck` + smoke manual.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/app/aldeia/\[aldeiaId\]/aldeia-types.ts src/app/api/aldeias/\[id\]/route.ts
git commit -m "feat: contar participacoes no resumo da aldeia"
git push origin main
```

---

## Task 9: Membros — pesquisa + agrupamento por função

**Files:**
- Modify: `src/app/aldeia/[aldeiaId]/aldeia-members.tsx`

- [ ] **Step 1: Estado local + grupos**

Em `AldeiaMembers` (componente client), adicionar estado e derivação:

```tsx
  const [search, setSearch] = useState("")
  const [filterRole, setFilterRole] = useState("all")

  const filtered = aldeia.userAldeiaRoles.filter(m => {
    const text = m.user.nome.toLowerCase()
    const matchesSearch = !search.trim() || text.includes(search.toLowerCase())
    const matchesRole = filterRole === "all" || m.role.name === filterRole
    return matchesSearch && matchesRole
  })

  const groups = [
    { key: "ADMIN", label: "Administradores", items: filtered.filter(m => ["ALDEIA_ADMIN", "MODERADOR"].includes(m.role.name)) },
    { key: "VENDEDOR", label: "Vendedores", items: filtered.filter(m => m.role.name === "COLABORADOR") },
    { key: "MEMBRO", label: "Utilizadores", items: filtered.filter(m => m.role.name === "MEMBRO" || !["ALDEIA_ADMIN", "MODERADOR", "COLABORADOR"].includes(m.role.name)) },
  ].filter(g => g.items.length > 0)
```

- Import `useState` de `react` e `Search`, `ChevronDown` (ou `Users`) de lucide.

- [ ] **Step 2: UI — pesquisa + select de função + listagem agrupada**

Substituir o bloco `<div className="space-y-2">` (linhas 40-90) por:

```tsx
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Procurar membro..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[150px] h-10 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as funções</SelectItem>
              {ALL_ROLES.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {groups.map(group => (
            <div key={group.key}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {group.label} ({group.items.length})
              </p>
              <div className="space-y-2">
                {group.items.map(membro => (
                  <div key={membro.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="font-medium text-sm text-primary">{membro.user.nome.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{membro.user.nome}</p>
                        <p className="text-xs text-muted-foreground">{membro.user.role === "aldeia_admin" ? "Admin da Aldeia" : membro.user.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(membro.role.name)}
                      {isAdmin && membro.userId !== currentUserId && (
                        <>
                          <Select value={membro.role.name} onValueChange={(val) => onChangeRole(membro.userId, val)}>
                            <SelectTrigger className="w-[130px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ALL_ROLES.map(r => (
                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => onRemoveMember(membro.userId, membro.user.nome)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Nenhum membro encontrado</p>
              {isAdmin && (
                <Button variant="outline" size="sm" className="mt-3" onClick={onAddMember}>
                  <UserPlus className="h-4 w-4 mr-2" /> Adicionar primeiro membro
                </Button>
              )}
            </div>
          )}
        </div>
```

- Import `Input` de `@/components/ui/input`.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/aldeia/\[aldeiaId\]/aldeia-members.tsx
git commit -m "feat: membros da aldeia com pesquisa e agrupamento por funcao"
git push origin main
```

---

## Task 10: Config — secção Pagamentos (métodos aceites + dados MBWay/email)

**Files:**
- Modify: `src/app/aldeia/[aldeiaId]/aldeia-settings.tsx`
- Modify: `src/app/aldeia/[aldeiaId]/page.tsx` (saveEdits)

- [ ] **Step 1: Constantes + ToggleRow local**

No topo de `aldeia-settings.tsx`, após imports:

```tsx
const PAYMENT_OPTIONS = [
  { key: "mbway", label: "MBWay", desc: "Recebido via MBWay" },
  { key: "dinheiro", label: "Dinheiro", desc: "Recebido presencialmente" },
  { key: "stripe", label: "Cartão (Stripe)", desc: "Pagamento online por cartão" },
  { key: "transferencia", label: "Transferência bancária", desc: "Depósito/transferência para o IBAN da aldeia" },
  { key: "saldo", label: "Saldo da carteira", desc: "Utilização do saldo digital do jogador" },
]

function ToggleRow({ label, desc, enabled, onToggle, disabled }: {
  label: string
  desc: string
  enabled: boolean
  onToggle: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} disabled={disabled} />
    </div>
  )
}

function parseMetodos(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
```

- `Switch` já importado (linha ~8). Verificar import de `Switch` (`@/components/ui/switch`).

- [ ] **Step 2: Blocos "Métodos de Pagamento Aceites" e "Dados para Pagamentos"**

Inserir após o bloco "Dados Bancários" (após linha 182), antes do bloco "Escola":

```tsx
        {/* Métodos de Pagamento Aceites */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Métodos de Pagamento Aceites</p>
          <p className="text-xs text-muted-foreground mb-3">Os clientes só veem os métodos ativos no carregamento de saldo</p>
          <div className="divide-y rounded-xl border px-4">
            {PAYMENT_OPTIONS.map(opt => (
              <ToggleRow
                key={opt.key}
                label={opt.label}
                desc={opt.desc}
                disabled={!editMode}
                enabled={parseMetodos(editForm.metodosPagamentoAceites).includes(opt.key)}
                onToggle={checked => {
                  const current = parseMetodos(editForm.metodosPagamentoAceites)
                  const next = checked ? [...current, opt.key] : current.filter(k => k !== opt.key)
                  onUpdateField('metodosPagamentoAceites', next.length > 0 ? JSON.stringify(next) : null)
                }}
              />
            ))}
          </div>
        </div>

        {/* Dados para Pagamentos */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">Dados para Pagamentos</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Telemóvel MBWay</Label>
              <Input
                value={editForm.telefoneMBWay || ""}
                onChange={e => onUpdateField('telefoneMBWay', e.target.value)}
                disabled={!editMode}
                placeholder="912345678"
              />
            </div>
            <div>
              <Label>Email de Pagamentos</Label>
              <Input
                type="email"
                value={editForm.emailPagamentos || ""}
                onChange={e => onUpdateField('emailPagamentos', e.target.value)}
                disabled={!editMode}
                placeholder="pagamentos@aldeia.pt"
              />
            </div>
          </div>
        </div>
```

- [ ] **Step 3: saveEdits envia os campos novos**

Em `src/app/aldeia/[aldeiaId]/page.tsx`, em `saveEdits`, após a linha dos IBAN (linha 152):

```tsx
      if (editForm.telefoneMBWay !== aldeia?.telefoneMBWay) payload.telefoneMBWay = editForm.telefoneMBWay
      if (editForm.emailPagamentos !== aldeia?.emailPagamentos) payload.emailPagamentos = editForm.emailPagamentos
```

E adicionar `metodosPagamentoAceites` ao compare-diff padrão — não está no array `fields` (string JSON); adicionar após os campos de escola (linha 156):

```tsx
      if ((editForm as any).metodosPagamentoAceites !== (aldeia as any)?.metodosPagamentoAceites) {
        payload.metodosPagamentoAceites = (editForm as any).metodosPagamentoAceites
      }
```

Nota: `telefoneMBWay`/`emailPagamentos` são sensitiveFields (Task 3) → a edição por aldeia_admin requer aprovação; super_admin aplica direto (fluxo já existente).

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/app/aldeia/\[aldeiaId\]/aldeia-settings.tsx src/app/aldeia/\[aldeiaId\]/page.tsx
git commit -m "feat: config de pagamentos por aldeia (metodos aceites, telemovel MBWay, email pagamentos)"
git push origin main
```

---

## Task 11: Carregamento de saldo — usar os novos dados

**Files:**
- Modify: `src/components/modals/carregar-saldo-hooks.ts:43-53`
- Modify: `src/components/modals/carregar-saldo-form.tsx:210-223` e bloco MBWay

Importante: hoje `data.data.telefoneMBWay` já é lido mas o campo não existia no schema — depois do Task 1 passa a vir preenchido. Validar o `login-admin` flow manualmente.

- [ ] **Step 1: hooks — emailPagamentos**

Em `carregar-saldo-hooks.ts`, no fetch de `/api/aldeias/${aldeiaId}` (linha 43-53), o setDadosConta passa a incluir:

```ts
            const payload: DadosConta = {
              iban: data.data?.iban ?? undefined,
              nomeTitularConta: data.data?.nomeTitularConta ?? undefined,
              telefoneMBWay: data.data?.telefoneMBWay ?? undefined,
              emailPagamentos: data.data?.emailPagamentos ?? undefined,
            };
            setDadosConta(payload);
```

E no tipo `DadosConta` em `carregar-saldo-types.ts:26` (já existe `telefoneMBWay?`), adicionar:

```ts
  emailPagamentos?: string;
```

- [ ] **Step 2: form — bloco Transferência mostra titular + email**

Em `carregar-saldo-form.tsx:210-223`, dentro do bloco de transferência, após a linha do titular (221):

```tsx
              {state.dadosConta.emailPagamentos && (
                <p className="text-xs text-on-surface-variant">Email: {state.dadosConta.emailPagamentos}</p>
              )}
```

- [ ] **Step 3: form — bloco MBWay mostra o telemóvel**

Após o bloco Transferência (linha 223), adicionar:

```tsx
          {state.metodoCarregamento === PAYMENT_METHODS.MBWAY && state.dadosConta.telefoneMBWay && (
            <div className="bg-purple-600/10 border border-purple-600/20 rounded-xl p-3 space-y-2">
              <p className="text-xs text-primary font-medium">Dados para MBWay:</p>
              <p className="text-xs text-on-surface-variant">Envie para o telemóvel:</p>
              <div className="flex items-center justify-between bg-surface-container-low p-2 rounded-lg">
                <span className="text-xs font-mono">{state.dadosConta.telefoneMBWay}</span>
                <button onClick={onCopiarIBAN} className="p-1 hover:bg-surface-container-high rounded" aria-label="Copiar telemóvel MBWay">
                  <Copy className="w-4 h-4 text-primary" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
```

(Estratégia simples de copy: reutilizar `onCopiarIBAN` com fallback — se preferir, o hook também copia o telefone. Mantém-se `onCopiarIBAN` para não tocar no contrato do modal.)

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/components/modals/carregar-saldo-hooks.ts src/components/modals/carregar-saldo-types.ts src/components/modals/carregar-saldo-form.tsx
git commit -m "feat: carregamento de saldo mostra dados de pagamento da aldeia (MBWay e transferencia)"
git push origin main
```

---

## Task 12: Verificação final + migração Neon + deploy

**Files:**
- Modify: (nada — validação)
- Run: `scripts/gen-postgres-schema.js` + `db push` Neon

- [ ] **Step 1: Suite completa**

Run: `npx vitest run`
Expected: PASS (391 testes ≈ 388 + 3 novos).

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 3: Build de produção local**

Run: `DATABASE_URL="file:./dev.db" npx next build --webpack`
Expected: build OK sem erros.

- [ ] **Step 4: Playwright smoke (UI do detalhe de aldeia)**

Run: `npx playwright test e2e/aldeia-detail.spec.ts` (se não existir, smoke manual):
Em vez de spec novo, validar manualmente com produção local: `npx next start`, login `admin@aldeias.pt`/`123456`, abrir `/aldeias`, clicar num card → detalhe → tabs Participações/Config.

- [ ] **Step 5: Regenerar schema postgres + db push Neon**

```bash
node scripts/gen-postgres-schema.js
DATABASE_URL="postgresql://neondb_owner:npg_OY1W3DZkTUGH@ep-patient-haze-abnxdpma-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require" npx prisma@6.19.3 db push --schema=prisma/schema.postgres.prisma --skip-generate
```

Expected: `Now using PostgreSQL`, as 2 colunas novas aplicadas (retry 2-4x se P1001 transitório). NOTA: a Neon é o alvo — sem regenerar o schema postgres o push reporta "already in sync" errado.

- [ ] **Step 6: Commit final + push (deploy Vercel)**

```bash
git add -A
git commit -m "feat: melhorias de aldeias - participacoes, contactos, membros e pagamentos por aldeia"
git push origin main
```

Wait ~2 min pelo build da Vercel. Se falhar: ler erro, corrigir, commit novo.

---

## Self-Review (feito após escrita)

**1. Cobertura da spec:** secções 1 (cards clicáveis + localidade) → Task 4; 2 (tab URL + Suspense) → Task 5; 3 (tab participações + CSV) → Tasks 2+6; 4 (Geral: contactos + conformidade + checklist) → Tasks 7+8; 5 (membros pesquisa/agrupamento) → Task 9; 6 (pagamentos: schema, settings, sensitiveFields, carregar-saldo) → Tasks 1, 3, 10, 11; âmbito/riscos/testes → Task 12. ✓
**2. Placeholders:** nenhum "TBD"; blocos de código completos em todas as tarefas. ✓
**3. Consistência de tipos:** `telefoneMBWay`/`emailPagamentos` criados no schema (T1), propagados a tipos (T1), API update (T3), settings (T10), carregar-saldo (T11) — nomes idênticos em todo o plano. `_count.participacoes` criado na API (T8) antes de ser usado no overview (T7 ordenado: T8 é pré-requisito do typecheck do T7 — executar T8 imediatamente antes de T7 step 5). Tabs válidas `overview|participacoes|members|events|settings` idênticas em T5 e T6. ✓