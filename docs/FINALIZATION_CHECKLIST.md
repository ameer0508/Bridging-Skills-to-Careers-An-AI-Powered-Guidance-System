# SkillBridge finalization checklist

Progress is the sum of points for items marked **Done**. An item is only marked Done when
the stated verification has actually been run and passed. "Code exists" does not count.

Total: 100 points. **Current: 97 / 100.**

Verification levels used below:

- **service test**: backend test suites that call service classes directly on a clean in-memory database
- **HTTP test**: `backend/src/tests/api_integration.test.ts`, real Express app called over HTTP (in-memory database, fake AI service)
- **AI test**: `ai/tests` run with pytest
- **live check**: real backend and real AI service started locally and driven over HTTP
- **API**: exercised over HTTP against a running backend
- **UI**: exercised in the browser
- **browser journey** / **browser check**: scripted headless Microsoft Edge session against the Vite dev server, a real backend on a temporary database and the real AI service with no provider key (so AI features use their labelled rule-based fallbacks and job listings are the labelled demo listings)

## A. Accounts and onboarding (6)

| # | Item | Pts | Status | Verification |
|---|---|---|---|---|
| A1 | Register, login, refresh rotation, logout | 2 | **Done** | service test + HTTP test (validation, duplicate, wrong password, rotation, reuse detection, logout) |
| A2 | Onboarding flow end to end | 2 | **Done** | browser journey: register, three-step onboarding, target role stored on the profile |
| A3 | Remove on-disk credential backup; safe account persistence | 2 | **Done** | Runner tripwire: backup file, local database and uploads unchanged after the full suite; opt-in restore script tested |

## B. Resume intelligence (10)

