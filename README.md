# 🎮 Aldeias Games 2026 - Digital Fundraising Platform

![Version](https://img.shields.io/badge/version-3.12.0-indigo)
![License](https://img.shields.io/badge/license-MIT-green)
![Next.js](https://img.shields.io/badge/Framework-Next.js%2016-black)
![Tailwind](https://img.shields.io/badge/CSS-Tailwind%204-blue)
![Status](https://img.shields.io/badge/status-online-brightgreen)

**🌐 Ver Online:** [aldeiasgame.vercel.app](https://aldeiasgame.vercel.app/)

**Aldeias Games** é uma plataforma SaaS (Software as a Service) multi-tenant de alto desempenho, focada na dinamização de comunidades locais portuguesas através de jogos tradicionais digitalizados para angariação de fundos.

## 🚀 Funcionalidades Principais

### Para Utilizadores (Jogadores)
- **Jogos Interativos**: Poio da Vaca (grelha), Rifa/Tombola, Raspadinhas Digitais e **Euromilhões** (Tombola com números oficiais).
- **Experiência Imersiva**: Efeitos sonoros processuais e visuais (confetti) via Web Audio API.
- **Pagamentos Seguros**: Integração com Stripe e **MBWay real**.
- **App PWA**: Instalável em qualquer smartphone com suporte offline.
- **Carteira Digital**: Saldo, extrato de movimentos e carregamentos.
- **Onboarding Personalizado**: Experiência de boas-vindas após primeiro login via OAuth.
- **Celebração de Vitória**: Modal animado com confetti ao ganhar um prémio.

### Para Organizações (Aldeias/Escolas/Clubes)
- **Gestão de Campanhas**: Criação e monitorização de eventos de angariação.
- **CRM e Analytics**: Acompanhamento de vendas, participantes e metas financeiras.
- **Wizard de Configuração**: Configuração guiada e conformidade legal integrada.

### Para Vendedores
- **POS Mobile**: Interface otimizado para registo de vendas em 3 passos.
- **Modo Offline**: Vendas guardadas localmente com sincronização automática.
- **Gestão de Comissões**: Acompanhamento de comissão e saldo a entregar.
- **Recibo de Venda**: Comprovativo detalhado para o cliente.

### Para Super Admin
- **Seletor de Organização**: Dropdown pesquisável com Aldeias, Escolas, Clubes e Associações de Pais.
- **Testar Jogo**: Modo fictício para verificar configurações sem alterar dados.
- **Gestão Global**: Visão completa de todas as organizações, eventos e jogos.
- **Analytics em Tempo Real**: Gráficos de evolução, top vendedores e métodos de pagamento.
- **Logs de Auditoria**: Registo de acessos com IP e User Agent.

## 🎮 Sistema de Jogos - Fluxo Completo e Transparência

O sistema de jogos da Aldeias Games foi projetado com **transparência total** e **justiça comprovável** como pilares fundamentais. Todos os sorteios são auditáveis e verificáveis por qualquer participante.

### Fluxo Completo de um Jogo

#### 1. Criação de Evento/Jogo (por Admin Aldeia)
- O admin da aldeia cria um evento (ex: "Festa de Verão 2026")
- Dentro do evento, cria um ou mais jogos (Poio da Vaca, Rifa, Raspadinha)
- Define configurações específicas:
  - **Poio da Vaca**: Grade de letras e números, valor por quadrado
  - **Rifa/Tombola**: Intervalo de números (ex: 00-99), preço por bilhete
  - **Raspadinha**: Número de prémios, valores e percentagens
  - Data/hora do sorteio (opcional para sorteios imediatos)
  - Valor mínimo para ativar o jogo (se aplicável)

#### 2. Configuração do Jogo
- O admin configura os prémios (dinheiro físico, experiências, etc.)
- Define o lucro mínimo garantido (ex: 50% para raspadinhas)
- Estabelece limites de compra por usuário (se aplicável)
- O sistema calcula automaticamente:
  - Receita esperada (preço × stock)
  - Percentagem total destinada a prémios
  - Lucro líquido previsto
  - Gera um **hash de verificação** (SHA-256) baseado nas configurações

#### 3. Participação dos Jogadores
- Jogadores compram bilhetes/participações através de:
  - Carteira digital (saldo)
  - MBWay (pagamento instantâneo)
  - Stripe (cartão de crédito/débito)
  - Dinheiro (através de vendedores)
- Cada participação gera:
  - Um número/bilhete único (para rifa/tombola)
  - Uma combinação letra+número (para poio da vaca)
  - Uma raspadinha com código único (para raspadinhas)
- Todas as partidas são registradas com timestamp e hash de participação

#### 4. Sorteio Transparente e Verificável
O sistema utiliza um processo de **commit-reveal** com SHA-256 para garantir total transparência:

**Fase 1: Commit (antes do sorteio)**
1. O sistema gera um **seed aleatório** (32 bytes em hexadecimal)
2. Combina o seed com um **salt secreto** e o ID do jogo
3. Calcula o **hash de commitment** (SHA-256) e o armazena
4. O hash de commitment é publicado imediatamente e pode ser verificado por qualquer pessoa
5. O seed permanece secreto nesta fase

**Fase 2: Reveal (durante o sorteio)**
1. No momento do sorteio, o sistema revela o **seed original**
2. Qualquer pessoa pode verificar:
   - Recalculando o hash usando: `SHA256(seed + salt + jogoId + timestamp)`
   - Comparando com o hash de commitment publicado na Fase 1
3. O seed é usado como entrada para um algoritmo determinístico que seleciona o vencedor
4. O resultado (número vencedor, letra+número, etc.) é publicado junto com o seed usado

#### 5. Distribuição de Premiações e Registo
- Os prémios são distribuídos aos vencedores conforme as regras do jogo
- Todas as transações são registradas no sistema
- Os vencedores recebem notificações por email/SMS (quando aplicável)
- Um registo detalhado é criado no AuditLog para cada sorteio

### Mecanismos de Justiça e Auditabilidade

1. **Hash de Commitment Público**: 
   - Publicado antes do sorteio começa
   - Permite verificação de que o seed não foi alterado após o início das vendas

2. **Algoritmo Determinístico**:
   - O mesmo seed sempre produz o mesmo resultado
   - Qualquer pessoa pode reexecutar o sorteio localmente para verificar

3. **Seed Aleatório Criptográfico**:
   - Gerado usando `crypto.randomBytes(32)` (256 bits de entropia)
   - Impossível de prever ou manipular

4. **Registro Completo no AuditLog**:
   - Quem iniciou o sorteio
   - Timestamp preciso
   - Seed utilizado
   - Hash de commitment e de révélation
   - Resultado do sorteio
   - Lista de vencedores

5. **Proteção contra Manipulação**:
   - O sorteio só pode ser realizado por admins da aldeia ou super admins
   - Verificação de que o jogo não foi sorteado anteriormente
   - Confirmação de que existem participações válidas

### Exemplos de Verificação por Jogadores

Qualquer jogador pode verificar a justiça de um sorteio seguindo estes passos:

1. Obter o **hash de commitment** (disponível imediatamente após a criação do sorteio pendente)
2. Após o sorteio, obter o **seed revelado** e o **resultado**
3. Usar qualquer ferramenta SHA-256 para calcular:
   ```
   hash_calculado = SHA256(seed + salt_secreto + jogoId + timestamp_do_commit)
   ```
4. Comparar `hash_calculado` com o hash de commitment original
5. Se coincidirem, o sorteio foi justo e não foi manipulado

---

### 🎰 Euromilhões — Sistema de Tombola com Números Oficiais

O módulo **Euromilhões** é uma tombola digital onde os jogadores escolhem números (1–50) e o número vencedor é o **primeiro número do sorteio oficial do Euromilhões** da sexta-feira seguinte, obtido via API pública.

#### Fluxo Completo

1. **Admin cria grelha**: Define preço por número, data de sorteio automática (próxima sexta 21:30) e bloqueio automático 3h antes.
2. **Jogadores escolhem números**: Seleção flexível de 1 a 50 números. Jogador paga `números × preço` (ex: 5 números × 2€ = 10€).
3. **Vendedor regista anónimos**: Interface POS para registar participações de jogadores sem conta.
4. **Grelha fecha automaticamente** ao atingir o `bloqueioData` (18:30 da sexta). Admin pode fechar manualmente.
5. **Sorteio automático na API**: Ao sortear, o sistema consulta o resultado oficial do Euromilhões (`getLatestFirstNumber()`) e usa o primeiro número como vencedor.
6. **Distribuição de prémios**: O sistema identifica automaticamente participantes com o número sorteado, creditando o prémio (configurado pelo admin) na carteira digital.

#### Sistema de Bloqueio Temporal

- **`sorteioData`**: Data/hora do sorteio oficial (sexta 21:30) — calculado por `getNextFriday()`.
- **`bloqueioData`**: 3 horas antes do sorteio (18:30 da sexta) — calculado por `getBloqueioData()`.
- Antes do bloqueio: jogadores podem participar livremente; admin pode sortear manualmente.
- Após bloqueio: participações bloqueadas; sorteio manual permitido a qualquer momento.
- A verificação horária no endpoint de sorteio permite usar um **fallback manual** (admin escolhe número) se a API oficial não responder.

#### Fontes de Resultados Oficiais

O sistema tenta múltiplas APIs em cascata com timeout de 8s cada:

1. `euromillions-api.vercel.app` — formato `{ numeros: [...] }`
2. `api.fugete.com` — formato `{ numbers: [...] }`

Se ambas falharem, o admin pode inserir o número manualmente (`fonte: "manual"`).

#### API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/euromilhoes/grelhas?jogoId=X` | Lista grelhas (todas ou filtradas por jogo) |
| `POST` | `/api/euromilhoes/grelhas` | Criar nova grelha (admin) |
| `PUT` | `/api/euromilhoes/grelhas/[id]/fechar` | Fechar grelha para participações |
| `PUT` | `/api/euromilhoes/grelhas/[id]/sortear` | Sortear (usa API oficial ou fallback manual) |
| `GET` | `/api/participacoes` | Listar participações do jogador/logado |

#### Páginas

| Rota | Descrição |
|------|-----------|
| `/jogos/euromilhoes` | Página pública de participação (seleção de 1–50 números, preço dinâmico, botões aleatórios) |
| `/admindashboard/euromilhoes` | Gestão de grelhas (criar, fechar, sortear, ver datas agendadas) |

#### Test Scripts — Fluxo Completo (Windows)

Todos os scripts de teste estão na raiz do projecto e usam `curl` para simular o fluxo completo de cada jogo. Requerem o servidor a correr em `http://localhost:3000`.

| Script | Jogo | Fluxo |
|--------|------|-------|
| `teste-euromilhoes.bat` | Euromilhões | login → criar jogo → criar grelha → verificar datas → jogador participa (saldo deduzido) → vendedor regista anónimo → fechar grelha → sortear (API oficial) → prémio creditado | logs |
| `teste-poio.bat` | Poio da Vaca | login → criar jogo → jogador participa (coordenada A5) → saldo deduzido → commit hash → sortear → verificar resultado |
| `teste-rifa.bat` | Rifa | login → criar jogo → jogador participa (número 7) → saldo deduzido → commit hash → sortear → verificar vencedor |
| `teste-raspadinha.bat` | Raspadinha | login → criar jogo → jogador compra raspadinha (saldo) → saldo deduzido → revelar → reclamar prémio |
| `teste-tudo.bat` | Todos | Executa os 4 scripts acima sequencialmente, reporta **X/4 passed** no final |

##### Como usar

```bash
# Windows Command Prompt (cmd.exe)
teste-euromilhoes.bat

# Ou executar todos os jogos
teste-tudo.bat
```

> ⚠️ **Importante**: Os scripts devem ser executados no **cmd.exe** (não PowerShell) e com terminações de linha **CRLF** (Windows). LF (Unix) pode causar saltos de instruções no parser do batch.

## 🏗️ Stack Tecnológica

- **Frontend**: React 19, Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Radix UI.
- **Backend**: Next.js API Routes, Prisma ORM.
- **Base de Dados**: SQLite (Dev) / PostgreSQL (Prod - Neon).
- **Pagamentos**: Stripe API + MBWay (integração real).
- **Rate Limiting**: Upstash Redis (produção) / In-Memory (desenvolvimento).
- **Testes**: Vitest (232 unit/integration) + Playwright (32 E2E).
- **Docs**: OpenAPI 3.0 + Swagger UI em `/docs`.
- **Infra**: Vercel (deploy), Docker (local).

## 📂 Estrutura de Pastas

```text
src/
├── app/                          # Rotas e Endpoints de API (App Router)
│   ├── api/participacoes/_lib/   # Handlers modulares por tipo de jogo
│   │   ├── types.ts              # Interface GameHandler compartilhada
│   │   ├── raspadinha.ts         # Lógica de raspadinha (grid, hash, probabilidades)
│   │   ├── rifa.ts               # Lógica de rifa (validação, ocupação, hashes)
│   │   ├── poio.ts               # Lógica de poio da vaca (coordenadas, hash)
│   │   ├── euromilhoes.ts        # Lógica de euromilhões (grelha, validação, grelha updates)
│   │   └── index.ts              # Registry de handlers
│   └── docs/                     # Swagger UI (CDN)
├── components/                   # Componentes UI (shadcn + Custom) e Modais
│   ├── cookie-consent-banner.tsx # Cookie consent RGPD com preferências granulares
│   └── notification-bell.tsx     # Sino de notificações com polling
├── features/                     # Módulos de negócio complexos
├── hooks/                        # Lógica de negócio e estado
├── lib/                          # Utilitários e motores
│   ├── auth.ts                   # Autenticação JWT + 2FA TOTP
│   ├── audit.ts                  # Audit logging consolidado (único módulo)
│   ├── rate-limit.ts             # Rate limiting Redis/in-memory
│   ├── validations.ts            # Zod schemas para todas as rotas
│   └── email.ts                  # Envio de emails (bilhetes, etc.)
├── __tests__/                    # Testes Vitest (232 testes)
│   ├── unit/                     # Testes unitários (game-logic, game-handlers)
│   ├── integration/              # Testes de integração (game-lifecycle)
│   └── lib/                      # Testes de bibliotecas (validations, rate-limit, etc.)
├── types/                        # Tipagem centralizada
└── middleware.ts                  # CSRF, autenticação, rate limiting global
```

## ⚙️ Instalação e Execução

### Pré-requisitos
- Node.js 20+ ou Bun 1.1+
- Docker (opcional para deploy)

### Passos
1. **Clonar o repositório**
   ```bash
   git clone https://github.com/smpsandro1239/Aldeias_Games.git
   cd Aldeias_Games
   ```

2. **Instalar dependências**
   ```bash
   bun install
   ```

3. **Configurar Variáveis de Ambiente**
   ```bash
   cp .env.example .env
   # Editar .env com as suas configurações
   ```

4. **Preparar Base de Dados**
   ```bash
   bunx prisma db push
   bunx prisma db seed
   ```

5. **Iniciar em Desenvolvimento**
   ```bash
   bun run dev
   ```

### Upstash Redis (Rate Limiting em Produção)

O rate limiting usa **Upstash Redis** em produção com fallback automático para in-memory em desenvolvimento.

#### Configurar no Upstash:
1. Criar conta em [upstash.com](https://upstash.com)
2. Criar um banco de dados Redis
3. Copiar o **REST URL** e **REST Token**

#### Adicionar ao Vercel:
No dashboard do Vercel → Settings → Environment Variables, adicionar:

| Variável | Descrição |
|----------|-----------|
| `UPSTASH_REDIS_REST_URL` | URL do banco Redis (ex: `https://xxx.upstash.io`) |
| `UPSTASH_REDIS_REST_TOKEN` | Token de autenticação |

> **Nota**: Sem estas variáveis, o rate limiting funciona em modo in-memory (adequado para dev/teste, mas ineficaz em serverless com múltiplas instâncias).

#### Configurações de Rate Limiting:

| Endpoint | Limite | Janela |
|----------|--------|--------|
| Login | 5 tentativas | 15 min |
| Registo | 3 tentativas | 1 hora |
| Forgot Password | 3 tentativas | 1 hora |
| 2FA Verify | 5 tentativas | 5 min |
| API Geral | 100 requests | 1 min |
| Participações | 20 requests | 1 min |
| Pagamentos | 10 requests | 1 min |

## 🔑 Credenciais de Teste (Seed)

> **Segurança**: Os utilizadores demo só estão disponíveis com `ENABLE_DEMO_USERS=true` e `NODE_ENV !== 'production'`. As passwords são hashes bcrypt (não texto plano).

| Role | Email | Password | aldeiaId |
|------|-------|----------|----------|
| Super Admin | admin@aldeias.pt | (ver ENABLE_DEMO_USERS) | — |
| Admin Aldeia | aldeia@gmail.com | (ver ENABLE_DEMO_USERS) | aldeia-vale-azenha |
| Vendedor | vendedor@gmail.com | (ver ENABLE_DEMO_USERS) | aldeia-vale-azenha |
| Jogador | jogador@gmail.com | (ver ENABLE_DEMO_USERS) | — (multi-aldeia) |

## 🛡️ Controlo de Acesso por Role (RBAC)

### Super Admin (`super_admin`)
- ✅ Gestão completa de todas as organizações (Aldeias/Escolas/Clubes)
- ✅ Gestão de todos os eventos e jogos (todas as organizações)
- ✅ Gestão de todos os utilizadores
- ✅ Visualização de transações globais
- ✅ Logs de auditoria completos
- ✅ Seletor de organização pesquisável ao criar jogos
- ✅ Testar jogos em modo fictício
- ✅ Executar sorteios e gerir prémios
- ✅ Carregar saldo na carteira

### Admin Aldeia (`aldeia_admin`)
- ✅ Gestão de eventos da sua organização
- ✅ Gestão de jogos da sua organização
- ✅ Gestão de utilizadores da sua organização (não pode criar outros admins)
- ✅ Executar sorteios e gerir prémios
- ✅ Verificar hash de participações
- ✅ Converter prémios em saldo
- ✅ Confirmar entrega de prémios
- ❌ Não acede a transações globais
- ❌ Não acede a logs de auditoria
- ❌ Não acede a gestão de outras organizações

### Vendedor (`vendedor`)
- ✅ POS Mobile para registo de vendas
- ✅ Modo offline com sincronização
- ✅ Acompanhamento de comissão pessoal
- ✅ Histórico de vendas
- ✅ Recibo de venda
- ❌ Não pode criar/editar/eliminar eventos ou jogos
- ❌ Não pode gerir utilizadores
- ❌ Não acede a dados financeiros globais

### Jogador (`user`)
- ✅ Carteira digital com saldo e extrato
- ✅ Participar em jogos (Raspadinha, Rifa, Poio da Vaca)
- ✅ Revelar raspadinhas interativas
- ✅ Ver participações e resultados
- ✅ Celebração de vitória com confetti
- ✅ Carregar saldo na carteira
- ✅ Verificar transparência de sorteios (hash/seed)
- ✅ Aviso ao jogar fora da sua aldeia
- ❌ Não acede a funcionalidades administrativas

## 💳 MBWay - Integração Real

A plataforma inclui integração real com MBWay através da API oficial:

1. Configure as variáveis de ambiente no `.env`:
   ```bash
   MBWAY_API_URL=https://api.mbway.pt/v1
   MBWAY_API_KEY=sua_chave_api
   MBWAY_ENTITY_PHONE=+351****0000
   MBWAY_ENTITY_CODE=seu_codigo_entidade
   MBWAY_SANDBOX=true  # true para testes
   ```

2. Em modo sandbox, os pagamentos são simulados para testes.

3. Em produção, os pagamentos reais são processados através da API MBWay.

## 🔐 Google OAuth - Autenticação com Conta Google

[Section remains largely unchanged - omitted for brevity in this example]

## 🍎 Apple Sign In - Autenticação com ID Apple

[Section remains largely unchanged - omitted for brevity in this example]

## 👋 Onboarding Personalizado

[Section remains largely unchanged - omitted for brevity in this example]

## 🐳 Docker

[Section remains largely unchanged - omitted for brevity in this example]

## 📄 Licença

MIT License - ver [LICENSE](LICENSE) para detalhes.

---

## 📝 Próximos Passos para Produção

- [x] Autenticação 2FA (TOTP) completa
- [x] Cookie consent RGPD com preferências granulares
- [x] Refresh token rotation
- [x] CSRF protection (Origin/Referer validation)
- [x] Rate limiting com Upstash Redis
- [x] Audit logging consolidado
- [x] Testes unitários (232) + E2E (32)
- [x] OpenAPI docs com Swagger UI
- [x] Handlers modulares por tipo de jogo
- [x] Migração `middleware.ts` → `proxy.ts` (Next.js 16)
- [x] Eliminação de 287 erros TypeScript (`: any` → tipos concretos)
- [ ] Configurar Upstash Redis no Vercel (env vars)
- [ ] Remover `ignoreBuildErrors: true` (SWC bug Node.js v24)

## 🔄 Account Linking (Vinculação de Contas)

[Section remains largely unchanged - omitted for brevity in this example]

### 🪟 Windows — Local Build

Turbopack não funciona no Windows (erro `invalid type: unit value, expected usize` no SWC do Next.js 16.2.7 com Node 24). Use o Webpack:

```bash
npx next build --webpack
```

Se o TypeScript checker falhar com `Error: invalid type: unit value, expected usize` (WASM), usar o workaround de compilação sem TS checker:

```bash
npx next build --webpack --no-typescript
# Ou, se a flag não existir:
set NODE_OPTIONS=--experimental-vm-modules
npx next build --webpack
```

Limpar cache `.next` resolve CSS não atualizar ou erros estranhos de compilação:

```bash
Remove-Item -Recurse -Force .next
if ($?) { npm run dev }
```

### 🐚 Batch Scripts (cmd.exe) — Troubleshooting

Todos os scripts de teste (`.bat`) devem ser executados no **cmd.exe** (Command Prompt), não no PowerShell.

#### CRLF vs LF — Erro Silencioso

O parser do cmd.exe **não interpreta corretamente** ficheiros com terminações de linha Unix (LF). As instruções podem ser saltadas sem aviso. Sintomas:
- O output salta de `=== 2. Criar Jogo ===` diretamente para `=== 8. Verificar premio ===`
- Comandos `findstr` falham com `FINDSTR: Cannot open ficheiro`
- Variáveis aparecem vazias

**Fix**: Converter para CRLF antes de editar ou correr:

```powershell
# PowerShell
$content = [System.IO.File]::ReadAllText("ficheiro.bat")
$content = $content -replace "`r`n", "`n"
$content = $content -replace "`n", "`r`n"
[System.IO.File]::WriteAllText("ficheiro.bat", $content, [System.Text.Encoding]::Default)
```

#### extract_json — JSON Multi-Linha

O Next.js dev server imprime JSON com indentação (pretty-print). A função `extract_json` original só capturava a **última linha** porque usava `findstr /n` + `find`. **Fix**: Usar `for /f "usebackq delims="` + `!LINE!` para concatenar todas as linhas:

```batch
:extract_json
for /f "usebackq delims=" %%L in (%1) do set "jsonLine=%%L"
exit /b
```

#### Delayed Expansion em Blocos `if`

Variáveis dentro de blocos `if (...) else (...)` com `set /a` precisam de `!VAR!` (delayed expansion) em vez de `%VAR%`, senão expandem antes do bloco executar:

```batch
:: ERRADO: %DIF% expande antes de set /a executar
if ... (
    set /a DIF = %ANTES% - %DEPOIS%
    echo Diferenca: %DIF%@
)

:: CORRETO: delayed expansion com !DIF!
setlocal enabledelayedexpansion
if ... (
    set /a DIF = ANTES - DEPOIS
    echo Diferenca: !DIF!@
)
```

### 🔄 Prisma — Migrações Locais

Após alterar `prisma/schema.prisma`, executar:

```bash
npx prisma@6.19.3 db push
npx tsx prisma/seed-full.ts   # após reiniciar servidor
```

## 🚨 Troubleshooting

### Common Build, Runtime & Test Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `invalid type: unit value, expected usize` | SWC/WASM bug in Next.js 16.2.7 + Node 24 on Windows | Use `npx next build --webpack` (no Turbopack). Se o TypeScript checker falhar, passar `--no-typescript` |
| CSS não atualiza / stylesheet 404 | Cache `.next` corrompido | `Remove-Item -Recurse -Force .next` + reiniciar servidor |
| Login 500 error | Build parcial corrompida ou base de dados inconsistente | Limpar `.next`, reiniciar servidor, verificar seed |
| `FINDSTR: Cannot open _resp_*.json` | Ficheiro não existe, caminho incorreto, ou LF line endings no batch | Verificar se o passo anterior criou o ficheiro; converter batch para CRLF |
| Variáveis `%VAR%` vazias em `if` | Batch sem delayed expansion | Usar `!VAR!` com `setlocal enabledelayedexpansion` |
| Script salta passos (ex: 2→8) | LF line endings no `.bat` | Converter para CRLF (ver secção Windows acima) |
| `loadManifest` crash (dev server) | Next.js dev server corrompe `manifest.json` após vários requests | Reiniciar servidor; usar produção (`next start`) para testes intensivos |
| `params: { id: string }` → `params: Promise<{ id: string }>` | Next.js 16 requires async params | Atualizar tipo do parâmetro para `Promise<...>` |
| `Cannot find name 'apiRequest'` | Import em falta | Adicionar `import { apiRequest } from "@/lib/api-client"` |
| Import não usado (TypeScript error) | Import residual após refactor | Remover import não utilizado |
| `export` indevido em função local | Função helper marcada como `export` quando só é usada no mesmo ficheiro | Remover `export` |
| `getOfficialTime()` timeout na WorldTimeAPI | Timeout de 5s excedido durante dev; pode corromper compilações | Verificar conectividade; o sistema usa fallback com hora local em caso de falha |

## 🎯 Transparência e Segurança nos Jogos - Detalhes Técnicos

### Proteção de Dados e Conformidade RGPD
- **Consentimento explícito**: Todos os utilizadores devem consentir com a política de privacidade
- **Direito ao esquecimento**: Implementado conforme regulamento
- **Portabilidade de dados**: Utilizadores podem exportar os seus dados
- **Minimização de dados**: Só são coletados os dados estritamente necessários
- **Armazenamento seguro**: Criptografia em repouso para dados sensíveis

### Auditoria Completa de Ações
Cada ação significativa na plataforma gera um registo no AuditLog com:
- **Utilizador responsável** (quando aplicável)
- **Timestamp preciso** com timezone
- **Endereço IP** (para deteção de actividades suspeitas)
- **User Agent** (identificação do dispositivo/navegador)
- **Descrição detalhada** da ação realizada
- **Dados antes e depois** (quando aplicável para alterações)
- **Recursos afetados** (jogo, evento, utilizador, etc.)

### Especificamente para Sorteios:
Cada sorteio gera registos de auditoria para:
1. **Criação do commit** (quando o hash de commitment é gerado)
2. **Execução do sorteio** (quando o seed é revelado e o resultado é calculado)
3. **Distribuição de prémios** (quando os vencedores são notificados e os prémios são atribuídos)
4. **Verificação pública** (qualquer consulta ao endpoint de verificação gera um registo de acesso)

### Endpoint Público de Verificação de Sorteios
Para maximizar a transparência, disponibilizamos um endpoint público para verificação de qualquer sorteio:

**GET** `/api/jogos/[id]/verificar-sorteio`

Este endpoint retorna:
- O hash de commitment original (da fase de commit)
- O seed revelado (se o sorteio já ocorreu)
- O resultado do sorteio (se já ocorreu)
- Instruções passo a passo para verificação independente
- Metadados do jogo (nome, tipo, data de criação, etc.)

Qualquer pessoa pode usar este endpoint para:
1. Confirmar que um sorteio ocorreu
2. Verificar a justiça do sorteio recalculando o hash
3. Confirmar que o resultado corresponde ao seed revelado
4. Verificar que o sorteio não foi manipulado após o início das vendas

## 🧪 Testes (232 testes)

| Tipo | Framework | Testes | Ficheiros |
|------|-----------|--------|-----------|
| Unitários | Vitest | 152 | game-logic, game-handlers, validations, utils |
| Integração | Vitest | 35 | game-lifecycle |
| Bibliotecas | Vitest | 45 | rate-limit, i18n, financial-validations |
| E2E | Playwright | 32 | auth, navigation, mobile, accessibility |

```bash
# Todos os testes
npx vitest run

# Teste específico
npx vitest run src/__tests__/unit/game-handlers.test.ts

# E2E (requer servidor a correr)
npx playwright test --reporter=list

# Todos (Vitest + Playwright + API scripts)
teste-tudo.bat
```

### Testes dos Handlers de Jogo

Os testes em `src/__tests__/unit/game-handlers.test.ts` validam:
- **Registry**: Handlers para os 4 tipos (raspadinha, rifa, poio, euromilhoes)
- **Raspadinha**: Grid 3x3, hash SHA-256, probabilidades, prémios
- **Rifa**: Validação, duplicados, ocupação, race conditions
- **Poio da Vaca**: Hash de coordenadas
- **Euromilhões**: Grelha, range 1-50, bloqueio temporal

## 📞 Suporte e Contato

Para questões técnicas, sugestões ou relatos de bugs, por favor:

1. Verifique se o problema já está documentado neste README
2. Consulte a seção de troubleshooting acima
3. Se persistir, abra uma issue no repositório com:
    - Descrição clara do problema
    - Passos para reproduzir
    - Logs relevantes (removendo informações sensíveis)
    - Versão do Node.js/Bun e Next.js sendo usada

---

## 📋 Changelog v3.12.0

### Segurança (P1)
- Demo users protegidos por `ENABLE_DEMO_USERS=true` + `NODE_ENV !== 'production'`
- Registo de utilizador já não emite JWT (requer verificação de email)
- `setup-status` PATCH protegido com RBAC (super_admin/aldeia_admin)
- Password validation unificada (12+ chars, maiúscula, minúscula, número, especial)
- Zod schemas em 3 endpoints financeiros (depósitos, levantamentos)
- RGPD: Anonimização completa (participações, transactions, logs, tokens)
- Audit logging em sorteios (commit-reveal)
- Fix: Euromilhoes string `contains` bug (usa `Array.includes`)

### Arquitetura (P2)
- OpenAPI 3.0 + Swagger UI em `/docs` (25+ endpoints)
- 3 bibliotecas de audit consolidadas em 1 (`audit.ts`)
- Error boundaries em 5 dashboards
- Rate limiting: Suporte a Upstash Redis com fallback in-memory
- 16 testes de middleware (auth, CSRF, RBAC, páginas públicas)
- Handlers modulares por tipo de jogo (raspadinha, rifa, poio, euromilhoes)
- 41 novos testes unitários para handlers

### Melhorias (P3)
- `poweredByHeader: false` em `next.config.js`
- Cashback percentual configurável (default 5%, max 50%)
- Cookie consent granular com toggle de analytics
- Migração `middleware.ts` → `proxy.ts` (Next.js 16)
- Eliminação de 287 erros TypeScript (`: any` → tipos concretos)