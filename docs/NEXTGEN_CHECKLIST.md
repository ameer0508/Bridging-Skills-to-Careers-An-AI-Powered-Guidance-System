# Next-generation expansion checklist

Separate from the original A-J checklist ([`FINALIZATION_CHECKLIST.md`](FINALIZATION_CHECKLIST.md)),
which remains at **100 / 100**.

Scope and point budget come from [`NEXTGEN_EXPANSION_PLAN.md`](NEXTGEN_EXPANSION_PLAN.md); the design
is in [`NEXTGEN_IMPLEMENTATION_MATRIX.md`](NEXTGEN_IMPLEMENTATION_MATRIX.md).

An item is **Done** only when it has a working screen, an authenticated API, stored data where
needed, validation and error states, documented limits, and passing service, HTTP and browser
tests. Code that exists but is not verified earns nothing.

Expansion total: 100 points. **Current: 17 / 100.**

## Phase 1. Advanced career intelligence (15)

| ID | Item | Points | Status | Evidence |
|---|---|---|---|---|
| A1 | Compare careers by requirements, evidence, effort and opportunities | 3 | Pending | Partly done: comparison by requirements, evidence and effort works and is tested (HTTP and browser). The opportunities dimension is not shown because there are no dated market records yet (C1); no points until it is |
| A2 | What-if changes from skills, projects and certifications | 3 | **Done** | HTTP suite `career_lab`; browser suite `pnpm test:e2e` (40/40): scores before and after hypothetical skills, projects, certifications or roles with requirement-level changes; nothing is saved; unknown skills rejected. After the evidence was really added, 6 career scores equalled the hypothetical ones exactly |
| A3 | Skill freshness and revalidation | 3 | **Done** | HTTP suite `career_lab`; browser suite `pnpm test:e2e` (40/40): freshness from dated evidence only (role periods), "undated" when the resume gives no date; a user's confirmation is labelled unverified, adds no points and survives reprocessing. Assessment-based revalidation arrives with B3 |
| A4 | Multi-stage career transition plans | 3 | **Done** | HTTP suite `career_lab`; browser suite `pnpm test:e2e` (40/40): staged plan through nearer careers, saved per user, re-evaluated on read, projected scores agree with what-if, survives a reload, private to its owner |
| A5 | Counterfactual explanations of a match | 3 | **Done** | HTTP suite `career_lab`; browser suite `pnpm test:e2e` (40/40): ranked single changes and a monotonic path to a target score, consistent with what-if; unreachable targets reported as not reached |

## Phase 2. Adaptive learning and skill verification (15)

| ID | Item | Points | Status | Evidence |
|---|---|---|---|---|
| B1 | Learning-platform and course integration | 2 | Pending |  |
| B2 | Personalised project suggestions | 2 | Pending |  |
| B3 | Practical quizzes and skill verification | 4 | Pending |  |
| B4 | Availability- and progress-aware roadmaps | 3 | Pending |  |
| B5 | Evidence-backed portfolios | 2 | Pending |  |
| B6 | Streaks, opt-in reminders and milestone notifications | 2 | Pending |  |

## Phase 3. Historical market and opportunity intelligence (15)

| ID | Item | Points | Status | Evidence |
|---|---|---|---|---|
| C1 | Sourced, dated job-demand records and history | 3 | Pending |  |
| C2 | Demand forecasting only with sufficient dated data | 2 | Pending |  |
| C3 | Salary insights by geography, currency, period and source | 3 | Pending |  |
| C4 | Job-description trend mining | 2 | Pending |  |
| C5 | Market-aware recommendations | 2 | Pending |  |
| C6 | Application outcome analytics with denominators and sample sizes | 3 | Pending |  |

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
| X2 | Validated proficiency and dated skill evidence | 1 | Pending | Partly done: evidence carries points, date and verification state. Validated proficiency needs assessments (B3) |
| X3 | Career explanation | 1 | **Done** | Delivered by A5 and the existing breakdown: baseline evidence per requirement, what would change it, and by how much |
| X4 | Evidence-grounded readiness calibration | 1 | Pending |  |
| X5 | Measurable, personalised recommendations | 1 | Pending |  |
| X6 | Time- and progress-aware roadmaps | 1 | Pending |  |
| X7 | Job freshness, deduplication and rate limits | 1 | Pending |  |
| X8 | Application histories, reminders and outcomes | 1 | Pending |  |
| X9 | Interview scoring quality | 1 | Pending |  |
| X10 | Cross-module Command Center state | 1 | Pending |  |
| X11 | AI observability, fallback and confidence calibration | 1 | Pending |  |
| X12 | Security, privacy, retention and hardening | 1 | Pending |  |

## Phase 7. Research contributions and evaluation (8)

| ID | Item | Points | Status | Evidence |
|---|---|---|---|---|
| R1 | Continuously adaptive career intelligence | 2 | **Done** | `docs/NEXTGEN_RESEARCH.md` R1; suite `career_lab`: one run per event, only affected modules recomputed (match record ids unchanged on a role change), duplicates and a burst of ten collapse to one, audit record with before/after figures and versions; shown in the Career Lab Activity tab |
| R2 | Explainable and counterfactual career matching | 2 | **Done** | `docs/NEXTGEN_RESEARCH.md` R2; suite `career_lab`: hypothetical evidence equals real evidence in 100 of 100 grid cases; end-to-end scores equal after really adding the evidence; path and plan consistent with what-if; isolation checked |
| R3 | Adaptive next-best-action recommendations | 2 | Pending |  |
| R4 | Market-aware career adaptation | 2 | Pending |  |

## Phase 8. Regression, security, UX, CI and release verification (10)

| ID | Item | Points | Status | Evidence |
|---|---|---|---|---|
| V1 | Original regression baseline still passes (19 backend suites, 104 AI tests, 35 browser checks) | 2 | Pending | Passing at this checkpoint: 20 backend suites (19 original + 1), 104 AI tests, 40 browser checks (35 original + 5). Awarded at the end of the expansion |
| V2 | Cross-user isolation and input validation for every new endpoint | 2 | Pending |  |
| V3 | Accessibility and failure states for every new screen | 2 | Pending |  |
| V4 | Docker Compose workflow passes with the expansion | 2 | Pending |  |
| V5 | Documentation, limits and research write-up | 2 | Pending |  |

## Not verified live

- Google Gemini: no generation request has been made.
- JSearch: never called.
