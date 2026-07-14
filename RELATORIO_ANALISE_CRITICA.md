# RELATÓRIO DE ANÁLISE CRÍTICA — ALDEIAS GAMES v3.11.1

**DATA:** 2026-07-13
**VERSÃO ANALISADA:** 3.11.1
**ANALISTA:** big-pickle (opencode)

---

## SCORE GERAL: 4.2/10

| Área                              | Nota  | Tendência |
|-----------------------------------|-------|-----------|
| 1. Segurança e Prevenção de Fraude| 3/10  | →         |
| 2. Jogos                          | 5/10  | →         |
| 3. Autenticação e Perfis          | 3/10  | →         |
| 4. Design System e UI/UX          | 6/10  | →         |
| 5. Arquitetura e Código           | 5/10  | →         |
| 6. Performance e Escalabilidade   | 5/10  | →         |
| 7. Conformidade RGPD              | 2/10  | →         |
| 8. Testes                         | 1/10  | →         |
| 9. Documentação                   | 4/10  | →         |
| 10. Dependências e Configuração   | 4/10  | →         |

---

## MATRIZ DE RISCO (top 10 vulnerabilidades)

| ID  | Vulnerabilidade                                        | Severidade | Impacto | Esforço |
|-----|--------------------------------------------------------|------------|---------|---------|
| R1  | JWT secret hardcoded fallback no middleware             | CRÍTICO    | Alto    | Baixo   |
| R2  | Password reset usa `reset.id` em vez de `reset.userId` | CRÍTICO    | Alto    | Baixo   |
| R3  | Rate limiting em memória — perde estado ao reiniciar   | CRÍTICO    | Alto    | Médio   |
| R4  | JWT 30 dias sem refresh/rotation/invalidação           | ALTO       | Alto    | Médio   |
| R5  | `getFullUserFromRequest` cria utilizador sintético     | ALTO       | Alto    | Baixo   |
| R6  | CSP com `unsafe-inline` e `unsafe-eval`                | ALTO       | Médio   | Médio   |
| R7  | Endpoints duplicados de reset com expirações diferentes| ALTO       | Médio   | Baixo   |
| R8  | `ignoreBuildErrors: true` mascara erros reais          | ALTO       | Alto    | Baixo   |
| R9  | Sem testes unitários, integração ou E2E                | ALTO       | Alto    | Alto    |
| R10 | RGPD sem consentimento, cookies, ou mecanismo apagar   | ALTO       | Alto    | Alto    |

---

## RESUMO EXECUTIVO

A plataforma Aldeias Games apresenta riscos de segurança CRÍTICOS que devem ser corrigidos antes de qualquer produção. O JWT secret com fallback hardcoded no middleware (`src/middleware.ts:59-61`) permite que qualquer pessoa com acesso ao código gere tokens válidos. O endpoint de reset de password está completamente broken — usa `reset.id` em vez de `reset.userId` na linha 46-59 de `src/app/api/auth/reset-password/confirm/route.ts`, tornando o fluxo de recuperação de password inoperacional.

A ausência total de testes (0 ficheiros de teste encontrados) significa que não existe garantia de correção em qualquer fluxo. O rate limiting em memória (`src/lib/rate-limit.ts`) perde estado ao reiniciar o servidor, tornando-o ineficaz contra ataques persistentes. O RGPD não tem mecanismo de consentimento, cookie banner, ou direito ao esquecimento implementado.

Do ponto de vista arquitetural, existe duplicação de 80-90% entre os 4 jogos (Poio, Rifa, Raspadinha, Euromilhões), cada um com ~400-600 linhas de código quase idêntico. A ausência de Prettier, ESLint, e configuração TypeScript strict contribui para inconsistências no código.

---

**ESTIMATIVA DE DÍVIDA TÉCNICA:** ~45% do código
**TEMPO ESTIMADO PARA RESOLVER:** 15-20 dias/pessoa

