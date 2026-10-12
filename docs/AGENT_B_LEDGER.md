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
