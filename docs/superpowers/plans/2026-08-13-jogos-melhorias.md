# Jogos — Análise Completa e Plano de Melhorias (2026-08-13)

> Foco: os 4 jogos do projeto (Raspadinha, Rifa, Poio da Vaca, Euromilhões).
> Objetivo: o que está certo, o que está errado, o que falta, e 5 melhorias priorizadas
> com testes, ficheiros, endpoints, UI, critérios de aceitação e esforço.

---

## 1. Análise por Jogo

### 1.1 Raspadinha — ESTADO: SÓLIDO (a referência do sistema)

| Pilar | Status | Detalhe |
|---|---|---|
| Sorteio justo | ✅ | Pool de prémios Fisher-Yates criptográfico (`buildRaspadinhaPool`), draw sem reposição dentro da `$transaction` com lock de stock (serializado) |
| Exatidão | ✅ | Saem EXATAMENTE os prémios configurados (`round(stock × %/100)`), nem mais nem menos |
| Limites | ✅ | `maxGanhadores` + `maxPremioTotal` (pool) — ambos funcionam independentemente e em conjunto; jogos continuam abertos quando esgotados |
| Verificação pública | ✅ | Hash sha256 autêntico; `/verificar-raspadinha` público; bug do timestamp já corrigido |
| Fallback | ✅ | Jogos antigos sem `pool` usam estatística antiga (compatibilidade) |
| Testes | ✅ | 25 + 11 + 100 bilhetes real-db (exatidão de contagens) |

**Problemas menores:**
- `premioMaximo` hardcoded 5000 — nunca é gravado nem configurável.
- `postCreate()` é dead code (nunca corre; as notificações de limite são feitas em `validate`/`prepareData`).
- `safeConfig` expõe o `pool` publicamente (informação interna — não é segredo por si, mas não devia sair).
- **UI não mostra o pool restante** aos administradores (saber quantos prémios ainda faltam sair).

### 1.2 Rifa — ESTADO: **2 BUGS CRÍTICOS + SORTEIO SEM UI**

| Pilar | Status | Detalhe |
|---|---|---|
| Identidade do bilhete | ❌ **CRÍTICO** | Compra de múltiplos números grava o **mesmo array `numeros` em cada participação** e o sorteio só lê `numeros[0]` → só o 1º número pode ganhar; os restantes são "bilhetes mortos" que o jogador pagou |
| Unicidade de números | ❌ | `validate` verifica fora da transação e **não há constraint único** no DB → corrida pode vender o mesmo número 2× |
| MBWay pendente | ❌ | Participações pendentes (MBWay) bloqueiam números para sempre sem timeout/libertação |
| Sorteio real (commit/reveal) | ❌ **Sem UI** | `POST/PATCH /api/sorteios` existe (provably fair com commitment) mas **nenhum frontend o chama** — admins só têm simulação |
| Simulação legacy | ❌ | `/sorteios/teste` e `/sorteios/externo` usam `dadosParticipacao.numero` (formato antigo) → **nunca encontram vencedores**; `POST /api/sorteios` devolve `resultado: null` para rifa |
| Commitment hash | ⚠️ | Risco de mismatch se o `timestamp` do commitment e do reveal divergirem (mesmo bug antigo da raspadinha) |
| Prova de jogo | ⚠️ | Compra múltipla quebra a prova (hash não cobre todos os números) |
| Notificações | ⚠️ | Hash do jogo ausente das mensagens WhatsApp |

### 1.3 Poio da Vaca — ESTADO: **ROTO (dois mundos paralelos)**

| Pilar | Status | Detalhe |
|---|---|---|
| Modelo de dados | ❌ | Página pública grava em `Aposta` via `/api/apostas`; **sorteio só lê `Participacao`** → apostas da página pública **nunca podem ganhar** |
| Agregados financeiros | ❌ | `/api/apostas` não move `stock`, `totalParticipacoes`, `totalAngariado` nem cashbox → cofre/reconciliação ignoram vendas da página |
| Cashbox | ❌ | Vendas em dinheiro na página não tocam `VendedorCashbox` |
| MBWay | ❌ | Quebrado para utilizadores normais (role `vendedor` assumida na configuração) |
| Config insuficiente | ❌ | Config criada pelo admin UI não tem `letras`/`numerosPorLetra`/`dimensoesCampo` → handler/sorteio podem crashar |
| Handler incompatível | ❌ | `poioHandler.validate` espera `c.x/c.y`; schema/cliente usam `letra/numero` → validações e cashbox divergem |
| Claim de prémio | ❌ | Sem `claim-premio` para poio; sem prova/verificação para apostas |

