# Trainer

**Author:** Aryan Rajendra Suthar  
**License:** MIT — see [LICENSE](./LICENSE)

A premium, evidence-based fitness + physiotherapy web app. Offline-first architecture, real-time data sync, and clinical-level exercise science — built as a production-grade full-stack portfolio project.

---

## Features

- **Personalised workout splits** — Push/Pull/Legs, Upper/Lower, Full Body, and more with evidence-based progressions
- **Exercise library** — 200+ exercises with muscle activation diagrams, cues, and video links
- **Live workout tracker** — Set-by-set logging with RPE, rest timers, and fire-and-forget backend sync
- **Session splitting** — Split a scheduled workout into "Now" and "Later" buckets with pending session recovery
- **Progress analytics** — Volume trends by muscle group, personal records, and body weight charting
- **Physiotherapy module** — Condition management with phase-gated rehab protocols and progression criteria
- **Glossary** — 64 clinical terms with inline tooltips (anatomy, movement, assessment, conditions)
- **Warmup protocols** — Session-type-aware warmup cards for every split type
- **Offline-first** — Zustand stores with IndexedDB persistence; all data survives refreshes without a network connection
- **PWA-ready** — Installable on iOS and Android from the browser

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| UI | Framer Motion v12, Recharts, Lucide React |
| State | Zustand v5 with `persist` middleware (IndexedDB) |
| Backend | Node.js 20, Express, Zod |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth — Email/Password + Google OAuth |
| Frontend hosting | Vercel |
| Backend hosting | Render.com (free tier) |
| CI | GitHub Actions |

---

## Architecture

```
.
├── trainer/
│   ├── frontend/               # Next.js 14 App Router
│   │   ├── app/
│   │   │   ├── (app)/          # Authenticated route group
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
│   │   │   ├── auth/callback/  # Supabase OAuth callback
│   │   │   ├── components/
│   │   │   ├── data/           # Exercise library, glossary, splits, protocols
│   │   │   ├── hooks/
│   │   │   ├── lib/            # API client, Supabase client, utils
│   │   │   ├── store/          # Zustand stores (offline-first)
│   │   │   └── types/
│   │   ├── public/             # Icons, manifest.json
│   │   └── next.config.mjs
│   ├── backend/                # Express REST API
│   │   └── src/
│   │       ├── routes/         # auth, sessions, exercises, progress, physio
│   │       ├── middleware/     # auth guard, rate limiter, error handler
│   │       └── lib/            # Supabase admin client
│   └── supabase/
│       └── migrations/         # SQL schema + RLS policies
├── render.yaml                 # Render.com auto-deploy config
└── .github/workflows/ci.yml
```

**Data flow:** All user interactions write to Zustand stores first (source of truth). API calls are fire-and-forget — the UI never blocks on the network. On page load, persisted state is hydrated from IndexedDB instantly, with any newer server data merged in the background.

---

## Local Development

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier is fine)

### 1. Clone

```bash
git clone <repo-url>
cd trainer
```

### 2. Supabase — run migrations

Open your Supabase project → **SQL Editor** and run the two migration files in order:

1. `trainer/supabase/migrations/001_initial_schema.sql`
2. `trainer/supabase/migrations/002_physio_schema.sql`

### 3. Backend

```bash
cd trainer/backend
npm install
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

```env
PORT=4000
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
GROQ_API_KEY=<your-groq-api-key>
```

> **Where to find these values:** Supabase dashboard → **Settings → API**
> - `SUPABASE_URL` — "Project URL"
> - `SUPABASE_SERVICE_ROLE_KEY` — "service_role" key (keep this secret — never commit it)

```bash
npm run dev   # starts on http://localhost:4000
```

### 4. Frontend

```bash
cd trainer/frontend
npm install
```

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_API_URL=http://localhost:4000
```

> **Where to find these values:** Supabase dashboard → **Settings → API**
> - `NEXT_PUBLIC_SUPABASE_URL` — same as above
> - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — "anon public" key (safe to expose in the browser)

```bash
npm run dev   # starts on http://localhost:3000
```