---

## ÁREA 1: Segurança e Prevenção de Fraude

### Estado Atual

O middleware implementa JWT auth, RBAC, e rate limiting em `src/middleware.ts`. Existem headers de segurança em `next.config.js` (X-Content-Type-Options, X-Frame-Options, XSS-Protection, Referrer-Policy, HSTS, Permissions-Policy). O CSP foi adicionado mas com configuração problemática.

### Problemas e Riscos

| ID  | Problema                                              | Severidade   | Ficheiro:Line                          | Código/Evidência |
|-----|-------------------------------------------------------|--------------|----------------------------------------|------------------|
| P1  | JWT secret hardcoded fallback                         | 🔴 CRÍTICO   | `src/middleware.ts:59-61`               | `const secret = process.env.JWT_SECRET \|\| "aldeias-games-dev-secret-2024-super-secure"` |
| P2  | Rate limiting em memória — perde estado               | 🔴 CRÍTICO   | `src/lib/rate-limit.ts:1-68`            | Store em Map — perde ao restart |
| P3  | 30 dias JWT sem refresh/rotation                      | 🟠 ALTO      | `src/lib/auth.ts:10,90-98`              | `expiresIn: "30d"` |
| P4  | CSP com `unsafe-inline` e `unsafe-eval`              | 🟠 ALTO      | `next.config.js:42-63`                  | `script-src 'self' 'unsafe-inline' 'unsafe-eval'` |
| P5  | Sem verificação CSRF em endpoints state-changing      | 🟠 ALTO      | `src/app/api/participacoes/route.ts`    | POST sem token CSRF |
| P6  | Webhook Stripe sem verificação de assinatura          | 🟠 ALTO      | `src/app/api/pagamentos/stripe/webhook/route.ts` | `const event = await req.json()` sem verify |
| P7  | RBAC bypass — `getFullUserFromRequest` cria user fake | 🟠 ALTO      | `src/lib/auth.ts:188-204`               | `return { id: "anonymous", ... }` |
| P8  | Console.logs sensíveis em produção                    | 🟡 MÉDIO     | `src/lib/sms.ts`, `email.ts`, `mbway.ts` | Parcialmente condicionados |

### Pontos Fortes

- Headers de segurança HTTP bem configurados em `next.config.js:50-58`
- RBAC implementado via middleware com verificação `allowedRoles.includes(user.role)`
- Rate limiting por endpoint com configurações diferenciadas em `src/lib/rate-limit.ts:45-65`

### Recomendações

| ID  | Recomendação                                          | Prioridade | Esforço | Benefício | Solução |
|-----|-------------------------------------------------------|------------|---------|-----------|---------|
| R1  | JWT secret com throw em production                    | 1 (máx)   | Baixo   | Alto      | Remover fallback, throw se não definido |
| R2  | Rate limiting com Redis/DB persistente                | 1 (máx)   | Médio   | Alto      | Usar Vercel KV ou Upstash Redis |
| R3  | Refresh tokens com rotação                            | 1 (máx)   | Médio   | Alto      | Criar modelo RefreshToken, rotação a cada 7d |
| R4  | CSP sem unsafe-inline/eval                            | 2 (alto)   | Médio   | Alto      | Usar nonce ou hash para scripts inline |
| R5  | CSRF tokens em endpoints POST/PUT/DELETE              | 2 (alto)   | Médio   | Alto      | Implementar double-submit cookie |
| R6  | Verificação de assinatura Stripe webhook              | 2 (alto)   | Baixo   | Alto      | Usar `stripe.webhooks.constructEvent()` |

---

## ÁREA 2: Jogos

### Estado Atual

Quatro jogos implementados: Poio da Vaca (`src/app/jogos/poio-da-vaca/page.tsx`), Rifa (`src/app/jogos/rifa/page.tsx`), Raspadinha Premium (`src/app/jogos/raspadinha-premium/page.tsx`), Euromilhões (`src/app/jogos/euromilhoes/page.tsx`). Cada jogo tem ~400-600 linhas com 80-90% de duplicação.

