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
- **Jogos Interativos**: Poio da Vaca (grelha), Rifa/Tombola e Raspadinhas Digitais.
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

### Segurança e Transparência
- **Auditoria de Sorteios**: Algoritmos baseados em SHA-256 (Seed/Hash) para garantir justiça.
- **Proteção de Dados**: Conformidade total com RGPD (EU/PT 2026).
- **Rate Limiting**: Defesa nativa contra bots e ataques DDoS.
- **2FA**: Autenticação de dois fatores para admins (configurável).
- **RBAC**: Controlo de acesso baseado em roles em todas as rotas API.

## 🏗️ Stack Tecnológica

- **Frontend**: React 19, Next.js 16, TypeScript, Tailwind CSS 4, Framer Motion.
- **Backend**: Next.js API Routes, Prisma ORM.
- **Base de Dados**: SQLite (Dev) / PostgreSQL (Prod - Neon).
- **Pagamentos**: Stripe API + MBWay (integração real).
- **Infra**: Docker, Caddy Server, Vercel.

## 📂 Estrutura de Pastas

```text
src/
├── app/          # Rotas e Endpoints de API (App Router)
├── components/   # Componentes UI (Shadcn + Custom) e Modais
├── features/     # Módulos de negócio complexos (Admin, Vendedor, Cliente)
├── hooks/        # Lógica de negócio e estado (Zustand, React Query)
├── lib/          # Utilitários, Motores (Auth, DB, Stripe, Storage, MBWay)
├── types/        # Tipagem centralizada e rigorosa
└── middleware.ts # Camada de segurança global (Rate Limit/Auth)
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

## 🔑 Credenciais de Teste (Seed)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@aldeias.pt | 123456 |
| Admin Aldeia | aldeia@gmail.com | 123456 |
| Vendedor | vendedor@gmail.com | 123456 |
| Jogador | smpsandro1239@gmail.com | 123456 |

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

A plataforma suporta autenticação via Google OAuth, permitindo que usuários façam login usando suas contas do Google.

### Configuração no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Crie um projeto (ou use um existente)
3. Vá em "APIs e Serviços" → "Credenciais"
4. Clique em "Criar credenciais" → "ID do cliente OAuth"
5. Tipo de aplicativo: **"Aplicativo da web"**
6. Nome: "Aldeias Games"
7. URIs de redirecionamento autorizados:
   - Desenvolvimento: `http://localhost:3000/api/auth/google/callback`
   - Produção: `https://seudominio.com/api/auth/google/callback`
8. Clique em "Criar"
9. Copie o **Client ID** e **Client Secret**

### Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis ao seu arquivo `.env` (ou `.env.local` para desenvolvimento):

```bash
# Google OAuth
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"  # Desenvolvimento
# GOOGLE_REDIRECT_URI="https://seudominio.com/api/auth/google/callback"  # Produção

# NextAuth (opcional, para compatibilidade futura)
NEXTAUTH_SECRET=uma_chave_secreta_muito_longa_aqui_para_assinatura_de_tokens
NEXTAUTH_URL="http://localhost:3000"  # Desenvolvimento
# NEXTAUTH_URL="https://seudominio.com"  # Produção
```

### Como Funciona

1. **Primeiro login**: Se o email do Google não existir no sistema, um novo usuário é criado automaticamente com:
   - Nome e foto do perfil do Google
   - Email verificado (já que o Google verifica emails)
   - Papel padrão: `user` (jogador)
   - Senha aleatória (não utilizada para login, apenas para satisfazer o schema)

2. **Login subsequente**: Se o email já existir:
   - O usuário existente é encontrado
   - Seu nome e foto são atualizados com as informações mais recentes do Google
   - O Google ID é vinculado à conta (se ainda não estiver)
   - O papel (role) do usuário existente é **preservado** (não é sobrescrito)

3. **Segurança**:
   - Proteção CSRF via parâmetro `state`
   - Cookies httpOnly seguros
   - Validação de tokens do Google
   - Tratamento adequado de erros

### Testando o Google OAuth

Para testar localmente:
1. Certifique-se de que as variáveis `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estão configuradas no `.env`
2. Inicie o servidor: `bun run dev`
3. Acesse: `http://localhost:3000`
4. Clique em "Entrar" → "Continuar com o Google"
5. Autorize com sua conta Google
6. Você será redirecionado de volta para a aplicação e feito login automaticamente

### Personalização

- O botão de login com Google usa o ícone oficial do Google com fallback para garantir que sempre apareça
- Estados de loading são exibidos durante o processo de autenticação
- Após o login, o usuário é redirecionado para o dashboard correto baseado em seu role

