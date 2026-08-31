# Graph Report - Quiz-App  (2026-08-23)

## Corpus Check
- Corpus is ~45,679 words - fits in a single context window. You may not need a graph.

## Summary
- 1135 nodes · 3411 edges · 57 communities (46 shown, 11 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 196 edges (avg confidence: 0.81)
- Token cost: 45,130 input · 3,961 output

## Community Hubs (Navigation)
- Java Annotations & Imports
- Test Infrastructure
- JWT Security & Auth Filter
- Admin Panel Sections
- Live Room DTOs
- Frontend Dependencies & Tooling
- Spring Configuration Beans
- Auth & Attempt Endpoints
- Global Error Handling
- TypeScript Configuration
- Category Admin Operations
- Leaderboard & Analytics Endpoints
- Certificate & Progress Pages
- Quiz Taking Flow UI
- Question Admin & Exceptions
- AI Question Generation Tabs
- UI Icon Library
- Settings & Bookmarks Persistence
- Live Room Client
- REST Controller Layer
- User Administration
- Analytics Count Projections
- Score Trend Analytics
- Certificates Badges & History
- Auth UI & API Client
- Gemini AI Integration
- Attempt Status & Lifecycle
- Attempt Submission Logic
- Question Types & DTOs
- Quiz Creation Service
- Certificate Claiming Service
- User Stats & Streaks
- CSV Question Parser
- Category CRUD Service
- Scheduled Jobs & Sweeper
- Custom Quiz Start
- Leaderboard UI
- App Shell & Providers
- Category Count Queries
- Backend Modules & Cloud Services
- Project Planning Docs
- Maven Wrapper Script
- Platform Settings Admin
- Application Entry Point
- Bulk CSV Import
- Render Deployment Configuration
- ESLint Config
- Next.js Config
- PostCSS Config
- Render Service Definitions
- Auth Module Node
- Live Rooms Module Node
- Maven Project Root

## God Nodes (most connected - your core abstractions)
1. `User` - 45 edges
2. `Quiz` - 42 edges
3. `Question` - 39 edges
4. `api()` - 37 edges
5. `ResourceNotFoundException` - 35 edges
6. `QuestionType` - 33 edges
7. `QuizRepository` - 33 edges
8. `QuizAttempt` - 32 edges
9. `QuizAttemptRepository` - 32 edges
10. `LiveRoomService` - 32 edges

## Surprising Connections (you probably didn't know these)
- `IT Quiz Platform — Complete Project Plan` --semantically_similar_to--> `HexQuiz Architecture & Functionality Diagrams`  [INFERRED] [semantically similar]
  Plan.md → ARCHITECTURE.md
- `startGame()` --calls--> `api()`  [EXTRACTED]
  frontend/app/live/room/[code]/page.tsx → frontend/lib/api.ts
- `AdminPage()` --calls--> `api()`  [EXTRACTED]
  frontend/app/admin/page.tsx → frontend/lib/api.ts
- `AdminPage()` --calls--> `useAuthStore`  [EXTRACTED]
  frontend/app/admin/page.tsx → frontend/lib/auth-store.ts
- `DashboardSection()` --calls--> `api()`  [EXTRACTED]
  frontend/app/admin/page.tsx → frontend/lib/api.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **HexQuiz Technology Stack & Data Stores** — concept_supabase_postgres, concept_upstash_redis, concept_google_gemini [EXTRACTED 1.00]
- **Spring Boot Modular Monolith Modules** — backend_auth, backend_quiz, backend_attempt, backend_leaderboard, backend_certificate, backend_live [EXTRACTED 1.00]
- **External Infrastructure Services** — supabase_postgres, upstash_redis, gemini_api [EXTRACTED 1.00]

## Communities (57 total, 11 thin omitted)

### Community 0 - "Java Annotations & Imports"
Cohesion: 0.06
Nodes (57): jakarta.persistence.Entity, jakarta.persistence.Table, lombok.AllArgsConstructor, lombok.Builder, lombok.extern.slf4j.Slf4j, lombok.Getter, lombok.NoArgsConstructor, lombok.Setter (+49 more)

### Community 1 - "Test Infrastructure"
Cohesion: 0.05
Nodes (31): com.fasterxml.jackson.databind.ObjectMapper, org.junit.jupiter.api.DisplayName, org.junit.jupiter.api.extension.ExtendWith, org.junit.jupiter.api.Test, org.mockito.junit.jupiter.MockitoExtension, org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc, org.springframework.boot.test.context.SpringBootTest, org.springframework.data.redis.core.ZSetOperations (+23 more)

### Community 2 - "JWT Security & Auth Filter"
Cohesion: 0.05
Nodes (29): GrantedAuthority, io.jsonwebtoken.Claims, io.jsonwebtoken.JwtException, jakarta.servlet.FilterChain, jakarta.servlet.http.HttpServletResponse, javax.crypto.SecretKey, org.springframework.data.redis.core.StringRedisTemplate, org.springframework.security.core.userdetails.UserDetails (+21 more)

### Community 3 - "Admin Panel Sections"
Cohesion: 0.06
Nodes (37): ALL_SECTIONS, NAV_GROUPS, SectionDef, SectionId, STATUS_STYLES, AttemptsChart(), CategoriesPanel(), OptionRow (+29 more)

### Community 4 - "Live Room DTOs"
Cohesion: 0.08
Nodes (21): java.util.concurrent.ScheduledFuture, LiveQuestionPayload, QuestionPublicDto, ConflictException, CreateLiveRoomResponse, FinalResultsPayload, LiveQuestionPayload, LiveRoomInfo (+13 more)

### Community 5 - "Frontend Dependencies & Tooling"
Cohesion: 0.05
Nodes (38): eslint, eslint-config-next, dependencies, next, react, react-dom, @stomp/stompjs, @tanstack/react-query (+30 more)

### Community 6 - "Spring Configuration Beans"
Cohesion: 0.10
Nodes (24): io.swagger.v3.oas.models.OpenAPI, OpenAPI, org.springframework.context.annotation.Bean, org.springframework.context.annotation.Configuration, org.springframework.lang.NonNull, org.springframework.messaging.simp.config.MessageBrokerRegistry, org.springframework.scheduling.annotation.EnableScheduling, org.springframework.scheduling.TaskScheduler (+16 more)

### Community 7 - "Auth & Attempt Endpoints"
Cohesion: 0.12
Nodes (11): io.github.bucket4j.Bucket, jakarta.servlet.http.HttpServletRequest, org.springframework.web.bind.annotation.PostMapping, AuthController, RefreshTokenRequest, ClientIdentifiers, RateLimitService, JoinResponse (+3 more)

### Community 8 - "Global Error Handling"
Cohesion: 0.16
Nodes (12): org.springframework.dao.DataIntegrityViolationException, org.springframework.orm.ObjectOptimisticLockingFailureException, org.springframework.security.authentication.BadCredentialsException, org.springframework.security.authentication.LockedException, org.springframework.web.bind.annotation.ExceptionHandler, org.springframework.web.bind.annotation.RestControllerAdvice, org.springframework.web.bind.MethodArgumentNotValidException, org.springframework.web.method.annotation.MethodArgumentTypeMismatchException (+4 more)

### Community 9 - "TypeScript Configuration"
Cohesion: 0.07
Nodes (28): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+20 more)