### Problemas e Riscos

| ID  | Problema                                              | Severidade   | Ficheiro:Line                          | Código/Evidência |
|-----|-------------------------------------------------------|--------------|----------------------------------------|------------------|
| P1  | Duplicação 80-90% entre os 4 jogos                   | 🟠 ALTO      | Todos os ficheiros em `src/app/jogos/` | Funções idênticas: `handlePlay`, `handleBuy`, `fetchNumerosOcupados` |
| P2  | Race conditions no stock de números                   | 🟠 ALTO      | `src/app/api/rifa/numeros/route.ts`     | `numerosOcupados` check sem lock |
| P3  | Sem commit-reveal na raspadinha                       | 🟡 MÉDIO     | `src/app/jogos/raspadinha-premium/`     | Resultado calculado client-side |
| P4  | Sorteio sem verificabilidade por terceiros            | 🟡 MÉDIO     | `src/app/api/rifa/sorteio/route.ts`     | Sem hash/commit do resultado |
| P5  | `jogoId` pode ser undefined em chamadas API           | 🟡 MÉDIO     | `src/app/jogos/rifa/page.tsx:211`       | `fetchNumerosOcupados()` chamado sem jogoId |

### Pontos Fortes

- Fluxo completo: criação → participação → pagamento → sorteio → resultado
- RBAC verificado nos endpoints de jogo

### Recomendações

| ID  | Recomendação                                          | Prioridade | Esforço | Benefício | Solução |
|-----|-------------------------------------------------------|------------|---------|-----------|---------|
| R1  | Extrair componentes comuns dos jogos                  | 2 (alto)   | Alto    | Alto      | Criar `GameBase`, `NumericGrid`, `PrizeDisplay` |
| R2  | Transações atômicas para stock                        | 2 (alto)   | Médio   | Alto      | Usar Prisma `$transaction` com lock |
| R3  | Implementar commit-reveal na raspadinha               | 3 (médio)  | Médio   | Médio     | Hash server-side antes, reveal depois |
| R4  | Adicionar hash/audit ao sorteio                       | 3 (médio)  | Baixo   | Médio     | Salvar hash do seed + timestamp |

---

## ÁREA 3: Autenticação e Perfis

### Estado Atual

Login com email/password via `src/app/api/auth/login/route.ts`. Registo em `src/app/api/auth/register/route.ts`. Recuperação de password com 2 endpoints duplicados. JWT com expiração de 30 dias.

### Problemas e Riscos

| ID  | Problema                                              | Severidade   | Ficheiro:Line                          | Código/Evidência |
|-----|-------------------------------------------------------|--------------|----------------------------------------|------------------|
| P1  | Password reset usa `reset.id` em vez de `reset.userId`| 🔴 CRÍTICO   | `src/app/api/auth/reset-password/confirm/route.ts:46-59` | `user: { connect: { id: reset.id } }` |
| P2  | Endpoints duplicados com expirações diferentes        | 🟠 ALTO      | `reset-password/route.ts` vs `reset-password/confirm/route.ts` | 1h vs 24h |
| P3  | Sem 2FA/MFA                                           | 🟡 MÉDIO     | N/A                                    | Não implementado |
| P4  | Sem email verification após registo                   | 🟡 MÉDIO     | `src/app/api/auth/register/route.ts`   | Registo direto sem verificação |
| P5  | Sem account lockout após tentativas falhadas          | 🟡 MÉDIO     | `src/app/api/auth/login/route.ts`      | Apenas rate limiting |

### Pontos Fortes

- Password hashing com bcrypt (rounds 10) em `src/lib/auth.ts`
- Validação de email e password no registo

### Recomendações

