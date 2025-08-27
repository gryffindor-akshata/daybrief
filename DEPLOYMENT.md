# DayBrief Deployment Guide

## 🚀 Option 1: Vercel (Recommended)

### Prerequisites
- GitHub account
- Vercel account (free tier available)
- OAuth credentials configured

### Step 1: Prepare for Production

1. **Update database for production** (recommended):
   ```bash
   # Install PostgreSQL adapter
   npm install @prisma/adapter-neon
   ```

2. **Update environment for production**:
   Create `.env.production` or configure in Vercel dashboard.

### Step 2: Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial DayBrief implementation"
   git branch -M main
   git remote add origin https://github.com/yourusername/daybrief.git
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables** in Vercel Dashboard:
   ```env
   # Required
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-production-secret-here
   DATABASE_URL=your-production-database-url
   OPENAI_API_KEY=sk-your-openai-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Optional
   MS_CLIENT_ID=your-ms-client-id
   MS_CLIENT_SECRET=your-ms-client-secret
   RESEND_API_KEY=your-resend-key
   SLACK_BOT_TOKEN=xoxb-your-slack-token
   SLACK_SIGNING_SECRET=your-slack-signing-secret
   ```

4. **Update OAuth Redirect URLs**:
   - Google Console: Add `https://your-app.vercel.app/api/auth/callback/google`
   - Microsoft Portal: Add `https://your-app.vercel.app/api/auth/callback/microsoft`

5. **Deploy**:
   - Click "Deploy" in Vercel
   - Vercel will build and deploy automatically

### Database Options for Production

#### Option A: Neon (PostgreSQL - Recommended)

1. **Sign up at [neon.tech](https://neon.tech)**
2. **Create a database**
3. **Get connection string**:
   ```
   postgresql://username:password@host:port/database?sslmode=require
   ```
4. **Update DATABASE_URL** in Vercel environment variables
5. **Update Prisma schema**:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
6. **Deploy database changes**:
   ```bash
   npx prisma db push
   ```

#### Option B: PlanetScale (MySQL)

1. **Sign up at [planetscale.com](https://planetscale.com)**
2. **Create database and get connection string**
3. **Update schema provider to "mysql"**

#### Option C: Supabase (PostgreSQL)

1. **Sign up at [supabase.com](https://supabase.com)**
2. **Create project and get database URL**
3. **Use PostgreSQL provider**

---

## 🐳 Option 2: Docker + Any Host

### Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose (with PostgreSQL)

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/daybrief
      - NEXTAUTH_URL=http://localhost:3000
      # Add other environment variables
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: daybrief
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Deploy Commands

```bash
# Build and run
docker-compose up -d

# Run database migrations
docker-compose exec app npx prisma db push
```

---

## ☁️ Option 3: Railway

### Quick Deploy

1. **Connect GitHub** at [railway.app](https://railway.app)
2. **Select repository**
3. **Add PostgreSQL service**
4. **Configure environment variables**
5. **Deploy automatically**

### Railway Configuration

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

## 🔧 Production Configuration

### 1. Update next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // For Docker
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  }
}

module.exports = nextConfig
```

### 2. Add Health Check Route

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  })
}
```

### 3. Production Environment Variables

```bash
# Generate a strong secret
openssl rand -base64 32

# Set in production
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=https://your-domain.com
NODE_ENV=production
```

---

## 📊 Monitoring & Analytics

### Add Error Monitoring (Sentry)

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

### Add Analytics (Vercel Analytics)

```bash
npm install @vercel/analytics
```

```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

---

## 🔐 Production Security Checklist

- [ ] **HTTPS enabled** (automatic on Vercel)
- [ ] **Environment variables secured** (not in code)
- [ ] **OAuth redirect URLs updated** for production domain
- [ ] **Database secured** with proper access controls
- [ ] **API rate limiting** implemented
- [ ] **Error logging** configured (Sentry/LogRocket)
- [ ] **Backup strategy** for database
- [ ] **Domain configured** with proper DNS

---

## 🚀 Deployment Automation

### GitHub Actions (Optional)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm run build
      - run: npm run test:run
      
      # Deploy to your platform of choice
```

---

## 📈 Post-Deployment

1. **Test all OAuth flows**
2. **Verify calendar integration**
3. **Test AI summary generation**
4. **Check email/Slack recaps**
5. **Monitor error rates**
6. **Set up alerts for downtime**

Choose the deployment option that best fits your needs. Vercel is recommended for its simplicity and excellent Next.js integration!