| # | Item | Pts | Status | Verification |
|---|---|---|---|---|
| B1 | Upload, replace, download, delete | 2 | **Done** | `pnpm test:e2e` (35/35): upload, byte-identical download, replace, confirmed delete; HTTP test resume_lifecycle |
| B2 | Better extraction accuracy (skills and sections; AI-assisted with fallback) | 3 | **Done** | AI test: 25 fixture tests over TXT, PDF and DOCX in five layouts; live check with a real PDF. Scope: English, single-column, text-based documents only |
| B3 | Honest ATS and section labels | 1 | **Done** | browser check: resume page shows "Rule-based parser"; invented quality defaults removed |
| B4 | Reprocess endpoint and recovery of stuck jobs | 2 | **Done** | HTTP test resume_lifecycle (reprocess, 409 while running, failed/stuck/interrupted jobs recoverable); `pnpm test:e2e` (35/35) drives reprocess and failure recovery in the UI |
| B5 | Differential processing on replace | 2 | **Done** | service test (old resume's skills do not linger after replacement) |

## C. Skill intelligence (8)

| # | Item | Pts | Status | Verification |
|---|---|---|---|---|
| C1 | Evidence scoring with whole-term matching and proficiency estimate | 2 | **Done** | service test ("Java" not credited from "JavaScript") |
| C2 | Robust normalization (special characters, name variants) | 2 | **Done** | service test (C++, AWS variants) |
| C3 | Skill taxonomy beyond software roles | 2 | **Done** | Shared 128-skill lexicon covering data, cloud, security, design and business; AI test (design and BI fixtures); service test asserts every career requirement is extractable |
| C4 | Skills page shows evidence and proficiency | 2 | **Done** | browser check: skills grouped by category with proficiency label and evidence weight; requirement coverage reads the real match (was always 0% from a wrong field name) |

## D. Career intelligence and readiness (10)

| # | Item | Pts | Status | Verification |
|---|---|---|---|---|
| D1 | Idempotent career taxonomy (14 careers, 109 requirements) | 2 | **Done** | service test |
| D2 | Matching works on a fresh database, no duplicates | 2 | **Done** | service test |
| D3 | Readiness and gap analysis persisted per career | 2 | **Done** | service test |
| D4 | Explainable score breakdown in API and UI | 2 | **Done** | browser journey: careers page shows the API score and a per-requirement "How this score was calculated" table |
| D5 | Careers and Readiness pages verified | 2 | **Done** | browser journey: careers page matches the API; readiness page shows tier and score; the same readiness figure appears on home, readiness, jobs and interview pages |

## E. Recommendations and roadmaps (10)

| # | Item | Pts | Status | Verification |
|---|---|---|---|---|
| E1 | Every gap produces a recommendation | 2 | **Done** | service test |
| E2 | Roadmap creation, persisted progress, progress kept on regeneration | 3 | **Done** | service test |
| E3 | Remove canned recommendations with invented statistics; proper empty state | 1 | **Done** | browser check: no invented uplift figures; cards show "Gap impact x/100" and the evidence sentence from the API |
| E4 | Broader learning resource catalog | 2 | **Done** | 39 curated official documentation links seeded idempotently; live check shows a recommendation pointing at one |
| E5 | Recommendations and Roadmap pages verified | 2 | **Done** | browser journey: roadmap item marked complete, progress 0% to 17% in page and snapshot; recommendations page content checked |

## F. Jobs and application tracking (10)

| # | Item | Pts | Status | Verification |
|---|---|---|---|---|
| F1 | Saved jobs keep URL, notes, status; counted in Command Center | 2 | **Done** | service test |
| F2 | Honest match score (no floor, no invented skills) | 2 | **Done** | service test (0, partial, 100, aliases, unscoreable postings, repeats, substring traps) + HTTP test + live check |
| F3 | Filters, ranking, freshness, deduplication | 2 | **Done** | HTTP test opportunity_tracking: keyword, location, remote, type, date, salary (stated salaries only), sorting, page size, re-post deduplication, result metadata; `pnpm test:e2e` (35/35) |
| F4 | Application history, reminders, outcomes | 2 | **Done** | HTTP test opportunity_tracking: status history, notes, follow-up reminders, due reminders in snapshot, 404 semantics; `pnpm test:e2e` (35/35) drives the tracking panel |
| F5 | Jobs pages verified; sandbox data labelled | 2 | **Done** | browser journey: search, save, status change to Applied, survives reload; without a provider key listings are labelled "demo listing" / sandbox |

## G. Interview intelligence (10)

| # | Item | Pts | Status | Verification |
|---|---|---|---|---|
| G1 | Answers, evaluations and scores persisted | 2 | **Done** | service test |
| G2 | AI question generation with deterministic fallback | 2 | **Done** | AI test test_interview_questions (12) and HTTP test interview_questions: AI questions when a provider answers, otherwise a 108-question bank selected by role, skills, gaps and job posting, with no repeats across sessions |
| G3 | AI evaluation with labelled heuristic fallback; honest dimension scores | 3 | **Done** | service test (empty, one-sentence, off-topic, keyword list, STAR, technical, AI output validation, unavailable, invalid, timeout) + AI test. The AI path was tested with mocked provider output only |
| G4 | Report and history pages verified | 2 | **Done** | `pnpm test:e2e` (35/35): report shows question source, scoring source and real rubric dimensions; history lists sessions and reopens a stored report |
| G5 | Fix wrong history path in profile workspace | 1 | **Done** | browser journey: profile page loads interview history with no failed request |

## H. Command Center (8)

| # | Item | Pts | Status | Verification |
|---|---|---|---|---|
| H1 | Snapshot aggregates are consistent across modules | 2 | **Done** | service test |
| H2 | Actions work and other modules update live | 3 | **Done** | browser journey: completing a roadmap item, saving a job and changing its status are reflected in the snapshot and on Home without a manual refresh step |
| H3 | Fabricated telemetry removed or labelled | 2 | **Done** | browser check: scan of the 13 main pages for the known invented labels is clean; values on Home equal the API values. Landing-page mock-up previews still show sample percentages (see known limitations) |
| H4 | Home page verified | 1 | **Done** | browser journey: Home shows the API readiness, skill count, tracked jobs and roadmap progress |

## I. AI infrastructure (8)

| # | Item | Pts | Status | Verification |
|---|---|---|---|---|
| I1 | AI service authentication and restricted CORS | 2 | **Done** | AI test (all 52 operations audited) + live check |
| I2 | Upload filename sanitization, size limit, content validation | 1 | **Done** | AI test + HTTP test |
| I3 | Gemini configuration verified; fallback and observability | 2 | **Done** | Model id confirmed present for the configured key via the model-list endpoint (no prompt sent); no silent model substitution, provider-reported token counts (AI test, mocked). No real generation request has been made |
| I4 | Chat timeout alignment and fallback flag | 2 | **Done** | AI test test_chat, HTTP test chat_reliability, `pnpm test:e2e` (35/35): timeouts ordered (provider 20s, server 25s, browser 40s); fallback replies labelled and retryable; mock provider never answers chat |
| I5 | Simulated modules hidden or labelled as demos | 1 | **Done** | 16 simulated workspaces wrapped in a "design preview" banner (verified in the browser on one of them); sample market, salary, course and certification panels carry an "Illustrative sample data" notice |

## J. Reliability, security, testing, UX, deployment (20)

| # | Item | Pts | Status | Verification |
|---|---|---|---|---|
| J1 | Models tracked, typed, matching services; backend `tsc --noEmit` clean | 3 | **Done** | `tsc --noEmit`: 0 errors |
| J2 | Recalculations serialized per user | 1 | **Done** | service test (duplicate checks) |
| J3 | Docker Compose starts a working stack | 3 | Pending | NOT run: Docker is still not installed on the development machine. Configuration was corrected by inspection only |
| J4 | Correct error codes and input validation | 2 | **Done** | HTTP test input_validation: 40 malformed requests across every write endpoint return the expected 4xx with an error code, none 500, none changes data |
| J5 | All test suites isolated, run once, pass | 3 | **Done** | `pnpm --filter backend test`: 13 suites pass; pytest: 78 pass |
| J6 | Frontend type-check is real and build passes | 3 | **Done** | `pnpm --filter frontend build` now runs `tsc --noEmit -p tsconfig.app.json` first: 0 errors (was 514), then `vite build` passes. No strictness relaxed, no `@ts-ignore`/`@ts-nocheck` added |
| J7 | Lint clean | 1 | **Done** | `pnpm lint`: backend 0 warnings; frontend 0 warnings (was 108), no rule disabled or suppression added. Seven suppressions that predate this work remain in context/provider files |
| J8 | UX polish, accessibility, loading and error states | 2 | **Done** | `pnpm test:e2e` (35/35): accessible names on every control of 13 pages, 7 pages fit 390px, keyboard focus order, and a load-failure notice with retry on 12 pages when the API fails; loading, empty, error and retry states for resume, jobs, interviews and chat. Not covered: screen readers, colour contrast, non-Chromium browsers |
| J9 | README and docs match the implementation | 1 | **Done** | README, DEPLOYMENT, SECURITY, ARCHITECTURE, CHANGELOG, SCORING and the `.env.example` files rewritten or corrected against the code; the endpoint table in API_REFERENCE is checked against all 54 routes. The older per-endpoint examples in API_REFERENCE were not re-verified one by one and say so |
| J10 | Full demo journey run-through | 1 | **Done** | browser journey: 27 of 27 checks pass on a clean temporary database (register, onboarding, upload, extraction, skills, matches, readiness, roadmap, jobs, interview, Home, reload, logout, re-login, cross-user isolation, invalid input, navigation, 390px layout, basic accessibility) |

## Environment limitations (as of milestone 5)

- **Docker is not installed** on the development machine, so `docker compose up` and the
  image builds have not been executed. The Compose file, Dockerfiles, nginx config and
  ignore files were corrected by inspection only.
- **The project's Python 3.11 virtualenv (`ai/.venv`) could not be launched** from the
  automation shell. The AI tests and the live check ran in a separate throwaway Python 3.13
  environment installed from `ai/requirements.txt`, so they exercised current package
  versions rather than the exact versions in `ai/.venv`.
- **No real Gemini generation request has been made.** The configured model id was confirmed
  to exist for the key via the model-list endpoint only. Chat, AI interview evaluation and the
  AI resume-parsing fallback are therefore verified with mocked provider output, not live.
- **Browser testing used Microsoft Edge headless only**, through the committed suite in `e2e/`
  (`pnpm test:e2e`), which uses a stub AI service. No other browser, real mobile device or
  screen reader was used.
- **JSearch has never been called.** Live job search is verified only against a stubbed provider.

## Known limitations carried forward

- Local databases created before the model repair may hold documents in the old shapes.
  They are left untouched; a tested, non-destructive, opt-in migration is documented in
  `docs/DATA_COMPATIBILITY.md`. It has not been run against any real database.
- Scoring formulas, their limits and a worked example are documented in `docs/SCORING.md`.
- Skill extraction only recognises the 128 skills in the shared lexicon, and resume parsing is
  verified for English, single-column, text-based documents only.
- `ai/app/services/gemini.py` is unused dead code with a different hardcoded model id; it was left in place.
- The public landing page still shows product mock-ups with sample percentages (for example "94.8%" match cards). Its statistics strip now uses real counts from the codebase.
- Unknown URLs redirect to the landing page; there is no dedicated not-found page.
- About 140 frontend source files are not reachable from the router and were left in place.
