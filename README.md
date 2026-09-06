# HexQuiz - Interview Prep for the Whole Loop

A pixel-perfect Claude `frontend_design` recreation as a full-stack quiz application.

## One‑line pitch
Modern quiz platform combining LeetCode‑style practice with live multiplayer rooms, built for
**interview prep** and **social virality** — not just another quiz app.

## Tech Stack
- **Frontend**: Next.js 16.3.2 (App Router), React 19, Tailwind 4.3.3, Framer Motion 13, Zustand, lucide-react
- **Backend**: Spring Boot 3.5.16, Java 21, Supabase PostgreSQL, Redis, Gemini AI (question generation)
- **Data**: 10 topics × 3 difficulties = 30 quizzes, 240 questions, 960 options; live leaderboard (Redis + DB fallback)
- **Design**: Fraunces `'Fraunces', serif` display font, Inter body, grain overlay, aurora gradients, glass morphism, scroll blur‑up

## Quick Start

```bash
# 1. Clone & env
git clone <repo-url>
cd quiz-app
cp .env.example .env.local          # fill in Supabase, Redis, Gemini keys
# .env.secrets is gitignored — contains ADMIN_EMAIL / ADMIN_PASSWORD / REDIS_URI / GEMINI_API_KEY

# 2. Backend
cd ..
./mvnw spring-boot:run              # Maven wrapper; no separate Maven install needed

# 3. Frontend
cd frontend
npm install && npm run dev          # Turbopack dev server on http://localhost:3000
```

## Directory Overview

```
quiz-app/
├─ .env.example              # never commit real secrets
├─ .env.secrets              # gitignored — ADMIN_EMAIL / ADMIN_PASSWORD / REDIS_URI / GEMINI_API_KEY
├─ mvnw                      # Maven wrapper (no separate Maven needed)
├─ mvnw.cmd
├─ .mvn/                     # Maven configuration (required for build)
├─ frontend/
│  ├─ package.json
│  ├─ tailwind.config.js
│  └─ ... (Next.js 16 App Router)
├─ src/main/java/...         # Spring Boot 3.5.16, Java 21
├─ src/test/java/...         # 30 backend tests
└─ docs/                     # see below
```

## Live Demo
(Deploy URL if deployed — otherwise note “local dev only”)

## Learn More
- See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for system diagram + design decisions
- See [`docs/SETUP.md`](docs/SETUP.md) for local dev env steps, Docker, and gotchas
- See [`docs/API.md`](docs/API.md) for endpoint reference
- See [`docs/SECURITY.md`](docs/SECURITY.md) for auth, anti‑cheat, ownership details
- See [`docs/ROADMAP.md`](docs/ROADMAP.md) for shipped vs. next

## Project History
- Initial commit: port of Claude `frontend_design` as HexQuiz (pixel‑perfect CSS/Tailwind)
- Key milestones: leaderboard real-data wiring, live rooms with per-question timer, admin console
  DB‑driven, dead‑code removal, fraud‑free grading, Fraunces/Inter typography, grain/aurora CSS,
  guest‑join no‑signup flow, e2e verified (register→login→profile→practice→play→results→profile→logout)
- Current: USP definition phase; live‑room timer monotonic‑clock fix; roadmap planning