### Community 10 - "Category Admin Operations"
Cohesion: 0.14
Nodes (12): org.springframework.http.ResponseEntity, org.springframework.security.access.prepost.PreAuthorize, org.springframework.web.bind.annotation.DeleteMapping, org.springframework.web.bind.annotation.PatchMapping, org.springframework.web.bind.annotation.PutMapping, org.springframework.web.multipart.MultipartFile, AdminCategoryController, CategoryAdminDto (+4 more)

### Community 11 - "Leaderboard & Analytics Endpoints"
Cohesion: 0.12
Nodes (9): org.springframework.web.bind.annotation.GetMapping, LeaderboardController, AdminQuizController, QuizController, AdminOverviewDto, CategoryPerformanceDto, QuizDto, Difficulty (+1 more)

### Community 12 - "Certificate & Progress Pages"
Cohesion: 0.12
Nodes (18): CertificatePage(), JoinLiveRoomPage(), DAY_LABELS, fireParticles(), MyProgressPage(), nextMilestone(), Button(), ButtonProps (+10 more)

### Community 13 - "Quiz Taking Flow UI"
Cohesion: 0.13
Nodes (21): QuizDetailPage(), ResultPage(), AnswerMap, emptySubscribe(), formatClock(), TakeQuizPage(), DifficultyBadge(), labels (+13 more)

