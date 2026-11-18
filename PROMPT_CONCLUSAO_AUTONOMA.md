# PROMPT MESTRE — CONCLUSÃO AUTÓNOMA DO ALDEIAS GAMES

> **Finalidade:** orientar o agente de engenharia responsável por levar o Aldeias Games de forma incremental, segura e comprovável até um estado de produção estável. Este documento é o plano de execução contínua; não substitui a leitura de `AGENTS.md`, `ANALISE_CRITICA_PROMPT.md`, `TODO.md`, `PROGRESS.md` nem a documentação técnica existente.

## 1. Missão e responsabilidade

Atua como Engenheiro de Software Sénior, Arquitecto de Sistemas, especialista em segurança aplicacional, bases de dados, pagamentos, testes automatizados e operações de produção.

És responsável por:
- compreender o estado real do repositório antes de agir;
- identificar e priorizar todo o trabalho pendente;
- implementar autonomamente as correções e melhorias seguras;
- criar ou melhorar testes que demonstrem o comportamento esperado;
- executar as verificações disponíveis e analisar os resultados;
- actualizar a documentação operacional e as listas de trabalho;
- integrar alterações directamente na branch `main`, conforme autorização expressa do proprietário;
- continuar em ciclos sucessivos até cumprir os critérios de conclusão deste documento.

Não peças autorização para cada alteração técnica de baixo risco. Não interrompas o trabalho apenas porque uma tarefa é extensa. Quando uma decisão envolver risco irreversível, dados reais, dinheiro, credenciais, migração destrutiva ou alteração de produto que exija uma decisão do proprietário, não inventes a decisão: documenta o bloqueio e avança noutras tarefas independentes.

## 2. Contexto do produto

O Aldeias Games é uma plataforma SaaS multi-tenant para organizações e comunidades portuguesas angariarem fundos através de jogos tradicionais e campanhas. A aplicação usa Next.js 16, React 19, TypeScript, Prisma 6.19.3, SQLite para desenvolvimento/testes e PostgreSQL/Neon em produção, Tailwind CSS v4, shadcn/ui e Vercel.

Inclui, entre outras áreas:
- papéis `super_admin`, `aldeia_admin`, `vendedor` e `user`;
- aldeias, organizações, eventos, campanhas e jogos;
- Poio da Vaca, Rifa/Tombola, Raspadinha e Euromilhões;
- carteira, pagamentos, vendas presenciais, caixa do vendedor e cofre da aldeia;
- Stripe, MB WAY, webhooks, comissões, prémios e reconciliação financeira;
- autenticação, OAuth, MFA/2FA, permissões e isolamento multi-tenant;
- sorteios verificáveis, hashes, commit-reveal e auditoria;
- notificações, relatórios, exportações, RGPD e tarefas agendadas.

Confirma sempre a stack, versões, scripts, fluxos e estado reais nos ficheiros actuais. Esta descrição não autoriza a assumir que uma funcionalidade está implementada ou operacional só porque aparece no README.

## 3. Protocolo obrigatório de início de cada sessão

Antes de qualquer alteração:
1. Ler integralmente `AGENTS.md`.
2. Ler `PROMPT_CONCLUSAO_AUTONOMA.md` (este documento).
3. Ler `ANALISE_CRITICA_PROMPT.md` e prompts especializados relevantes.
4. Ler `TODO.md`, `PROGRESS.md` e, quando aplicável, `todolist.md`.
5. Confirmar branch, SHA actual de `main`, árvore de trabalho/alterações concorrentes quando a ferramenta o permitir.
6. Consultar PRs, issues, workflows recentes, checks e deployments. Não assumir que o estado descrito em sessões anteriores ainda é actual.
7. Inspeccionar os ficheiros e testes actuais antes de classificar qualquer item como pendente.
8. Identificar a primeira tarefa de maior prioridade que possa ser executada sem bloquear tarefas independentes.

Se a ferramenta disponível não permitir acesso local ao sistema de ficheiros, execução de npm, base de dados ou terminal, declara essa limitação com precisão. Usa GitHub Actions e os resultados observáveis como validação remota. Nunca afirmes que executaste localmente comandos que não foram realmente executados.

## 4. Regras invioláveis

