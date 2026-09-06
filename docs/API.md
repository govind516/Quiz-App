# API Reference

Authentication is required for all endpoints except those marked `auth: false`. 
All responses use the `ApiError` format on failure: `{ status, message, fieldErrors, timestamp }`.

## Auth

| Method | Path | Auth | Body | Purpose |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | optional | `{ email, password }` | Authenticate admin; on success returns JWT `accessToken` |
| `POST` | `/api/auth/register` | optional | `{ email, password }` | Register new user; first attempt returns 404 (intentional) |
| `POST` | `/api/auth/logout` | required | — | Clears both backend auth store and frontend guest session |
| `POST` | `/api/auth/refresh` | required | — | Rotates access token; revoked tokens added to Redis denylist |

## Quizzes

| Method | Path | Auth | Body | Purpose |
|---|---|---|---|---|
| `GET` | `/api/quizzes` | `auth: false` | — | List all published quizzes (30: 10 topics × 3 difficulties) |
| `GET` | `/api/quizzes/{id}` | `auth: false` | — | Get quiz detail including question count, difficulty, category |
| `POST` | `/api/quizzes/{id}/start` | `auth` (token or guest) | `{ guestSessionId?: string }` | Start attempt; returns `StartAttemptResponse` with `attemptId`, `perQuestionTimeSec`, `expiresAt`, and all questions with shuffled option orders |

## Attempts

| Method | Path | Auth | Body | Purpose |
|---|---|---|---|---|
| `POST` | `/api/attempts/{id}/submit` | `auth` (token or guest+guestSessionId+answers) | `{ answers: [{ questionId, selectedOptionIds }] }` | Server-side grades all answers; returns `AttemptResultDto` with per-question correctness, score, totalPoints, percentage, and `AttemptStatus` |
| `GET` | `/api/attempts/{id}/result` | `auth` (token or guest+guestSessionId) | — | Returns `AttemptResultDto`; throws `ConflictException` if attempt still `IN_PROGRESS` |

## Leaderboard

| Method | Path | Auth | Query | Purpose |
|---|---|---|---|---|
| `GET` | `/api/leaderboard/global?limit=10` | `auth: false` | `limit` (default 10) | All-time leaderboard from Redis; entries have `rank`, `name`, `initials`, `score`, `country`, `streak` |
| `GET` | `/api/leaderboard/weekly?limit=10` | `auth: false` | `limit` (default 10) | Last 7 days from PostgreSQL `attempts` table; same entry shape |
| `GET` | `/api/leaderboard/category/{id}?limit=10` | `auth: false` | `limit`, `id` (category id) | By-category leaderboard from Redis; same entry shape |

## Categories

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/categories` | `auth: false` | List all categories (10); each has `id`, `name`, `slug` |

## Users (me)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/users/me/stats` | required (JWT) | Current user: `completedAttempts`, `avgScore`, `bestScore`, `points`, `streak`, `bestStreak` |
| `GET` | `/api/users/me/history` | required (JWT) | Quiz history with links to `/play/{id}` |
| `GET` | `/api/users/me/badges` | required (JWT) | Earned + locked badges; demo notice if guest session |