**Nota**: o handler de aposta (`src/app/api/apostas/route.ts`) é sólido e testado (12 testes de segurança), mas vive numa ilha que não liga ao resto do sistema.

### 1.4 Euromilhões — ESTADO: FUNCIONAL, COM LACUNAS

| Pilar | Status | Detalhe |
|---|---|---|
| Grelha | ✅ | Auto-criação + self-heal; bloqueio por data (`bloqueioData`); preenchida aos 50 |
| Recorrentes | ✅ | Cron sexta 22:00 UTC + `processarRecorrentes` testado (401 sem CRON_SECRET, idempotência, numeração) |
| Segurança | ✅ | `numerosOcupados` verificados, JWT, transações atómicas |
| **Cashbox/valorPago multi-número** | ❌ | Venda em dinheiro com vários números grava `valorPago = jogo.preco` (1×) em vez de `numeros.length × preco` → **cashbox a menos** |
| `numeros-ocupados` | ⚠️ | Agrega **todas as grelhas** do jogo (fora de contexto) |
| Vencedor no admin | ⚠️ | Nome do vencedor nunca é mostrado no admin |
| Estatísticas de números | ❌ | Não existe top de números mais jogados |
| Limites divergentes | ⚠️ | Página permite 50 números; POS limita a 5 |
| Grelha não fecha | ⚠️ | A grelha não se auto-fecha na `bloqueioData` (fica bloqueada mas visualmente "aberta") |

### 1.5 Infra Comum — Bugs e Lacunas

| Bug | Ficheiro | Impacto |
|---|---|---|
| `where.id = userId` deveria ser `where.userId` | `src/app/api/participacoes/route.ts:87` | Filtro de super_admin por userId mal aplicado |
| Dead code | `sendWinnerEmail`/`sendWinnerSMS` e afins | Confusão, risco de futuro uso errado |
| `GET /api/jogos` expõe `configuracao.pool` a todos os autenticados | route jogos | Info interna exposta |
| `VERIFICATION_URL` hardcoded ao domínio de produção | libs | Link errado em dev/testes |
| Sem sandbox para sorteios | — | Impossível testar sorteio sem sujar dados reais |
| Sem export CSV de participações por jogo (só por aldeia) | — | Administração limitada |
| `tipo: 'sorteio'` nunca é criado nas notificações | cofre/notificacoes | Jogadores não sabem do sorteio |

---

## 2. Priorização (impacto × esforço)

| # | Melhoria | Impacto | Esforço |
|---|----------|---------|---------|
| **1** | Rifa: números como participações individuais + constraint único + validação na transação | 🔴 Segurança financeira (odds erradas hoje) | M |
| **2** | Poio da Vaca: unificar no fluxo `/api/participacoes` (jogável, sorteável, rastreável) | 🔴 Jogo roto de ponta a ponta | XL |
| **3** | Sorteios: simulação correta + UI commit/reveal + notificações `tipo: 'sorteio'` | 🟠 Admins sem sorteio real | L |
| **4** | Euromilhões: rasto financeiro multi-número + ocupados por grelha + vencedor no admin | 🟠 Cashbox errado em dinheiro | M |
| **5** | Estatísticas + CSV por jogo + pool restante na UI da raspadinha | 🟢 Administração/transparência | M |

---

## 3. Plano de Implementação (5 Melhorias)

### M1 — Rifa: bilhete = 1 participação = 1 número (corrige odds)

**Problema**: compra com N números cria N participações, cada uma com o array completo de números; o sorteio lê só `numeros[0]`.

**Solução (recomendada)**: na criação, **partir os números por participação** (1 número por participação) — alinha com o comportamento do webhook Stripe (`route.ts:193-194`) e com a prova/claim por participação.