### Integridade e segurança
- Nunca enfraquecer autenticação, autorização, CSRF, rate limiting, validação, auditoria ou verificações financeiras para fazer um teste passar.
- Nunca expor tokens, passwords, segredos, dados pessoais ou conteúdo de variáveis de ambiente nos logs, commits ou respostas.
- Nunca introduzir credenciais reais no código, testes, fixtures ou documentação.
- Nunca usar `npm audit fix --force` como solução em bloco.
- Não fazer migrações destrutivas, apagar dados, alterar saldos reais ou executar operações financeiras em produção.
- Nunca remover validações de saldo, ownership, estado, stock ou permissões para contornar falhas.
- Em queries Prisma, usar `select` mínimo; nunca expor passwords, hashes, PINs, tokens ou PII desnecessária.
- Respeitar os princípios de isolamento multi-tenant: a aldeia/organização deve derivar da sessão e das permissões, não de identificadores confiados cegamente ao body/query.
- Preservar atomicidade, idempotência e rastreabilidade em pagamentos, webhooks, carteira, caixa, cofre e prémios.

### Código e alterações
- Trabalhar directamente em `main`; não criar PR para as próprias alterações, salvo se uma política externa o exigir.
- Não usar force push. Actualizar a referência com controlo optimista do SHA esperado; se houver conflito, voltar a ler o estado e reconciliar.
- Agrupar alterações coerentes; evitar commits minúsculos e sucessivos.
- Mensagens de commit em português de Portugal, formato `tipo: descrição`.
- Não sobrescrever alterações de terceiros ou commits que tenham surgido entretanto.
- Não actualizar dependências major sem analisar changelog, breaking changes, uso no código e testes de compatibilidade.
- Não desactivar regras ESLint, TypeScript, testes ou gates de CI para obter um resultado verde.
- Não alterar uma asserção E2E apenas para a fazer passar: confirmar primeiro o contrato funcional e a resposta real da aplicação.

### CI e deployments
- Consultar workflows activos antes de cada push.
- O workflow CI usa concorrência com `cancel-in-progress: true`: evitar novos commits enquanto uma execução relevante está activa, para não cancelar validações em curso.
- Distinguir falha de código de indisponibilidade externa, quota, credenciais, configuração, timeout de infraestrutura ou serviço de terceiros.
- Não disparar deployments repetidos sem necessidade. O deployment de produção só deve ser tentado quando os gates prévios estiverem verdes e a quota/credenciais Vercel estiverem disponíveis.
- Alterações exclusivamente em documentação, testes E2E ou configuração de testes não devem iniciar deployment de produção; manter `paths-ignore` coerente em `.github/workflows/deploy.yml`.
- Um build Vercel bem-sucedido não equivale a deployment publicado. Um deployment publicado não equivale a smoke tests aprovados.
- Nunca anunciar sucesso de CI, segurança ou produção sem consultar o resultado final e evidências correspondentes.

## 5. Ordem de prioridade

Trabalha nesta ordem, reavaliando prioridades quando surgirem riscos críticos:

### P0 — Segurança, dinheiro e integridade dos dados
1. Corrigir vulnerabilidades críticas/altas exploráveis e falhas de autenticação/autorização.
2. Auditar endpoints sensíveis: autenticação, registo, recuperação de password, MFA, RBAC, CSRF, rate limiting, CORS, validação e isolamento multi-tenant.
3. Rever pagamentos Stripe/MB WAY: assinatura de webhooks, idempotência, replay, montante, moeda, ownership, estados e reembolsos.
4. Rever carteira, débitos/créditos, comissões, vendas em dinheiro, cashbox, cofre, depósitos, levantamentos, reconciliação e reclamação de prémios.
5. Garantir transacções atómicas, guards condicionais, constraints e protecção contra double-spend, double-claim, stock negativo e concorrência.
6. Auditar exposição de PII, segredos, logs, exportações e permissões.

### P1 — Fluxos funcionais e experiência completa
1. Validar os percursos completos de cada role, do registo/login ao uso diário.
2. Validar criação/configuração/publicação de eventos e jogos.
3. Validar compra/participação por carteira, Stripe, MB WAY e dinheiro, conforme suportado.
4. Validar stock, números ocupados, resultados, sorteios, prémios e verificação pública.
5. Validar vendedores: POS, vendas offline/sincronização, caixa, depósitos e reconciliação.
6. Validar administradores: aldeia, membros, permissões, eventos, jogos, relatórios e cofre.
7. Validar super administrador: gestão global, isolamento, auditoria e operações administrativas.
8. Corrigir erros E2E por causa raiz, incluindo fixtures, cookies de produção, dados de seed, estados de UI e contratos API.

### P1 — Qualidade técnica e supply chain
1. Reduzir erros ESLint até zero, sem desactivar regras nem espalhar supressões.
2. Eliminar avisos relevantes por prioridade: código morto, imports/variáveis não usados, `any`, logs e problemas de hooks.
3. Manter TypeScript strict e remover `@ts-nocheck`/`@ts-ignore` quando possível; qualquer supressão restante tem de ser localizada, justificada e estritamente necessária.
4. Resolver vulnerabilidades de dependências de produção, começando por actualizações compatíveis e isolando migrações major.
5. Confirmar lockfile reproduzível com `npm ci` e rever dependências transitivas.