### Community 14 - "Question Admin & Exceptions"
Cohesion: 0.14
Nodes (9): ResourceNotFoundException, GeneratedQuestionsDto, GenerateQuestionsRequest, Difficulty, QuestionType, QuestionAdminDto, AdminQuestionService, Difficulty (+1 more)

### Community 15 - "AI Question Generation Tabs"
Cohesion: 0.10
Nodes (15): CategoryQuestionBank(), DashboardSection(), GenerateTab(), QuestionsTab(), ReviewTab(), UploadTab(), AnalyticsPanel(), BrowseInner() (+7 more)

### Community 16 - "UI Icon Library"
Cohesion: 0.16
Nodes (21): IconAnalytics(), IconArrowRight(), IconArrowUp(), IconBell(), IconChartLine(), IconCheck(), IconChevronLeft(), IconGrid() (+13 more)

### Community 17 - "Settings & Bookmarks Persistence"
Cohesion: 0.16
Nodes (5): org.springframework.data.jpa.repository.Modifying, org.springframework.transaction.annotation.Transactional, SettingsService, BookmarkRepository, BookmarkService

### Community 18 - "Live Room Client"
Cohesion: 0.19
Nodes (15): emptySubscribe(), Identity, LiveRoomPage(), lockIn(), startGame(), readIdentity(), API_BASE_URL, GUEST_SESSION_KEY (+7 more)

### Community 19 - "REST Controller Layer"
Cohesion: 0.42
Nodes (11): io.swagger.v3.oas.annotations.tags.Tag, lombok.RequiredArgsConstructor, org.springframework.web.bind.annotation.RequestMapping, org.springframework.web.bind.annotation.RestController, AttemptController, CustomQuizController, CurrentUserProvider, CertificateController (+3 more)

### Community 20 - "User Administration"
Cohesion: 0.17
Nodes (7): org.springframework.data.domain.Page, org.springframework.data.domain.Pageable, AttemptAnswerRepository, AdminUserService, AdminUsersResponse, AdminUserDto, AdminUsersResponse

### Community 21 - "Analytics Count Projections"
Cohesion: 0.14
Nodes (6): CategoryCount, DayCount, AdminAnalyticsDto, DayPoint, TopCategory, AdminAnalyticsDto

### Community 22 - "Score Trend Analytics"
Cohesion: 0.16
Nodes (4): ScoreTrendRow, ScoreTrendPoint, AdminAnalyticsService, ScoreTrendPoint

### Community 23 - "Certificates Badges & History"
Cohesion: 0.13
Nodes (3): CertificateDto, BadgeDto, UserStatsDto

### Community 24 - "Auth UI & API Client"
Cohesion: 0.19
Nodes (9): AuthInner(), Mode, emptySubscribe(), Navbar(), ApiError, AuthState, useAuthStore, AuthResponse (+1 more)

### Community 25 - "Gemini AI Integration"
Cohesion: 0.19
Nodes (7): RestClient, BadRequestException, Candidate, Content, GeminiClient, GeminiResponse, Part

### Community 26 - "Attempt Status & Lifecycle"
Cohesion: 0.16
Nodes (6): AttemptStatus, EXPIRED, IN_PROGRESS, SUBMITTED, Override, DropoffDto

### Community 27 - "Attempt Submission Logic"
Cohesion: 0.25
Nodes (5): AttemptResultDto, SubmitAnswerDto, SubmitAttemptRequest, AttemptService, AttemptResultDto

### Community 28 - "Question Types & DTOs"
Cohesion: 0.20
Nodes (7): QuestionResultDto, QuestionRequest, QuestionUpsertRequest, QuestionType, MCQ, MULTI_SELECT, TRUE_FALSE