| ID  | Recomendação                                          | Prioridade | Esforço | Benefício | Solução |
|-----|-------------------------------------------------------|------------|---------|-----------|---------|
| R1  | Corrigir `reset.userId` no reset de password          | 1 (máx)   | Baixo   | Alto      | Alterar `reset.id` → `reset.userId` |
| R2  | Unificar endpoints de reset de password               | 1 (máx)   | Baixo   | Médio     | Manter apenas `reset-password/confirm` |
| R3  | Implementar email verification                        | 2 (alto)   | Médio   | Alto      | Token de verificação + email |
| R4  | Implementar 2FA para admin                            | 3 (médio)  | Alto    | Médio     | TOTP com speakeasy |

---

## ÁREA 4: Design System e UI/UX

### Estado Atual

UI construída com shadcn/ui, Tailwind CSS v4, Radix UI. Dark mode suportado. Layout responsivo com sidebar. Menus diferenciados por role.

### Problemas e Riscos

| ID  | Problema                                              | Severidade   | Ficheiro:Line                          | Código/Evidência |
|-----|-------------------------------------------------------|--------------|----------------------------------------|------------------|
| P1  | ~109 componentes client sem lazy loading              | 🟡 MÉDIO     | `src/components/`                      | Todos carregados no bundle inicial |
| P2  | Sem breadcrumb em páginas profundas                   | 🟡 MÉDIO     | `src/app/admindashboard/`              | Navegação depende de sidebar |
| P3  | Feedback de loading inconsistente                     | 🟡 MÉDIO     | Vários ficheiros                       | Alguns usam skeleton, outros spinner |

### Pontos Fortes

- shadcn/ui fornece componentes acessíveis (ARIA built-in)
- Dark mode funciona bem com CSS variables
- Layout responsivo com sidebar colapsável

### Recomendações

| ID  | Recomendação                                          | Prioridade | Esforço | Benefício | Solução |
|-----|-------------------------------------------------------|------------|---------|-----------|---------|
| R1  | Lazy loading de componentes pesados                  | 2 (alto)   | Médio   | Alto      | `React.lazy()` + `Suspense` |
| R2  | Adicionar breadcrumbs em páginas admin               | 3 (médio)  | Baixo   | Médio     | Componente Breadcrumb reutilizável |

---

## ÁREA 5: Arquitetura e Código

### Estado Atual

382 ficheiros em `src/`, 109 rotas API, 109 componentes, 30 modelos Prisma. App Router organizado por features.

### Problemas e Riscos

| ID  | Problema                                              | Severidade   | Ficheiro:Line                          | Código/Evidência |
|-----|-------------------------------------------------------|--------------|----------------------------------------|------------------|
| P1  | 80-90% duplicação entre jogos                         | 🟠 ALTO      | `src/app/jogos/`                       | 4 ficheiros com ~400-600 linhas idênticas |
| P2  | `@types/*` em `dependencies` em vez de `devDependencies` | 🟡 MÉDIO  | `package.json`                         | Aumenta bundle size |
| P3  | `ignoreBuildErrors: true` mascara erros               | 🟠 ALTO      | `next.config.js`                       | `typescript: { ignoreBuildErrors: true }` |
| P4  | .env aninhado obsoleto                                | 🟡 MÉDIO     | `Aldeias_Games/.env`                   | Pode causar confusão |

### Pontos Fortes

- Separação clara: `src/app/api/` (rotas), `src/components/` (UI), `src/lib/` (lógica)
- Prisma schema bem estruturado com 30 modelos

### Recomendações

| ID  | Recomendação                                          | Prioridade | Esforço | Benefício | Solução |
|-----|-------------------------------------------------------|------------|---------|-----------|---------|
| R1  | Extrair componentes comuns dos jogos                  | 2 (alto)   | Alto    | Alto      | Criar diretório `src/components/games/` |
| R2  | Remover `ignoreBuildErrors` e corrigir erros          | 2 (alto)   | Alto    | Alto      | Corrigir tipos um por um |
| R3  | Mover `@types/*` para `devDependencies`               | 3 (médio)  | Baixo   | Médio     | `npm install --save-dev @types/*` |