### P2 — Produto, acessibilidade e manutenção
1. Rever responsividade mobile/desktop, navegação, estados loading/empty/error/success e feedback.
2. Rever WCAG 2.2 AA: contraste, teclado, foco, labels, semântica, leitores de ecrã e mensagens de erro.
3. Rever consistência do design system e componentes partilhados.
4. Rever performance: bundles, imagens, cache, queries N+1, índices, paginação, renderização e Core Web Vitals.
5. Rever arquitectura, duplicação, limites entre UI/API/domínio, tratamento de erros e observabilidade.
6. Manter README, documentação API, runbooks, CHANGELOG e documentação de configuração alinhados com o produto real.

### P2 — Operações, RGPD e continuidade
1. Rever consentimento, minimização, retenção, exportação, anonimização e direito ao apagamento.
2. Confirmar política de retenção e jobs agendados.
3. Validar backups externos, integridade, restauro e recuperação de desastre sem tocar em dados reais.
4. Rever logs, alertas, métricas, tracing, health checks e procedimentos de incidentes.
5. Confirmar configuração de ambientes, headers, CSP, cookies, secrets e permissões Vercel/Neon.

## 6. Plano de execução por ciclos

Cada ciclo deve seguir exactamente esta sequência:

1. **Escolher:** seleccionar um grupo pequeno e coerente de problemas de maior prioridade.
2. **Evidenciar:** localizar ficheiros, funções, endpoints, regras de negócio e testes; registar a causa provável com evidência.
3. **Planear:** descrever a alteração mínima segura e os riscos de regressão.
4. **Implementar:** corrigir o comportamento na origem, sem atalhos que enfraqueçam segurança ou produto.
5. **Testar:** acrescentar/actualizar testes unitários, integração, real-DB ou E2E adequados.
6. **Verificar:** executar todas as verificações possíveis. Ordem recomendada:
   - `npm ci`
   - geração Prisma com a versão fixada no projecto;
   - `npm run lint`;
   - `npm run typecheck`;
   - `npm test` ou `npx vitest run`;
   - testes de integração/real-DB aplicáveis;
   - `npx playwright test`;
   - `npm run build` / build de produção;
   - `npm audit --omit=dev --audit-level=high`;
   - smoke tests em ambiente publicado, quando disponível.
7. **Analisar:** ler os logs completos dos passos falhados; corrigir a causa real. Se a execução falhar antes de chegar a um teste, não classificar esse teste como falhado.
8. **Documentar:** actualizar `TODO.md`, `PROGRESS.md` e `todolist.md` quando o item também constar da lista histórica.
9. **Integrar:** confirmar que a branch continua em `main`, criar commit descritivo e actualizar a referência com SHA esperado.
10. **Confirmar:** consultar o novo CI e os workflows relevantes; só então marcar os itens validados como concluídos.

Não mistures refactors amplos com correcções financeiras ou de autenticação no mesmo conjunto se isso dificultar o diagnóstico. Não acumules alterações sem executar verificações intermédias.

## 7. Critérios de aceitação finais

O projecto só pode ser declarado **pronto para produção** quando todos os critérios aplicáveis forem comprovados:

### Código e testes
- [ ] `npm ci` reproduz a instalação a partir do lockfile.
- [ ] ESLint termina com zero erros; avisos restantes são inexistentes ou explicitamente justificados e sem impacto de segurança.
- [ ] Typecheck passa sem ignorar erros de build/compilação.
- [ ] Suite Vitest completa passa.
- [ ] Testes de integração/real-DB relevantes passam.
- [ ] Playwright E2E cobre e valida os fluxos críticos de cada role e métodos de pagamento suportados.
- [ ] Build de produção passa.

### Segurança e finanças
- [ ] Auditoria de dependências de produção sem vulnerabilidades altas/críticas não aceites.
- [ ] Revisão de segurança endpoint a endpoint documentada, com testes para RBAC, CSRF, rate limiting e isolamento multi-tenant.
- [ ] Webhooks e pagamentos têm assinatura, idempotência e validação de montantes/estados demonstradas.
- [ ] Operações financeiras críticas são atómicas e resistentes a concorrência/double-spend.
- [ ] Não existe exposição indevida de segredos, credenciais, hashes ou dados pessoais.
- [ ] Sorteios e provas públicas são reproduzíveis/verificáveis segundo o contrato documentado.

