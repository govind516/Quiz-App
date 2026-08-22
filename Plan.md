# IT Quiz Platform — Complete Project Plan

**Stack:** Spring Boot (backend, CRUD already implemented) + Next.js (frontend) + Supabase (Postgres) + Upstash Redis + Gemini API (AI quiz generation) — deployed entirely on Render + JWT auth with guest quiz-taking allowed

---

## 1. Project Overview

A web platform where any user can take IT-focused quizzes (JavaScript, Python, Networking, DBMS, OS, DSA, Cloud/AWS, Cybersecurity, System Design, etc.), track their progress, and compete on leaderboards. Admins manage the question bank and monitor analytics.

**Current status:** Basic CRUD operations for core entities already implemented in Spring Boot. This plan covers what's built, what's next, and the full roadmap.

---

## 2. Core Features

### For all users (guests + registered)
- Browse quizzes by category
- Filter by difficulty (Beginner / Intermediate / Advanced) and tags
- Take a quiz with a timer, instant scoring, and answer explanations

### For registered users
- Save quiz history and track progress over time
- Bookmark/favorite quizzes
- Leaderboards (global + per-category)
- Streaks / daily challenge
- Custom quiz creation (pick topics + number of questions + difficulty)
- Profile with badges/achievements

### For admins
- Question bank management (CRUD questions, bulk upload via CSV/Excel)
- Category/tag management
- Analytics dashboard (most attempted quizzes, average scores, drop-off rates)
- User management & moderation

### AI-assisted question generation (planned, using Gemini free tier)
- Admin provides topic + difficulty + count → backend calls Gemini API → returns structured questions
- All AI-generated questions go into a `PENDING_REVIEW` state — never auto-published
- Admin reviews/edits in the admin panel before publishing (protects against hallucinated/incorrect answers)

### Phase 2+ / nice-to-haves
- Multiplayer / live quiz mode (Kahoot-style, via WebSocket/STOMP)
- Certificates on completion of a quiz series
- Community-submitted questions with upvote/downvote and moderation queue

---

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Backend | Spring Boot (already in progress) |
| Backend structure | Layered: `controller → service → repository`; move toward hexagonal/clean architecture as it grows |
| Database | **Supabase** (managed Postgres) — see Section 4a for why this fits your existing JPA code |
| Auth | Spring Security + JWT (access + refresh token) — **guests can take quizzes without an account**; JWT only required for history, leaderboard, bookmarks, and custom quizzes |
| Caching / Leaderboard | **Upstash Redis** (serverless, REST + Redis protocol, free tier) |
| AI (question generation) | **Google Gemini API** (free tier — exact model TBD, confirm current free-tier model name before implementing) via API key |
| Validation | Bean Validation (`@Valid`, `@NotBlank`, etc.) |
| API docs | springdoc-openapi (Swagger UI) |
| Frontend | **Next.js** |
| Styling | Tailwind CSS + shadcn/ui |
| Frontend state | React Query (server state) + Zustand/Redux (client/UI state) |
| File storage | **Skipped for now** — no images in MVP (see Section 4b) |
| Deployment | **Both frontend and backend on Render** (two separate Render services) |
| CI/CD | GitHub Actions → auto-deploy to Render on push (Render also supports this natively via its dashboard) |

---

## 4. What's Already Done vs. What's Next

The existing CRUD layer likely covers entities like `Quiz`, `Question`, `Option` with basic save/find/update/delete. That's the **data layer**. The bulk of remaining product complexity lives in the **quiz-taking logic layer**:

- Starting an attempt (server-side session/state)
- Scoring (server-side only — never trust frontend-submitted scores)
- Timer validation
- History / leaderboard aggregation
- Auth/authorization (who can edit questions vs. who can just take quizzes)

---

## 4a. Database Choice: Supabase (Decided)

You already have JPA-based CRUD written against a relational model (`Quiz`, `Question`, `Option` with foreign keys) — so **Supabase (Postgres)** is the choice, since it's the lower-effort path:

