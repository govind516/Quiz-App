# Roadmap

## Shipped (v1 - production)

- **Leaderboard**: Real backend data wired (Redis all-time + DB weekly fallback), three tabs (Global/Redis, By category/Redis, Weekly/DB), topic dropdown + difficulty pills on question bank, per-entry `initials`/`country`/`streak`, proper loading/error states
- **Live rooms**: Host creates attempt → joiners enter code as guests (no signup required) → per-question synchronized timer (60s/Q, monotonic `performance.now()` clock, wall‑clock immune) → auto‑advance when timer expires → "Finish & submit" only after last question; guest sessions persist via `getGuestSessionId`/`saveStartPayload`/clear
- **Profile**: Identity card, stats (completed/avg/best score/points/streak/best-streak), quiz history with quiz‑title links, badges (earned/locked), demo notice for guest sessions, logout restores guest nav
- **Practice**: 10 topic cards (default) → drill into 3 difficulty cards; search bypasses grouping; back‑to‑tracks button; chip + level dropdown filters; scroll blur‑up effect via `filter: blur(14px)` + `-webkit-backdrop-filter: blur(14px)`
- **Home**: Hero with `pt-40`/`md:pt-48` offset matches fixed nav; CodeConstellation; Live Ticker shelf pulling live quizzes from API; `max-w-[900px]` + `style={{maxWidth:900}}` on Build page; `backdrop-filter: blur(14px)` on nav glass
- **Admin**: Full DB‑driven console (dashboard/analytics/question‑bank/categories/users/review/AI studio) with live API calls, no mock fallbacks; `AdminError`/`AdminLoading` components; review badge from live pending count; `AdminUserItem` `completedAttempts` field

## In Progress / Next Sprint

- **USP definition**: Target user persona, live rooms, certificates, bookmarks — clear yes/no on each pillar
- **Security hardening docs**: JWT rotation/revocation flow, rate‑limiting parameters, anti‑cheat measures write‑up (complements `SECURITY.md`)
- **Cross‑device live play**: confirmed working via guest UUID + backend‑synced timers; test on phone + laptop + tablet

## Backlog (future considerations)

- Certificate generation (PDF + email)
- Bookmark/system‑save per user
- AI question generation UI (Gemini prompt design + fallback UX)
- Dark mode (currently light‑only; respects `prefers-color-scheme` meta but no custom theme)
- Internationalization (i18n) — currently English‑only; key strings in `messages.json` could be added

## Out of Scope (declined)

- OAuth2 / Social Login (per directive: no `/register`, no `/auth` flows beyond email+password)
- Georgia font fallback (per directive: `Fraunces`, serif only)
- Separate mobile app (responsive web is the only target)

## Milestones

| Milestone | Target |
|---|---|
| MVP + e2e verified | Done (30 backend tests pass, frontend builds, register→login→profile→practice→play→results→profile history/stats/badges→logout restores guest nav) |
| Leaderboard v2 (topic/pill filters) | Done |
| Live rooms with timer | Done |
| USP finalized | Q4 2026 |
| Certificate generation | Q1 2027 |
