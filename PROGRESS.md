# PROGRESS — Aldeias Games

## Estado da branch

- Branch de trabalho: `main`
- Commit de referência antes desta sessão: `28176292694eae3f6db0c391a5456703fa36091a`
- Commits desta sessão: `0c39f07`, `2112857`, `ad6411f`, `41a752c`, `18266f7`, `a51d3d8` (MBWay).
- Repositório: `smpsandro1239/Aldeias_Games`
- Última atualização: 17/11/2026

## Trabalho desta sessão

### Continuação — correção do webhook MBWay (código integrado, validação pendente)

- [x] Corrigido o erro de TypeScript `Cannot find name 'verifyWebhookAmount'` que bloqueava o CI.
- [x] Implementada verificação do montante do webhook contra a participação ou carregamento pendente, com comparação exata ao cêntimo.
- [x] Carregamentos MBWay passam a guardar a referência do fornecedor em `Transacao.referencia`, permitindo pesquisa direta em vez de depender exclusivamente de JSON.
- [x] O endpoint de iniciação valida que a participação pertence ao utilizador, ainda não foi paga e tem o mesmo montante antes de contactar o MBWay.
- [x] Callbacks `failed` e `cancelled` são agora payloads válidos e ficam registados como falhados, sem acionar créditos.
- [x] Adicionados testes unitários para montantes iguais, diferenças ao cêntimo e valores inválidos.
- [ ] Validar CI (typecheck, Vitest, lint, build/E2E) após o commit.
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
