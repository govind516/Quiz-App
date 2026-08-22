# HexQuiz — Architecture & Functionality Diagrams

Complete functional architecture of the IT quiz platform, split into **User-facing** and **Admin-facing** views.

- **Frontend:** Next.js 16 (App Router) + Tailwind v4 + TanStack Query + Zustand + STOMP.js
- **Backend:** Spring Boot 3.2 (Java 17) — modular monolith (`auth` · `user` · `quiz` · `attempt` · `leaderboard` · `certificate` · `live`)
- **Data:** Supabase (Postgres/JPA) · Upstash Redis (leaderboards) · Google Gemini (AI generation)

---

## 1. System Overview

```mermaid
flowchart LR
    subgraph Client["Browser"]
        FE["Next.js frontend\n(pages, React Query, Zustand, STOMP.js)"]
    end

    subgraph Backend["Spring Boot API :8080"]
        SEC["Spring Security\nJWT filter (optional-auth)\nRBAC USER/ADMIN"]
        subgraph Modules["Feature modules"]
            AUTH["auth"]
            QUIZ["quiz"]
            ATT["attempt"]
            LB["leaderboard"]
            CERT["certificate"]
            LIVE["live rooms"]
        end
    end

    DB[("Supabase Postgres")]
    RD[("Upstash Redis")]
    GM["Gemini API"]

    FE -->|"HTTPS REST + WebSocket(STOMP)"| SEC
    SEC --> Modules
    ATT --> DB
    ATT -->|"leaderboard writes via LeaderboardService"| RD
    QUIZ --> DB
    CERT --> DB
    LIVE -. "in-memory only" .-> FE
    LB --> RD
    QUIZ -->|"AI generation"| GM
```

---

## 2. USER-SIDE FUNCTIONALITY

### 2.1 Guest journey (no account required)

```mermaid
flowchart TD
    G0(["Visitor opens HexQuiz"]) --> G1["Landing /\nbrowse tracks"]
    G1 --> G2["Browse /browse\ncategory + difficulty + tag filters"]
    G2 --> G3["Quiz detail /quiz/id"]
    G3 -->|"Start quiz"| G4["POST /quizzes/id/start\n+ generated guestSessionId\n(stored in localStorage)"]
    G4 --> G5["Take quiz /take/attemptId\noverall timer ring, segmented progress,\nA/B/C/D options (answers hidden)"]
    G5 -->|"Finish & submit OR\ntimer expires (auto-submit)"| G6["POST /attempts/id/submit\nserver-side grading"]
    G6 --> G7["Result /result/attemptId\nscore ring, breakdown dots,\nper-question explanations"]
    G7 --> G8{{"Sign-up nudge:\n'Save this score'"}}
    G7 -->|Try another| G1

    style G8 fill:#7B5CFF,color:#fff
```

Guest attempts are tracked by `guestSessionId`; they are **excluded from history, leaderboards and certificates** until converted to an account.

### 2.2 Registered user journey

```mermaid
flowchart TD
    R0(["/auth — login or signup tabs"]) --> R1["JWT issued\n(access 15 min + refresh 7 days)"]

    R1 --> R2["Everything guests can do\n+ scores linked to account"]
    R1 --> R3["Bookmark quizzes ♡\n/api/bookmarks"]
    R1 --> R4["Custom quiz builder /build\npick category/difficulty/count/time\n→ random questions from bank"]
    R1 --> R5["My progress /me\nstreak 🔥 + week strip,\nbadges, history, stats"]
    R1 --> R6["Leaderboard /leaderboard\nGlobal or per-category podium"]
    R1 --> R7["Certificates 🎓\nclaim when every published quiz\nin a category is passed ≥60%"]
    R1 --> R8["Live arena /live/create · /live/join\nhost or join real-time rooms"]

    R4 --> T2
    R2 --> T2["Quiz-taking engine\n(see sequence below)"]
    T2 --> L2["On SUBMITTED attempt:\nleaderboard ZADD/ZINCRBY\n+ streak & badge recompute"]
    L2 --> R5
    L2 --> R6

    style R0 fill:#7B5CFF,color:#fff
```

### 2.3 Quiz-taking engine (core sequence)

