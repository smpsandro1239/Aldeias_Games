# Plano de migração segura — Zod 3 para Zod 4

Data da auditoria: 18/11/2026  
Estado: diagnóstico concluído; migração de runtime ainda não aplicada.

## 1. Diagnóstico confirmado no lockfile

O `package-lock.json` (lockfile v3) resolve actualmente:

| Caminho | Versão | Origem |
|---|---:|---|
| `node_modules/zod` | 3.25.76 | Dependência directa declarada em `package.json` |
| `node_modules/@vercel/cli-config/node_modules/zod` | 4.1.11 | Dependência exacta de `@vercel/cli-config@0.3.1` |
| `@vercel/blob` | 2.9.0 | Dependência directa |
| `@vercel/oidc` | 3.8.10 | Transitiva de `@vercel/blob` |
| `@vercel/cli-config` | 0.3.1 | Transitiva de `@vercel/oidc` |

Existem, portanto, **duas cópias vulneráveis de Zod**: a versão 3.25.76 da aplicação e a versão 4.1.11 aninhada sob `@vercel/cli-config`.

A árvore de dependências também contém:
- `picomatch@4.0.7` e `picomatch@2.3.2`;
- `glob@13.0.7`;
- `minimatch@3.1.5`, `10.2.6` e `11.0.9`.

As versões e advisories devem ser reavaliadas no `npm audit` executado contra o lockfile final; não basta actualizar apenas o pacote de topo.

## 2. Advisory Zod

O advisory GHSA-mrhx-c7xc-m3w5 / CVE-2023-54404 identifica esgotamento de memória durante a validação de arrays grandes com elementos inválidos. O intervalo afectado é anterior a 4.6.6; a versão corrigida mínima é 4.6.6. O alvo da migração será **Zod 4.6.7**, versão estável mais recente identificada nesta auditoria.

Referências:
- GitHub Advisory Database: https://github.com/advisories/GHSA-mrhx-c7xc-m3w5
- npm: https://www.npmjs.com/package/zod

## 3. Inventário de compatibilidade a concluir

A pesquisa de código identificou:
- `validation.error.errors` em vários route handlers; a serialização de erros deve ser normalizada para `error.issues` e coberta por testes.
- `error.flatten()` num endpoint financeiro; confirmar o comportamento e o tipo no Zod 4.
- `z.record(z.any())` e `z.record(z.unknown())` em `src/lib/validations.ts`; rever a assinatura explícita de chave/valor no Zod 4.
- Uso extensivo de `z.enum([...])` em rotas e schemas; confirmar inferência e comportamento.
- `@hookform/resolvers@^3.9.0` é dependência directa; verificar compatibilidade oficial com Zod 4 e actualizar para uma versão compatível, se necessário.
- Existem schemas locais nas rotas de aldeias, membros, autenticação 2FA e ajuste de carteira, além de `src/lib/validations.ts`.

A pesquisa de texto não é prova de inventário completo: antes de alterar a dependência, repetir a pesquisa no checkout/CI e rever todos os imports de `zod`, os schemas, os resolvers e os testes.

## 4. Sequência de migração

1. Criar baseline de contratos dos schemas críticos: registo/login, pagamentos, participações, carteiras, cofre, membros e aldeias.
2. Adicionar limites explícitos a arrays, strings, objectos e payload HTTP antes de analisar JSON não confiável. A mitigação de tamanho da requisição é complementar, não substitui a versão corrigida do validador.
3. Actualizar `@hookform/resolvers` apenas se necessário para uma versão que declare suporte ao Zod 4; executar testes dos formulários.
4. Actualizar `zod` para `4.6.7` e regenerar o lockfile com npm. Não editar manualmente resoluções do lockfile.
5. Verificar a cópia aninhada de `@vercel/cli-config`. Se a cadeia continuar a fixar `zod@4.1.11`, avaliar nesta ordem:
   - actualizar `@vercel/blob` para uma versão cujo grafo use uma versão corrigida de OIDC/CLI config;
   - se o upstream ainda fixar uma versão vulnerável, testar um `overrides` para `zod@4.6.7`, confirmando compatibilidade do `@vercel/cli-config`;
   - não aceitar overrides sem `npm ls zod`, testes de build e `npm audit` completos.
6. Migrar APIs incompatíveis em alterações pequenas, sem mudar mensagens, paths, defaults, coerções ou regras de negócio.
7. Executar `npm ci`, `npm ls zod`, `npm audit --omit=dev`, typecheck, Vitest, Playwright, build Next.js e build Vercel.
8. Rever o diff de `package-lock.json` para garantir que só houve alterações esperadas e que não foram introduzidas versões duplicadas vulneráveis.
9. Integrar na `main` apenas depois de todos os checks relevantes passarem; actualizar este plano e `PROGRESS.md` com evidência.

## 5. Critérios de aceitação

- Nenhuma resolução de Zod abaixo de 4.6.6 no grafo final, incluindo cópias aninhadas.
- `npm audit --omit=dev --audit-level=high` sem vulnerabilidades altas/críticas.
- `npm audit` completo analisado; vulnerabilidades moderadas restantes têm plano e owner, não são ocultadas.
- Schemas e mensagens de erro mantêm os contratos públicos existentes.
- TypeScript, Vitest, Playwright e build passam.
- Sem `--force` e sem supressão de advisories.

## 6. Outros advisories transitivos

A cadeia `picomatch` deve ser validada contra os advisories correspondentes às versões concretas e os seus consumidores. `glob` e `minimatch` também devem ser actualizados por caminhos compatíveis, privilegiando `npm audit fix` sem `--force` e actualizações directas dos pacotes que introduzem a cadeia. A classificação final será feita pelo audit depois da instalação limpa, não apenas pela comparação de números de versão.
