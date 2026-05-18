# Trainer

A premium, evidence-based fitness + physiotherapy web app. Designed as a portfolio-grade full-stack project demonstrating offline-first architecture, real-time data sync, and clinical-level exercise science.

---

## Features

- **Personalised workout splits** — Push/Pull/Legs, Upper/Lower, Full Body, and more, with AI-curated progressions
- **Exercise library** — 200+ evidence-based exercises with muscle activation diagrams, cues, and video placeholders
- **Live workout tracker** — Set-by-set logging with RPE, rest timers, and fire-and-forget backend sync
- **Progress analytics** — Volume trends by muscle group, personal records, and body weight charting
- **Physiotherapy module** — Condition management with phase-gated rehab protocols and progression criteria
- **Glossary** — 64 clinical terms (anatomy, movement, assessment, conditions) with inline tooltips
- **Warmup protocols** — Session-type-aware warmup cards (push/pull/legs/shoulders/arms/core)
- **Offline-first** — Zustand stores with IndexedDB persistence; all data survives refreshes without a network connection

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| UI | Framer Motion, Recharts, Lucide React |
| State | Zustand v5 with `persist` middleware |
| Backend | Node.js, Express, Zod |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth (JWT) |
| Frontend hosting | Vercel |
| Backend hosting | Render.com |
| CI | GitHub Actions |

---

## Architecture

```
.
├── trainer/
│   ├── frontend/          # Next.js 14 App Router
│   │   ├── app/
│   │   │   ├── (app)/     # Authenticated route group
│   │   │   │   ├── dashboard/
│   │   │   │   ├── workout/
│   │   │   │   ├── exercises/
│   │   │   │   ├── progress/
│   │   │   │   ├── physio/
│   │   │   │   ├── glossary/
│   │   │   │   └── settings/
│   │   │   ├── onboarding/
│   │   │   ├── signin/
│   │   │   ├── signup/
│   │   │   ├── components/
│   │   │   ├── data/       # Exercise library, glossary, splits, protocols
│   │   │   ├── lib/        # API client, utils
│   │   │   ├── store/      # Zustand stores
│   │   │   └── types/
│   │   └── vercel.json
│   ├── backend/            # Express API
│   │   └── src/
│   │       ├── routes/     # auth, sessions, exercises, progress, physio
│   │       ├── middleware/ # auth guard, rate limiter, error handler
│   │       └── lib/        # Supabase admin client
│   └── supabase/
│       └── migrations/     # SQL schema + RLS policies
├── render.yaml             # Render.com deployment
└── .github/workflows/ci.yml
```

**Data flow:** All user interactions write to Zustand stores first (source of truth). API calls are fire-and-forget — the UI never blocks on the network. On page load, persisted state is hydrated from IndexedDB instantly.

---

## Local Development

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project

### 1. Clone

```bash
git clone <repo-url>
cd trainer
```

### 2. Database

Run the migrations in order against your Supabase project:

```bash
# In Supabase SQL Editor, run:
# 1. trainer/supabase/migrations/001_initial_schema.sql
# 2. trainer/supabase/migrations/002_physio_schema.sql
```

### 3. Backend

```bash
cd trainer/backend
npm install
```

Create `trainer/backend/.env`:

```env
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
FRONTEND_URL=http://localhost:3000
PORT=4000
```

```bash
npm run dev
```

### 4. Frontend

```bash
cd trainer/frontend
npm install
```

Create `trainer/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

```bash
npm run dev
```

The app is now running at [http://localhost:3000](http://localhost:3000).

---

## Deployment

### Frontend → Vercel

1. Import the repository in [Vercel](https://vercel.com)
2. Set **Root Directory** to `trainer/frontend`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` — your Render.com backend URL (e.g. `https://trainer-backend.onrender.com`)
4. Deploy

### Backend → Render.com

1. Connect the repository in [Render](https://render.com)
2. Render will detect `render.yaml` automatically and create the `trainer-backend` web service
3. Set the following environment variables in the Render dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FRONTEND_URL` — your Vercel frontend URL (e.g. `https://trainer.vercel.app`)
4. Deploy

---

## Environment Variables Reference

### Backend

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `FRONTEND_URL` | Allowed CORS origin |
| `PORT` | Server port (default: 4000) |

### Frontend

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL |

---

## CI

GitHub Actions runs TypeScript type checks on every push and pull request to `main` for both frontend and backend. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
