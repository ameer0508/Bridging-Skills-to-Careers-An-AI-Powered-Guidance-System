# Agent B contribution ledger (branch `work/skillbridge-parallel-features`)

This ledger is kept apart from the integrated expansion score in [`NEXTGEN_CHECKLIST.md`](NEXTGEN_CHECKLIST.md). The checklist copy on this branch is **not reconciled** and is not edited here; Agent A's verified score (34/100 at `cdce436`) is authoritative until integration. Each line below records what was built and tested on this branch, and whether it is eligible for checklist credit at integration.

## Milestone M1: market intelligence and application history (2026-10-12)

**Head:** `aaf194a` (pushed). Base of this milestone: `89c1e7b`.

### Features

| ID | State | Data it rests on | Eligible for credit at integration? |
|---|---|---|---|
| C1 dated posting history | Implemented, tested (U H B D) | Synthetic fixture only; real history *unavailable* (no licensed source) | **No.** Pending a licensed source; synthetic tests do not make it real market analytics. |
| C4 skill trend mining | Implemented, tested (U H B) | Synthetic only; real *unavailable* | **No.** Same real-data dependency. |
| C3 salary insights | Implemented, tested (U H B D) | Synthetic only; real answers **DATA UNAVAILABLE** | **No.** Same real-data dependency. The capability is complete. |
| C2 guarded forecasting | Implemented, tested (U H B D) with a held-out synthetic evaluation | Synthetic only; real answers **FORECAST UNAVAILABLE** | **No.** Same real-data dependency. |
| C5 / R4 market signals | Contract v1 implemented, tested (U H), counterfactual tests | Neutral without valid sourced evidence | **No.** Pending integration with Agent A's R3 ranking and a licensed source. |
| C6 application outcomes | Implemented, tested (U H B) | **Genuine user-recorded data** | **Yes**, candidate. |
| X8 application history | Implemented, tested (U H B) | **Genuine user-recorded data** | **Yes**, candidate. |
| Zero-cost policy and runtime enforcement | Implemented, tested | n/a | Supports X12 and V2; counted where the plan assigns it. |

### Screens

| Route | Screen | Sidebar label |
|---|---|---|
| `/market` | Market Evidence, with history, skill trends and the C2 postings forecast | Market Evidence |
| `/market/salaries` | Salary Insights | Salary Insights |
| `/applications` | Application history | Applications |
| `/application-outcomes` | C6 outcome analytics | Application Outcomes |

### APIs (all require sign-in)

- `GET /market/salaries`
- `GET /market/forecast`
- `GET /market/careers/:id/signals`
- `GET /applications`
- `POST /applications/manual`
- `GET /applications/:id/history`
- `POST`, `PATCH` and `DELETE /applications/:id/events[/:eventId]`
- `PUT /applications/:id/reminder`

The earlier endpoints (`/market/history`, `/market/skill-trends`, `/market/careers/:id/summary`, `/market/imports`, `/applications/outcomes`) are unchanged.

### Database changes (additive and optional; no migration rewrites records)

`SavedOpportunity.statusHistory[]` entries gain:
- `_id`; older entries receive one on first read, written once with an exact-match guard;
- `recordedAt`;
- `dateSource`;
- `editedAt`.

There are no new collections. `MarketPosting` and `MarketImportBatch` are unchanged. The synthetic fixture's salary amounts now vary deterministically, while posting volume, dates and skills are unchanged.

### Tests executed at this milestone

The full checkpoint ran after the last code change, on `aaf194a`:

| Suite | Result |
|---|---|
| Backend `runAllTests.ts` (all suites) | **31/31 suites passed** |
| AI `pytest` (full) | **154 passed**, 0 failed |
| Typecheck, frontend and backend | Pass (0 errors) |
| Lint, frontend and backend (`--max-warnings 0`) | Pass |
| Production build, frontend and backend | Pass. Vite printed a chunk-size warning. |
| Browser `smoke.mjs` (original regression) | **35/35** |
| Browser `market.mjs` (C1, C4, C2) | **15/15** |
| Browser `salaries.mjs` (C3) | **14/14** |
| Browser `applications.mjs` (X8) | **15/15** |
| Browser `outcomes.mjs` (C6) | **10/10** |

Focused runs during development:

| Area | Run |
|---|---|
| C3 | `market_salaries` (7 groups) |
| X8 | `application_history` (8 groups) |
| C2 | `market_forecast` (7 groups, including the held-out table) |
| C5 | `market_signals` (4 groups) |
| Re-runs after shared changes | `market_intelligence`, `market_skill_trends`, `market_opportunity_summary`, `application_outcomes`, `opportunity_tracking`, `opportunities` and `input_validation` |
| Checkpoint | `cost_policy`, `zero_cost_runtime`, and AI `test_runtime_cost_enforcement` + `test_zero_cost_policy` (50 passed) |

### Blockers

- **Data source.** No free, licensed job-posting source is registered (see `ZERO_COST_API_POLICY.md`). C1, C2, C3, C4 and C5 therefore stay *unavailable* on real data.
- **Unverified providers.** JSearch and Gemini remain unverified, and no live call was made.
- **Hard-coded panels.** `MarketTrendsPanel` and `SalaryIntelligencePanel` in Agent A's Career Intelligence workspace still show invented figures. The replacement plan is in `MARKET_INTELLIGENCE.md` §7a; this branch does not edit them.
- **Security.** No security blocker is open. Every new endpoint is user-scoped and tested for 401, 400 and 404 isolation.

### Shared files and expected integration conflicts

Shared files this branch changed since the merge base `4107269`:
- `backend/src/app.ts`
- `backend/src/tests/runAllTests.ts`
- `frontend/src/routes/index.tsx`
- `frontend/src/layouts/Sidebar/Sidebar.tsx`

Agent A changed the same four files (`1af34e3`), and every change on both sides is an addition. Expect textual conflicts at the same anchors; each resolves by keeping both sides.

`SavedOpportunity.ts` and `OpportunityService.ts` (the X8 additions) are changed only here.

### Next

The D-series in this order: D5, D4, D3, D6, D2, D1.

## Milestone M2: advanced interviews, D1–D6 (2026-10-12)

**Head before this ledger entry:** `3276d25`, plus a test-typing fix committed with this entry. Base of this milestone: `31595a7`.

### Features

| ID | State | Data | Eligible for credit at integration? |
|---|---|---|---|
| D5 role-specific rubrics | Implemented, tested (U H B) | User answers | **Yes**, candidate |
| D4 technical assessments, no code execution | Implemented, tested (U H B D) | Curated bank, user answers | **Yes**, candidate |
| D3 adaptive follow-ups | Implemented, tested (U H B) | User answers | **Yes**, candidate |
| D6 historical comparison | Implemented, tested (U H B) | User sessions | **Yes**, candidate |
| D2 speech-to-text with fallback | Implemented, tested (U H B D) with a stand-in recogniser | Browser speech; SkillBridge receives text only | Candidate, **after a manual check** in Chrome or Edge with a real microphone |
| D1 voice interviews | Implemented, tested (U H B D) with a stand-in microphone | Recordings on this server only | Candidate, **after a manual check** of real capture; schedule the purge script |

### Screens

| Route | What changed |
|---|---|
| `/interview-agent` | Rubric picker, follow-up opt-in, dictation, recording, read-aloud, progress panel in history, and a debrief with the rubric and follow-up summary |
| `/interview-agent/assessments` | The technical assessment page |

### APIs (sign-in required; other users' records answer 404)

- `GET /interviews/rubrics?role=`
- `GET`, `POST /interviews/assessments` and the `catalog`, `:id`, `answers` and `finish` endpoints under it
- `GET /interviews/progress`
- `GET` and `PUT /interviews/voice-settings`
- `POST` and `GET /interviews/:id/recordings`, plus `GET .../:questionId/audio` and `DELETE` (one or all)
- `POST /interviews` gains `rubricId` and `adaptiveFollowUps`
- `POST /interviews/:id/respond` gains `inputMethod`

### Database changes (additive and optional)

| Collection | Change |
|---|---|
| `InterviewSession` | Gains `rubricId`, `rubricVersion`, `adaptiveFollowUps` and `followUpSummary` |
| Session questions | Gain `followUpOf`, `followUpReason` and `answerInputMethod`; `source` adds `follow_up` |
| Evaluations | Gain `rubricId` and `rubricVersion` |
| `TechnicalAssessment` | New collection |
| `VoiceSettings` | New collection, with consent audit history |
| `VoiceRecording` | New collection; files under `<UPLOAD_DIR>/../voice-recordings` |

