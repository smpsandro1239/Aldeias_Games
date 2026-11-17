# PROGRESS — Aldeias Games

## Estado da branch

- Branch de trabalho: `main`
- Commit de referência antes desta sessão: `28176292694eae3f6db0c391a5456703fa36091a`
- Commits desta sessão: `0c39f07`, `2112857`, `ad6411f`, `41a752c`, `18266f7`, `a51d3d8`, `05d947a`, `d3ef962`.
- Repositório: `smpsandro1239/Aldeias_Games`
- Última atualização: 17/11/2026

## Trabalho desta sessão

### Ajuste de testes após renomeação de rota (código integrado, validação pendente)

- [x] Atualizado `membros-gestao.test.ts` para importar a rota normalizada `[userId]` e fornecer o parâmetro `userId`; a falha anterior era um import de teste obsoleto, não uma regressão no endpoint.
- [ ] Confirmar suite Vitest e E2E após novo commit.

### Reforço da assinatura HMAC MBWay (código integrado, validação pendente)

- [x] Removido `require('crypto')` da validação HMAC; agora usa imports estáticos `createHmac` e `timingSafeEqual`.
- [x] A comparação valida comprimento antes de `timingSafeEqual`, evitando exceções para assinaturas truncadas e mantendo comparação timing-safe.
- [x] Adicionados testes unitários de assinatura válida, adulterada, truncada e segredo/assinatura vazios.
- [ ] Validar CI após commit.

### Correção de rotas dinâmicas Next.js (código integrado, validação pendente)

- [x] Normalizado o segmento dinâmico de membros para `[userId]`, mantendo os mesmos endpoints HTTP e parâmetros URL; o Next.js exige nomes idênticos para segmentos dinâmicos equivalentes no mesmo ramo.
- [ ] Confirmar que o servidor Next.js arranca e que os testes E2E passam.

### Segurança — API legada de apostas (código integrado, validação pendente)

- [x] `GET /api/apostas` deixa de devolver PII e relações completas do jogo a visitantes não autenticados; mantém apenas os dados mínimos necessários para a ocupação do tabuleiro.
- [x] Utilizadores normais e vendedores ficam limitados às apostas associadas ao respetivo utilizador; administradores de aldeia ficam limitados à sua aldeia; super admin mantém visão global.
- [x] Dados pessoais do POST são normalizados/limitados, email e telefone são validados e números têm de ser inteiros positivos e únicos.
- [x] Criados testes unitários de privacidade pública, ownership e isolamento multi-tenant; aguarda CI.

### Continuação — robustez do relógio e build de produção (código integrado, validação pendente)

- [x] Corrigido `syncTime()` para validar HTTP, `unixtime` finito e data válida antes de atualizar o offset; respostas inválidas preservam o último offset ou usam o relógio local, sem propagar `Invalid Date` nem repetir chamadas em cada pedido.
- [x] Adicionados testes unitários para resposta sem timestamp e HTTP 503 da WorldTimeAPI.
- [x] Corrigido `metadataBase` para não lançar `ERR_INVALID_URL` quando `NEXT_PUBLIC_BASE_URL` está malformada; tenta URL configurada, `VERCEL_URL` e domínio canónico como fallback.
- [ ] Validar testes Euromilhões, suite completa, typecheck, lint e build Vercel após commit.

### Remediação de dependências

- [x] Criado workflow controlado `.github/workflows/dependency-remediation.yml`: executa `npm audit fix` sem `--force`, valida `npm ci`, Prisma, typecheck, Vitest e build antes de fazer commit de lockfile/package.json diretamente na `main`; vulnerabilidades que exijam major permanecem visíveis no audit e não bloqueiam as restantes validações.
- [ ] Confirmar resultado do workflow e rever todas as versões efetivamente instaladas antes de marcar dependências como corrigidas.

### Continuação — correção do fluxo MBWay (código integrado, validação pendente)