**Ficheiros**:
- `src/app/api/participacoes/_lib/rifa.ts` — `postCreate` parte `dadosParticipacao.numeros` em N participações (1 por número) com `NumeroVendido` + hash + cashbox corretos
- `src/app/api/participacoes/route.ts` — mover check de unicidade para dentro da `$transaction` (após lock de stock) em `validateInTransaction`; remover check pré-transação
- `prisma/schema.prisma` — `@@unique([jogoId, numero])` em `NumeroVendido`
- `src/app/api/participacoes/numeros-ocupados` — incluir participações `pendente` (consistência com o bloqueio atual)

**Endpoints**: `POST /api/participacoes`, `GET /api/participacoes/numeros-ocupados`

**UI**: grid da rifa mostra números pendentes como ocupados (já bloqueados hoje — só alinhar a listagem).

**Testes** (novos em `src/__tests__/integration/real-db/`):
1. Compra 5 números → 5 participações, cada uma com 1 número distinto, `valorPago = 5 × preco`, cashbox = 5 × preco
2. `NumeroVendido` duplicado no mesmo jogo → P2002 rejeitado (2 pedidos concorrentes em transações separadas)
3. Unicidade dentro da transação: 2 compras simultâneas do mesmo número → só 1 vence
4. Vencedor do sorteio corresponde ao número da participação (não ao `[0]`)
5. Prova de jogo cobre o número exato vendido

**Critérios de aceitação**:
- [ ] Todos os números comprados têm chance de ganhar (odds corretas)
- [ ] Impossível vender o mesmo número 2× mesmo em concorrência
- [ ] `valorPago` e cashbox = nº números × preço
- [ ] Prova de jogo lista os números efetivamente jogados

**Esforço**: M (meio dia com testes).

---

### M2 — Poio da Vaca: unificação total no fluxo de participações

**Decisão de design** (recomendada): **migrar a página pública e o handler para `POST /api/participacoes`** com tipo `poio_da_vaca`, e manter `/api/apostas` como legacy/leitura até migração completa. Alternativa (mais rápida mas pior): fazer o sorteio ler `Aposta` — cria segundo modelo de dados com cashbox/reconciliação partidos.

**Ficheiros**:
- `src/app/api/participacoes/_lib/poio.ts` — handler v2 compatível com a página: aceita `letra/numero` E `c.x/c.y` (normaliza internamente); valida contra `dimensoesCampo`; cashbox em dinheiro
- `src/app/api/participacoes/route.ts` — registar `poio_da_vaca` no registry + `claim-premio` para poio
- `src/app/api/jogos/[id]` e `create-jogo-modal.tsx` — config de poio gera `letras`/`numerosPorLetra`/`dimensoesCampo` automaticamente (por colunas) quando ausentes
- `src/app/api/participacoes/[id]/prova` — suportar poio (mesmo mecanismo de hash)
- `src/app/api/sorteios` — vencedor poio ligado à participação (já lê `Participacao`)
- `src/app/jogos/poio-da-vaca/page.tsx` — trocar o POST de `/api/apostas` para `/api/participacoes`
- `src/features/admin/...` — tab Jogos mostra vendas/agregados do poio (passa a ser automático)

**Endpoints**: `POST /api/participacoes` (poio), `POST /api/participacoes/[id]/claim-premio`, `GET /api/sorteios`, `/api/participacoes/numeros-ocupados` (poio)

**UI**: página poio inalterada visualmente; admin ganha stock/angariado/cashbox do poio sem mudanças manuais.

**Testes**:
1. Publicação com coordenadas → participação criada com `letra/numero` normalizados, stock decrementado, `totalAngariado` + preço
2. Venda em dinheiro → `VendedorCashbox` incrementada
3. Sorteio sobre participações de poio → vencedor correto (inclui apostas da página)
4. Config sem `dimensoesCampo`/`letras` → gerada automaticamente, sem crash
5. `claim-premio` poio (carteira/cofre/pagar_cliente/jogar_novamente) com guard `premioEntregue`
6. Migração de dados: script que converte `Aposta` concluídas em `Participacao` (uma vez)

**Critérios de aceitação**:
- [ ] Comprar na página pública dá chance real de ganhar no sorteio
- [ ] Vendas de poio aparecem em stock/angariado/cashbox/reconciliação
- [ ] Prémio reclamável pelos 4 fluxos existentes
- [ ] Sem regressão nas apostas históricas (`Aposta` preservada)

**Esforço**: XL (2–3 dias com migração + testes).

---

### M3 — Sorteios: simulação correta + UI commit/reveal + notificações ✅ CONCLUÍDO

