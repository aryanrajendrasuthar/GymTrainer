# Trainer — Backend

**Author:** Aryan Rajendra Suthar  
**License:** Proprietary — All rights reserved. See [LICENSE](../../LICENSE)

Express REST API for the Trainer fitness PWA. See the [root README](../../README.md) for full project documentation, architecture overview, and deployment instructions.

## Local Development

```bash
npm install
cp .env.example .env   # fill in values — see below
npm run dev            # http://localhost:4000
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key — **never expose publicly** |
| `FRONTEND_URL` | Yes | Allowed CORS origin (use `http://localhost:3000` locally) |
| `GROQ_API_KEY` | Yes | Groq API key for AI coaching endpoints |
| `PORT` | No | Server port (default: 4000) |

## API Reference

All routes are prefixed with `/api`. All protected routes require a `Bearer <supabase_jwt>` header.

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Liveness check — returns `{"status":"ok"}` |

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/signup` | — | Create account with email + password |
| `POST` | `/signin` | — | Sign in and return access + refresh tokens |
| `POST` | `/refresh` | — | Exchange refresh token for a new access token |
| `POST` | `/signout` | — | Invalidate the current session |
| `GET` | `/profile` | ✓ | Fetch the authenticated user's profile |
| `PATCH` | `/profile` | ✓ | Update profile fields (weight, goal, activity level, etc.) |

### Sessions — `/api/sessions`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ✓ | List all workout sessions for the user |
| `GET` | `/:id` | ✓ | Fetch a single session by ID |
| `POST` | `/` | ✓ | Save a completed workout session |
| `DELETE` | `/:id` | ✓ | Delete a session |

### Exercises — `/api/exercises`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ✓ | List all exercises (with optional `?muscle=` filter) |
| `GET` | `/history/:exerciseId` | ✓ | Performance history for a specific exercise |

### Progress — `/api/progress`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/weight` | ✓ | Body weight log entries |
| `GET` | `/prs` | ✓ | All-time personal records |
| `GET` | `/prs/:exerciseId` | ✓ | PRs for a specific exercise |
| `GET` | `/volume` | ✓ | Weekly volume data |
| `GET` | `/sessions` | ✓ | Session history with stats |
| `POST` | `/weight` | ✓ | Log a body weight entry |
| `POST` | `/measurements` | ✓ | Log body measurements |
| `PATCH` | `/measurements/:id` | ✓ | Update a measurement entry |

### Physio — `/api/physio`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/injuries` | ✓ | List active injuries/conditions |
| `POST` | `/injuries` | ✓ | Add a new injury |
| `PATCH` | `/injuries/:id` | ✓ | Update injury phase or severity |
| `POST` | `/phase-transition` | ✓ | Advance condition to the next rehab phase |
| `GET` | `/flags/:id` | ✓ | Get exercise flags for a condition |
| `POST` | `/flags` | ✓ | Set exercise modification flags |
| `POST` | `/pain-log` | ✓ | Log a pain score entry |
| `GET` | `/pain-log/:condition` | ✓ | Pain trend history for a condition |

### AI Coaching — `/api/ai`

Powered by [Groq](https://console.groq.com) (Llama 3). All endpoints require auth.

| Method | Path | Description |
|---|---|---|
| `POST` | `/tip` | Post-workout recovery and coaching tip |
| `POST` | `/chat` | Freeform coach chat (voice coach + text coach) |
| `POST` | `/weekly-summary` | Structured weekly training summary |

## Type Check

```bash
npx tsc --noEmit
```
