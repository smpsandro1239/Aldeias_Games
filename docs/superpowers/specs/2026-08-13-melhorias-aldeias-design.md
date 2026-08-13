# Design — Melhorias de Aldeias (cards clicáveis, tab Participações, uso de dados)

Data: 2026-08-13
Estado: Aprovado pelo utilizador (13/08/2026)

## Objetivo

Tornar o fluxo de gestão de aldeias mais completo: cada item dos cards da listagem `/aldeias` navega diretamente para a informação correspondente no detalhe, nova tab de Participações por aldeia, dados recolhidos (contactos, conformidade legal) passam a ser visíveis/usados, e a tab Membros fica navegável com pesquisa e agrupamento.

## Contexto existente

- `/aldeias` (super_admin) — `src/app/aldeias/page.tsx`: cards com métricas (membros, eventos, jogos, part.) mas sem navegação nos itens.
- `/aldeia/[aldeiaId]` — página de detalhe com tabs Geral/Membros/Eventos/Config (`page.tsx` + widgets em `src/app/aldeia/[aldeiaId]/`). `activeTab` é estado local, sem parâmetro de URL.
- Tab Membros (aldeia-members.tsx): lista `userAldeiaRoles`, adicionar por email+função, mudar função, remover. Sem pesquisa/agrupamento.
- Tab Eventos (aldeia-events.tsx): eventos com jogos e ações.
- Tab Config (aldeia-settings.tsx): edição completa + pending changes (IBAN com aprovação 2ª pessoa).
- Campos recolhidos quase sem uso: `responsavel`, `numeroAlvara`, `autorizacaoCM`, `documentosVerificados` (guardados/editados, nunca exibidos); `morada`/`codigoPostal`/`localidade` apenas em SAF-T e API pública.
- `GET /api/participacoes` tem paginação e filtros `jogoId`, `userId`, `estadoPagamento`, `ganhador`; filtra por jogos da aldeia para aldeia_admin. Sem filtro `aldeiaId`.
- Export CSV pronto: `src/lib/export-utils.ts` (`generateCSV`, `downloadCSV`).

## Âmbito

### 1. Deep-linking dos cards (`/aldeias` → detalhe com tab)

- Cada item de métrica do card torna-se clicável:
  - Membros → `/aldeia/[id]?tab=members`
  - Eventos → `/aldeia/[id]?tab=events`
  - Jogos → `/aldeia/[id]?tab=events` (jogos vivem dentro dos eventos)
  - Participações → `/aldeia/[id]?tab=participacoes`
- O detalhe lê `tab` da URL via `useSearchParams` (componente interno envolvido em `Suspense` para não quebrar o prerender Next 16), sincroniza `activeTab` inicial e atualiza o URL ao mudar de tab (replace, sem historial extra).
- Tabs válidas: `overview | members | events | participacoes | settings`. Tab desconhecida ou vazia → `overview`.

### 2. Tab "Participações" (apenas admins: super_admin ou admin da aldeia)

**API** — `GET /api/participacoes` recebe filtro `aldeiaId`:
- super_admin: filtra participações dos jogos da aldeia indicada.
- aldeia_admin: `aldeiaId` é ignorado/forçado à sua própria aldeia (nunca pode ver outra).
- vendedor/user: 403 se `aldeiaId` fornecido.
- Filtro dispara depois da lógica de role já existente (juntar ao `where`).

**Componente** — `src/app/aldeia/[aldeiaId]/aldeia-participacoes.tsx` (padrão dos widgets existentes):
- Tabela paginada (20/página, reutiliza `getPaginationFromRequest` do API).
- Filtros: jogo (select com os jogos da aldeia), estado de pagamento (todos/concluido/pendente), ganhador (todos/sim/não).
- Colunas: data, jogador (nomeCliente ou user.nome), jogo (nome), valor, método de pagamento, estado de pagamento, ganhador (badge sim/não) e entregue (badge para ganhadores).
- Botão "Exportar CSV": percorre páginas de 100 até `pagination.total`, `generateCSV` + `downloadCSV` (BOM Excel), toast de sucesso.
- Visibilidade: `isSuperAdmin || isAdmin` (admins da aldeia). Nota RGPD: nunca expor a utilizadores normais.

### 3. Tab Geral mais completa

- `aldeia-overview.tsx`:
  - Novo card "Contactos & Localização" (só quando há dados): telefone, email, morada, código postal, localidade.
  - Novo card "Conformidade Legal" (apenas admins): responsável, nº alvará, autorização CM (sim/não), documentos verificados (sim/não).
  - Bloco Administração (super admin): adicionar checklist de conformidade junto ao switch "Verificar Aldeia" — badges: Alvará (falta/preenchido), Autorização CM, Documentos; aviso quando faltam itens.
- Sem alterações a `aldeia-settings.tsx`.

### 4. Tab Membros melhorada

- `aldeia-members.tsx`: input de pesquisa (nome) + agrupamento por função com contagem por grupo — cada grupo usa a label de `ALL_ROLES` (ex.: Admin Aldeia/MODERADOR, Vendedor/COLABORADOR, Utilizador/MEMBRO, Super Admin/ALDEIA_ADMIN); funções fora de `ALL_ROLES` caem num grupo "Outros". Mantém adicionar/mudar função/remover.

