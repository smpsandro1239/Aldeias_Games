# Deploy Guide - Aldeias Games

## Visão Geral

Este guia explica como fazer deploy do projeto Aldeias Games para Vercel com PostgreSQL (Neon).

---

## Step 1: Criar Base de Dados Neon

1. Vai a https://console.neon.tech
2. Cria um novo projeto:
   - **Name:** aldeias-games
   - **Region:** EU West (London)
   - **Version:** PostgreSQL 15
3. Copia a connection string (vai ser algo como `postgresql://user:password@ep-xxx.eu-west-2.aws.neon.tech/neondb`)

**Importante:** Usa o **pooler endpoint** para evitar problemas de conexão:
```
postgresql://neondb_owner:password@ep-patient-haze-abnxdpma-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

## Step 2: Configurar Variáveis de Ambiente na Vercel

### Opção A: Via Dashboard

1. Vai a https://vercel.com/smpsandro1239s-projects/aldeias-games/settings/environment-variables
2. Adiciona cada variável:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_xxx@ep-xxx-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require` | Production |
| `JWT_SECRET` | String aleatória 32+ caracteres | Production |
| `NEXT_PUBLIC_APP_URL` | `https://aldeias-games.vercel.app` | Production |
| `NEXT_PUBLIC_BASE_URL` | `https://aldeias-games.vercel.app` | Production |

### Opção B: Via CLI (Recomendado para automatização)

```bash
# Deploy com variável inline
npx vercel --prod --yes --env DATABASE_URL="postgresql://neondb_owner:password@ep-xxx-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

---

## Step 3: Configurar Prisma

Verifica que `prisma/schema.prisma` está configurado para PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Step 4: Deploy Automático (GitHub Actions)

O projeto já tem GitHub Actions configurado. Faz push para main e o deploy acontece automaticamente.

### Deploy Manual (CLI)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy produção
npx vercel --prod --yes --token VERCEL_TOKEN
```

**Com token específico:**
```bash
npx vercel --prod --yes --token SEU_VERCEL_TOKEN
```

---

## Step 5: Verificar Deploy

Após o deploy, verifica que tudo funciona:

1. **Página principal:** https://aldeias-games.vercel.app
2. **API Health:** https://aldeias-games.vercel.app/api/health

---

## Problemas Comuns e Soluções

### ❌ Internal Server Error (500)

**Causa:** DATABASE_URL não está configurada corretamente.

**Solução:**
1. Verifica que a variável `DATABASE_URL` está nas Environment Variables da Vercel
2. Usa o **pooler endpoint** (termina em `-pooler.`)
3. Adiciona `&channel_binding=require` à connection string

### ❌ Build Failures

**Soluções:**
```bash
# Regenera Prisma Client
npx prisma generate

# Verifica schema
npx prisma validate
```

### ❌ Database Connection Errors

**Verificar Neon:**
1. Vai a https://console.neon.tech
2. Verifica que o projeto está **ativo** (Estado: active)
3. Usa o endpoint correto do pooler

---

## Variáveis de Ambiente Necessárias

### Produção (Obrigatório)
| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | Connection string Neon | `postgresql://...` |
| `JWT_SECRET` | Chave JWT (32+ chars) | `random-string...` |

### Produção (Opcional - Pagamentos)
| Variável | Descrição |
|----------|-----------|
| `STRIPE_SECRET_KEY` | Chave Stripe |
| `STRIPE_WEBHOOK_SECRET` | Webhook Stripe |
| `MBWAY_API_KEY` | API Key MBWay |
| `MBWAY_ENTITY_CODE` | Código entidade MBWay |
| `MBWAY_ENTITY_PHONE` | Telefone entidade MBWay |

### Desenvolvimento
| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | `file:./dev.db` (SQLite local) |
| `NODE_ENV` | `development` |

---

## Comandos Úteis

```bash
# Desenvolvimento local
npm run dev

# Build local
npm run build

# Push schema para base de dados
npx prisma db push

# Gerar Prisma Client
npx prisma generate

# Abrir Prisma Studio
npx prisma studio
```

---

## Estrutura do Projeto

```
aldeias-games/
├── prisma/
│   └── schema.prisma    # Schema da base de dados
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── api/         # API routes
│   │   └── jogos/       # Páginas de jogos
│   ├── components/      # Componentes React
│   └── lib/             # Utilitários (db, utils)
├── vercel.json         # Configuração Vercel
├── DEPLOY.md          # Este guia
└── package.json
```

---

## Suporte

- **Vercel:** https://vercel.com/docs
- **Neon:** https://neon.tech/docs
- **Prisma:** https://prisma.io/docs
- **Issues:** https://github.com/smpsandro1239/Aldeias_Games/issues
