# AdminDashboard - Refatorado

## 📋 Visão Geral

Dashboard administrativo refatorado com foco em performance, manutenibilidade e escalabilidade.

---

## 🏗 Estrutura

```
src/features/admin/
├── AdminDashboard.tsx          # Componente principal (951 linhas)
├── components/
│   ├── types.ts                # Tipos partilhados (Stats, Evento, Jogo, etc.)
│   ├── index.ts                # Exportações
│   └── tabs/
│       ├── OverviewTab.tsx     # Visão geral (resumo)
│       ├── EventosTab.tsx      # Gestão de eventos (CRUD + busca + paginação)
│       ├── JogosTab.tsx        # Gestão de jogos (CRUD + toggle estado + QR + filtro por evento)
│       ├── VencedoresTab.tsx   # Vencedores + converter prémio + entrega
│       ├── UsersTab.tsx        # Utilizadores (CRUD + busca + paginação 50/pág)
│       ├── AldeiasTab.tsx      # Organizações (CRUD + busca + paginação) [super_admin]
│       ├── TransacoesTab.tsx   # Transações da plataforma (busca + paginação) [super_admin]
│       ├── AuditoriaTab.tsx    # Logs de acesso (busca + paginação) [super_admin]
│       ├── ComissoesTab.tsx    # Comissões de vendedores [aldeia_admin]
│       └── VerificarTab.tsx    # Verificação de hash de participação
└── analytics-dashboard.tsx     # Analytics (já existia)
```

---

---

## 🔍 Aba "Verificar" - Verificação de Participações

### 🎯 Objetivo
A aba **"Verificar"** permite ao superadmin e aldeia_admin verificar a autenticidade de participações através de hashes criptográficos, garantindo que apenas bilhetes válidos recebam prémios.

### 🔐 Segurança e Integridade
- **Hashes Criptográficos**: Cada participação gera um hash SHA-256 único
- **Verificação de Autenticidade**: Sistema verifica se o hash corresponde aos dados armazenados
- **Prevenção de Fraudes**: Impossível falsificar bilhetes sem conhecimento dos dados internos

### 📋 Como Funciona

#### 1. **Obtenção do Hash**
- Cliente apresenta bilhete físico ou digital com código hash
- Hash é um código alfanumérico de 64 caracteres (ex: `a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3`)
- Pode ser obtido por:
  - **Leitura manual** do código impresso
  - **Scanner QR code** (se disponível)
  - **Digitação direta** no sistema

#### 2. **Processo de Verificação**
1. Acesse a aba **"Verificar"** no dashboard
2. Clique em **"Verificar Hash"**
3. Digite ou cole o hash no campo
4. Clique na lupa ou pressione Enter
5. Sistema retorna resultado em segundos

#### 3. **Resultado da Verificação**
**✅ Hash Válido:**
- Verde com ícone de check
- Mostra todos os detalhes da participação
- Permite entregar prémio com segurança

**❌ Hash Inválido:**
- Vermelho com ícone X
- Indica tentativa de fraude
- Bloqueia entrega de prémio

#### 4. **Informações Mostradas**
Após verificação válida, o sistema exibe:
- **Jogo**: Nome do jogo/jogo
- **Tipo**: Rifas, Tombolas, Poio da Vaca, Raspadinhas
- **Valor**: Montante pago pelo cliente
- **Data**: Quando foi realizada a participação
- **Cliente**: Nome do comprador
- **Telefone**: Contacto para validação
- **Aldeia**: Organização responsável
- **Estado do Prémio**: Se já foi entregue
- **Resultado/Jogada**: Números sorteados ou coordenadas

### 🎮 Tipos de Jogos e Verificação

#### **Rifas e Tombolas**
- Hash baseado em números sorteados
- Verificação compara seed + resultado + ID único

#### **Poio da Vaca**
- Hash baseado em coordenadas escolhidas
- Cada combinação letra+número é verificada

#### **Raspadinhas**
- Hash baseado no resultado revelado
- Seed único por raspadinha

### ⚠️ Casos de Uso

#### **Cenário 1: Entrega de Prémio**
```
Cliente: "Ganhei! Aqui está o meu bilhete"
Admin: Verifica hash → ✅ Válido → Entrega prémio
```

#### **Cenário 2: Detecção de Fraude**
```
Cliente: "Ganhei! Aqui está o meu bilhete"
Admin: Verifica hash → ❌ Inválido → Recusa entrega
```

#### **Cenário 3: Validação sem Cliente**
```
Admin encontra bilhete perdido → Verifica hash → Identifica dono
```

### 🔧 Permissões
- ✅ **super_admin**: Acesso total
- ✅ **aldeia_admin**: Acesso às participações da sua aldeia
- ❌ **vendedor**: Sem acesso
- ❌ **user**: Sem acesso

### 💡 Dicas de Uso
- Sempre verifique o hash **ANTES** de entregar prémios
- Compare nome/telefone do cliente com os dados mostrados
- Em caso de dúvida, contacte o cliente pelo telefone registrado
- Mantenha registro das verificações para auditoria