### 5. Cards da listagem mais ricos

- `src/app/aldeias/page.tsx`: quando `aldeia.localidade` existir, mostrar "· Localidade" junto ao tipo; manter o resto do card inalterado.
- A interface `Aldeia` do page.tsx ganha `localidade?: string` e a API `/api/aldeias` deve devolver o campo (verificar no select; adicionar se faltar).

### 6. Pagamentos por aldeia (tab Config) — aditamento aprovado 13/08

Contexto: o fluxo de carregamento já consome `telefoneMBWay` da aldeia (`carregar-saldo-hooks.ts` lê `data.data.telefoneMBWay`), mas o campo **não existe** no schema — os requisitos de cada método de pagamento nunca são preenchidos.

**Schema (model Aldeia)** — novos campos:
- `telefoneMBWay String?` — telemóvel para MBWay/WhatsApp (exigido quando MBWay está ativo)
- `emailPagamentos String?` — email de referência para pagamentos (transferência/MBWay)

**Tab Config (`aldeia-settings.tsx`)** — duas novas secções:
- "Métodos de Pagamento Aceites": toggles no padrão ToggleRow da página `/configuracoes` — dinheiro e saldo sempre ligados; mbway, stripe, transferencia, vendedor alternáveis → guardaredo em `metodosPagamentoAceites` (JSON string, mesmo formato já existente).
- "Dados para Pagamentos": IBAN + Titular (secção "Dados Bancários" existente, mantida sempre visível — usada por transferência e SAF-T), Telemóvel MBWay/WhatsApp (`telefoneMBWay`), Email de Pagamentos (`emailPagamentos`).
- `saveEdits` no `page.tsx`: incluir `telefoneMBWay`/`emailPagamentos` no payload; `metodosPagamentoAceites` apenas quando mudar.

**Sensibilidade (2ª aprovação)**: API `PATCH /api/aldeias/[id]` — `sensitiveFields = ['iban', 'nomeTitularConta', 'telefoneMBWay', 'emailPagamentos']` (os campos de pagamento passam pelo fluxo pending-changes para não-super-admins).

**Uso efetivo (completar requisitos)**:
- `carregar-saldo-hooks.ts`: dadosConta ganha `emailPagamentos` (telefoneMBWay já lido).
- `carregar-saldo-form.tsx`: bloco transferência mostra IBAN + titular + email de pagamentos; bloco MBWay mostra o telemóvel WhatsApp como contacto de referência (quando preenchidos).
- `carregar-saldo-types.ts`: `DadosConta` ganha `emailPagamentos?: string`.

**Migração**: `db push` local (sqlite) + Neon (regenerar `schema.postgres.prisma` via `scripts/gen-postgres-schema.js` e push) antes do deploy.

## Fora de âmbito

- Vendedores/utilizadores normais não veem a tab Participações (RGPD).
- Sem alterações ao wizard de criação, nem ao módulo de eliminações, nem a gráficos.
- Sem alterações ao SAF-T.
- `metodosPagamentoDefault` (métodos padrão por jogo) não é alterado nesta iteração.

## Riscos

- `useSearchParams` em página client estática exige `Suspense` (erro de build no Next 16) — envolvido num componente filho.
- `aldeiaId` no GET /api/participacoes: garantir que aldeia_admin nunca consegue ver outra aldeia (forçar o próprio `aldeiaId` do utilizador).
- CSV de participações pode ser grande — percorrer páginas de 100 com limite razoável (ex.: 5000 registos máx).

## Testes

- Unit/API: filtro `aldeiaId` no GET /api/participacoes — super_admin vê outra aldeia; aldeia_admin forçado à sua; vendedor/user 403.
- Smoke Playwright: login super_admin → `/aldeias` → clique em "4 jogos" do card → URL com `?tab=events`; clique em participações → tab participacoes renderiza tabela.
- `npx tsc --noEmit` limpo; `npx vitest run` sem regressões.

## Ficheiros afetados

- `src/app/aldeias/page.tsx` — cards clicáveis + localidade
- `src/app/aldeia/[aldeiaId]/page.tsx` — ler/sincronizar `tab` da URL + saveEdits com novos campos
- `src/app/aldeia/[aldeiaId]/aldeia-participacoes.tsx` — novo
- `src/app/aldeia/[aldeiaId]/aldeia-overview.tsx` — contactos + conformidade + checklist
- `src/app/aldeia/[aldeiaId]/aldeia-members.tsx` — pesquisa + agrupamento
- `src/app/aldeia/[aldeiaId]/aldeia-settings.tsx` — secções de pagamentos
- `src/app/aldeia/[aldeiaId]/aldeia-types.ts` — tipos novos
- `src/app/api/participacoes/route.ts` — filtro `aldeiaId`
- `src/app/api/aldeias/route.ts` — garantir `localidade` no select da listagem
- `src/app/api/aldeias/[id]/route.ts` — sensitiveFields + devolver novos campos
- `prisma/schema.prisma` — `telefoneMBWay`, `emailPagamentos` na Aldeia
- `src/components/modals/carregar-saldo-hooks.ts`, `carregar-saldo-form.tsx`, `carregar-saldo-types.ts` — usar os novos dados
- Testes: `src/__tests__/` (novo caso para filtro aldeiaId)