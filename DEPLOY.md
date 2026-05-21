# Deployment Guide

## Quick Deploy (Vercel + Neon + Upstash)

### 1. Database (Neon PostgreSQL)
1. Create account at https://neon.tech
2. Create a new project → copy the connection string
3. Run: `DATABASE_URL="your-neon-url" npx prisma db push`
4. Run: `DATABASE_URL="your-neon-url" npm run db:seed`

### 2. Redis (Upstash)
1. Create account at https://upstash.com
2. Create a Redis database → copy the URL
3. Set `REDIS_URL` in your deployment env

### 3. Frontend (Vercel)
1. Push to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `DATABASE_URL` — Neon connection string
   - `AUTH_SECRET` — `openssl rand -base64 32`
   - `AUTH_URL` — Your Vercel URL (e.g., https://codequest.vercel.app)
   - `REDIS_URL` — Upstash Redis URL
   - `OLLAMA_URL` — Your AI server URL
   - `JUDGE0_URL` — Your Judge0 instance URL
4. Deploy

### 4. AI Server (VPS)
```bash
# On a VPS with GPU or decent CPU
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull deepseek-coder:6.7b
# Expose port 11434 (use nginx + SSL in production)
```

### 5. Judge0 (Docker on VPS)
```bash
git clone https://github.com/judge0/judge0.git
cd judge0
docker-compose up -d
# Expose port 2358
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | Random 32+ char secret |
| `AUTH_URL` | ✅ | App URL (https://...) |
| `REDIS_URL` | ❌ | Redis URL (graceful fallback) |
| `OLLAMA_URL` | ❌ | AI server (defaults localhost) |
| `OLLAMA_MODEL` | ❌ | Model name (default: deepseek-coder:6.7b) |
| `JUDGE0_URL` | ❌ | Code execution service |
| `JUDGE0_API_KEY` | ❌ | Judge0 auth token |

## Docker (Self-hosted)
```bash
docker compose up --build -d
docker compose exec ollama ollama pull deepseek-coder:6.7b
```

## Health Check
```
GET /api/health
```
Returns status of database, Redis, and Ollama connectivity.
