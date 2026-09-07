# Changelog: SkillBridge

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-07-21

### Changed
- **Production Hardening Milestone**: Transformed the platform into a production-grade SaaS application.
- **Backend Security**: Implemented `helmet`, dynamic `cors` based on environment, `express-rate-limit` for DDoS protection, and strict JSON body size limits (10MB).
- **AI Service Resilience**: Added circuit-breaker patterns, timeout handling (15s), and automatic fallback generation to gracefully degrade when LLMs are unavailable or timeout.
- **Observability**: Standardized structured logging and health endpoints.
- **DevOps**: Introduced full Dockerization with separate `Dockerfile`s for `frontend` (Nginx), `backend` (Node), and `ai` (Python), orchestrated via `docker-compose.yml`.
- **Frontend Hardening**: Introduced global `ErrorBoundary` to gracefully catch and report unexpected React rendering errors without crashing the app.

---

## [0.10.0-alpha] - 2026-07-21

### Added

- AI Career Architect: Personalized Conversational AI advisor grounded strictly in verified platform intelligence.
- ContextAssembler Engine: Gathers Resume, Skill, Career, Readiness, Roadmap, and Analytics context into a deterministic LLM prompt payload.
- Conversation Models: `Conversation`, `ConversationMessage`, `ConversationContextSnapshot`, and `ConversationFeedback`.
- Dynamic Context Switching: AI automatically resets context if the user switches their target career midway through a conversation.
- AI Architect Frontend Chat Interface: Built a full conversational UI with contextual indicators, dynamic typing states, and suggested starting questions.

---

## [0.9.0-alpha] - 2026-07-21

### Added

- Progress Intelligence & Analytics Engine: Computes incremental metrics and progress insights using stored historical data.
- Snapshot Engine: Periodically records Career Readiness and Skill Growth statistics over time without fabricating missing dates.
- Insight Engine: Analyzes sequential snapshots to derive intelligent observations (e.g., Velocity, Gap Closure, Trend improvements).
- Models: `ProgressEvent`, `AnalyticsSnapshot`, and `Insight` to store atomic progression logs.
- Analytics Dashboard (Frontend UI): Visualizes historical Readiness Trend via responsive Recharts, smart insights, and a running activity log of progress events.

---

## [0.8.0-alpha] - 2026-07-21

### Added

- Adaptive Learning Roadmap Engine: Generates strictly-ordered learning sequences mapped to career readiness gaps.
- DependencyResolver Engine: Performs topological sorting of recommendations to prevent impossible learning paths.
- Roadmap Data Models: `LearningRoadmap`, `RoadmapPhase`, `RoadmapItem`, and `RoadmapHistory`.
- Frontend Learning Roadmap Page: Displays visual timeline of phases, tracks completion percentage, and allows marking items in progress or completed.

---

## [0.7.0-alpha] - 2026-07-19

### Added

- Career Readiness Engine: Evaluates user preparedness across Technical, Experience, and Educational dimensions.
- Gap Analysis Engine: Ranks missing skills by impact score to prioritize improvements.
- Readiness Data Models: `CareerReadiness`, `GapAnalysis`, and `ReadinessHistory`.
- Frontend Career Readiness Page: Provides deep dive analytics into dimensions, verified strengths, and critical gaps.

---

## [0.6.0-alpha] - 2026-07-19

### Added

- Career Readiness Engine: Evaluates user preparedness across Technical, Experience, and Educational dimensions.
- Gap Analysis Engine: Ranks missing skills by impact score to prioritize improvements.
- Readiness Data Models: `CareerReadiness`, `GapAnalysis`, and `ReadinessHistory`.
- Frontend Career Readiness Page: Provides deep dive analytics into dimensions, verified strengths, and critical gaps.

---

## [0.5.0-alpha] - 2026-07-19

### Added

- Career Intelligence Engine: Deterministic matching engine that evaluates UserSkill evidence against CareerRequirements.
- Career Data Models: `Career`, `CareerRequirement`, `CareerMatch`, and `CareerSimilarity`.
- Scoring & Explanation Services: XAI reasoning generating explicit strength/weakness statements without LLMs dynamically.
- Frontend Career Intelligence Page: A dashboard sorting and visualizing top career matches based entirely on verified evidence.

---

## [0.4.0-alpha] - 2026-07-19

### Added

- Skill Intelligence Layer: Normalizes raw resume skills into a canonical taxonomy.
- Knowledge Graph Models: `Skill`, `SkillRelationship`, and `UserSkill`.
- AI Normalization Service (`/api/v1/skills/normalize`): Uses Gemini LLM to categorize and relate unknown skills.
- Evidence Calculator: Derives an evidence score (0-100) based on skill presence in parsed resume experience, projects, education, and certifications.
- Frontend Skill Intelligence Page: Grouped visualization of user skills, categories, and evidence breakdown.

---

## [0.3.0-alpha] - 2026-07-19

### Added

- Resume Document Upload & Storage integration (`multer` + local disk storage placeholder).
- Resume Data Models: `Resume`, `ParsedResume`, `ExtractedSkill`.
- AI Resume Intelligence Engine: Extracts structured JSON data (Experience, Projects, Education) from docx/pdf via Gemini.
- Frontend Document Management: Resume Upload page and Parsing Status polling UI.

---

## [0.2.0-alpha] - 2026-07-19

### Added

- Secure JWT-based Authentication system (Registration, Login, Logout, Refresh Token Rotation).
- User collection model with selection projection safety and custom indexes.
- RefreshToken collection model featuring MongoDB TTL index integration for automatic session expiration.
- Centralized input schema validator middleware utilizing Zod schemas.
- Route authorization (RBAC) and JWT verification middlewares.
- Security enhancements: Helmet middleware and route-level rate limiting via `express-rate-limit`.
- Frontend Zustand `useAuthStore` session sync mechanism with localStorage persistence.
- React Router route security guards (`ProtectedRoute` and `GuestRoute`).
- Axios queue-based interceptor for automatic `401 Unauthorized` token refreshing.
- Core UI pages: Registration Form, Login Form, and a Profile Dashboard to display and edit user metadata.

---

## [0.1.0-alpha] - 2026-07-19

### Added

- Monorepo structure using `pnpm` workspaces.
- Root configuration files: `.gitignore`, `.editorconfig`, `.gitattributes`, and MIT `LICENSE`.
- Frontend architecture configured with React 19, Vite, TypeScript (strict), Tailwind CSS v4, React Router, TanStack Query, Zustand, Axios, React Hook Form, and Zod.
- Backend architecture configured with Node.js, Express, TypeScript (strict), Winston Logger, centralized error handler, environment validation via Zod, and API versioning structure.
- AI service foundation configured with Python FastAPI, environment loading via Pydantic Settings, JSON logging, and `/health` endpoints.
- Base project documentation: `README.md`, `docs/ARCHITECTURE.md`, `docs/API_REFERENCE.md`, and `docs/CHANGELOG.md`.