The app is now running at [http://localhost:3000](http://localhost:3000).

---

## Production Deployment

### Overview

| Service | What it hosts | Cost |
|---|---|---|
| [Render.com](https://render.com) | Express backend | Free (750 h/month) |
| [Vercel](https://vercel.com) | Next.js frontend | Free |
| [Supabase](https://supabase.com) | Postgres + Auth | Free |

> **Render free tier note:** Free web services spin down after 15 minutes of inactivity and take ~30 seconds to cold-start on the next request. See the [Keep-alive](#keep-alive-render-free-tier) section below to prevent this.

---

### Step 1 — Deploy the backend to Render.com

1. Go to [render.com](https://render.com) and sign up (no credit card required).

2. Click **New → Web Service**, then **Connect a repository** and select your GitHub repo.

3. Render will detect `render.yaml` in the repo root and pre-fill all settings:
   - **Name:** `trainer-backend`
   - **Region:** Oregon
   - **Root directory:** `trainer/backend`
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`

   If it doesn't auto-detect, fill those in manually.

4. Scroll to **Environment Variables** and add the three secrets (leave `NODE_ENV` and `PORT` — `render.yaml` sets those):

   | Key | Value |
   |---|---|
   | `SUPABASE_URL` | `https://<your-project-ref>.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | your service role key |
   | `GROQ_API_KEY` | your Groq API key (from [console.groq.com](https://console.groq.com)) |
   | `FRONTEND_URL` | `https://<your-vercel-app>.vercel.app` *(add this after deploying the frontend)* |

5. Click **Create Web Service**. Render builds and deploys automatically.

6. Once deployed, your backend URL will be something like `https://trainer-backend.onrender.com`. Copy it — you'll need it in the next step.

7. Test it: `curl https://trainer-backend.onrender.com/health` should return `{"status":"ok"}`.

---

### Step 2 — Deploy the frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub.

2. Click **Add New → Project**, import your GitHub repo.

3. Under **Configure Project**:
   - Set **Root Directory** to `trainer/frontend`
   - Framework will auto-detect as **Next.js**

4. Under **Environment Variables**, add all three:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<your-project-ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
   | `NEXT_PUBLIC_API_URL` | `https://trainer-backend.onrender.com` |

5. Click **Deploy**. Vercel builds and assigns a URL like `https://trainer-backend.vercel.app`.

6. Go back to Render → your `trainer-backend` service → **Environment** → update `FRONTEND_URL` to your Vercel URL. Render will redeploy automatically.

---

### Step 3 — Configure Supabase Auth

#### Redirect URLs

Supabase Auth needs to know which origins are allowed to complete OAuth flows.

1. Open Supabase dashboard → **Authentication → URL Configuration**.

2. Set **Site URL** to your production Vercel URL:
   ```
   https://<your-app>.vercel.app
   ```

3. Under **Redirect URLs**, add all of these:
   ```
   https://<your-app>.vercel.app/auth/callback
   https://<your-app>.vercel.app/auth/complete
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/complete
   ```

#### Google OAuth (optional)

If you want Google sign-in in production:

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials**.

2. Create an **OAuth 2.0 Client ID** (Web application type).

3. Add the following to **Authorised redirect URIs**:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```

4. Copy the **Client ID** and **Client secret**.

5. In Supabase dashboard → **Authentication → Providers → Google**, enable it and paste your credentials.

---

### Step 4 — Keep-alive (Render free tier)

Render's free tier sleeps after 15 minutes. Use [UptimeRobot](https://uptimerobot.com) (free) to ping the health endpoint every 10 minutes:

1. Sign up at [uptimerobot.com](https://uptimerobot.com).
2. Click **Add New Monitor**:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** `Trainer Backend`
   - **URL:** `https://trainer-backend.onrender.com/health`
   - **Monitoring Interval:** Every 10 minutes
3. Save. UptimeRobot will now keep your backend awake 24/7.

---

### Step 5 — Verify the deployment

Work through this checklist after deploying:

- [ ] `https://trainer-backend.onrender.com/health` returns `{"status":"ok"}`
- [ ] Frontend loads at your Vercel URL
- [ ] Email sign-up and sign-in work
- [ ] Google OAuth sign-in completes without a redirect error
- [ ] Dashboard loads and shows your workout split
- [ ] Logging a set syncs to Supabase (check the `sessions` table)
- [ ] App is installable as a PWA (Chrome → address bar → "Install" icon)

---

## Environment Variables Reference

### Backend (`trainer/backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key — **never expose publicly** |
| `FRONTEND_URL` | Yes | Allowed CORS origin (your Vercel URL in production) |
| `GROQ_API_KEY` | Yes | Groq API key for AI coaching features — get free at [console.groq.com](https://console.groq.com) |
| `PORT` | No | Server port (default: 4000) |
| `NODE_ENV` | No | Set to `production` by Render automatically |

### Frontend (`trainer/frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key — safe to expose in the browser |
| `NEXT_PUBLIC_API_URL` | Yes | Backend base URL |

---

## Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security and has full database access. It must **only** exist in the backend `.env` and in Render's environment variables dashboard — never in the frontend or committed to git.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose. Supabase RLS policies restrict what anonymous/authenticated users can access.
- If you believe your service role key has been exposed, rotate it immediately: Supabase dashboard → **Settings → API → Regenerate** under "service_role".

---

## CI

GitHub Actions runs TypeScript type checks on every push and pull request to `main` for both frontend and backend. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

Render and Vercel both auto-deploy on push to `main` — no manual deploy step needed after the initial setup.

---

## Author

**Aryan Rajendra Suthar**

---

## License

MIT © 2025 Aryan Rajendra Suthar — see [LICENSE](./LICENSE) for full text.