```mermaid
sequenceDiagram
    autonumber
    participant U as User / Guest
    participant A as AttemptService
    participant DB as Supabase
    participant R as Upstash Redis

    U->>A: POST /api/quizzes/{id}/start
    Note over A: guest → requires guestSessionId<br/>logged-in → links user.id
    A->>DB: load published quiz + APPROVED questions
    A->>A: shuffle questions & options<br/>(seeded, persisted as JSON on attempt)
    A->>DB: INSERT quiz_attempt (IN_PROGRESS, @Version)
    A-->>U: attemptId · timeLimitSec · expiresAt · questions (no answers!)

    U->>U: countdown against server expiresAt
    U->>A: POST /api/attempts/{id}/submit {answers[]}
    A->>A: ownership check (user id ∨ guestSessionId)
    A->>A: timer validation (+30s buffer → else EXPIRED)
    A->>DB: grade exact-set match per type,<br/>save AttemptAnswer rows
    A->>DB: score, status SUBMITTED/EXPIRED<br/>(optimistic lock blocks double-submit → 409)
    opt registered + quiz-linked + SUBMITTED
        A->>R: ZADD best-% per quiz (GT)<br/>ZINCRBY global + category points
    end
    A-->>U: full result DTO<br/>(correctness, correct options, explanations)
```

Anti-cheat guarantees: answers never serialized pre-submit · scoring 100% server-side · double-submit blocked by `@Version` · late submits capped at time limit.

### 2.4 Custom quiz builder

```mermaid
flowchart LR
    A["POST /api/custom-quizzes\n{categorySlug?, difficulty?, tagSlug?, count, timeLimitSec}"] --> B{"filters"}
    B -->|match| C["random pick N APPROVED questions\nacross published quizzes"]
    B -->|none| D[409 no matching questions]
    C --> E["create attempt (quiz = NULL,\ntitle snapshot 'Custom: …')"]
    E --> F["/take/attemptId — same engine as 2.3"]
```

Registered users only. Custom attempts count toward stats/streaks but not leaderboards (no quiz linkage).

### 2.5 Live multiplayer room (Kahoot-style)

```mermaid
sequenceDiagram
    autonumber
    participant H as Host (registered)
    participant API as REST API
    participant RS as RoomService (in-memory map)
    participant W as STOMP /ws
    participant P as Players (anyone)

    H->>API: POST /api/live-rooms {quizId} → code
    RS-->>W: broadcast LOBBY → /topic/room/{code}
    P->>API: POST /{code}/join {nickname} (rate-limited)
    RS-->>W: lobby update (player list)

    H->>API: POST /{code}/start (host-only)
    loop every question (shuffled, 20s each)
        RS-->>W: LiveQuestionPayload (public DTO + deadline)
        P-->>RS: SEND /app/room/{code}/answer {playerId, qIndex, optionIds}
        RS->>RS: one answer per player/question ·<br/>grade exact-set · speed bonus 500–1000 pts
        RS-->>W: scoreboard refresh
        Note over RS: TaskScheduler auto-advances at deadline
    end
    RS-->>W: FinalResultsPayload (ranked podium) → room GC after 10 min
```

Rooms are ephemeral/in-memory (single-instance friendly). Spectators can watch without joining.

---

## 3. ADMIN-SIDE FUNCTIONALITY

All `/api/admin/**` routes require `ROLE_ADMIN` (`@PreAuthorize`); enforced again in the UI guard on `/admin`.

### 3.1 Admin capability map

```mermaid
flowchart TD
    AD(["Admin console /admin"]) --> D1["Dashboard\nstat cards (count-ups):\nquizzes · active questions ·\ncompletions today · pending AI"]
    AD --> Q1["Question bank\nlist by quiz · approve/reject/delete\noption-level correctness view"]
    AD --> G1["AI Generate (Gemini)\ntopic + count + type + difficulty"]
    AD --> U1["Bulk import (CSV)\nheader-driven parser,\nper-row error report"]
    AD --> V1["Review queue\npending AI drafts table\n✓ approve ✗ reject (tint-collapse)"]

    D1 --> AN["GET /admin/analytics/attempts\ndaily completions chart (SVG draw-in)\n+ top categories this week"]
    Q1 --> DB1[(questions · options)]
    G1 --> PIPE
    V1 --> PIPE
    U1 --> DB1

    subgraph PIPE["AI pipeline"]
        direction TB
        P1["strict-JSON prompt\n(responseMimeType=json, retry on 429/5xx)"] --> P2["Gemini generateContent"] --> P3["defensive parse\n(strip fences, wrapper objects)"] --> P4["validate per-question\n(discard malformed)"]
    end
    P4 -->|saved as| PENDING["status = PENDING_REVIEW\nnever auto-published"]
    PENDING --> V1
```

