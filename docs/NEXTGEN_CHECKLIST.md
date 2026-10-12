# Next-generation expansion checklist

Separate from the original A-J checklist ([`FINALIZATION_CHECKLIST.md`](FINALIZATION_CHECKLIST.md)),
which remains at **100 / 100**.

Scope and point budget come from [`NEXTGEN_EXPANSION_PLAN.md`](NEXTGEN_EXPANSION_PLAN.md); the design
is in [`NEXTGEN_IMPLEMENTATION_MATRIX.md`](NEXTGEN_IMPLEMENTATION_MATRIX.md).

An item is **Done** only when it has a working screen, an authenticated API, stored data where
needed, validation and error states, documented limits, and passing service, HTTP and browser
tests. Code that exists but is not verified earns nothing.

Expansion total: 100 points. **Current: 43 / 100.**

## Phase 1. Advanced career intelligence (15)

| ID | Item | Points | Status | Evidence |
|---|---|---|---|---|
| A1 | Compare careers by requirements, evidence, effort and opportunities | 3 | Pending | Wired, not awarded. The comparison now reads the market module's `MarketOpportunitySummary` server-side and shows a posting count only for valid, fresh, sourced evidence, with source, licence, location, period and freshness; no source, sparse, stale, synthetic and failed are each shown as "Market data unavailable" with the reason and no number (suite `career_market`, browser check). **No licensed market source is registered, so every real comparison shows "unavailable"**; the count path is exercised only with a test source. Pending until legitimate dated records exist |
| A2 | What-if changes from skills, projects and certifications | 3 | **Done** | HTTP suite `career_lab`; browser suite `pnpm test:e2e` (40/40): scores before and after hypothetical skills, projects, certifications or roles with requirement-level changes; nothing is saved; unknown skills rejected. After the evidence was really added, 6 career scores equalled the hypothetical ones exactly |
| A3 | Skill freshness and revalidation | 3 | **Done** | HTTP suite `career_lab`; browser suite `pnpm test:e2e` (41/41): freshness from dated evidence only (role periods), "undated" when the resume gives no date; a user's confirmation is labelled unverified, adds no points and survives reprocessing. A passed skill check (B3) also dates the skill and is labelled as assessed |
| A4 | Multi-stage career transition plans | 3 | **Done** | HTTP suite `career_lab`; browser suite `pnpm test:e2e` (40/40): staged plan through nearer careers, saved per user, re-evaluated on read, projected scores agree with what-if, survives a reload, private to its owner |
| A5 | Counterfactual explanations of a match | 3 | **Done** | HTTP suite `career_lab`; browser suite `pnpm test:e2e` (40/40): ranked single changes and a monotonic path to a target score, consistent with what-if; unreachable targets reported as not reached |

## Phase 2. Adaptive learning and skill verification (15)

| ID | Item | Points | Status | Evidence |
|---|---|---|---|---|
| B1 | Learning-platform and course integration | 2 | **Done** | Suite `learning_resources` (catalogue and HTTP); browser suite `pnpm test:e2e` (46/46): 39 curated https links to official documentation, without tracking or affiliate parameters, shown for the user's real gaps in gap order; gaps with no resource are named; each link labelled third-party and not re-checked, opened in a new tab with `noopener`; no ratings, durations or prices; saved and worked-through marks are private and change no score, recalculation or streak. This is a link-out catalogue, not an integration with any learning platform's API: no external request is made. Covers 39 of 52 requirement skills. Rules in `docs/SCORING.md` section 17 |
| B2 | Personalised project suggestions | 2 | **Done** | Suite `learning_projects` (catalogue and HTTP); browser suite `pnpm test:e2e` (43/43): 15 curated briefs covering all 14 careers; a brief is suggested only for requirements the user has not shown in use; ranked by the same what-if score change the Career Lab returns (asserted equal); reason, tasks, deliverables, assumed effort and weeks at the user's hours. Taking on, working on and completing a project changes no skill, score or recalculation (asserted). Irrelevant briefs cannot be taken on; private per user. Rules in `docs/SCORING.md` section 14 |
| B3 | Practical quizzes and skill verification | 4 | **Done** | HTTP suite `skill_assessment`; browser suite `pnpm test:e2e` (41/41): versioned bank for **8 skills only** (JavaScript, TypeScript, React, Node.js, Python, SQL, Git, Docker; 56 questions), server-side scoring with answers never sent before submission, shuffled options, per-skill pass criteria (4 of 5), 15-minute limit, 3 attempts per skill per day, single submission, owner-only. A fail changes no score; a pass adds `assessed` evidence worth 15 points once per skill and triggers one recalculation; a repeat pass adds nothing. Survives reprocessing and deleting the resume. Limits in `docs/SCORING.md` section 12: unsupervised, memorisable, not a certification |
| B4 | Availability- and progress-aware roadmaps | 3 | **Done** | Suite `learning_plan` (unit and HTTP); browser suite `pnpm test:e2e` (42/42): weekly hours set by the user (1-60, none assumed), effort per item as a range labelled `catalogue` or `assumption`, weeks and finish dates as ranges, prerequisites block dependants, completing an item shortens the plan. Regeneration keeps item ids, completion dates and anything started; an untouched item whose gap is now evidenced is removed and the history says why. Same figures on the dashboard. Assumptions in `docs/SCORING.md` section 13: effort ranges are not measured |
| B5 | Evidence-backed portfolios | 2 | **Done** | Suite `portfolio`; browser suite `pnpm test:e2e` (44/44): entries with owner, completion date, skills, optional https link and visibility; with a link an entry counts as a further project on the resume's own scale (equal to the what-if prediction), without one it earns nothing; always `self_reported`, stored separately from skill-check evidence; an unfinished practice project cannot be added; evidence rebuilt idempotently and kept through reprocessing and deleting the resume; public link off by default, shared entries only, no ids or contact details, new token each time. The same project on the resume and in the portfolio, or in two entries, is credited once per skill without deleting any record (suite `portfolio_dedup`). No file uploads (links only). Rules in `docs/SCORING.md` section 15 |
| B6 | Streaks, opt-in reminders and milestone notifications | 2 | **Done** | Suite `learning_activity` (unit and HTTP); browser suite `pnpm test:e2e` (45/45): streak from recorded events only (UTC days, alive until the end of the next day, longest run, 30-day count); milestone and reminder notifications both off by default, in-app only, one per occasion, never recreated after dismissal, nothing announced retroactively; reminders worked out on read after 7 idle days or 14 days in progress; opting out stops new ones; private per user. The top-bar bell now shows the real unread count instead of a permanent dot. No e-mail, SMS or push. Rules in `docs/SCORING.md` section 16 |

