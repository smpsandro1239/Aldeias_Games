# 🎮 Aldeias Games 2026 - Digital Fundraising Platform

![Version](https://img.shields.io/badge/version-3.11.0-indigo)
![License](https://img.shields.io/badge/license-MIT-green)
![Next.js](https://img.shields.io/badge/Framework-Next.js%2016-black)
![Tailwind](https://img.shields.io/badge/CSS-Tailwind%204-blue)
![Status](https://img.shields.io/badge/status-online-brightgreen)

**🌐 Ver Online:** [aldeiasgame.vercel.app](https://aldeiasgame.vercel.app)

**Aldeias Games** é uma plataforma SaaS (Software as a Service) multi-tenant de alto desempenho, focada na dinamização de comunidades locais portuguesas através de jogos tradicionais digitalizados para angariação de fundos.

## 🚀 Funcionalidades Principais

### Para Utilizadores (Jogadores)
- **Jogos Interativos**: Poio da Vaca (grelha), Rifa/Tombola e Raspadinhas Digitais.
- **Experiência Imersiva**: Efeitos sonoros processuais e visuais (confetti) via Web Audio API.
- **Pagamentos Seguros**: Integração com Stripe e **MBWay real**.
- **App PWA**: Instalável em qualquer smartphone com suporte offline.

### Para Organizações (Aldeias/Escolas/Clubes)
- **Gestão de Campanhas**: Criação e monitorização de eventos de angariação.
- **CRM e Analytics**: Acompanhamento de vendas, participantes e metas financeiras.
- **Wizard de Configuração**: Configuração guiada e conformidade legal integrada.

### Segurança e Transparência
- **Auditoria de Sorteios**: Algoritmos baseados em SHA-256 (Seed/Hash) para garantir justiça.
- **Proteção de Dados**: Conformidade total com RGPD (EU/PT 2026).
- **Rate Limiting**: Defesa nativa contra bots e ataques DDoS.

## 🏗️ Stack Tecnológica

- **Frontend**: React 19, Next.js 16, TypeScript, Tailwind CSS 4, Framer Motion.
- **Backend**: Next.js API Routes, Prisma ORM.
- **Base de Dados**: SQLite (Dev) / PostgreSQL (Prod).
- **Pagamentos**: Stripe API + MBWay (integração real).
- **Infra**: Docker, Caddy Server.

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
   git clone https://github.com/your-repo/aldeias-games.git
   cd aldeias-games
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