---

## ÁREA 6: Performance e Escalabilidade

### Estado Atual

120 páginas geradas no build. Bundle size razoável. Prisma queries sem N+1 detectado.

### Problemas e Riscos

| ID  | Problema                                              | Severidade   | Ficheiro:Line                          | Código/Evidência |
|-----|-------------------------------------------------------|--------------|----------------------------------------|------------------|
| P1  | 109 componentes client sem code splitting             | 🟡 MÉDIO     | `src/components/`                      | Bundle inicial grande |
| P2  | Sem ISR ou stale-while-revalidate                     | 🟡 MÉDIO     | `src/app/`                             | Todas as páginas SSR |
| P3  | Polling de notificações a cada 30s                    | 🟡 MÉDIO     | `src/components/notification-bell.tsx` | Requisições desnecessárias |

### Pontos Fortes

- Build webpack funciona em Windows
- Prisma com select mínimo nas queries

### Recomendações

| ID  | Recomendação                                          | Prioridade | Esforço | Benefício | Solução |
|-----|-------------------------------------------------------|------------|---------|-----------|---------|
| R1  | Implementar ISR para páginas públicas                | 3 (médio)  | Baixo   | Alto      | `export const revalidate = 3600` |
| R2  | Usar WebSocket para notificações                     | 3 (médio)  | Alto    | Médio     | Server-Sent Events ou WebSocket |

---

## ÁREA 7: Conformidade RGPD

### Estado Atual

Sem implementação RGPD. Sem cookie banner, sem consentimento, sem mecanismo de exclusão.

### Problemas e Riscos

| ID  | Problema                                              | Severidade   | Ficheiro:Line                          | Código/Evidência |
|-----|-------------------------------------------------------|--------------|----------------------------------------|------------------|
| P1  | Sem cookie banner ou consentimento                    | 🔴 CRÍTICO   | N/A                                    | Não existe |
| P2  | Sem direito ao esquecimento                           | 🔴 CRÍTICO   | N/A                                    | Não existe endpoint DELETE para dados pessoais |
| P3  | Sem política de privacidade                           | 🟠 ALTO      | N/A                                    | Não existe página |
| P4  | Sem minimização de dados                              | 🟡 MÉDIO     | `prisma/schema.prisma`                 | Campos extras em modelos |

### Pontos Fortes

- Nenhum identificado nesta área

### Recomendações

| ID  | Recomendação                                          | Prioridade | Esforço | Benefício | Solução |
|-----|-------------------------------------------------------|------------|---------|-----------|---------|
| R1  | Implementar cookie banner com consentimento          | 1 (máx)   | Médio   | Alto      | Usar react-cookie-consent |
| R2  | Criar endpoint DELETE para dados pessoais             | 1 (máx)   | Médio   | Alto      | Anonimizar dados em vez de deletar |
| R3  | Criar página de política de privacidade              | 2 (alto)   | Baixo   | Alto      | Template estático |

---

## ÁREA 8: Testes

### Estado Atual

Nenhum ficheiro de teste encontrado. Sem testes unitários, integração, ou E2E.

### Problemas e Riscos

| ID  | Problema                                              | Severidade   | Ficheiro:Line                          | Código/Evidência |
|-----|-------------------------------------------------------|--------------|----------------------------------------|------------------|
| P1  | 0 testes unitários                                    | 🔴 CRÍTICO   | N/A                                    | Nenhum ficheiro `.test.ts` ou `.spec.ts` |
| P2  | 0 testes de integração API                            | 🔴 CRÍTICO   | N/A                                    | Nenhum ficheiro de teste de endpoints |
| P3  | 0 testes E2E                                          | 🔴 CRÍTICO   | N/A                                    | Sem Playwright/Cypress |
| P4  | Sem framework de testes configurado                   | 🔴 CRÍTICO   | `package.json`                         | Sem Jest/Vitest no scripts |

