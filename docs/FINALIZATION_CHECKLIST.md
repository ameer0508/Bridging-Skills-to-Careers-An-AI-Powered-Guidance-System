# SkillBridge finalization checklist

Progress is the sum of points for items marked **Done**. An item is only marked Done when
the stated verification has actually been run and passed. "Code exists" does not count.

Total: 100 points. **Current: 25 / 100.**

Verification levels used below:

- **service test**: covered by `backend/src/tests/core_pipeline.test.ts` on a clean in-memory database
- **API**: exercised over HTTP against a running backend
- **UI**: exercised in the browser

## A. Accounts and onboarding (6)

| # | Item | Pts | Status | Verification |
|---|---|---|---|---|
| A1 | Register, login, refresh rotation, logout | 2 | Pending | Existing auth tests not yet run (they write to the real backup file, see A3) |
| A2 | Onboarding flow end to end | 2 | Pending | UI |
| A3 | Remove on-disk credential backup; safe account persistence | 2 | Pending | service test |

## B. Resume intelligence (10)

| # | Item | Pts | Status | Verification |
|---|---|---|---|---|
| B1 | Upload, replace, download, delete | 2 | Pending | API + UI |
| B2 | Better extraction accuracy (skills and sections; AI-assisted with fallback) | 3 | Pending | fixture resumes |
| B3 | Honest ATS and section labels | 1 | Pending | UI |
| B4 | Reprocess endpoint and recovery of stuck jobs | 2 | Pending | API |
| B5 | Differential processing on replace | 2 | Pending | service test |

## C. Skill intelligence (8)

| # | Item | Pts | Status | Verification |
|---|---|---|---|---|
| C1 | Evidence scoring with whole-term matching and proficiency estimate | 2 | **Done** | service test ("Java" not credited from "JavaScript") |
| C2 | Robust normalization (special characters, name variants) | 2 | **Done** | service test (C++, AWS variants) |
| C3 | Skill taxonomy beyond software roles | 2 | Pending | fixture resumes |
| C4 | Skills page shows evidence and proficiency | 2 | Pending | UI |

## D. Career intelligence and readiness (10)

| # | Item | Pts | Status | Verification |
|---|---|---|---|---|
| D1 | Idempotent career taxonomy (14 careers, 109 requirements) | 2 | **Done** | service test |
| D2 | Matching works on a fresh database, no duplicates | 2 | **Done** | service test |
| D3 | Readiness and gap analysis persisted per career | 2 | **Done** | service test |
| D4 | Explainable score breakdown in API and UI | 2 | Pending | API + UI |
| D5 | Careers and Readiness pages verified | 2 | Pending | UI |

## E. Recommendations and roadmaps (10)

| # | Item | Pts | Status | Verification |
|---|---|---|---|---|
| E1 | Every gap produces a recommendation | 2 | **Done** | service test |
| E2 | Roadmap creation, persisted progress, progress kept on regeneration | 3 | **Done** | service test |
| E3 | Remove canned recommendations with invented statistics; proper empty state | 1 | Pending | API + UI |
| E4 | Broader learning resource catalog | 2 | Pending | service test |
| E5 | Recommendations and Roadmap pages verified | 2 | Pending | UI |

## F. Jobs and application tracking (10)

| # | Item | Pts | Status | Verification |
|---|---|---|---|---|
| F1 | Saved jobs keep URL, notes, status; counted in Command Center | 2 | **Done** | service test |
| F2 | Honest match score (no floor, no invented skills) | 2 | Pending | service test |
| F3 | Filters, ranking, freshness, deduplication | 2 | Pending | service test + API |
| F4 | Application history, reminders, outcomes | 2 | Pending | API + UI |
| F5 | Jobs pages verified; sandbox data labelled | 2 | Pending | UI |

## G. Interview intelligence (10)

| # | Item | Pts | Status | Verification |
|---|---|---|---|---|
| G1 | Answers, evaluations and scores persisted | 2 | **Done** | service test |
| G2 | AI question generation with deterministic fallback | 2 | Pending | service test |
| G3 | AI evaluation with labelled heuristic fallback; honest dimension scores | 3 | Pending | service test |
| G4 | Report and history pages verified | 2 | Pending | UI |
| G5 | Fix wrong history path in profile workspace | 1 | Pending | UI |

## H. Command Center (8)

| # | Item | Pts | Status | Verification |
|---|---|---|---|---|
| H1 | Snapshot aggregates are consistent across modules | 2 | **Done** | service test |
| H2 | Actions work and other modules update live | 3 | Pending | UI |
| H3 | Fabricated telemetry removed or labelled | 2 | Pending | UI |
| H4 | Home page verified | 1 | Pending | UI |

## I. AI infrastructure (8)

| # | Item | Pts | Status | Verification |
|---|---|---|---|---|
| I1 | AI service authentication and restricted CORS | 2 | Pending | API |
| I2 | Upload filename sanitization | 1 | Pending | AI test |
| I3 | Gemini configuration verified; fallback and observability | 2 | Pending | API |
| I4 | Chat timeout alignment and fallback flag | 2 | Pending | API + UI |
| I5 | Simulated modules hidden or labelled as demos | 1 | Pending | UI |

## J. Reliability, security, testing, UX, deployment (20)

| # | Item | Pts | Status | Verification |
|---|---|---|---|---|
| J1 | Models tracked, typed, matching services; backend `tsc --noEmit` clean | 3 | **Done** | `tsc --noEmit`: 0 errors |
| J2 | Recalculations serialized per user | 1 | **Done** | service test (duplicate checks) |
| J3 | Docker Compose starts a working stack | 3 | Pending | `docker compose up` |
| J4 | Correct error codes and input validation | 2 | Pending | API |
| J5 | All test suites isolated, run once, pass | 3 | Pending | `pnpm --filter backend test`, pytest |
| J6 | Frontend type-check is real and build passes | 3 | Pending | `tsc -p tsconfig.app.json`, `vite build` |
| J7 | Lint clean | 1 | Pending | `pnpm lint` (10 pre-existing backend errors) |
| J8 | UX polish, accessibility, loading and error states | 2 | Pending | UI |
| J9 | README and docs match the implementation | 1 | Pending | review |
| J10 | Full demo journey run-through | 1 | Pending | UI |

## Known limitations carried forward

- Local databases created before the model repair may hold documents in the old shapes
  (for example saved jobs stored with a string user id). They are left untouched and are
  not migrated; affected records simply do not appear until re-created.
- The heuristic interview scorer is lenient (a one-sentence answer scored 90 in the test). G3 addresses this.
