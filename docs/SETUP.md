# Setup & Local Development

This project requires four distinct systems to run locally. Below are all the options.

## Option 1: All-Stacks Local (Recommended for Development)

Run both frontend and backend on your local machine.

### Backend
```bash
# From project root
./mvnw spring-boot:run
```
- Maven Wrapper (`./mvnw`) is checked in and requires no separate Maven install
- JVM: Java 21 (or adopt JDK 21)
- Uses an in-memory H2 database by default if no `REDIS_URL`/`DATABASE_URL` is set, or Supabase PostgreSQL in production
- Redis is optional: if `REDIS_URI` is set in `.env.secrets`, leaderboard uses Redis + DB fallback; if absent, leaderboard uses DB-only

### Frontend
```bash
cd frontend
npm install
npm run dev
```
- Node: 20+ (Turbopack for Next.js 16.3.2)
- Picks up `.env.local` for environment variables
- Hot reload via Turbopack

### Environment
Copy `.env.example` to `.env.local` and set:

| Variable | Required? | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supanon anon key |
| `VITE_SUPABASE_URL` | yes (same as above) | Alias for Vite |
| `VITE_SUPABASE_ANON_KEY` | yes | Alias for Vite |
| `ADMIN_EMAIL` | yes | Default admin account |
| `ADMIN_PASSWORD` | yes | Default admin password |
| `REDIS_URI` | no | Format: `rediss://user:pw@host:port`; if absent, leaderboard DB-only |
| `GEMINI_API_KEY` | no | Google Gemini API key; if absent, quiz demo data is seeded |
| `BASE_URL` | no | Override API base path (default `http://localhost:8080`) |

## Option 2: Docker Compose (All Services)

If Docker is available, bring up Supabase, Redis, and the backend together.

```bash
docker-compose up -d
```

This requires a `docker-compose.yml` at the project root (not included in this repo skeleton but typically defines):
- `supabase` service (Postgres + realtime + storage)
- `redis` service (`)
- `backend` service (Java app via `./mvnw spring-boot:run` or a prebuilt JAR)

Then:
```bash
npm run dev    # frontend connects to host IPs automatically via Docker DNS
```

## Option 3: CI / Remote Build Only

```bash
# Backend CI (GitHub Actions / GitLab)
./mvnw -q test          # 30 tests pass
./mvnw -q package -DskipTests

# Frontend CI
cd frontend && npm run build   # output: .next/ archive
```

## Gotchas & Caveats

| Issue | Fix |
|---|---|
| **Next.js 16 Turbopack `blur(14px)`** | If `filter: blur(14px)` emits both `backdrop-filter` and `-webkit-backdrop-filter` in compiled CSS, that's expected Turbopack behavior — do not remove the `-webkit-` duplicate to avoid overriding the standard property |
| **Redis unavailable** | Leaderboard returns empty arrays with a warning log; data lives in PostgreSQL and falls back gracefully |
| **Gemini AI missing** | Quiz demo data (10 topics × 3 difficulties = 30 quizzes, 240 questions) is seeded automatically; no AI key = no AI-generated questions |
| **Admin gating** | `/profile` and admin panels require a valid session; login with `ADMIN_EMAIL`/`ADMIN_PASSWORD` or use a guest session |
| **Guest session persistence** | `getGuestSessionId()` / `saveStartPayload()` / `clearStartPayload()` in `frontend/lib/guest-session.ts` — persist across page reloads |

## Directory Structure (Quick Nav)

```
quiz-app/
├─ .env.example          # template; never commit real secrets
├─ .env.secrets          # gitignored; ADMIN_EMAIL / ADMIN_PASSWORD / REDIS_URI / GEMINI_API_KEY
├─ mvnw                  # Maven wrapper (no separate Maven install needed)
├─ mvnw.cmd
├─ .mvn/                 # Maven configuration (required for build)
├─ frontend/
│  ├─ package.json
│  ├─ tailwind.config.js
│  └─ ... (Next.js 16 App Router)
├─ src/main/java/...     # Spring Boot 3.5.16, Java 21
├─ src/test/java/...     # 30 backend tests
└─ docs/
   ├─ ARCHITECTURE.md
   ├─ API.md
   ├─ SECURITY.md
   ├─ ROADMAP.md
   └─ SETUP.md   (this file)
