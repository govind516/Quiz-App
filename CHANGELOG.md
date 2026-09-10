# Changelog

All notable changes to this project are logged here, newest first.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
