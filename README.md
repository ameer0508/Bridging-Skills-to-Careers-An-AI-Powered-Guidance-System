# SkillBridge: Bridging Skills to Careers

An AI-assisted career guidance system. A student uploads a resume; SkillBridge extracts their
skills, matches them against career requirements, explains the match, shows where they stand,
builds a learning roadmap, helps them track job applications and lets them practise interviews.

This is a college major project. It runs locally and is covered by automated tests. It has **not**
been deployed to a server or load-tested, and the two external integrations (Google Gemini and
JSearch) have not been exercised live; see [Verification status](#verification-status).

## Contents

- [What it does](#what-it-does)
- [How it works](#how-it-works)
- [Run it locally](#run-it-locally)
- [Configuration](#configuration)
- [Tests and checks](#tests-and-checks)
- [Verification status](#verification-status)
- [Known limitations](#known-limitations)
- [Repository layout](#repository-layout)
- [Further documentation](#further-documentation)
- [License](#license)

## What it does

| Area | What the user gets |
|---|---|
| Account | Registration, sign-in with rotating refresh tokens, sign-out, a three-step onboarding that records a career domain and target role. |
| Resume | Upload a PDF or DOCX (5 MB at most). Replace, download, reprocess or delete it. After a replacement the page lists which skills were added and which are no longer found. |
| Skills | Skills are recognised from a fixed lexicon of 128 skills and scored by the evidence in the resume: applied in a role or project scores higher than merely listed. |
| Career matches | 14 careers with 109 weighted requirements. Each match shows a score and a per-requirement table of how the score was calculated. |
| Readiness | A 0-100 readiness score per career with a tier and dimension breakdown. It describes resume evidence; it does not predict hiring outcomes. |
| Recommendations and roadmap | One recommendation per gap, leading with the chosen target career, and a phased roadmap whose progress is saved. |
| Jobs | Search with keyword, location, remote, employment type, date and salary filters. Save jobs, set a status, keep notes, set follow-up reminders, and see the status history. |
| Interviews | Mock interviews with questions built from the user's role, skills, gaps, resume and optionally a job posting. Answers are scored on a rubric; reports and history are saved. |
| Assistant | A chat grounded in the user's stored data. |
| Command Center | A home page that summarises the above from one snapshot. |

### What happens without AI or job-provider keys

The system is usable with no external keys. It says so on screen rather than inventing results:

| Feature | With a provider | Without one |
|---|---|---|
| Resume parsing | Rule-based parser. If it fails on a document, the AI provider is asked instead | Rule-based parser. If it fails, the resume is marked failed and can be reprocessed; no content is invented |
| Interview questions | Written by AI, labelled "written by AI" | Built-in bank of 108 questions selected for the user, labelled "from the question bank" |
| Interview scoring | AI rubric, including technical accuracy | Rule-based rubric, capped at 80, technical accuracy shown as "Not assessed" |
| Chat | AI reply, labelled with provider and model | A labelled summary of the user's stored data with a Retry button; never a made-up answer |
| Job search | Live JSearch results | Built-in demo listings, each labelled as a demo; a failing provider shows "unavailable" |

Some secondary screens are design previews with built-in example content. They carry a banner
saying so, and sample market, salary, course and certification panels are marked as illustrative.

## How it works

```
Browser (React)  ──HTTPS──▶  Backend (Express)  ──internal key──▶  AI service (FastAPI)  ──▶  Gemini (optional)
                                   │                                    
                                   ├──▶ MongoDB
                                   └──▶ JSearch via RapidAPI (optional)
```

- **Frontend** (`frontend/`): React 19, Vite, TypeScript, Tailwind, TanStack Query.
- **Backend** (`backend/`): Express, TypeScript, Mongoose. Owns all user data, authentication,
  scoring, recommendations, roadmaps, jobs and interviews.
- **AI service** (`ai/`): FastAPI. Parses resumes and talks to the AI provider. Only the backend
  may call it, using a shared `X-Internal-Service-Key`; the browser never contacts it.

Scoring is deterministic and documented, with a worked example, in [`docs/SCORING.md`](docs/SCORING.md).

## Run it locally

Requirements: Node.js (developed and tested on 24), pnpm, and Python 3.11 for the AI service.
MongoDB does not need to be installed: in development the backend runs an embedded MongoDB and
keeps its files in `backend/data/local_db`.

```bash
pnpm install

# AI service
cd ai
python -m venv .venv
# Windows:      .venv\Scripts\activate
# macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

Start the three parts in separate terminals:

```bash
pnpm dev:backend                                             # http://localhost:5000
pnpm dev:frontend                                            # http://localhost:3000
cd ai && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open http://localhost:3000 and register. No `.env` files are needed for this; every setting has a
development default.

## Configuration

Copy the example files only when a default needs changing. They list every variable with an
explanation:

- [`backend/.env.example`](backend/.env.example)
- [`ai/.env.example`](ai/.env.example)
- [`frontend/.env.example`](frontend/.env.example)

The settings that matter most:

| Variable | Where | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | `ai/.env` | Enables AI replies, AI interview questions and AI scoring. Optional. |
| `RAPIDAPI_KEY` | `backend/.env` | Enables live job search through JSearch. Optional. |
| `INTERNAL_SERVICE_KEY` | both | Shared key between backend and AI service. Required in production; must match. |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | `backend/.env` | Required in production; must be strong and different from each other. |
| `MONGODB_URI` | `backend/.env` | A non-local URI makes the backend use that database instead of the embedded one. |
| `FRONTEND_URL` | `backend/.env` | Browser origin allowed by CORS. |

In production mode both services refuse to start with the built-in development keys.

Timeouts are ordered so the innermost fires first and the user always gets an answer:
Gemini request 20 s (`GEMINI_TIMEOUT_SECONDS`) < backend chat wait 25 s (`CHAT_AI_TIMEOUT_MS`) <
browser chat request 40 s.

## Tests and checks

| Command | What it runs |
|---|---|
| `pnpm typecheck` | TypeScript type-check of frontend and backend. |
| `pnpm lint` | ESLint on frontend and backend; any warning fails. |
| `pnpm build` | Frontend type-check and production build, then backend build. |
| `pnpm test` | 19 backend suites on an in-memory database with a stub AI service. |
| `cd ai && python -m pytest` | 104 AI service tests; provider calls are mocked. |
| `pnpm test:e2e` | 35 browser checks against an isolated copy of the whole stack. See [`e2e/README.md`](e2e/README.md). |
| `gh workflow run docker-smoke.yml --ref <branch>` | Builds and starts the Docker Compose stack on GitHub Actions and runs 11 checks against it. |

None of these contacts Gemini or JSearch, and none reads or writes the development database or
uploads. The backend runner fails if it detects a change to those paths.

## Verification status

The full list, with the evidence for each item, is in
[`docs/FINALIZATION_CHECKLIST.md`](docs/FINALIZATION_CHECKLIST.md).

Verified by the automated tests above: the user journey from registration to interview report,
resume lifecycle, scoring rules, job filters and tracking, interview question generation and
scoring fallbacks, chat fallback and retry, request validation, and that one account cannot read
or change another's data.

The Docker Compose stack is verified by a GitHub Actions workflow (`docker-smoke.yml`, run by
hand): it builds the images, starts the four services and runs a resume-to-career check with
synthetic data. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

Not verified:

- **A real deployment.** The containers have run only on a CI runner, with one synthetic user.
  The project has never been deployed to a server.

- **Live Gemini.** The configured model was confirmed to exist for the key, but no generation
  request has been made. AI paths are tested with mocked provider output.
- **Live JSearch.** Never called. Live job search is tested against a stubbed provider response.
- **Browsers** other than Microsoft Edge (Chromium), real mobile devices, and screen readers.
- **Load, concurrency at scale, and production hosting.**

## Known limitations

- Skill extraction recognises only the 128 skills in the lexicon and is verified for English,
  single-column, text-based PDF and DOCX files. Scanned (image-only) resumes are not read.
- The career taxonomy has 14 careers, weighted towards software, data and related roles.
- The rule-based interview scoring judges the wording and structure of an answer. It cannot tell
  whether a technical answer is correct.
- Resume processing runs inside the backend process. A restart interrupts a running job; it is
  then marked failed and can be reprocessed from the resume page.
- Reminders are shown in the application; no email or push notification is sent.
- Demo job listings are a fixed set of ten built-in examples.
- About 140 frontend files are not used by the application. They are listed, grouped and left in
  place in [`docs/FRONTEND_UNREACHABLE_FILES.md`](docs/FRONTEND_UNREACHABLE_FILES.md).
- Databases created by early versions may hold records in older shapes. A non-destructive, opt-in
  migration is described in [`docs/DATA_COMPATIBILITY.md`](docs/DATA_COMPATIBILITY.md); it has not
  been run against real data.

## Repository layout

```
frontend/   React application
backend/    Express API, data models, scoring, tests (src/tests)
ai/         FastAPI service, resume parsing, provider gateway, tests (tests)
e2e/        Browser smoke tests and the script that starts an isolated stack
docs/       Scoring, API reference, deployment, data compatibility, checklist
```

## Further documentation

- [`docs/SCORING.md`](docs/SCORING.md): every formula, its limits and a worked example
- [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md): endpoints
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md): production settings and Docker
- [`docs/DATA_COMPATIBILITY.md`](docs/DATA_COMPATIBILITY.md): legacy data and migration
- [`docs/SECURITY.md`](docs/SECURITY.md): security measures
- [`docs/FINALIZATION_CHECKLIST.md`](docs/FINALIZATION_CHECKLIST.md): what is verified and how

## License

MIT. See [`LICENSE`](LICENSE).