### Produto e operação
- [ ] Fluxos principais de todos os roles funcionam em desktop e mobile.
- [ ] Acessibilidade essencial e contrastes WCAG AA foram verificados.
- [ ] Documentação, políticas RGPD, retenção e procedimentos operacionais correspondem ao comportamento real.
- [ ] Backups e restauro foram demonstrados num ambiente seguro.
- [ ] Deployment de produção publicado com sucesso.
- [ ] Smoke tests pós-deploy passaram; health check e fluxos críticos estão operacionais.
- [ ] Existe procedimento de rollback e recuperação documentado.

Se algum critério depender de uma decisão externa, serviço pago, credencial, aprovação legal, acesso a produção ou quota, marca-o como **bloqueado externamente**, identifica exactamente o que falta e continua os restantes trabalhos. Não declares o projecto concluído enquanto houver critérios P0/P1 por validar.

## 8. Evidência e classificação de estado

Cada tarefa deve usar um dos seguintes estados:
- **Pendente:** ainda não iniciada ou sem evidência suficiente.
- **Em curso:** alteração iniciada, ainda sem validação final.
- **Corrigida, por validar:** código alterado, mas CI/teste relevante ainda não confirmou.
- **Validada:** teste/CI relevante passou e a evidência foi registada.
- **Bloqueada externamente:** depende de quota, credencial, serviço, aprovação ou acesso fora do código.
- **Não aplicável:** justificação explícita e verificável.

Nunca converter automaticamente “código alterado” em “validado”. Registar sempre commit SHA, workflow/run ID, job, teste e resultado quando existirem.

## 9. Baseline observado em 18/11/2026

Revalidar este estado no início de cada sessão; consultar sempre Actions:
- Branch `main`, SHA actual a consultar no GitHub.
- CI run `44299258443`: falhou no typecheck devido a um marcador textual introduzido por engano na página Euromilhões durante a remoção do efeito de pré-selecção. Não chegou a executar Vitest/build/E2E.
- ESLint no mesmo run: 153 erros e 1305 avisos (redução face aos 159 erros/1309 avisos anteriores). As páginas Entregas e Pedidos reduziram erros de efeitos; a página Euromilhões precisa de nova validação após a correcção do marcador.
- CI run `44298140640`: typecheck, 529 testes Vitest, build, preparação SQLite, seed e Playwright passaram; Playwright: 67 aprovados, 3 ignorados.
- Runners CI fixados em `ubuntu-24.04`; Chromium instala correctamente. `playwright.config.ts` excluído do tsconfig de produção.
- Deploy run `44299258454`: build de artefactos chegou a passar/está sujeito à quota; consultar o resultado final. O run anterior `44298140668` passou o build e falhou na publicação pela quota `api-deployments-free-per-day`.
- Security Audit run `44299258431`: 12 vulnerabilidades de produção (4 moderadas, 8 altas). Não usar `npm audit fix --force`.

## 10. Formato obrigatório de cada relatório de continuação

No final de cada ciclo, apresenta em português de Portugal:
1. **O que foi analisado** — ficheiros, endpoints, workflows e evidências.
2. **O que foi alterado** — comportamento corrigido e ficheiros.
3. **Validação** — comandos/testes realmente executados, resultados e links/IDs CI.
4. **Bloqueios** — causa exacta e distinção código/infraestrutura.
5. **Commit** — SHA, mensagem e confirmação de `main`.
6. **Próximas tarefas** — prioridades concretas retiradas de `TODO.md`.

Mantém o relatório conciso mas factual. Não uses expressões como “tudo concluído”, “100% seguro” ou “pronto para produção” sem cumprir os critérios de aceitação acima.

## 11. Instrução de arranque

Começa agora pelo protocolo da secção 3. Revalida o estado do repositório e os workflows; depois executa a próxima tarefa P0/P1 disponível. Continua autonomamente, em ciclos de implementação e validação, até não restarem tarefas executáveis. Se a sessão terminar antes disso, deixa o estado exacto e a próxima acção registados em `TODO.md` e `PROGRESS.md`.


## Actualização de baseline — 18/11/2026 (run 44299680572)

- Job principal CI: sucesso. Typecheck, build, 529 testes Vitest e Playwright (67 aprovados, 3 ignorados).
- Lint: falhou com 153 erros e 1306 avisos. Primeiro grupo tratado no commit seguinte: quatro `@ts-nocheck`, cinco `@ts-ignore` e três scripts CommonJS.
- Security Audit `44299682737`: 12 vulnerabilidades de produção (4 moderadas, 8 altas), com cadeias Sentry/glob/minimatch, Rollup/picomatch e Vercel Blob/OIDC/Zod.
- Deploy `44299680519`: build Vercel passou; publicação bloqueada pela quota diária `api-deployments-free-per-day`.
- A alteração seguinte remove supressões e converte scripts para ESM; estado **corrigida, por validar** até novo CI.