## 🍎 Apple Sign In - Autenticação com ID Apple

A plataforma suporta autenticação via Sign in with Apple, permitindo que usuários façam login usando suas contas Apple ID (ideal para usuários iOS/macOS).

### Configuração no Apple Developer Portal

1. Acesse: https://developer.apple.com/account/
2. Vá em "Certificates, Identifiers & Profiles"
3. Under "Identifiers", clique em "+" para criar um novo identificador
4. Selecione "Services IDs" → Continue
5. Descrição: "Aldeias Games Sign in with Apple"
   - Identifier: algo como `com.seudominio.aldeiasgames` (deve ser único)
   - Marque a caixa "Sign in with Apple" → Continue → Registrar
6. Configure o Services ID criado:
   - Selecione o Services ID que você criou
   - Em "Sign in with Apple", clique em "Configure"
   - Primary App ID: Selecione um app web (ou deixe em branco para web apenas)
   - Save
7. Crie uma chave (Key) para Sign in with Apple:
   - Under "Keys", clique em "+" para criar uma nova chave
   - Nome: "Aldeias Games Apple Key"
   - Marque a caixa "Sign in with Apple" → Configure
   - Selecione o Services ID que você criou anteriormente
   - Save → Isso irá gerar um arquivo .p8 para download
8. Anote:
   - Key ID (mostrado na tela após criar a chave)
   - Seu Team ID (visible na conta do desenvolvedor)
   - Faça o download do arquivo .p8

### Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis ao seu arquivo `.env` (ou `.env.local` para desenvolvimento):

```bash
# Apple Sign In
APPLE_CLIENT_ID=com.seudominio.aldeiasgames  # Seu Services ID
APPLE_TEAM_ID=SEUTEAMIDAQUI                 # Seu Apple Developer Team ID
APPLE_KEY_ID=SUAKEYIDAQUI                   # Key ID da chave criada acima
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQ...\n-----END PRIVATE KEY-----"  # Conteúdo do arquivo .p8
APPLE_REDIRECT_URI="http://localhost:3000/api/auth/apple/callback"  # Desenvolvimento
# APPLE_REDIRECT_URI="https://seudominio.com/api/auth/apple/callback"  # Produção
```

> **⚠️ IMPORTANTE**: A variável `APPLE_PRIVATE_KEY` deve conter exatamente o conteúdo do arquivo .p8 baixado do Apple Developer Portal, incluindo as linhas `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`, com quebras de linha reais (use `\n` em strings JSON ou quebras de linha reais em arquivos .env).

### Como Funciona

1. **Primeiro login**: Se o email da Apple não existir no sistema, um novo usuário é criado automaticamente com:
   - Nome (se fornecido pela Apple - o usuário pode escolher não compartilhar)
   - Email (pode ser um email real ou um email privado de relay `@privaterelay.appleid.com`)
   - Email marcado como verificado (Apple pré-verifica emails quando `email_verified` é true)
   - Papel padrão: `user` (jogador)
   - Senha aleatória (não utilizada para login, apenas para satisfazer o schema)
   - Apple ID vinculado à conta
   - Provider definido como `apple`

2. **Login subsequente**: Se o email já existir:
   - O usuário existente é encontrado pelo email
   - Seu nome é atualizado com as informações mais recentes da Apple (se fornecido)
   - O Apple ID é vinculado à conta (se ainda não estiver)
   - O provedor de autenticação é definido como `apple` (se ainda não estiver definido)
   - **O papel (role) do usuário existente é preservado** (não é sobrescrito com 'user' padrão)
   - Último login é atualizado

3. **Segurança**:
   - **Verificação completa do ID Token**: Implementamos verificação JWKS adequada usando as chaves públicas da Apple em `https://appleid.apple.com/auth/keys`
   - Validação de assinatura (algoritmo ES256)
   - Validação de issuer (`https://appleid.apple.com`)
   - Validação de audience (deve ser nosso Client ID)
   - Validação de expiração
   - Cache das chaves públicas da Apple (válidas por 24h conforme recomendação da Apple)
   - Proteção CSRF via parâmetro `state` com cookie httpOnly
   - Cookies de autenticação httpOnly seguros
   - Tratamento adequado de erros e edge cases (como emails privados da Apple)