- [x] Corrigido o erro de TypeScript `Cannot find name 'verifyWebhookAmount'` que bloqueava o CI.
- [x] Implementada verificação do montante do webhook contra a participação ou carregamento pendente, com comparação exata ao cêntimo.
- [x] Carregamentos MBWay passam a guardar a referência do fornecedor em `Transacao.referencia`, permitindo pesquisa direta em vez de depender exclusivamente de JSON.
- [x] O endpoint de iniciação valida que a participação pertence ao utilizador, ainda não foi paga e tem o mesmo montante antes de contactar o MBWay.
- [x] Callbacks `failed` e `cancelled` são agora payloads válidos e ficam registados como falhados, sem acionar créditos.
- [x] Adicionados testes unitários para montantes iguais, diferenças ao cêntimo e valores inválidos.
- [x] O GET de estado MBWay passou a verificar ownership da referência antes de consultar o fornecedor e só atualiza uma participação do utilizador autenticado.
- [x] Atualizada a dependência `@vercel/blob` para 2.8.2 através do PR #18, com preview Vercel Ready.
- [ ] Validar CI (typecheck, Vitest, lint, build/E2E) após o commit.
- [x] Validação observada no commit `a51d3d8`: Prisma Client gerado, TypeScript passou e Vitest passou; lint falhou por erros existentes noutros módulos. O commit seguinte acrescentou testes de callbacks e lookup por referência; aguarda validação CI própria.
- [x] O webhook procura agora primeiro por `Transacao.referencia` e `Participacao.referenciaPagamento`, mantendo fallback legado limitado a registos recentes; callbacks malformados não provocam exceção ao construir a resposta.

### Concluído no código (validação pendente)

- [x] Leitura das instruções do repositório (`AGENTS.md`) e do prompt de análise (`ANALISE_CRITICA_PROMPT.md`).
- [x] Registado em `AGENTS.md` o protocolo obrigatório para futuras sessões: ler instruções, prompt, TODO e PROGRESS antes de desenvolver e validar estado atual.
- [x] Identificada divergência: o helper `src/lib/recurrence.ts` já corrigia parte do overflow mensal, mas o POST de criação e o cron mantinham implementações próprias; o helper de primeira ocorrência ainda alterava mês antes de definir o dia 1.
- [x] Corrigida a ordem de operações mensal em `computeFirstRecurrenceDate`.
- [x] POST `/api/eventos` passa a usar `computeFirstRecurrenceDate`.
- [x] Cron `/api/eventos/process-recurring` passa a usar `addRecurrence`.
- [x] Acrescentados testes unitários para datas de referência no dia 31 e preservação da hora.
- [x] Atualizada a tarefa histórica em `todolist.md`.

### Validação

- [ ] Vitest — executar suite de recorrência e suite completa.
- [ ] Typecheck.
- [ ] Lint — primeiro lint integral revelou 224 erros e 1311 avisos; dívida pré-existente, registada em TODO.md.
- [ ] Build.
- [ ] Verificar CI e auditoria de dependências após o commit.
- [x] Separada a auditoria de dependências do pipeline de testes: existe workflow dedicado `.github/workflows/security-audit.yml`; a falha do audit já não deve impedir a execução de lint, typecheck, testes, build e E2E.
- [x] Migrado o lint de `next lint` para `eslint .` no `package.json` e no workflow CI: Next.js 16 removeu oficialmente o comando `next lint`; a execução direta do ESLint é agora a configuração suportada.

## Bloqueios e riscos identificados

- **Bloqueio de segurança conhecido:** a execução Security Audit falha no passo `npm audit --omit=dev --audit-level=high`, após instalação bem-sucedida. O log identifica 1 vulnerabilidade crítica em `@sentry/nextjs`, vulnerabilidades altas em `follow-redirects` e `zod`, além de moderadas em `glob/minimatch`. Não é falha de infraestrutura.
- **CI de qualidade:** a auditoria já tem workflow dedicado e foi separada do pipeline principal. O primeiro lint integral executado após migrar para ESLint detetou 224 erros e 1311 avisos em 1535 ocorrências; o lint passou para job independente para não bloquear typecheck, Vitest, build e E2E. O comando obsoleto `next lint` foi substituído por `eslint .` e a dívida foi registada em TODO.md.


- **Deploy Vercel:** alguns checks reportaram `build-rate-limit` / pedido de upgrade do plano. Isto é um limite de infraestrutura/conta, não evidência de falha do código; o check de deployment restante ainda deve ser consultado.
- **Migração Zod:** o npm indica que a correção de Zod requer versão 4, uma alteração major que exige revisão de compatibilidade antes de integrar.
- **PRs Dependabot:** existem PRs abertos; cada atualização será avaliada individualmente antes de integrar.

## Próximo passo

Executar CI para validar a correção MBWay; depois corrigir os erros ESLint por grupos e atualizar dependências vulneráveis com versões compatíveis, começando por Sentry 10.x com patch de segurança. Não declarar a tarefa de recorrência validada até o CI confirmar os testes.