---

## ✨ Melhorias Implementadas

### 1. Performance
- ✅ `useCallback` em todos handlers (evita re-renders)
- ✅ `useMemo` para filtros e cálculos
- ✅ `revalidate` inteligente (20-60s) vs `no-store`
- ✅ Dados essenciais separados de secundários

### 2. Organização
- ✅ Tabs separadas em componentes individuais (< 200 linhas cada)
- ✅ Estado local por tab (filtros, página)
- ✅ Handlers centralizados no componente principal
- ✅ Modals controlados pelo estado global

### 3. UX/UI
- ✅ Busca em todas as tabs (onde aplicável)
- ✅ Paginação em todas as listas
- ✅ Feedback visual (badges, loading states)
- ✅ Navegação externa (Pedidos/Entregas) com contadores

### 4. Manutenibilidade
- ✅ Tipagem explícita (interfaces)
- ✅ Código limpo e comentado
- ✅ Separação de responsabilidades

---

## 🔄 Fluxo de Dados

### Fetch Data (otimizado)
```typescript
// Dados ESSENCIAIS (revalidate: 20-40s)
- /api/dashboard/stats
- /api/eventos
- /api/jogos
- /api/users
- /api/participacoes?ganhador=true

// Dados SECUNDÁRIOS (revalidate: 60s)
- /api/aldeias (super_admin)
- /api/admin/transacoes (super_admin)
- /api/admin/logs (super_admin)
- /api/admin/vendedores-stats (aldeia_admin)

// Contadores (sem cache)
- /api/admin/pedidos-carregamento?estado=pendente
- /api/admin/entregas-saldo?estado=solicitado
```

### Handlers Principais
- `handleSaveEvento` - CRUD eventos + criar jogos automáticos
- `handleSaveJogo` - CRUD jogos
- `handleToggleJogoEstado` - Ativar/desativar jogo
- `handleSaveAldeia` - CRUD organizações
- `handleSaveUser` - CRUD utilizadores
- `handleConvertPremio` - Converter prémio em saldo
- `executeDelete` - Eliminar registos
- `handleTestarJogo` - Abrir modal de teste (super_admin)

---

## 📱 Tabs Disponíveis

| Tab | Descrição | Ações | Permissão |
|-----|-----------|-------|-----------|
| Visão Geral | Resumo de stats + eventos recentes | Novo evento, Novo jogo | Todos |
| Analytics | Gráficos e métricas | - | Todos |
| Eventos | Lista de eventos | Criar, Editar, Eliminar, Ver Jogos, Processar Recorrentes | Todos |
| Jogos | Lista de jogos | Criar, Editar, Eliminar, Toggle estado, QR Code, Testar | Todos |
| Vencedores | Participações vencedoras | Converter prémio, Confirmar entrega | Todos |
| Utilizadores | Gestão de utilizadores | Criar, Editar, Eliminar | aldeia_admin, super_admin |
| Comissões | Stats de vendedores | - | aldeia_admin |
| Aldeias | Gestão de organizações | Criar, Editar, Eliminar | super_admin |
| Transações | Histórico financeiro | - | super_admin |
| Auditoria | Logs de acesso | - | super_admin |
| Verificar | Validar hash de participação | - | Todos |

---

## 🔗 Navegação Externa

As tabs **Pedidos** e **Entregas** são páginas separadas:
- `/admindashboard/pedidos` - Pedidos de carregamento pendentes
- `/admindashboard/entregas` - Entregas de saldo solicitadas

Ambas exibem badge com contador de itens pendentes.

---

## 🛠 Modais

| Modal | Propósito | Callback |
|-------|-----------|----------|
| CreateEventoModal | Criar/editar evento | `handleSaveEvento` |
| CreateJogoModal | Criar/editar jogo | `handleSaveJogo` |
| AldeiaModal | Criar/editar organização | `handleSaveAldeia` |
| UserModal | Criar/editar utilizador | `handleSaveUser` |
| ConfirmModal | Confirmação genérica | `executeDelete`, `handleConvertPremio`, etc. |
| ResultadosExternosModal | Importar resultados externos | - |
| VerificarHashModal | Verificar autenticidade de participação | - |
| QRCodeGenerator | Gerar QR code para partilha | - |
| SorteioModal | Executar sorteio (teste) | - |

---

## ⚙️ Estado Global

```typescript
// Dados
[stats, setStats]               // Stats do dashboard
[eventos, setEventos]           // Lista de eventos
[jogos, setJogos]              // Lista de jogos
[users, setUsers]              // Lista de utilizadores
[vencedores, setVencedores]    // Participações vencedoras
[aldeias, setAldeias]          // Organizações (super_admin)
[transacoes, setTransacoes]    // Transações (super_admin)
[logs, setLogs]               // Logs de acesso (super_admin)
[vendedoresStats, setVendedoresStats] // Stats vendedores (aldeia_admin)

// UI
[activeTab, setActiveTab]      // Tab atual
[loading, setLoading]          // Loading state
[deleteData, setDeleteData]    // Dados para eliminação

// Seleções
[selectedEvento, setSelectedEvento]    // Evento em edição
[selectedJogo, setSelectedJogo]        // Jogo em edição
[selectedAldeia, setSelectedAldeia]    // Organização em edição
[selectedUser, setSelectedUser]        // Utilizador em edição
[selectedPremio, setSelectedPremio]    // Prémio para converter/entregar

// Outros
[convertValor, setConvertValor]        // Valor de conversão do prémio
[qrCodeData, setQrCodeData]           // Dados para QR code
[paymentMethodsDefault, setPaymentMethodsDefault] // Métodos de pagamento
```