Older sessions keep the General rubric, so historical scores are unchanged.

### Tests executed at this milestone

All ran after the last code change:

| Suite | Result |
|---|---|
| Backend `runAllTests.ts` | **35/35 suites passed** (adds `interview_rubrics`, `technical_assessments`, `interview_followups`, `interview_progress` and `voice_interviews`) |
| AI `pytest` (full) | **154 passed** |
| Typecheck, frontend and backend | Pass, after fixing a `Blob` typing error in `voice_interviews.test.ts` that the full typecheck caught |
| Lint, frontend and backend | Pass |
| Production build | Pass |
| Browser `smoke.mjs` | **35/35** |
| Browser `market.mjs` | **15/15** |
| Browser `salaries.mjs` | **14/14** |
| Browser `applications.mjs` | **15/15** |
| Browser `outcomes.mjs` | **10/10** |
| Browser `interviews.mjs` (D1–D6) | **21/21** |

### Blockers and manual checks

- Real speech recognition (D2) and real microphone capture and codecs (D1) are not automatable here. They need one manual pass in Chrome or Edge.
- `scripts/purgeVoiceRecordings.ts` should be scheduled daily in deployment. Expired recordings are also purged whenever recordings are used.
- Docker deployments need the voice-recordings directory on a persistent, private volume.
- No paid or external service is used by any D feature. AI scoring stays behind the zero-cost policy.

### Shared files and integration

- **Shared files.** This milestone touched `runAllTests.ts` (5 suites registered) and `frontend/src/routes/index.tsx` (`/interview-agent/assessments`). Both are additions.
- **Agent A overlap.** At `1fc3fad`, Agent A has not changed any interview file, so no conflicts are expected there.
- **Consent.** Agent A's `User.learningPreferences` has no voice consent fields, so `VoiceSettings` duplicates nothing. If a single preferences screen is wanted, it can read `GET /interviews/voice-settings`.
- **D4 and skill evidence.** D4 results are practice only. Feeding them into Agent A's B3 skill evidence is an integration decision.

### Next

1. The manual voice check.
2. Coordinated integration with Agent A, resolving the keep-both conflicts in the four shared files.
3. Removing the hard-coded market panels (`MARKET_INTELLIGENCE.md` §7a).
4. Phase-5 wider-career work (E1–E5) if assigned.

## Milestone M3: wider careers, exams, multilingual and AI quality (2026-10-13)

**Head before this ledger entry:** `91b73e5`. Base of this milestone: `7ac386f`. The D1–D6 integration, voice-retention hardening, X7, removal of the market mock data and the final integration security checks were reassigned to Agent A and are not part of this milestone.

### Features

| ID | State | Data | Eligible for credit at integration? |
|---|---|---|---|
| E2 GATE CS 2026 pilot | Implemented, tested (U H B) | Official IIT Guwahati syllabus and pattern; 47 original questions, not official papers | **Yes**, candidate |
| E3 SSC CGL 2026 Tier-I pilot | Implemented, tested (U H B) | Official SSC notice §13.8 and §13.10; 33 original questions | **Yes**, candidate |
| E4 exam progress and study plans | Implemented, tested (U H B) | User attempts; kept separate from career skills | **Yes**, candidate |
| E1 six roles in four new domains | Preview only, tested (U H B) | O*NET 31.0, CC BY 4.0 | **Not yet.** It must first work across recommendations, readiness and roadmaps, which needs Agent A's lexicon and taxonomy patch (`docs/E1_CAREER_DOMAINS.md`) |
| E5/X1 multilingual resumes (en, hi, es) | Implemented, tested (U H B), accuracy measured | Labelled synthetic set, 6 resumes × 3 layouts | Candidate, **with the stated limitation**: Hindi PDFs are degraded and always flagged; no OCR |
| X9 interview scoring quality | Implemented, tested (U H B) | User answers | **Yes**, candidate |
| X11 AI observability | Implemented, tested (U H B) | Codes and timings only; 14-day retention | **Yes**, candidate |

### Screens

`/exams`, `/exams/:examId`, `/career-domains`, `/resume-language`, `/ai-observability` (administrators only). The interview room and review now show evaluation details.

### APIs

- `/api/v1/exams`
- `/api/v1/career-domains`
- `/api/v1/languages`
- `/api/v1/ai-observability`, administrators only, with the role read from the database
- AI service: `/api/v1/multilingual/*` and `/api/v1/observability/*`, both internal

