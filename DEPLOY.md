# Deploy Guide - Aldeias Games

## Vercel Deployment Guide

### Prerequisites
- [Vercel Account](https://vercel.com)
- [GitHub Repository](https://github.com/smpsandro1239/Aldeias_Games)
- PostgreSQL Database

### Step 1: Create Vercel Postgres

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Storage" → "Create Database"
3. Select "Postgres" → "Create"
4. Choose region closest to your users (Lisbon recommended for PT)
5. Copy the `POSTGRES_URL` connection string

### Step 2: Import Project to Vercel

**Option A: Via GitHub Integration (Recommended)**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Project"
3. Select your GitHub repository: `smpsandro1239/Aldeias_Games`
4. Framework: Next.js (auto-detected)
5. Build Command: `prisma generate && next build` (pre-filled)
6. Click "Deploy"

**Option B: Via Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Add Postgres
vercel env add POSTGRES_URL

# Deploy
vercel --prod
```

### Step 3: Configure Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

| Name | Value | Environments |
|------|-------|--------------|
| `DATABASE_URL` | (from Postgres) | Production, Preview, Development |
| `JWT_SECRET` | Random 32+ char string | All |
| `NEXT_PUBLIC_BASE_URL` | `https://your-project.vercel.app` | All |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | All |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Production |
| `MBWAY_API_URL` | `https://api.mbway.pt` | Production |
| `MBWAY_API_KEY` | Your API key | Production |
| `MBWAY_ENTITY_PHONE` | Your phone | Production |
| `MBWAY_ENTITY_CODE` | Your entity code | Production |
| `MBWAY_SANDBOX` | `false` | Production |

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Update Prisma Schema (Optional)

If using Vercel Postgres, update your `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 5: Database Setup

After first deploy, run migrations:

**Option A: Vercel CLI**
```bash
vercel env pull .env.local
npx prisma db push
npx prisma db seed
```

**Option B: Prisma Studio**
```bash
npx prisma studio
```

### Step 6: Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your domain (e.g., `jogos.minha-aldeia.pt`)
3. Update `NEXT_PUBLIC_BASE_URL` with your domain
4. Configure DNS records as instructed

### Troubleshooting

**Build Failures:**
- Ensure `DATABASE_URL` is set
- Check Prisma client generates correctly
- Verify Node.js version (20+)

**Runtime Errors:**
- Check Vercel Function logs
- Verify environment variables match local .env
- Ensure Stripe webhook URL is configured

**Database Connection:**
- Vercel Postgres requires connection via HTTP proxy
- Connection string format: `postgres://default:...@.../verceldb?sslmode=require`

## Useful Commands

```bash
# Local development
npm run dev

# Build locally
npm run build

# Database
npm run db:push    # Push schema
npm run db:seed    # Seed data
npm run db:studio  # Open Prisma Studio

# Tests
npm run test
```

## Quick Deploy (One-Liner)

```bash
vercel --prod --yes --token YOUR_VERCEL_TOKEN
```

## Support

- Vercel Docs: https://vercel.com/docs
- Prisma Docs: https://prisma.io/docs
- Project Issues: https://github.com/smpsandro1239/Aldeias_Games/issues
