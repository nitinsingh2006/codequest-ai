# CodeQuest AI 🎮⚔️

AI-powered gamified coding learning platform. Learn Python (and more) by solving quests, battling bosses, and leveling up — with a local AI mentor.

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL (or Docker)
- Ollama (for AI features)

### 1. Install dependencies
```bash
npm install
```

### 2. Set up database
```bash
# Start PostgreSQL (via Docker or local install)
docker compose up db -d

# Generate Prisma client & push schema
npx prisma generate
npx prisma db push

# Seed with starter quests
npm run db:seed
```

### 3. Set up AI (optional but recommended)
```bash
# Install Ollama: https://ollama.ai
ollama pull deepseek-coder:6.7b
```

### 4. Run the app
```bash
npm run dev
```

Open http://localhost:3000 — register an account and start questing!

## Docker (Full Stack)
```bash
docker compose up --build
# Then pull the AI model:
docker compose exec ollama ollama pull deepseek-coder:6.7b
```

## Architecture

```
src/
├── app/
│   ├── (app)/          # Authenticated pages (dashboard, quests, leaderboard)
│   ├── api/            # API routes (auth, quests, submissions, AI, leaderboard)
│   ├── login/          # Auth pages
│   └── register/
├── components/         # Reusable UI (sidebar, code-editor)
├── hooks/              # Custom hooks (usePyodide)
├── lib/                # Core logic (auth, db, ai, utils)
└── types/              # TypeScript declarations
prisma/
├── schema.prisma       # Database schema
└── seed.ts             # Seed data
```

## Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Monaco Editor
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **AI**: Ollama + DeepSeek Coder (100% local, free)
- **Code Execution**: Pyodide (Python in browser via WASM)
- **Auth**: Auth.js v5 with credentials

## Phase 2 Roadmap
- [ ] Multiple languages (JS, C++, Java)
- [ ] Boss battles with timed challenges
- [ ] Achievement system
- [ ] Adaptive AI difficulty
- [ ] Redis caching layer