**Implementado (2026-08-15)**: `SorteioModal` v2 (3 fases commit→reveal→done, seed no cliente, toggle dryRun default true), `PATCH/POST /api/sorteios` reescritos (commit guarda `serverSeed`+`clientSeedCommit` opcional; reveal verifica `hashClientSeed(clientSeed)` contra o compromisso, `dryRun:true` sem persistência, notificações `tipo:'sorteio'` via createMany), `sorteios/teste` com branches modernos (rifa `{numero}`/legacy `{numeros}`, euromilhões 1-50, poio coordenadas+legacy), schema com `Jogo.clientSeedCommit`+`Sorteio.clientSeedCommit`. **Nota**: não existe `/api/sorteios/[id]` — commit/reveal são no `/api/sorteios` (PATCH/POST). Euromilhões já é sorteável pelo fluxo genérico. 464/464 testes verdes, typecheck limpo, build OK.

**Problema**: o único sorteio que os admins conseguem correr (`/sorteios/teste`, `/sorteios/externo`) usa formato legacy e nunca encontra vencedores; o sorteio provably-fair (commit + reveal) não tem UI.

**Solução**:
1. **Corrigir `teste`/`externo`** para o formato moderno (`dadosParticipacao[].numeros`/`letra`+`numero`, `grelhaId` para euromilhões) e devolver `resultado` preenchido
2. **UI de sorteio real** no admin (tab Jogos → botão "Sorteio"): fluxo 2 passos — (a) commit gerado no cliente/API, (b) reveal com números sorteados; usa `POST /api/sorteios` + `PATCH /api/sorteios/[id]` já existentes
3. **Notificações**: criar `Notificacao` `tipo: 'sorteio'` para todos os participantes (ou por aldeia) quando o sorteio é concluído
4. **Sandbox**: variante de simulação com flag `dryRun: true` (não persiste vencedores) para testar sem sujar dados

**Ficheiros**:
- `src/app/api/sorteios/route.ts` (teste/externo) + `src/app/api/sorteios/[id]/route.ts` (PATCH reveal)
- `src/lib/lottery-utils.ts` — gerar commitment/reveal consistentes (hash + timestamp único partilhado)
- `src/features/admin/...` — `SorteioModal` (commit → reveal) na tab Jogos
- `src/lib/notificacoes.ts` — helper de notificação de sorteio
- `src/app/api/sorteios/externo` — compat com euromilhões (`numeros` da grelha)

**Testes**:
1. `teste`/`externo` com formato moderno → encontra vencedor correto por número/coordenadas
2. Fluxo commit+reveal: hash válido, timestamp idêntico, resultado não nulo para rifa/poio
3. Reveal com hash adulterado → rejeitado
4. Notificação `tipo: 'sorteio'` criada para participantes após conclusão
5. `dryRun` não persiste vencedores nem muda `premioEntregue`

**Critérios de aceitação**:
- [ ] Admin consegue correr sorteio real (commit + reveal) sem sujar dados
- [ ] Simulação encontra vencedores reais
- [ ] Participantes recebem notificação do sorteio
- [ ] Euromilhões sorteável pelo fluxo único

**Esforço**: L (1–1.5 dias).

---

### M4 — Euromilhões: rasto financeiro + contexto de grelha + vencedor no admin

**Decisão tomada**: adotar o mesmo modelo da M1 — **1 participação = 1 número** (frontend envia `quantidade = numeros.length`). Corrige `valorPago`, cashbox, stock e `totalParticipacoes` em bloco; a grelha continua a ser a autoridade de ocupação.

**Ficheiros**:
- `src/app/api/participacoes/_lib/euromilhoes.ts` — `prepareData` por número (`{numero:N}` + `numerosSelecionados:"[N]"` + `grelhaId`); `validateInTransaction` rejeita número ocupado dentro da transação; `maxNumeros` configurável em `configuracao.maxNumeros` (default 50)
- `src/app/api/participacoes/numeros-ocupados` — aceita `grelhaId` opcional; filtra por grelha
- `src/app/jogos/euromilhoes/use-euromilhoes-game.ts` — `quantidade = numerosSelecionados.length`, resposta em array → primeira participação, `maxNumeros` na UI, `grelhaId` no fetch de ocupados
- `src/app/api/euromilhoes/grelhas/[id]/sortear` — lookup do vencedor lê primeiro `dadosParticipacao.numero` (novo formato), fallback `numerosSelecionados` (legacy)
- `src/app/api/participacoes/route.ts` — GET com join `user` + `vendedor` (nome do vencedor no admin)