## Phase 3. Historical market and opportunity intelligence (15)

| ID | Item | Points | Status | Evidence |
|---|---|---|---|---|
| C1 | Sourced, dated job-demand records and history | 3 | Pending | Not awarded. Storage, import with licence checks, de-duplication and history are built and tested by the market agent (suite `market_intelligence`, browser `market.mjs` 13/13), but no licensed source is registered: only a labelled synthetic fixture can be imported, so there are no sourced, dated records |
| C2 | Demand forecasting only with sufficient dated data | 2 | Pending | Not started |
| C3 | Salary insights by geography, currency, period and source | 3 | Pending | Not awarded. Built and tested by the market agent on synthetic and test-source data (suite `market_salaries`, browser `salaries.mjs` 14/14); with no licensed source every real query is unavailable |
| C4 | Job-description trend mining | 2 | Pending | Not awarded. Built and tested by the market agent on synthetic and test-source data (suite `market_skill_trends`); with no licensed source there is nothing real to mine |
| C5 | Market-aware recommendations | 2 | Pending | Not awarded. The producer contract exists and is consumed (A1, R3 factor at weight 0); recommendations are deliberately not market-aware without sourced data |
| C6 | Application outcome analytics with denominators and sample sizes | 3 | **Done** | Built by the market agent; verified in the integrated tree: suite `application_outcomes`, browser suite `e2e/tests/outcomes.mjs` (10/10). Rates from the user's own tracked applications with numerator, denominator and a minimum sample of 5; saved is not applied; demo listings excluded unless asked for; private per user. Rules in `docs/APPLICATION_OUTCOMES.md` |

## Phase 4. Advanced interview and coding assessment (15)

| ID | Item | Points | Status | Evidence |
|---|---|---|---|---|
| D1 | Voice interviews with consent and retention controls | 3 | Pending |  |
| D2 | Speech-to-text with unsupported-browser fallback | 2 | Pending |  |
| D3 | Answer-adaptive follow-up questions | 3 | Pending |  |
| D4 | Coding and technical assessments without server-side code execution | 3 | Pending |  |
| D5 | Role-specific rubrics | 2 | Pending |  |
| D6 | Historical performance comparison | 2 | Pending |  |

## Phase 5. Wider careers, exams and multilingual support (10)

| ID | Item | Points | Status | Evidence |
|---|---|---|---|---|
| E1 | Additional career domains | 2 | Pending |  |
| E2 | Syllabus-versioned competitive exam pilot | 2 | Pending |  |
| E3 | Government or aptitude exam pilot | 2 | Pending |  |
| E4 | Domain-specific assessments and roadmaps | 2 | Pending |  |
| E5 | Multilingual guidance and extraction with declared languages and measured accuracy | 2 | Pending |  |

## Phase 6. Enhancements to existing modules (12)

One point each. An enhancement is counted here once, even when a feature above delivers it.