### 3.2 Question lifecycle

```mermaid
stateDiagram-v2
    [*] --> APPROVED: admin manual create / CSV row
    [*] --> PENDING_REVIEW: Gemini draft
    PENDING_REVIEW --> APPROVED: admin ✓ approve
    PENDING_REVIEW --> REJECTED: admin ✗ reject
    APPROVED --> REJECTED: admin reject
    REJECTED --> [*]: never served
```

> `QuestionStatus` has exactly three values: `PENDING_REVIEW`, `APPROVED`, `REJECTED`. "Playability" is not a status — an **APPROVED** question belonging to a **published** quiz is what the start-attempt shuffle serves.

### 3.3 Bulk CSV import contract

```csv
question_text,type,points,explanation,option_1,option_2,option_3,option_4,correct_options
"What is SQL injection?, in short?",MCQ,1,Injecting malicious SQL through unsanitised input,Asking the database for a backup,A firewall rule,A CSS framework,An encryption mode,1
Select prime numbers,MULTI_SELECT,2,,2,3,4,5,1|2|4
REST is stateless.,TRUE_FALSE,,,True,False,,,1
```

Rules: header row required · rows must supply every column (pad unused option slots with empty fields) · `correct_options` = 1-based indices joined by `|` · MCQ/TRUE_FALSE exactly one correct · TRUE_FALSE exactly two options. Response returns `{imported, failures[{line,error}]}` — valid rows commit, invalid rows reported.

### 3.4 Analytics endpoint

`GET /api/admin/analytics/attempts?days=7` →

```json
{ "daily": [{"date":"2026-08-22","count":5}, …],
  "topCategories": [{"name":"Python","count":2}, …],
  "today": 5 }
```

Zero-filled day series (SUBMITTED+EXPIRED completions) and ranked categories — rendered as the draw-in SVG chart and ranked panel on the Dashboard.

---

## 4. Data Model (Supabase Postgres)

```mermaid
erDiagram
    USERS ||--o{ QUIZ_ATTEMPTS : makes
    USERS ||--o{ BOOKMARKS : saves
    USERS ||--o{ CERTIFICATES : earns
    CATEGORIES ||--o{ QUIZZES : contains
    QUIZZES ||--o{ QUESTIONS : has
    QUESTIONS ||--o{ OPTIONS : offers
    QUIZZES }o--o{ TAGS : tagged
    QUIZ_ATTEMPTS ||--o{ ATTEMPT_ANSWERS : graded
    QUESTIONS ||--o{ ATTEMPT_ANSWERS : referenced-by
    ATTEMPT_ANSWERS ||--o{ ATTEMPT_ANSWER_SELECTED_OPTIONS : selected

    USERS { bigint id PK  varchar email UK  varchar password_hash  enum role  timestamp created_at }
    CATEGORIES { bigint id PK  varchar name UK  varchar slug UK }
    QUIZZES { bigint id PK  varchar title  bigint category_id FK  enum difficulty  int time_limit_sec  boolean is_published  bigint created_by FK }
    QUESTIONS { bigint id PK  bigint quiz_id FK  text question_text  enum type  int points  text explanation  enum status }
    OPTIONS { bigint id PK  bigint question_id FK  text option_text  boolean is_correct }
    TAGS { bigint id PK  varchar name  varchar slug UK }
    QUIZ_ATTEMPTS { bigint id PK  bigint user_id FK nullable  varchar guest_session_id  bigint quiz_id FK nullable  varchar title  int time_limit_sec  int score  enum status  text question_order  text option_order  bigint version }
    ATTEMPT_ANSWERS { bigint id PK  bigint attempt_id FK  bigint question_id FK  boolean is_correct }
    ATTEMPT_ANSWER_SELECTED_OPTIONS { bigint attempt_answer_id FK  bigint option_id }
    BOOKMARKS { bigint id PK  bigint user_id FK  bigint quiz_id FK }
    CERTIFICATES { bigint id PK  varchar code UK  bigint user_id FK  bigint category_id  varchar category_name }
```

Notable: `QUIZ_ATTEMPTS.quiz_id` is **nullable** — custom-builder attempts have no parent quiz (title/time snapshotted onto the row). Selected options live in the `attempt_answer_selected_options` join table (`@ElementCollection`), not a delimited column. Bookmarks enforce a unique `(user, quiz)` pair; certificates carry a unique public verification code. Redis holds only ranking sorted sets (`quizapp:lb:quiz/{id}`, `quizapp:lb:global`, `quizapp:lb:category/{id}`) — all source-of-truth lives in Postgres.