---

## 🎯 Funcionalidades Especiais

### Filtro por Evento (JogosTab)
- Botão "Ver Jogos" nos Eventos → navega para tab Jogos e filtra
- Filtro ativo mostra mensagem e botão "Limpar filtro"
- `filtroEventoId` controla o filtro

### Toggle Estado do Jogo
- Ativar/desativar jogos diretamente na lista
- Usa `handleToggleJogoEstado` (PUT /api/jogos/:id)

### Converter Prémio em Saldo
- Vencedores sem prémio entregue podem converter em saldo
- Modal com input de valor
- POST `/api/admin/convert-prize`

### Testar Jogo (Super Admin)
- Apenas super_admin pode testar jogos
- Abre modal com opções de teste (em breve)

### Eventos Recorrentes
- **Objetivo**: Permitir criação de eventos que se repetem automaticamente (semanal, quinzenal, mensal)
- **Como usar**:
  1. Criar novo evento e marcar "Evento Recorrente"
  2. Escolher frequência (semanal/quinzenal/mensal)
  3. Selecionar dia da semana e horário
  4. Definir máximo de ocorrências (opcional)
- **Processamento**: Endpoint `POST /api/eventos/process-recurring` cria novos eventos automaticamente
- **Visual**: Eventos recorrentes marcados com 🔄 e mostram próxima data
- **Botão**: "Processar Recorrentes" para execução manual

---

## 📝 To-Dos / Melhorias Futuras

### 🔴 Alta Prioridade
- [ ] **Substituir `as any` por tipos corretos** nos modais (CreateJogoModal, AldeiaModal, UserModal)
  - Importar `JogoData`, `AldeiaData`, `UserData` dos modais
  - Ajustar estados `selectedJogo/Aldeia/User`
  - Atualizar props `initialData={selectedX ?? undefined}`
- [ ] **Implementar testes unitários** para handlers principais
- [ ] **Adicionar validação de permissões** no frontend (além do RoleGuard)

### 🟡 Média Prioridade
- [ ] **Lazy loading das tabs** com `React.lazy()` e `Suspense`
  - AuditoriaTab, TransacoesTab, AldeiasTab (pesadas)
- [ ] **Virtualização** nas listas longas (UsersTab com 50+/pág)
- [ ] **Melhorar feedback visual** (skeletons mais elaborados)
- [ ] **Adicionar tooltips** nos ícones
- [ ] **Exportar dados** (CSV/Excel) em TransacoesTab, UsersTab

### 🟢 Baixa Prioridade
- [ ] ** dark mode** completo (já tem suporte, mas verificar contraste)
- [ ] **A11y** - melhorar navegação por teclado
- [ ] **Internationalização** (i18n) - preparar para múltiplos idiomas
- [ ] **Logging de erros** (Sentry, LogRocket)
- [ ] **Testes E2E** (Playwright/Cypress)

---

## 🐛 Issues Conhecidas

1. **Type assertions temporários** (`as any`) nos modais — perda de type safety
2. **UserAgent truncado** na AuditoriaTab (limitado a 50 chars para display)
3. **Testar Jogo** não implementado (placeholder)
4. **Filtro por evento** na JogosTab pode não funcionar se `eventos` vazio

---

## 📦 Dependências Principais

- **Next.js 16** (Turbopack)
- **React 18** (client components)
- **shadcn/ui** (UI components)
- **lucide-react** (ícones)
- **sonner** (toasts)
- **date-fns** (formatação de datas via `formatDate`)

---

## 🔐 Permissões (RBAC)

| Role | Tabs Acessíveis |
|------|-----------------|
| `aldeia_admin` | Overview, Analytics, Eventos, Jogos, Vencedores, Users, Comissões, Pedidos, Entregas, Verificar |
| `super_admin` | Todas as tabs + Aldeias, Transações, Auditoria |
| `vendedor` | **Não tem acesso** a este dashboard |

---

## 📖 Como Executar

```bash
# Instalar dependências
npm install

# Development
npm run dev

# Build de produção
npm run build

# Preview do build
npm start
```

---

## 🧪 Testes

```bash
# Unit tests (Jest/Vitest)
npm test

# E2E (Playwright)
npm run test:e2e
```

---

## 📄 Licença

Proprietário - Aldeias Games

---

**Última atualização:** 2026-04-30  
**Versão:** 1.0.0 (refatorado)  
**Autor:** Kilo (AI Assistant)