> **🔒 Aviso de Segurança Crítico**: 
> A verificação adequada do ID Token da Apple é **obrigatória para uso em produção**. 
> Nunca confie em tokens sem verificar a assinatura usando as chaves públicas da Apple.
> Nossa implementação inclui um fallback apenas para desenvolvimento (quando credenciais não estão configuradas) que **DEVE ser desativado em produção**.

### Testando o Sign in with Apple

Para testar localmente:
1. Certifique-se de que as variáveis `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID` e `APPLE_PRIVATE_KEY` estão configuradas no `.env`
2. Inicie o servidor: `bun run dev`
3. Acesse: `http://localhost:3000`
4. Clique em "Entrar" → "Continuar com a Apple"
5. Você será redirecionado para a página de login da Apple
6. Autorize com sua Apple ID (use uma conta de teste do Apple Developer Portal se necessário)
7. Após autorizar, você será redirecionado de volta para a aplicação e feito login automaticamente

### Personalização

- O botão de login com Apple usa o SVG oficial da Apple para aparência autêntica
- Estados de loading são exibidos durante o processo de autenticação
- Após o login, o usuário é redirecionado para o dashboard correto baseado em seu role
- O sistema lida adequadamente com:
  - Usuários que escolhem não compartilhar o nome com a Apple
  - Emails privados de relay da Apple (`@privaterelay.appleid.com`)
  - Contas existentes vinculando com Apple (account linking)

## 👋 Onboarding Personalizado

A plataforma agora inclui uma experiência de onboarding personalizada para usuários que fazem seu primeiro login via OAuth (Google ou Apple).

### Como Funciona o Onboarding

1. **Primeiro login via OAuth**: Quando um usuário faz seu primeiro login usando Google ou Apple:
   - Após a autenticação bem-sucedida, ele é redirecionado para a página `/onboarding`
   - A página coleta informações básicas para personalizar a experiência
   - O usuário pode completar o onboarding ou pular para acessar o dashboard diretamente

2. **Informações coletadas**:
   - Nome completo (se não foi fornecido pelo OAuth)
   - Telefone (opcional)
   - Preferências iniciais (para futuras personalizações)

3. **Após completar o onboarding**:
   - O usuário é marcado como `onboardingCompleted: true` no banco de dados
   - Ele é redirecionado para o dashboard correto baseado em seu role
   - Login subsequente vai diretamente para o dashboard (pula o onboarding)

### Benefícios do Onboarding

- **Experiência personalizada**: Coleta informações essenciais para melhor atender o usuário
- **Redução de fricção**: Permite que usuários comecem rapidamente mesmo que queiram pular inicialmente
- **Dados completos**: Garante que informações importantes como telefone sejam coletadas quando possível
- **Flexibilidade**: Usuários podem completar o onboarding em um momento conveniente

## 🐳 Docker

```bash
# Build da imagem
docker build -t aldeias-games .

# Executar
docker run -p 3000:3000 --env-file .env aldeias-games
```

## 📄 Licença

MIT License - ver [LICENSE](LICENSE) para detalhes.

---

## 📝 Próximos Passos para Produção

Antes de colocar a plataforma em produção, certifique-se de:

1. **Configurar corretamente todas as variáveis de ambiente** para o seu domínio de produção
2. **Verificar a segurança do Apple Sign In**:
   - Confirmar que a verificação JWKS do ID token está ativa (não usando fallback de desenvolvimento)
   - Testar com contas reais da Apple ID
   - Verificar os logs para garantir que não há avisos de "development fallback"
3. **Configurar URLs de redirecionamento corretas** no:
   - Google Cloud Console
   - Apple Developer Portal
   - Stripe Dashboard
4. **Testar todos os fluxos de autenticação**:
   - Login tradicional (email/senha)
   - Google OAuth (nova conta e linking)
   - Apple Sign In (nova conta e linking)
   - Account linking entre diferentes provedores (ex: Google → Apple)
5. **Verificar o tratamento de emails privados da Apple** (`@privaterelay.appleid.com`)
6. **Testar o fluxo de onboarding**:
   - Primeiro login via Google → deve mostrar página de onboarding
   - Primeiro login via Apple → deve mostrar página de onboarding
   - Login subsequente → deve ir direto para dashboard
   - Account linking + onboarding → funciona corretamente
7. **Configurar monitoramento e logs** para detectar tentativas de fraude ou abuso
8. **Realizar testes de carga** para garantir desempenho sob pressão
9. **Fazer backup da base de dados** antes do deploy

### Checklist de Segurança para Produção:

- [ ] Variáveis de ambiente configuradas corretamente (sem valores dummy)
- [ ] Verificação JWKS do ID token da Apple ativa (sem fallback de desenvolvimento)
- [ ] Cookies autenticação com flags Secure, HttpOnly e SameSite adequadas
- [ ] Rate limiting funcionando em todas as rotas de autenticação
- [ ] CSRF protection ativa em todos os fluxos OAuth
- [ ] Tratamento de erros seguro (sem vazamento de informações sensíveis)
- [ ] Headers de segurança implementados (Helmet ou equivalente)
- [ ] Dependências atualizadas e verificadas quanto a vulnerabilidades
- [ ] HTTPS configurado e forçado em produção
- [ ] Logs de auditoria ativos para eventos de autenticação

## 🔄 Account Linking (Vinculação de Contas)

A plataforma suporta **account linking inteligente** entre diferentes provedores de autenticação:

- **Google ↔ Apple**: Se um usuário tentar fazer login com Apple usando um email que já existe via Google (ou vice-versa), as contas são vinculadas automaticamente
- **Email/Senha ↔ OAuth**: Usuários que se cadastraram com email/senha podem vincular contas Google/Apple posteriormente
- **Preservação de Role**: Ao vincular contas, o papel (role) existente do usuário é **sempre preservado**, independentemente do provedor usado para o login

### Como Funciona o Account Linking:

1. Quando um usuário tenta fazer login com um provedor OAuth (Google ou Apple):
2. O sistema procura por um usuário existente com o mesmo email
3. Se encontrado:
   - Atualiza as informações do perfil (nome, foto, etc.) com os dados mais recentes do provedor
   - Vincula o ID do provedor à conta (se ainda não estiver vinculado)
   - Define o provedor de autenticação (se ainda não estiver definido)
   - **Mantém o role existente exatamente como estava** (não sobrescreve)
   - Atualiza o timestamp de último login
4. Se não encontrado:
   - Cria um novo usuário com os dados do provedor
   - Define o role padrão como `user` (jogador)

## 🚨 Troubleshooting

### Problemas Comuns com Apple Sign In:

**"Invalid ID token"**:
- Verifique se o `APPLE_CLIENT_ID` corresponde exatamente ao Services ID criado no Apple Developer Portal
- Certifique-se de que o `APPLE_REDIRECT_URI` corresponde exatamente ao configurado no Apple Developer Portal
- Verifique se o relógio do servidor está sincronizado (tokens têm janela de validade curta)

**"Unable to find key for kid"**:
- Isso pode acontecer se as chaves da Apple foram rotacionadas - nosso sistema busca novas chaves automaticamente
- Em desenvolvimento, tente limpar o cache do Next.js ou reiniciar o servidor
- Em produção, verifique se há problemas de conectividade com `https://appleid.apple.com/auth/keys`

**"Apple credentials not configured"**:
- Verifique se todas as variáveis `APPLE_*` estão definidas no seu `.env`
- Lembre-se de que o `APPLE_PRIVATE_KEY` precisa do conteúdo completo do arquivo .p8

**Conta não está sendo vinculada (account linking)**:
- Verifique se o email está sendo retornado pela Apple (o usuário pode ter escolhido ocultar o email)
- Certifique-se de que o email está verificado (`email_verified: true` no token)
- Verifique se não há erros nos logs do servidor durante o processo de vínculo

### Problemas Comuns com Onboarding:

**Onboarding não aparece após primeiro login OAuth**:
- Verifique se o campo `onboardingCompleted` está definido como `false` para novos usuários
- Certifique-se de que o handler OAuth está definindo `onboardingCompleted: false` ao criar novos usuários
- Verifique se há erros nos logs durante o processo de criação de usuário

**Redirecionamento incorreto após onboarding**:
- Verifique se a página `/onboarding/page.tsx` está correta
- Certifique-se de que o hook `useAuth` está funcionando corretamente
- Verifique se o role do usuário está sendo lido corretamente para redirecionamento

## 📞 Suporte e Contato

Para questões técnicas, sugestões ou relatos de bugs, por favor:

1. Verifique se o problema já está documentado neste README
2. Consulte a seção de troubleshooting acima
3. Se persistir, abra uma issue no repositório com:
   - Descrição clara do problema
   - Passos para reproduzir
   - Logs relevantes (removendo informações sensíveis)
   - Versão do Node.js/Bun e Next.js sendo usada
   - Ambiente (desenvolvimento, staging, produção)

**Desenvolvido com ❤️ para as aldeias de Portugal.** 🇵🇹

**Versão 3.12.0** | **Última atualização**: Maio 2026
## 🏘️ Funcionalidades Core do Jogo - Sistema de Aldeias