---

## 5. Access-control matrix

| Route group | Method(s) | Access |
|---|---|---|
| `/api/auth/**` | POST | Public (register/login/refresh) — rate-limit 5/min/IP |
| `/api/quizzes`, `/api/categories`, `/api/leaderboard/**` | GET | Public |
| `/api/quizzes/{id}/start` | POST | Public **or** authenticated (guestSessionId required if anonymous) — 30/min |
| `/api/attempts/*/submit` · `/result` | POST/GET | Ownership-checked: linked-user JWT **or** matching guestSessionId — 10/min submit |
| `/api/custom-quizzes` | POST | Authenticated (USER+) |
| `/api/bookmarks/**`, `/api/users/me/**` | any | Authenticated |
| `/api/certificates/{code}` | GET | Public verification |
| `/api/certificates/claim·categories·mine` | GET/POST | Authenticated |
| `/api/admin/**` | any | `ROLE_ADMIN` only |
| `/ws` + `/api/live-rooms/*/join` | WS/POST | Public (join rate-limited); create/start require auth |

---

## 6. Frontend route map

| Route | Page | Design screen |
|---|---|---|
| `/` | Landing (hero, constellation, track chips) | Landing |
| `/browse` | Filterable quiz grid | Tracks/Browse |
| `/auth` | Login/signup tabs (split screen) | Login/Signup |
| `/quiz/[id]` | Quiz detail + Start | — |
| `/take/[attemptId]` | Timer ring, segments, options | Quiz |
| `/result/[attemptId]` | Score ring, dots, review | Results |
| `/me` | Streak hero, week strip, milestones, certs, history | Streaks |
| `/leaderboard` | Podium + cascade rows | Leaderboard |
| `/admin` | Sidebar console (Dashboard/Questions/AI/Import/Review) | Admin |
| `/build` | Custom quiz builder | — |
| `/live/create` · `/live/join` · `/live/room/[code]` | Host / join / play | — |
| `/certificate/[code]` | Printable verifiable certificate | — |

---

## 7. Security posture & deliberate design decisions

Hardening choices and trade-offs that are **intentional** — listed so they read as decisions, not oversights.

**Leaderboard scoring asymmetry.** Per-quiz boards use `ZADD … GT` (best percentage wins — retrying cannot inflate a quiz rank), while global/category boards use `ZINCRBY` (cumulative points). Global rank is therefore an *activity/volume* signal by design; per-quiz rank is the *skill* signal.

**Certificates are snapshots.** Eligibility is evaluated live at claim time ("every published quiz in this category passed ≥60%"), but once issued a certificate is permanent — later additions to the category never revoke it. `CERTIFICATES` denormalises `category_name` for the same reason.

**Guest sessions are ownership credentials, not identities.** A client-generated UUID correlates start/submit/result calls; the server normalises and stores it, and ownership checks compare against it. It is not proof of identity.

**Anonymous rate limits are currently session-keyed (hardening planned).** Bucket keys today resolve to `u:{userId}` for registered users, `g:{guestSessionId}` when a guest supplies one, and client IP (`X-Forwarded-For` aware) otherwise — so a guest who rotates fresh session IDs can reset their per-guest quota. Re-anchoring anonymous limits to client IP regardless of session ID is tracked as the next hardening item; trade-off: many guests behind one NAT share a quota.

**Live rooms bind answers to joined players.** STOMP answer messages carry a `playerId` issued only via `POST /{code}/join`; unknown or mismatched IDs are silently dropped, and one answer per player per question is enforced server-side.

**Live rooms are single-instance in-memory.** Room state never touches Postgres/Redis. Running more than one backend instance therefore requires sticky routing (same room → same instance) or a migration to Redis-backed room state + pub-sub — treat horizontal scaling of `/live` as a real migration item, not a config flip.

**Refresh tokens rotate on use; revocation is planned hardening.** Each successful refresh issues a new token pair, and refresh tokens live in browser storage (localStorage) for 7 days — an accepted MVP trade-off. Token-revocation denylist and httpOnly-cookie storage are tracked as future hardening items.

**AI content is never auto-published.** Every Gemini draft lands in `PENDING_REVIEW`; only an explicit admin approve makes it servable, and malformed drafts are counted and discarded rather than stored.

---

*Generated from the implemented codebase — backend modules, endpoints and rules reflect actual behavior, not plans.*