| | **Supabase (Postgres)** |
|---|---|
| Compatibility with existing code | High — Supabase is plain Postgres, so your existing Spring Data **JPA** entities/repositories work with little to no change (just point the datasource at Supabase's connection string) |
| Data shape fit | Natural fit — quizzes/questions/options/attempts are relational by nature (foreign keys, joins for leaderboards/history) |
| Free tier | 500MB DB; pauses after ~1 week of inactivity on the free plan (a quick ping/cron on wake avoids surprise cold-starts if this matters for a demo) |
| Extras | Built-in auth, storage, and realtime available if you ever want them later (not used here since Spring Security handles auth) |

**Connection setup:** grab the Postgres connection string from Supabase's dashboard (Session pooler or direct connection) and set it as `spring.datasource.url` via environment variables on Render — no other code changes needed beyond what's already built.

---

## 4b. File Storage: Skipped for Now (Decided)

No S3 access, and images are being skipped in the MVP — most IT quiz questions (code snippets, conceptual questions) don't need them anyway. When/if image support is added later (diagram-based networking questions, etc.), revisit with **Cloudinary** (generous free tier, direct Spring Boot SDK) or **Supabase Storage** (already using Supabase for the DB, so it's a natural single-vendor add) — not a blocker for now.

---

## 5. Entity / Schema Plan (JPA, Supabase/Postgres)

```
User          — id, name, email, passwordHash, role (Enum: USER, ADMIN), createdAt
Category      — id, name, slug, description
Quiz          — id, title, category (ManyToOne), difficulty (Enum), timeLimitSec, isPublished, createdBy
Question      — id, quiz (ManyToOne), questionText, type (Enum: MCQ, MULTI_SELECT, TRUE_FALSE), explanation, points
Option        — id, question (ManyToOne), optionText, isCorrect
QuizAttempt   — id, user (ManyToOne, NULLABLE), guestSessionId (nullable), quiz (ManyToOne), score, startedAt, completedAt, status (Enum: IN_PROGRESS, SUBMITTED, EXPIRED)
AttemptAnswer — id, attempt (ManyToOne), question (ManyToOne), selectedOptionIds (or join table for multi-select), isCorrect
```

**Guest attempt handling:** since guests can take quizzes without logging in, `QuizAttempt.user` is nullable. For a guest attempt, generate a `guestSessionId` (random UUID) on the frontend (stored in browser storage, not a cookie tied to auth) and pass it with `start`/`submit` calls so the attempt can still be tracked for that session and shown as a result — but it won't appear in "my history" or the leaderboard unless the guest later registers. If you want guest scores to count on the leaderboard, treat them as anonymous/unranked entries or prompt "sign up to save your score" after a guest completes a quiz — a good natural conversion nudge.

**Key rule:** `Option.isCorrect` must **never** be serialized to the frontend while a quiz is in progress. Use separate DTOs:
- `QuestionPublicDTO` — strips `isCorrect`, used during quiz-taking
- `QuestionAdminDTO` — includes `isCorrect`, used only in admin endpoints

Additional supporting tables:
```
tags
quiz_tags (many-to-many join table)
```
Leaderboard data is computed via Redis sorted sets rather than a dedicated SQL table (see Section 7).

---

## 6. Core Service-Layer Logic

### Starting a quiz
```
POST /api/quizzes/{id}/start
```
- Creates a `QuizAttempt` row with `status=IN_PROGRESS`, `startedAt=now()`
- Returns questions via `QuestionPublicDTO` (shuffled question order, shuffled option order)
- Persist the shown order (or a shuffle seed) per attempt — needed for consistent grading and later review

### Submitting a quiz
```
POST /api/attempts/{id}/submit
```
- Validate `attempt.status == IN_PROGRESS` (block double-submit)
- Validate elapsed time vs. `quiz.timeLimitSec` (+ small buffer) — reject or auto-cap if exceeded
- Calculate score **entirely server-side**, comparing submitted option IDs against DB `isCorrect` values
- Save `AttemptAnswer` rows; update `QuizAttempt.status=SUBMITTED`, `completedAt=now()`
- Return a result DTO with per-question correctness + explanations (safe to reveal post-submission)

### Concurrency / idempotency
- Use optimistic locking (`@Version` on `QuizAttempt`) to prevent double-submission via race conditions (double-click, replayed request)

