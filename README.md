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
   MBWAY_ENTITY_PHONE=+351900000000
   MBWAY_ENTITY_CODE=seu_codigo_entidade
   MBWAY_SANDBOX=true  # true para testes
   ```

2. Em modo sandbox, os pagamentos são simulados para testes.

3. Em produção, os pagamentos reais são processados através da API MBWay.

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

**Desenvolvido com ❤️ para as aldeias de Portugal.** 🇵🇹