### Database changes (additive)

New collections: `ExamAttempt`, `ExamStudyPlan`, `ResumeLanguageAnalysis` and `LanguageSettings`. Interview evaluations gain method version, factors, uncertainty and limitations. Sessions gain `notScoredCount`.

### Tests executed at this milestone

All ran after the last code change (`91b73e5`):

| Suite | Result |
|---|---|
| Backend `runAllTests.ts` | **40/40 suites passed** (adds `exam_prep`, `career_domains`, `multilingual`, `interview_quality` and `ai_observability`) |
| AI `pytest` (full) | **169 passed** (adds `test_multilingual.py` with 8 tests and `test_observability.py` with 7) |
| Typecheck, frontend and backend | Pass |
| Lint, frontend and backend | Pass, after fixing two errors from this milestone's earlier commits (`23acdae`) |
| Production build | Pass |
| Browser: smoke | 35/35 |
| Browser: market | 15/15 |
| Browser: salaries | 14/14 |
| Browser: applications | 15/15 |
| Browser: outcomes | 10/10 |
| Browser: interviews | 23/23 |
| Browser: exams | 12/12 |
| Browser: careerDomains | 7/7 |
| Browser: languages | 10/10 |
| Browser: aiObservability | 6/6 |

### Blockers and limitations

- **OCR:** none. Tesseract (Apache-2.0) would need the user's approval to install. Scanned pages are detected and reported, not read.
- **Hindi PDFs:** PyMuPDF and pdfplumber garble shaped Devanagari. Section accuracy is 0.47 and experience and education recall are 0.00. Such files are always flagged; DOCX and text input are accurate.
- **Exams:** no official papers, cutoffs, ranks or pass rates are used. Practice scores are not qualifications.
- **X11:** the log is per process; set `AI_AUDIT_DIR` for a durable record.
- **Voice (D1/D2):** the manual microphone check is still outstanding.

### Shared files and integration

- **Shared files:** `chore(integration)` commits `6c8c2f7`, `2b2b307`, `1e59658`, `87c99e5` and `91b73e5` touch `app.ts`, `runAllTests.ts`, `routes/index.tsx`, `Sidebar.tsx` and `ai/app/main.py`. All are additions, so the expected conflicts are keep-both.
- **`ai_gateway.py`:** X11 adds audit calls and `metadata.observability`. Routing and policy are unchanged. If Agent A has edited the gateway, merge by hand.
- **Lexicon and taxonomy:** E1 does not change Agent A's lexicon, taxonomy or scoring. The patch is documented for Agent A to apply.
- **Reported to Agent A:** `middlewares/upload.ts` probably decodes UTF-8 file names as Latin-1. The language upload has its own fix; the shared file was not changed.

## Single-agent milestones U1–U5 (2026-10-13)

From 2026-10-13 this session is the only developer, working on `work/skillbridge-unified` and fast-forwarding `work/skillbridge-opus55-nextgen-expansion`. The checklist (`docs/NEXTGEN_CHECKLIST.md`) is the authority; this entry only records the path.

| Milestone | Expansion head | Checklist | Content |
|---|---|---|---|
| U1 | `af0464a` | 54 | Merged the M3 snapshot `34b98f5` into the expansion branch at `5b58863`; conflicts kept both sides |
| U2 | `d7a4655` | 66 | E1–E5, X9 and X11 accepted after fixes: contradiction cap, durable audit scope, E1 integration, Devanagari glyph recovery, upload file names |
| U3 | `1db5f6e` | 66 | V2 sweep and fixes; V3 axe scan and fixes; X12 account deletion and log retention; landing-page claims; portfolio duplicate credit by repository |
| U4 | (docs) | 66 | No free, compliant Indian market source; options in `MARKET_DATA_SOURCES.md` |
| U5 | `d4264f6` + checklist | **77** | Final verification: 56 backend suites, 179 AI tests, 12 browser suites, Docker run 38377392127; V1–V5 and X12 awarded |
| U6 | `b033d61` + docs | **78** | Local Tesseract OCR approved by the owner: X1 awarded. 56 backend suites, 189 AI tests, 12 browser suites, Docker run 38382438611 |

**Open:**
- Market items (17 points): need a licensed source.
- D1 and D2 (5 points): need the owner's manual microphone test.