### AI question generation (Gemini)
```
POST /api/admin/questions/generate
```
- Admin submits: `{ topic, difficulty, count, questionType }`
- Backend builds a prompt instructing Gemini to return **strict JSON only** (question text, options, which option is correct, explanation) — this is important, since free-tier LLMs will sometimes add prose around the JSON if not explicitly constrained
- Call Gemini via a plain `RestTemplate`/`WebClient` HTTP POST to the Generative Language API endpoint with your API key (store the key in Render's environment variables, never in source control)
- Parse the JSON response into `Question`/`Option` entities, save with `status=PENDING_REVIEW`
- Admin reviews each AI-generated question in the admin panel (edit/approve/reject) before it becomes `is_published=true` — **never auto-publish AI output**, since LLMs can generate factually wrong answers or mark the wrong option as correct
- Wrap the Gemini call with basic error handling/retry — free-tier APIs can rate-limit or occasionally return malformed JSON; fail gracefully and let the admin retry rather than crash the request

---

## 7. API Endpoints (REST)

```
Auth
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh

Quizzes
GET  /api/quizzes?category=&difficulty=&tag=
GET  /api/quizzes/:id
POST /api/quizzes            (admin)
PUT  /api/quizzes/:id        (admin)

Quiz taking
POST /api/quizzes/:id/start        -> creates attempt, returns questions (no correct answers exposed)
POST /api/attempts/:id/submit      -> submits answers, server calculates score
GET  /api/attempts/:id/result

User
GET  /api/users/me/history
GET  /api/users/me/stats

Leaderboard
GET  /api/leaderboard/global
GET  /api/leaderboard/category/:id

Admin
POST /api/admin/questions
PUT  /api/admin/questions/:id
DELETE /api/admin/questions/:id
POST /api/admin/questions/bulk-upload
POST /api/admin/questions/generate       -> AI-generate questions via Gemini (status=PENDING_REVIEW)
POST /api/admin/questions/:id/approve    -> publish an AI-generated or pending question
```

---

## 8. Security (Spring Security specifics)

- JWT filter chain:
  - `/api/auth/**` — public
  - `/api/quizzes/**` (GET), `/api/quizzes/:id/start`, `/api/attempts/:id/submit`, `/api/attempts/:id/result` — **public (guests allowed)**, since guests can take quizzes without an account
  - `/api/users/me/**`, `/api/leaderboard/**` (if you want authenticated users only on leaderboard), bookmarks, custom quiz creation — require a valid JWT
  - `/api/admin/**` — restricted to `ROLE_ADMIN`
- **Guest vs. authenticated distinction:** the JWT filter should not *require* a token on quiz-taking endpoints, but should still *read* one if present (so a logged-in user's attempt gets linked to their account instead of a guest session) — implement as an optional/permissive filter rather than a hard `authenticated()` rule on those routes
- Method-level security: `@PreAuthorize("hasRole('ADMIN')")` on question/quiz CRUD endpoints
- Rate-limit `/attempts/*/submit` (e.g., via Bucket4j) — **more important with guests allowed**, since there's no account-level throttling to fall back on; consider rate-limiting by IP or guest session ID too
- CORS configuration scoped to the Next.js frontend's Render URL
- Never trust client-submitted scores or `isCorrect` flags — always recompute server-side

---

## 9. Leaderboard (Upstash Redis)

- On successful submit: `ZADD leaderboard:quiz:{quizId} score userId` (and/or a global leaderboard key)
- `ZREVRANGE` for top-N results, `ZREVRANK` for a user's own rank
- Much cheaper at scale than `ORDER BY score` queries against the primary DB on every request
- **Upstash-specific setup:**
  - Use the standard Redis protocol connection string Upstash gives you (host, port, password) with Spring Data Redis's `LettuceConnectionFactory` — works exactly like any other Redis instance, no special SDK needed
  - Alternatively, Upstash offers a REST API (`UPSTASH_REDIS_REST_URL` + token) if you want to avoid opening a persistent TCP connection — useful since Render's free tier can be resource-constrained; REST calls are simple HTTP requests instead of a long-lived connection pool
  - Free tier has a request-per-day cap — fine for MVP traffic, but keep an eye on it as usage grows (e.g. avoid re-fetching the full leaderboard on every page render; cache client-side briefly)
- Spring implementation: `RedisTemplate<String, String>` with `ZSetOperations`, pointed at the Upstash connection details via `application.properties`/environment variables (never hardcode the password — use Render's environment variable settings)

---

## 10. Architecture Notes

- **Monolith first, split later.** A modular monolith (clear service boundaries: `auth`, `quiz`, `attempts`, `leaderboard`) is sufficient at this scale — avoid premature microservices.
- **Timer handling:** store `timeLimitSec` server-side; validate `completedAt - startedAt` against it on submit (with small buffer) to prevent tampering.
- **Question randomization:** shuffle question and option order per attempt (seeded per `attempt_id`) to reduce copying between concurrent users.
- **Rate limiting:** protect submission endpoints against bots and scripted quiz completion.

### Render deployment specifics
- **Two Render Web Services:** one for the Spring Boot backend (Docker or native Java build), one for the Next.js frontend (Render Web Service running `next start`, since Next.js SSR needs a running Node process rather than a pure static site)
- **Environment variables** (set in Render dashboard, not committed to git): Supabase Postgres connection string, JWT secret, Upstash Redis URL/token, Gemini API key
- **Cold starts:** Render's free tier spins down services after inactivity — first request after idle will be slow (10–60s), and this applies to *both* the Next.js and Spring Boot services on the free tier. Fine for a portfolio/learning project; worth mentioning if you plan to demo it live
- **CORS:** since frontend and backend are separate Render services (different domains/subdomains), configure Spring Security's CORS to explicitly allow the frontend's Render URL
- **Build:** for the Spring Boot service, Render can build directly from a `Dockerfile`, or auto-detect a Maven/Gradle build — a `Dockerfile` gives more control over the JDK version and startup command
- **Next.js build:** Render auto-detects Next.js and runs `npm run build && npm start`; set `NEXT_PUBLIC_API_URL` as an env var pointing at the backend's Render URL so the frontend knows where to send API calls

---

## 11. Roadmap

### Phase 1 (in progress)
- [x] Entities + basic CRUD
- [x] Database: Supabase — point existing JPA datasource at Supabase's Postgres connection string (env-driven `DB_URL` with sslmode; see `.env.example`)
- [x] Spring Security + JWT auth, with guest-accessible quiz-taking endpoints (optional-token filter, not hard auth)
- [x] Start-attempt / submit-attempt flow with server-side scoring (supports both guest sessions and logged-in users)
- [x] Public DTOs (hide correct answers pre-submission)
- [x] Next.js frontend: browse quizzes → take quiz (as guest or logged-in) → see result
- [ ] Deploy both services to Render (basic working version, even before all features are done — validates the deployment pipeline early)

### Phase 2
- [x] Admin endpoints (protected) for question CRUD + CSV bulk import
- [x] Gemini-based AI question generation with admin review/approval flow (`/admin` console: question bank, CSV upload, AI generate, review queue)
- [x] User history + profile stats (registered users only)
- [x] "Sign up to save your score" prompt for guests after quiz completion
- [x] Swagger/OpenAPI docs

### Phase 3
- [x] Upstash Redis leaderboard (global / per-category / per-quiz sorted sets; graceful no-op when REDIS_URI unset; `/leaderboard` page)
- [x] Bookmarks, tags/filtering (bookmark toggle + saved list, tag filter on browse)
- [x] Rate limiting (Bucket4j: submit/start/auth endpoints, keyed by user/guest-session/IP; attempt time validation already hardened via server-side buffer + optimistic locking)

### Phase 4
- [x] Custom quiz builder (`POST /api/custom-quizzes` + `/build` page), badges & daily streaks (rule-based badges, streak calc in `/api/users/me/stats|badges`)
- [x] Multiplayer live quiz mode (Spring WebSocket / STOMP: in-memory rooms, host controls, 20s timed questions w/ speed bonus, live scoreboard; `/live/create`, `/live/join`, `/live/room/[code]`)
- [x] Certificates on category series completion (60%+ per quiz; claim → verifiable public page `/certificate/[code]`)
- [ ] Image support (Cloudinary/Supabase Storage) — intentionally deferred until the need arises

---

## 12. Decisions Locked In

- ✅ **Database:** Supabase (Postgres) — keeps existing JPA code as-is
- ✅ **Frontend:** Next.js
- ✅ **Auth:** JWT (access + refresh), with **guest quiz-taking allowed** — accounts required only for history/leaderboard/bookmarks/custom quizzes
- ✅ **Images:** skipped for MVP
- ✅ **AI generation:** Gemini free tier
- ✅ **Redis:** Upstash (API key available)
- ✅ **Deployment:** Render, both frontend and backend as separate services

### Still open
- [ ] **Exact Gemini model name** — free-tier model availability changes; confirm the current free model (e.g. via Google AI Studio) before wiring up the `/api/admin/questions/generate` integration, since the API endpoint path includes the model name