### Pontos Fortes

- Nenhum identificado nesta área

### Recomendações

| ID  | Recomendação                                          | Prioridade | Esforço | Benefício | Solução |
|-----|-------------------------------------------------------|------------|---------|-----------|---------|
| R1  | Configurar Vitest + testes unitários                 | 1 (máx)   | Médio   | Alto      | `npm install vitest --save-dev` |
| R2  | Testes de integração para endpoints críticos          | 1 (máx)   | Alto    | Alto      | Testar login, registo, pagamentos |
| R3  | Testes E2E para fluxos de jogo                       | 2 (alto)   | Alto    | Alto      | Playwright para cada jogo |

---

## ÁREA 9: Documentação

### Estado Atual

README.md existe. AGENTS.md existe com workflow de deploy. Sem OpenAPI/Swagger. Sem CHANGELOG.

### Problemas e Riscos

| ID  | Problema                                              | Severidade   | Ficheiro:Line                          | Código/Evidência |
|-----|-------------------------------------------------------|--------------|----------------------------------------|------------------|
| P1  | Sem documentação de API (OpenAPI)                     | 🟡 MÉDIO     | N/A                                    | 109 endpoints sem docs |
| P2  | Sem CHANGELOG                                         | 🟡 MÉDIO     | N/A                                    | Histórico de versões perdido |
| P3  | README sem seção de arquitetura                       | 🟡 MÉDIO     | `README.md`                            | Setup básico apenas |

### Pontos Fortes

- AGENTS.md detalhado com workflow de deploy e troubleshooting

### Recomendações

| ID  | Recomendação                                          | Prioridade | Esforço | Benefício | Solução |
|-----|-------------------------------------------------------|------------|---------|-----------|---------|
| R1  | Criar OpenAPI spec para endpoints principais          | 3 (médio)  | Alto    | Médio     | Usar swagger-jsdoc |
| R2  | Criar CHANGELOG.md                                    | 3 (médio)  | Baixo   | Baixo     | Formato Keep a Changelog |

---

## ÁREA 10: Dependências e Configuração

### Estado Atual

Next.js 16.2.7, React 19, Prisma 6.19.3, TypeScript (sem strict mode), sem ESLint, sem Prettier.

### Problemas e Riscos

| ID  | Problema                                              | Severidade   | Ficheiro:Line                          | Código/Evidência |
|-----|-------------------------------------------------------|--------------|----------------------------------------|------------------|
| P1  | Sem ESLint configurado                                | 🟠 ALTO      | `package.json`                         | Sem script `lint` |
| P2  | Sem Prettier                                          | 🟡 MÉDIO     | N/A                                    | Sem formatação consistente |
| P3  | TypeScript sem `strict: true`                         | 🟠 ALTO      | `tsconfig.json`                        | `strict: false` |
| P4  | `@types/*` em `dependencies`                          | 🟡 MÉDIO     | `package.json`                         | Aumenta bundle |
| P5  | Sem `.prettierrc` ou `.eslintrc`                      | 🟡 MÉDIO     | N/A                                    | Sem config |

### Pontos Fortes

- Prisma版本 pinada em 6.19.3 (evita problemas de versão)
- Build command consistente em `vercel.json`

### Recomendações

| ID  | Recomendação                                          | Prioridade | Esforço | Benefício | Solução |
|-----|-------------------------------------------------------|------------|---------|-----------|---------|
| R1  | Configurar ESLint com regras básicas                  | 2 (alto)   | Baixo   | Alto      | `npm install eslint --save-dev` |
| R2  | Ativar `strict: true` no TypeScript                  | 2 (alto)   | Alto    | Alto      | Corrigir erros resultantes |
| R3  | Configurar Prettier                                   | 3 (médio)  | Baixo   | Médio     | `.prettierrc` com config básica |