| ID | Item | Points | Status | Evidence |
|---|---|---|---|---|
| X1 | Multi-layout and multilingual resume extraction | 1 | Pending |  |
| X2 | Validated proficiency and dated skill evidence | 1 | **Done** | Delivered by F1 and B3: every evidence record carries its points, date and one of three verification states (`stated`, `self_attested` at 0 points, `assessed`); proficiency is derived from the evidence score. Suites `career_lab` and `skill_assessment` |
| X3 | Career explanation | 1 | **Done** | Delivered by A5 and the existing breakdown: baseline evidence per requirement, what would change it, and by how much |
| X4 | Evidence-grounded readiness calibration | 1 | **Done** | Suite `readiness_basis` (unit and HTTP); browser suite `pnpm test:e2e` (48/48): every readiness record states what share of its credited evidence is verified by skill check, self-reported in the portfolio, stated in the resume or inferred (whole percentages adding up to 100, none when nothing is credited), recomputed with the score; shown on the readiness page with the statement that readiness is not calibrated against outcomes. This grounds the score in its evidence; it is not a statistical calibration, which would need outcome data that does not exist. `docs/SCORING.md` section 19 |
| X5 | Measurable, personalised recommendations | 1 | **Done** | Delivered by R3: each recommended action carries a measured hypothetical score change equal to the what-if result, and a passed skill check gives exactly the predicted score (suite `next_best_action`) |
| X6 | Time- and progress-aware roadmaps | 1 | **Done** | Delivered by B4: the roadmap is laid out in weeks from the user's own hours, moves with progress and is adjusted when evidence changes. Suite `learning_plan` |
| X7 | Job freshness, deduplication and rate limits | 1 | Pending |  |
| X8 | Application histories, reminders and outcomes | 1 | **Done** | Application history, notes and reminders (smoke journey) and outcome analytics (C6), both verified in the integrated tree |
| X9 | Interview scoring quality | 1 | Pending |  |
| X10 | Cross-module Command Center state | 1 | **Done** | Browser suite (47/47): the Command Center shows the study plan (roadmap and weekly hours), ranked next steps drawn from skill checks, practice projects and the portfolio, the learning streak, and the top bar shows real unread notifications. Each is asserted equal to the stored data |
| X11 | AI observability, fallback and confidence calibration | 1 | Pending |  |
| X12 | Security, privacy, retention and hardening | 1 | Pending | Partly done: zero-cost runtime guards from the market agent are integrated and pass (backend suites `cost_policy`, `zero_cost_runtime`; AI `test_runtime_cost_enforcement` 19, `test_zero_cost_policy` 31, `test_provider_integrity` 11), with paid-provider keys present and a network tripwire. Final security review belongs to phase 8 |

## Phase 7. Research contributions and evaluation (8)

| ID | Item | Points | Status | Evidence |
|---|---|---|---|---|
| R1 | Continuously adaptive career intelligence | 2 | **Done** | `docs/NEXTGEN_RESEARCH.md` R1; suite `career_lab`: one run per event, only affected modules recomputed (match record ids unchanged on a role change), duplicates and a burst of ten collapse to one, audit record with before/after figures and versions; shown in the Career Lab Activity tab |
| R2 | Explainable and counterfactual career matching | 2 | **Done** | `docs/NEXTGEN_RESEARCH.md` R2; suite `career_lab`: hypothetical evidence equals real evidence in 100 of 100 grid cases; end-to-end scores equal after really adding the evidence; path and plan consistent with what-if; isolation checked |
| R3 | Adaptive next-best-action recommendations | 2 | **Done** | `docs/NEXTGEN_RESEARCH.md` R3; suite `next_best_action`; browser check on the dashboard (47/47): deterministic ranking of evidence-producing actions over published factors and chosen weights, market factor neutral; compared with a gap-importance baseline on 42 synthetic profiles (mean gain after three actions 32.1 vs 30.43 points; better in 16, equal in 25, worse in 1). Limits stated, including that the comparison is partly circular and nothing was tried with real users |
| R4 | Market-aware career adaptation | 2 | Pending | Not awarded. Behaviour on missing, sparse, stale and synthetic data is tested; adaptation to real market data cannot be shown without sourced records |

## Phase 8. Regression, security, UX, CI and release verification (10)

| ID | Item | Points | Status | Evidence |
|---|---|---|---|---|
| V1 | Original regression baseline still passes (19 backend suites, 104 AI tests, 35 browser checks) | 2 | Pending | Passing on the integrated tree: 37 backend suites (19 original + 11 of this branch + 7 of the market agent), 154 AI tests (104 original + 50), browser 48 + 13 + 10 + 14. Awarded at the end of the expansion |
| V2 | Cross-user isolation and input validation for every new endpoint | 2 | Pending |  |
| V3 | Accessibility and failure states for every new screen | 2 | Pending |  |
| V4 | Docker Compose workflow passes with the expansion | 2 | Pending |  |
| V5 | Documentation, limits and research write-up | 2 | Pending |  |

## Not verified live

- Google Gemini: no generation request has been made.
- JSearch: never called. With a key present it is blocked by the zero-cost policy and labelled demo listings are served.
- Job-market sources: none is registered. All market, salary and trend figures shown to users are "unavailable"; the analytics are tested on synthetic and test-source data only.