### Community 29 - "Quiz Creation Service"
Cohesion: 0.23
Nodes (4): Difficulty, QuizCreateRequest, QuizDto, QuizService

### Community 30 - "Certificate Claiming Service"
Cohesion: 0.18
Nodes (5): CertificateService, CategoryProgressDto, CertificateDto, CategoryProgressDto, CertificateRepository

### Community 31 - "User Stats & Streaks"
Cohesion: 0.24
Nodes (4): AttemptResultDto, BadgeDto, UserStatsDto, UserService

### Community 32 - "CSV Question Parser"
Cohesion: 0.35
Nodes (5): org.apache.commons.csv.CSVRecord, CsvOption, CsvQuestionParser, ParsedQuestion, RowResult

### Community 33 - "Category CRUD Service"
Cohesion: 0.27
Nodes (4): CategoryDto, CategoryRequest, CategoryService, CategoryDto

### Community 34 - "Scheduled Jobs & Sweeper"
Cohesion: 0.27
Nodes (5): org.springframework.boot.autoconfigure.condition.ConditionalOnProperty, org.springframework.scheduling.annotation.Scheduled, QuizAttemptRepository, StaleAttemptSweeper, AnalyticsService

### Community 35 - "Custom Quiz Start"
Cohesion: 0.27
Nodes (4): CustomQuizRequest, Difficulty, StartAttemptRequest, StartAttemptResponse

### Community 36 - "Leaderboard UI"
Cohesion: 0.29
Nodes (8): AdminPage(), LeaderboardPage(), PodCard(), RankedEntry, withSharedRanks(), initials(), CategoryDto, LeaderboardEntryDto

### Community 37 - "App Shell & Providers"
Cohesion: 0.29
Nodes (5): jakarta, jetbrains, metadata, spaceGrotesk, Providers()

### Community 39 - "Backend Modules & Cloud Services"
Cohesion: 0.29
Nodes (7): attempt module, certificate module, leaderboard module, quiz module, Google Gemini API, Supabase Postgres, Upstash Redis

### Community 40 - "Project Planning Docs"
Cohesion: 0.40
Nodes (5): HexQuiz Architecture & Functionality Diagrams, Google Gemini API, IT Quiz Platform — Complete Project Plan, Supabase Postgres, Upstash Redis

### Community 42 - "Platform Settings Admin"
Cohesion: 0.80
Nodes (3): AdminSettingsController, SettingsUpdate, SettingsView

### Community 45 - "Render Deployment Configuration"
Cohesion: 0.67
Nodes (3): quiz-app-backend, quiz-app-frontend, Render Deployment Configuration

## Knowledge Gaps
- **111 isolated node(s):** `SectionDef`, `SectionId`, `NAV_GROUPS`, `ALL_SECTIONS`, `STATUS_STYLES` (+106 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `User` connect `Java Annotations & Imports` to `Test Infrastructure`, `JWT Security & Auth Filter`, `Custom Quiz Start`, `Live Room DTOs`, `User Administration`, `Certificates Badges & History`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `QuestionType` connect `Question Types & DTOs` to `Java Annotations & Imports`, `Test Infrastructure`, `CSV Question Parser`, `Live Room DTOs`, `Question Admin & Exceptions`, `Quiz Creation Service`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `UserRepository` connect `JWT Security & Auth Filter` to `Java Annotations & Imports`, `Test Infrastructure`, `REST Controller Layer`, `User Administration`, `Score Trend Analytics`, `Attempt Status & Lifecycle`, `Certificate Claiming Service`, `User Stats & Streaks`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `SectionDef`, `SectionId`, `NAV_GROUPS` to the rest of the system?**
  _111 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Java Annotations & Imports` be split into smaller, more focused modules?**
  _Cohesion score 0.05979330708661417 - nodes in this community are weakly interconnected._
- **Should `Test Infrastructure` be split into smaller, more focused modules?**
  _Cohesion score 0.050615901455767075 - nodes in this community are weakly interconnected._
- **Should `JWT Security & Auth Filter` be split into smaller, more focused modules?**
  _Cohesion score 0.05094905094905095 - nodes in this community are weakly interconnected._