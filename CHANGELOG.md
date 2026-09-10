# Changelog

All notable changes to this project are logged here, newest first.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [v0.1.1] — 2026-09-10

Security, test-coverage, and operability follow-up to v0.1.0.

### Security
- `next` + `eslint-config-next` bumped `16.3.2 → 16.3.4`: clears 1 critical
  (GHSA-p293-qw3h-jr36, GHSA-2xp9-vwfh-vxw4 — neither reachable here: no Windows
  hosting, no `next/image`/AVIF usage) and 1 high (libheif via `sharp` 0.35.3 → 0.35.4).
  Remaining high (`js-yaml` via eslint toolchain, dev-only) cleared with `npm audit fix`.
  Post-bump `npm audit --audit-level=high`: exit 0, 0 vulnerabilities.

### Added (since v0.1.0 — test suites and docker-compose shipped in v0.1.0 above)
- `logback-spring.xml`: JSON structured logging (`LogstashEncoder`) for the `prod`
  profile; human-readable Boot format kept for local dev.
- Report-only CI hygiene (non-blocking): frontend `npm run lint` + `npm audit`,
  backend `spotless:check` (import order, unused imports, whitespace), plus
  Dependabot for maven + npm.
- Boot-managed backend versions pinned explicitly in `pom.xml` (no-op values);
  `docs/SETUP.md` records the `versions:display-dependency-updates` baseline.

### Notes
- Backend suite: 44 tests, `./mvnw clean test` exit 0.
- Frontend clean rebuild (`rm -rf .next && npm run build`): exit 0, 19/19 pages.

## [v0.1.0] — 2026-09-10

First tagged release: live multiplayer quiz rooms, admin console, and one-command local startup.

### Added
- `LiveRoomServiceTest` (8 tests): create/join/start guards plus the answer-scoring path.
- `AdminQuestionServiceTest` (6 tests): bulk-import failure rows, approve/reject transitions.
- `docker-compose.yml` (postgres + redis + backend + frontend) and `frontend/Dockerfile`;
  README Quick Start now shows the one-command `docker compose up --build` path.
- This changelog.

### Notes
- Backend suite: 44 tests, `./mvnw test` exit 0.
- Full compose stack verified locally: backend `/actuator/health` → `UP` with seeded
  quiz data, frontend → HTTP 200.