---

## RESPOSTAS ÀS PERGUNTAS ESPECÍFICAS

1. **Vulnerabilidades de segurança para não autorizados?** SIM — JWT secret hardcoded permite forjar tokens. RBAC bypass via `getFullUserFromRequest` cria utilizador sintético.

2. **Fluxo de jogos à prova de fraude?** PARCIALMENTE — Rate limiting ajuda, mas race conditions no stock de números e sem commit-reveal na raspadinha são riscos.

3. **UX consistente para todos os roles?** SIM — shadcn/ui e menus diferenciados por role funcionam bem.

4. **Design system coerente?** SIM — shadcn/ui + Tailwind + Radix UI fornece base sólida.

5. **Preparada para crescer?** PARCIALMENTE — Arquitetura é boa, mas duplicação de código e sem testes limitam escalabilidade.

6. **Transparência dos sorteios verificável?** NÃO — Sem hash/commit de resultados, sem audit trail público.

7. **Dados protegidos e RGPD compliant?** NÃO — Sem cookie banner, sem consentimento, sem direito ao esquecimento.

8. **Código manutenível?** PARCIALMENTE — Boa estrutura, mas duplicação e sem testes dificultam.

9. **Testes cobrem fluxos críticos?** NÃO — 0 testes implementados.

10. **Dependências atualizadas e necessárias?** SIM — Versões atualizadas, mas `@types/*` em dependencies é desnecessário.

---

## CONCLUSÃO E PLANO DE AÇÃO

| #  | Ação                                                  | Prioridade | Esforço | Dependência | Prazo |
|----|-------------------------------------------------------|------------|---------|-------------|-------|
| 1  | Corrigir JWT secret hardcoded (throw em production)   | P1         | 1h      | Nenhuma     | Dia 1 |
| 2  | Corrigir password reset `reset.userId`                | P1         | 1h      | Nenhuma     | Dia 1 |
| 3  | Implementar rate limiting persistente (Redis)         | P1         | 4h      | Nenhuma     | Dia 1 |
| 4  | Remover `ignoreBuildErrors` e corrigir erros TS       | P1         | 8h      | Nenhuma     | Dia 1-2 |
| 5  | Configurar ESLint + Prettier                          | P1         | 2h      | Nenhuma     | Dia 2 |
| 6  | Ativar `strict: true` no TypeScript                   | P2         | 4h      | #4          | Dia 2 |
| 7  | Configurar Vitest + testes unitários básicos          | P2         | 8h      | #5          | Dia 2-3 |
| 8  | Extrair componentes comuns dos jogos                  | P2         | 12h     | Nenhuma     | Dia 3-5 |
| 9  | Implementar cookie banner RGPD                        | P2         | 4h      | Nenhuma     | Dia 5 |
| 10 | Criar endpoint DELETE para dados pessoais             | P2         | 4h      | #9          | Dia 5-6 |
| 11 | Implementar refresh tokens JWT                        | P2         | 6h      | #1          | Dia 6-7 |
| 12 | Adicionar CSRF tokens em endpoints                    | P2         | 4h      | Nenhuma     | Dia 7 |
| 13 | Corrigir CSP (remover unsafe-inline/eval)             | P2         | 6h      | Nenhuma     | Dia 7-8 |
| 14 | Testes de integração para endpoints críticos          | P3         | 12h     | #7          | Dia 8-10 |
| 15 | Implementar commit-reveal na raspadinha               | P3         | 8h      | #8          | Dia 10-11 |
| 16 | Implementar 2FA para admin                            | P3         | 12h     | #11         | Dia 11-13 |
| 17 | Testes E2E com Playwright                             | P3         | 16h     | #14         | Dia 13-15 |
| 18 | Documentação OpenAPI para endpoints                   | P3         | 8h      | Nenhuma     | Dia 15-16 |

---

**FIM DO RELATÓRIO**
