# TODO - AdminDashboard Refatorado

## 🔴 CRÍTICO (bloqueante para type safety)

- [ ] **Substituir type assertions `as any` por tipos corretos**
  - [ ] Importar `JogoData` de `@/components/modals/create-jogo-modal`
  - [ ] Importar `AldeiaData` de `@/components/modals/aldeia-modal`
  - [ ] Importar `UserData` de `@/components/modals/user-modal`
  - [ ] Alterar tipos de `selectedJogo`, `selectedAldeia`, `selectedUser` para os tipos dos modais
  - [ ] Atualizar props `initialData` para usar `?? undefined` em vez de `as any`
  - **Arquivos envolvidos:** `AdminDashboard.tsx`
  - **Linhas:** 120-122 (estados), 826, 837, 844 (props dos modais)

## 🟡 IMPORTANTE

- [ ] **Implementar lazy loading das tabs pesadas**
  - [ ] Criar `LazyAuditoriaTab` com `React.lazy()`
  - [ ] Criar `LazyTransacoesTab` com `React.lazy()`
  - [ ] Criar `LazyAldeiasTab` com `React.lazy()`
  - [ ] Atualizar AdminDashboard para usar `Suspense` com fallback
  - **Benefício:** Melhora carregamento inicial da página

- [ ] **Adicionar React Query/SWR para gerenciamento de estado servidor**
  - [ ] Substituir `fetchData` por `useQuery` para cada entidade
  - [ ] Implementar invalidação automática após mutations
  - [ ] Adicionar `isLoading`, `error`, `data` separadamente
  - [ ] Configurar cache temporal (staleTime, cacheTime)

- [ ] **Testes unitários**
  - [ ] Testar `handleSaveEvento` (criação com/sem jogos automáticos)
  - [ ] Testar `handleSaveJogo` (criação/edição)
  - [ ] Testar `handleToggleJogoEstado` (transição de estado)
  - [ ] Testar `handleConvertPrize` (conversão de prémio)
  - [ ] Testar `executeDelete` (eliminação)
  - [ ] Testar filtros e paginação em cada tab

- [ ] **Melhorar acessibilidade (a11y)**
  - [ ] Adicionar `aria-label` em botões de ícone
  - [ ] Garantir navegação por teclado nos modais
  - [ ] Melhorar contraste de cores
  - [ ] Adicionar skip links

## 🟢 MELHORIAS UX/UI

- [ ] **Skeletons mais elaborados**
  - [ ] Substituir skeleton genérico por skeletons específicos por tab
  - [ ] Adicionar animações de entrada (fade-in)

- [ ] **Feedback visual melhorado**
  - [ ] Toast de sucesso/erro mais descritivo
  - [ ] Indicador de "carregando" em botões de ação
  - [ ] Confirmação antes de ações destrutivas (já tem, mas pode melhorar)

- [ ] **Filtros avançados**
  - [ ] Filtro por data (range) em EventosTab, TransacoesTab
  - [ ] Filtro por estado em JogosTab (dropdown)
  - [ ] Filtro combinado (AND/OR)

- [ ] **Ordenação de colunas**
  - [ ] Clicar em cabeçalho de tabela para ordenar
  - [ ] Indicador visual de ordenação (▲/▼)

- [ ] **Exportação de dados**
  - [ ] Botão "Exportar CSV" em UsersTab
  - [ ] Botão "Exportar CSV" em TransacoesTab
  - [ ] Botão "Exportar PDF" em EventosTab (relatório)

## 🔵 DOCUMENTAÇÃO

- [ ] **JSDoc/TSDoc** em funções públicas
- [ ] **Storybook** para componentes UI (modals, cards)
- [ ] **Diagrama de arquitetura** (fluxo de dados)
- [ ] **Guia de contribuição** para novos devs

## 🟣 DEVOPS / CI-CD

- [ ] **Configurar Vercel** (se ainda não feito)
  - [ ] Conectar repositório GitHub
  - [ ] Configurar environment variables
  - [ ] Configurar preview deployments
  - [ ] Configurar produção branch

- [ ] **Git hooks** (pre-commit, pre-push)
  - [ ] `lint-staged` para formatar código
  - [ ] `husky` para rodar testes antes do commit
  - [ ] `commitlint` para convenção de mensagens

- [ ] **Monitorização**
  - [ ] Sentry para erros em produção
  - [ ] Analytics (Google Analytics, Mixpanel)
  - [ ] Performance monitoring (Core Web Vitals)

## 🟠 REFACTORING INTERNO

- [ ] **Remover `any` restante** (buscar no código)
- [ ] **Extrair constantes** (URLs da API, messages)
- [ ] **Criar hooks customizados**
  - [ ] `useApiFetch` (wrapper com toast e retry)
  - [ ] `usePagination` (lógica de paginação reutilizável)
  - [ ] `useTableFilters` (filtros + paginação combinados)

- [ ] **Melhorar tipagem dos modais**
  - [ ] `JogoData` deveria ser consistente com `Jogo` da API
  - [ ] `AldeiaData` deveria incluir todos os campos
  - [ ] `UserData` deveria incluir `createdAt`, `updatedAt`

## 🟡 FUTURO (novas features)

- [ ] **Notificações em tempo real** (WebSocket/Pusher)
  - [ ] Notificar quando novo pedido de carregamento
  - [ ] Notificar quando nova entrega solicitada
  - [ ] Notificar quando sorteio realizado

- [ ] **Dashboard personalizado**
  - [ ] Usuário pode escolher widgets
  - [ ] Salvar preferências no localStorage

- [ ] **Relatórios agendados**
  - [ ] Agendar envio de relatórios por email
  - [ ] Gerar PDF de eventos

- [ ] **Integração com strava/outros** (se aplicável)

---

## 📋 Checklist de Deploy

Antes de fazer deploy para produção:

- [ ] Todos os tipos corretos (sem `any` nos modais)
- [ ] Testes unitários passando (>80% coverage)
- [ ] Build local sem erros (`npm run build`)
- [ ] Lint sem erros (`npm run lint`)
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Database migrations aplicadas
- [ ] Logs configurados (Sentry)
- [ ] analytics configurado
- [ ] Backup automático configurado
- [ ] Documentação atualizada

---

## 🐍 Issues Técnicos Conhecidos

1. **`selectedJogo` usa tipo `any`** — causa: modais usam `JogoData` que tem campos extras
2. **`userAgent` truncado** — limite de 50 chars para exibição (pode cortar info importante)
3. **Reset de página** — `useEffect` em cada tab, mas pode falhar emSome edge cases
4. **Filtro por evento** — depende de `selectedEventoIdParaJogo` que é compartilhado

---

**Última atualização:** 2026-04-30  
**Responsável:** Kilo (AI Assistant)  
**Status:** Em desenvolvimento (pronto para revisão)
