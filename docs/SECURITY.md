# Security

## Authentication Security

- **JWT tokens** are stored in `localStorage` under the key `hexquiz-auth`
- **Token rotation**: a new access token is issued on each `/api/auth/refresh` call; the previous token is added to a Redis denylist
- **Token revocation**: logout clears both the backend session store and the frontend `localStorage` entry; the denylist entry has a TTL matching the token's `exp` claim
- **Admin gating**: the `/profile` route and all admin panels (`/admin/...`) require a valid authenticated session; the app guard checks `isAuthenticated` from the Zustand store, which is hydrated on startup from `localStorage`
- **Session timeout**: if the JWT `exp` expires while the user is active, the guard redirects to `/login`; the backend also rejects requests with expired tokens with `401 Unauthorized`

## Input Validation & Anti-Cheat

- **Server-side grading is mandatory**: every answer submission hits `POST /api/attempts/{id}/submit`; the backend checks each `selectedOptionIds` against the correct option IDs for that question. There is **no client-only grading** anywhere in the codebase.
- **Question & option shuffling per attempt**: when an attempt starts, `questionOrder` (serialized JSON of question IDs) and `optionOrder` (per-question option ID order) are generated using a seeded `Random` based on the attempt ID, making the order unpredictable to the client.
- **Rate limiting** on auth endpoints: excessive failed login attempts trigger a `429 Too Many Requests`; the rate limiter is configured in Spring Security filter chain.
- **Malformed request rejection**: all endpoints return `ApiError` with `fieldErrors` map for invalid payloads; the frontend displays these in a red alert banner.

## Ownership & Privacy

- **Attempt ownership**: a `QuizAttempt` belongs to either `user.id` or `guestSessionId`; the backend checks `getOwnedAttempt(attemptId, guestSessionId)` before any read/write, throwing `AccessDeniedException` if the IDs don't match.
- **Leaderboard pseudonymization**: entries store `initials` (first 2 capitalized chars of the user's name), `country` (from the User entity), and `streak` (consecutive quiz completions). No raw PII (email, full name) is persisted to the leaderboard.
- **Guest session isolation**: each guest gets a unique UUIDv4 stored in `localStorage` under `hexquiz-guest-session`. The same UUID is sent to the backend on every attempt start/submit; there is no cross-guest data leakage.
- **Email visibility**: email addresses are only visible to the admin account; regular users never see email addresses in the UI.

## Dependency Security

| Dependency | Purpose | Version |
|---|---|---|
| `spring-boot-starter-security` | JWT auth, method security, CSRF | 3.5.16 |
| `spring-data-redis` | Leaderboard Redis ZSets, denylist | 3.5.16 |
| `supabase-jwt` | JWT verification for Supabase tokens | latest |
| `guava` | Seeded `Random` for question/option order | 32.1.2-jre |
| `guava` dependency for `AbstractFuture::objectFieldOffset` warning | — | JDK internal |

## Compliance

- No secrets are committed to git; `.env.secrets` is gitignored
- All environment variables are loaded via `dotenv`; the app fails to start if required vars are missing
- CSP headers are not set at the app level (this is a Next.js/Turbopack dev concern); production deployment should add `Content-Security-Policy` headers
- The project does **not** use OAuth2 or Social Login; auth is purely email+password with JWT