**Testes**:
1. Compra 5 números → 5 participações unitárias, rasto financeiro completo (valorPago, stock, totais, saldo, grelha ocupada)
2. Venda em dinheiro → cashbox = 3 × preço
3. `numeros-ocupados?grelhaId=X` → só números da grelha X (sem sobreposição entre grelhas)
4. Guard atómico `validateInTransaction` rejeita número vendido; POST → 400 com reversão total
5. Sorteio da grelha → vencedor corresponde à participação unitária
6. GET participações → `user`/`vendedor` com nome

**Critérios de aceitação**: rasto financeiro correto em dinheiro; ocupados por grelha; vencedor visível; limite configurável por jogo.

**Esforço**: M (meio dia).

**NOTA (Pendente — executar pelo utilizador)**: o `@@unique([jogoId, numero])` da M1 e as colunas `Jogo.clientSeedCommit`/`Sorteio.clientSeedCommit` da M3 foram aplicados apenas na dev.db. Aplicar em produção (Neon), regenerando o schema postgres primeiro:
```bash
node scripts/gen-postgres-schema.js
DATABASE_URL="postgresql://neondb_owner:npg_OY1W3DZkTUGH@ep-patient-haze-abnxdpma-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require" npx prisma@6.19.3 db push --schema=prisma/schema.postgres.prisma --skip-generate
```
Expected: `Now using PostgreSQL`; a constraint `numeros_vendidos_jogoId_numero_key` é criada + 2 colunas `clientSeedCommit` adicionadas (retry 2-4x se P1001 transitório).

---

### M5 — Estatísticas + CSV por jogo + pool restante (admin/transparência)

**Ficheiros**:
- `src/app/api/jogos/[id]/estatisticas/route.ts` — top números (euromilhões), top coordenadas (poio), pool restante (raspadinha), vendas por dia
- `src/lib/export-utils.ts` + endpoint `GET /api/jogos/[id]/exportar` — CSV de participações do jogo (com filtro de datas)
- `src/app/jogos/raspadinha-premium/page.tsx` — badge "Prémios restantes: X/Total" (admin/vendedor; público sem detalhe)
- `src/app/api/jogos/route.ts` — `safeConfig` sem `pool` (remover campo sensível)

**Testes**:
1. Endpoint estatísticas com dados → top 5 números por frequência
2. CSV export com cabeçalhos + BOM; só participações do jogo no período
3. `safeConfig` não contém `pool`
4. Badge do pool restante correto (soma de premios - sorteados)

**Critérios de aceitação**: admin vê números mais jogados; exporta CSV por jogo; pool restante visível; pool nunca sai na API pública.

**Esforço**: M (meio dia).

---

## 4. Resumo de Esforço

| Melhoria | Esforço |
|---|---|
| M1 Rifa (odds + constraint) | M |
| M2 Poio unificado | XL |
| M3 Sorteios + notificações | L |
| M4 Euromilhões rasto + grelha | M |
| M5 Estatísticas + CSV + pool | M |
| **Total** | ~5–6 dias com testes |

## 5. Ordem de Execução Sugerida

1. **M1** (maior risco financeiro, esforço contido)
2. **M4** (cashbox errado em dinheiro — mesmo domínio financeiro, rápido)
3. **M3** (adms precisam de sorteio correto para rifa/poio)
4. **M2** (jogo roto; depende de M3 estar correto)
5. **M5** (transparência/administração)

## 6. Decisões Abertas para o Utilizador

1. **Poio (M2)**: migrar página para `/api/participacoes` (recomendado) vs. sorteio a ler `Aposta`
2. **Limite de números Euromilhões**: 50 (página) vs 5 (POS) → proposto máximo configurável (default 10)
3. **Histórico de edições (PUT jogo)**: já existe via `AlteracaoParticipacao`/audit + notificações `jogo_editado` — adicionar painel de histórico na UI? (proposto: incluir no M5 se o utilizador quiser)
4. **Sandbox (M3)**: incluir `dryRun` — confirmado?