O Sistema de Aldeias é a estrutura social central da plataforma, permitindo que usuários formem comunidades, colaborem em eventos e jogos, e acumulem recursos coletivamente.

### 🏗️ Arquitetura das Aldeias

- **Criação de Aldeias**: Qualquer usuário autenticado pode criar uma aldeia definindo nome, descrição, tipo (aldeia, escola, associação de pais, clube) e configurações de pagamento.
- **Gestão de Membros**: Sistema de muitos-para-muitos entre usuários e aldeias com papéis definidos:
  - : Pode gerenciar membros, promover/rebaixar roles, editar configurações da aldeia
  - : Pode ajudar na gestão de membros e aprovar Participações
  - : Pode participar de eventos, jogos e contribuir para os recursos da aldeia
- **Progresso da Aldeia**: Cada aldeia tem nível, experiência, pontos e moeda interna que aumentam com a participação em eventos e jogos.
- **Recursos Coletivos**: Moeda interna da aldeia que pode ser usada para melhorias, desbloqueio de funcionalidades especiais ou distribuição entre membros.

### 🔑 Funcionalidades Implementadas

1. **Modelo de Dados Aprimorado**:
   - : Nível atual da aldeia (padrão: 1)
   - : Experiência acumulada para subir de nível
   - : Pontos totais conquistados pela aldeia
   - : Recurso coletivo da aldeia (padrão: 0)
   - : Contagem de membros ativos (calculada dinamicamente)
   - : Timestamp de quando a aldeia foi criada

2. **API REST Completa**:
   - : Lista aldeias públicas com paginação, busca e filtros
   - : Cria nova aldeia (requer autenticação)
   - : Obtém detalhes de uma aldeia específica
   - : Atualiza aldeia (apenas líder/admin)
   - : Permite que um usuário entre em uma aldeia como membro

3. **Dashboard da Aldeia Protegido**:
   - Página  acessível apenas para membros da aldeia
   - Exibe estatísticas em tempo real:
     - Membros ativos e online
     - Progresso de nível e experiência necessária para o próximo nível
     - Recursos coletivos (moeda interna, pontos)
     - Membros recentes que entraram na aldeia
     - Eventos e jogos recentes da aldeia

4. **Integração com Audit Log**:
   - Todas as ações importantes são registradas para rastreabilidade:
     - Criação de aldeias
     - Entrada de membros em aldeias
     - Alterações de papel (role) de membros
     - Atualizações de configurações da aldeia

### 📱 Experiência Mobile

- Interface responsiva otimizada para smartphones usando Tailwind CSS
- Componentes shadcn/ui adaptados para telas touch
- Navegação intuitiva entre lista de aldeias, detalhes e dashboard
- Botões e áreas de toque com tamanho adequado para interação móvel

### 🔒 Segurança e Autorização

- Todas as rotas API são protegidas por autenticação
- Autorização por papel (role) dentro da aldeia para ações administrativas
- Validação de dados com Zod em todas as entradas
- Prevenção de slug duplicado ao criar/atualizar aldeias
- Rate limiting aplicado para prevenir abusos

### 🧪 Como Testar

1. **Criar uma aldeia**:
   - Faça login como qualquer usuário
   - Acesse a página /aldeias
   - Clique em "Criar Aldeia"
   - Preencha o formulário com nome, descrição e tipo
   - Confirme a criação

2. **Entrar em uma aldeia**:
   - Na lista de aldeias (/aldeias), clique em qualquer aldeia para ver seus detalhes
   - Clique no botão "Entrar na Aldeia"
   - Confirme a entrada

3. **Acessar o dashboard**:
   - Após entrar em uma aldeia, acesse /aldeia/[id]/dashboard (substitua [id] pelo ID da aldeia)
   - Você verá o dashboard com estatísticas da sua aldeia

4. **Testar gestão de membros (líder apenas)**:
   - O criador da aldeia é automaticamente definido como líder
   - Líderes podem gerenciar membros através da API (futuras funcionalidades)

### 📈 Próximos Passos

- Implementar página de gestão de membros para líderes promover/rebaixar/remover membros
- Adicionar funcionalidades de doação e transferência de recursos entre aldeias
- Criar conquistas e badges específicos para participação em aldeias
- Implementar sistema de níveis de aldeia com recompensas progressivas
- Adicionar integração com jogos específicos (Poio da Vaca, Rifa, Raspadinha) para contribuir com recursos da aldeia

---\n
\n
