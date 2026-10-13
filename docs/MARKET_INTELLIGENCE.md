# Market intelligence

**Branch:** `work/skillbridge-parallel-features` (Agent B). **Scope:** C1–C6, R4, X7, X8 from
[`NEXTGEN_EXPANSION_PLAN.md`](NEXTGEN_EXPANSION_PLAN.md). **Cost policy:** [`ZERO_COST_API_POLICY.md`](ZERO_COST_API_POLICY.md).

| ID | Status on this branch |
|---|---|
| **C1** sourced, dated job-demand records and history | **Implemented and tested** (see §5). Real-market history stays *unavailable*: no licensed source is registered yet. |
| **C4** job-description skill trend mining | **Implemented and tested** on synthetic data (see §5a). On real data it stays *unavailable* until a licensed source is registered. |
| C5 summary producer | `MarketOpportunitySummary` v2 producer built and tested (§4). |
| C6 application outcomes | Implemented and tested; see [`APPLICATION_OUTCOMES.md`](APPLICATION_OUTCOMES.md) |
| **C3** salary insights | **Implemented and tested** on synthetic data (see §5b). Real salary insights answer *DATA UNAVAILABLE* until a licensed source is registered. |
| **X8** application history | **Implemented and tested** on real user-recorded data; see [`APPLICATION_OUTCOMES.md`](APPLICATION_OUTCOMES.md#application-history-x8) |
| **C2** cautious forecasting | **Implemented and tested** with a held-out synthetic evaluation (see §5c). Real forecasts are *FORECAST UNAVAILABLE*: no licensed source. |
| **C5 / R4** market signals | **Implemented and tested** as contract v1 (see §4a); neutral without valid sourced evidence. **Integration with Agent A's R3 ranking pending.** |
| X7 | Not started |

## 1. Principles

- **No invented history.** Every figure is a count of distinct postings actually stored from a registered source.
- **Real and synthetic data never mix.** Each posting carries `dataset: 'sourced' | 'synthetic_fixture'`. Every query filters on one dataset. The page labels synthetic data in a dashed banner: *"They describe no real jobs."*
- **Insufficient means said, not hidden.** Below the minimums (30 distinct postings, postings in at least 3 months), the counts are still shown, labelled "Raw monthly counts (too few to read as a trend)", alongside the reasons.
- **Provenance travels with the data.** Each source's licence, attribution and URL is shown next to its counts, together with the latest retrieval date.
- **Store only what is needed.** Title, employer, location, country, remote flag, dates, salary and the skills read from the text are kept. **The description is not stored.**

## 2. Data model

`MarketPosting` (`backend/src/models/MarketPosting.ts`):

| Field | Meaning |
|---|---|
| `dataset`, `sourceId`, `sourceRecordId` | Where the posting came from; the record id is the source's own stable id. |
| `fingerprint` | SHA-256 of the normalised title, employer and location, plus the publication **day**. |
| `postedAt` | Employer's publication date. `null` when the source gave none, in which case the posting is kept but **excluded** from monthly history and reported as "Undated". |
| `firstSeenAt`, `lastSeenAt`, `observationCount` | When and how often SkillBridge saw it. |
| `skills` | Canonical names from the shared lexicon (`backend/src/utils/skillLexicon.ts`), read from the title, the description and the source's own skill list. Unknown names are dropped. |
| `salary` | `{min, max, currency (ISO 4217), period}`, exactly as stated. **Never converted.** |
| `alsoSeenIn` | The same posting found in another source or under another id. |

`MarketImportBatch` keeps an audit row per import: source, dataset, retrieval date, the importing user, the counts (`received`, `inserted`, `reobserved`, `duplicates`, `conflicts`, `rejected`) and up to 200 rejection reasons.

## 3. Ingestion and duplicate control

- **Who can import.** Imports come from `POST /api/v1/market/imports` (admin only) or the operator CLI:
  ```
  cd backend
  npx tsx src/scripts/importMarketPostings.ts --file postings.json --imported-by ops@example.com
  npx tsx src/scripts/importMarketPostings.ts --synthetic-fixture --imported-by ops@example.com
  ```
- **Which sources.** Only sources in `backend/src/config/marketSources.ts` are accepted. Today that is just the synthetic fixture. A real source is added in a reviewed change that cites its licence, its retention terms and the date they were read. Scraped sites are not accepted.
- **Validation.** Each posting is checked on its own, so one bad record does not fail the batch. A posting is rejected for:
  - an unknown field;
  - a title shorter than 2 characters;
  - a `postedAt` before 2000-01-01 or after the retrieval date;
  - an invalid country or currency code;
  - a minimum salary above the maximum.

  The whole batch is refused when the source is unknown, the retrieval date is in the future, there are no postings, or there are more than 2,000 postings.
- **Duplicate control, in order:**
  1. The same `sourceId` and `sourceRecordId` arriving again is a **re-observation**: `lastSeenAt` advances and nothing is added.
  2. The same `sourceRecordId` arriving with a different fingerprint is a **conflict**. The first stored version is kept and the conflict is reported.
  3. The same fingerprint in the same dataset is a **duplicate** (a cross-post). It is merged into `alsoSeenIn`.

  Unique indexes back each rule, and concurrent imports resolve to "duplicate".

## 4. `MarketOpportunitySummary` (contract v2 for Agent A)

- **Producer:** `MarketOpportunityService.summaryForCareer`, served at `GET /api/v1/market/careers/:careerId/summary?dataset&country&from&to` (sign-in required).
- **Types:** `backend/src/services/market/MarketOpportunitySummary.ts`, mirrored for the frontend in `frontend/src/features/market/marketApi.ts` (`fetchMarketOpportunitySummary`).

| `evidenceClass` | Meaning | `usableForRecommendations` | `demand` |
|---|---|---|---|
| `sourced_valid` | Sourced, at least 30 postings in at least 3 months, retrieved within 90 days | **true** | monthly counts |
| `sourced_sparse` | Sourced, but too few, too narrow, stale or not mapped | false | null |
| `no_legitimate_source` | No licensed source is registered | false | null |
| `synthetic_test_data` | Generated fixture, for tests and demonstrations | false | null |

**Matching rule.** A posting belongs to a career when its title contains the career title as whole words, case-insensitively. The rule is stated in `matchingRule`. It is deliberately narrow: "Data Analysts" and "Data Analytics Engineer" do not count for "Data Analyst".

**Counts.** `distinctPostings` counts deduplicated postings. `sourcedObservations` adds re-observations. Neither is ever scaled or estimated. There is **no opportunity score**. Readiness describes the person and these figures describe postings, so consumers keep them separate.

**Backend consumer example** (Career Lab comparison; Career Lab is not edited here):

```ts
const market = await MarketOpportunityService.summaryForCareer({ id, title }, { dataset: 'sourced', country: 'IN', from, to });
row.market = market.usableForRecommendations
  ? { distinctPostings: market.distinctPostings, demand: market.demand, sources: market.sources }
  : { evidenceClass: market.evidenceClass, reasons: market.insufficientDataReasons };  // never a zero as if measured
```

**Frontend consumer example:**

```tsx
const s = await fetchMarketOpportunitySummary(careerId, { country: 'IN' });
{s.usableForRecommendations
  ? <span>{s.distinctPostings} postings · {s.sources.map(x => x.name).join(', ')}</span>
  : <span>Market evidence unavailable ({s.evidenceClass}): {s.insufficientDataReasons.join(', ')}</span>}
```

**Tests:** `backend/src/tests/market_opportunity_summary.test.ts` covers all four classes, staleness, an unmapped career, the matching-rule boundaries, observations vs distinct postings, and HTTP 401/400/404.

## 4a. Market signals (C5) and market-aware adaptation (R4): contract v1 for Agent A

- **Producer:** `MarketSignalService.signalsForCareer`, served at `GET /api/v1/market/careers/:careerId/signals?dataset&country&from&to&skills=a,b` (sign-in required; at most 10 skills; unknown parameters → 400).
- **Types and helpers:** `backend/src/services/market/MarketSignalService.ts`.

**What a response holds:**

| Field | Contents |
|---|---|
| `demand` | Distinct postings; earlier-half vs recent-half counts; direction (`rising`, `falling`, `stable` or `null`); per-source directions |
| `skills` | Per requested skill, share, mentions and C4 change, with `usable` |
| `provenance` | Matching rule, sources, licences and links |
| `dataAsOf` | The latest retrieval the signals rest on |
| `generatedAt` | When the signals were computed |
| `influence` | Whether consumers may use the signals, as below |
| `separation` | States that readiness is a separate input |

**Direction.** A two-period Poisson comparison, z = (recent − earlier) / √(recent + earlier), with |z| ≥ 1.96. It needs at least 15 postings in each half; otherwise the direction is `null`.

**Influence:**
- `{mode: 'evidence', demandDirection, distinctPostings, asOf}` only when the summary is `sourced_valid` **and** no two sources state opposite directions.
- `{mode: 'neutral', reasons}` in every other case. The reasons are: `no_registered_source`, `synthetic_test_data`, `stale_data`, `too_few_postings`, `too_few_months_with_postings`, `career_not_mapped_to_postings` and `conflicting_sources`.

**No score, weight or boost exists.** Signals describe postings, not the applicant. The service does not read readiness, and nothing combines the two.

**How a ranking consumer (R3) may use it.** Only as the final tie-break:

```ts
import { compareWithMarketTieBreak } from '../market/MarketSignalService.js';
items.sort((a, b) => ownOrder(a, b) || compareWithMarketTieBreak(a.marketInfluence, b.marketInfluence));
```

`compareWithMarketTieBreak` returns 0 unless both items carry evidence with a stated direction; then rising comes before stable, which comes before falling. So:
- neutral, missing or undetermined signals never change an order;
- a market signal can never move an item past one the consumer ranked differently.

**Counterfactual tests** (`backend/src/tests/market_signals.test.ts`). The same career is evaluated under each evidence condition:

| Evidence | Influence |
|---|---|
| No source | neutral |
| Sourced and rising | **evidence, rising** |
| The same records read 4 months later | neutral, `stale_data` |
| Sparse | neutral, `too_few_postings` |
| One source rising and one falling | neutral, `conflicting_sources` |
| Flat | evidence, `stable` |
| Postings only in the recent half | evidence, direction `null` |
| The same rising counts, synthetic | neutral, `synthetic_test_data` |

The contract test shows that only an exactly tied pair is reordered, that all-neutral signals leave the baseline order unchanged, and that the consumer's order is never overridden. The test also asserts that the response contains no score, boost or weight.

**Status.** Implemented and tested here. It is **not yet integrated**: Agent A's R3 ranking, `RecommendationEngine` and Career Lab were not edited. C5/R4 stay pending until the merge wires the tie-break in and the combined regression passes.

## 5. C1 evidence

| Layer | What | Where |
|---|---|---|
| API | `GET /market/sources`, `GET /market/history?dataset&skill&country&from&to` (sign-in required; at most 60 months; unknown skills and fields → 400), `POST/GET /market/imports` (admin) | `backend/src/routes/market.ts` |
| Screen | `/market` "Market Evidence": dataset switch, filters, monthly chart with a table alternative, sources and licence, caveats, loading, error and insufficient states | `frontend/src/features/market/` |
| Service and HTTP tests | Fingerprints; lexicon skills; import counts; re-import; conflict; refused sources and dates; history totals, filters and sufficiency; sourced/synthetic separation; licensed source; sign-in; admin-only; 7 invalid queries; contract | `backend/src/tests/market_intelligence.test.ts` |
| Browser test, 11 steps | Sign-in required; sidebar link; honest empty sourced view; CLI import; no leak into sourced view; synthetic banner, counts, source, table; insufficient skill; error state; 390 px fit; no console errors | `e2e/tests/market.mjs` (run with `E2E_TEST_FILE=./tests/market.mjs node run.mjs`) |

## 5a. C4 skill trends

`GET /api/v1/market/skill-trends?dataset&country&from&to&granularity=quarter|month&skills=a,b&limit` (sign-in required).

- **What is counted.** The unit is a distinct stored posting. Duplicates were merged on import and re-observations add nothing. A skill counts once per posting, whichever alias appeared (`postgres` and `PostgreSQL` are one skill).
- **Denominator.** A share's denominator is *every* dated posting in the same period and filters, including postings with no recognised skill. Undated postings are excluded and reported.
- **When a change is described.** The earlier half of the period is compared with the recent half. A change is stated only when *all* of these hold:
  - each half has at least 30 postings;
  - the period has postings in at least 6 months;
  - the skill has at least 10 mentions;
  - a two-proportion z-test reaches |z| ≥ 1.96.

  Otherwise the result is "no clear change", or the counts are shown with the reasons no trend is stated.
- **Datasets.** Synthetic and sourced postings are never combined. The synthetic section is labelled `SYNTHETIC TEST DATA`.
- **Tests.**
  - `backend/src/tests/market_skill_trends.test.ts` covers the statistic, the fixture trend, duplicates and contradicting re-imports, windows, aliases, sparse sourced data, zero mentions and HTTP validation.
  - `e2e/tests/market.mjs` covers 4 C4 steps.

## 5b. C3 salary insights

`GET /api/v1/market/salaries?dataset&country&currency&period&skill&from&to` (sign-in required). Service: `backend/src/services/market/MarketSalaryService.ts`. Screen: `/market/salaries` "Salary Insights".

- **Only stated salaries.** Figures come from the `salary` a source gave for each posting. Nothing is inferred from titles, levels or other postings.
- **One market at a time.** Each statistic covers one country, one currency (ISO 4217, never converted) and one pay period. Without filters, every market is shown as its own card. The filters narrow which markets appear; they never merge them.
- **Unit and duplicates.** The unit is a distinct stored posting, so C1's duplicate control carries through: a cross-post or re-import adds nothing. Postings without a publication date are left out and counted, as in the history.
- **Range shapes.**
  - *Complete ranges* give the median stated minimum, median stated maximum and median midpoint ((min + max) / 2). The midpoint is a summary convention, not a pay figure.
  - *"From" figures* (minimum only) and *"up to" figures* (maximum only) are counted and summarised separately, never treated as ranges.
- **Minimum samples.**

  | Figure | Needs |
  |---|---|
  | Median of complete ranges | 10 complete ranges in the market |
  | Quartiles (P25–P75) and the midpoint distribution (6 equal-width bands) | 20 |
  | Median of a one-bound figure | 10 such postings |

  Below these minimums, the count is shown with "Not given: n of 10 complete ranges needed".
- **Method.** Quantiles use linear interpolation (Hyndman–Fan type 7). Amounts are rounded to whole units, or to two decimals for hourly pay.
- **Exclusions, each counted and shown:**
  - no salary stated;
  - a salary with no country;
  - a missing or non-positive amount;
  - a range whose maximum is more than 10× its minimum, treated as a data error.
- **States.**
  - `data_unavailable`: no licensed source is registered. The screen shows **DATA UNAVAILABLE** and no figure.
  - `insufficient_data`: postings exist but have no salaries, or no market reaches the minimum.
  - `available`: at least one market meets the minimum.

  The synthetic fixture is shown only in **demonstration mode**, under a dashed **SYNTHETIC TEST DATA** banner.
- **Provenance per market.** Every card shows:
  - the sources, with licence and link;
  - first and latest retrieval dates;
  - publication date range;
  - posting counts.
- **Limits.**
  - Advertised salaries are not pay received.
  - Postings that state a salary are a selective subset.
  - Remote postings are counted under the country the source gave.
  - At most 50,000 postings are read per request, and the response says when that cap is reached.
- **Tests.**
  - `backend/src/tests/market_salaries.test.ts` covers:
    - quantiles, rounding, bins and shape classification;
    - `data_unavailable` with no source;
    - synthetic figures re-computed from the stored postings;
    - exact medians on a hand-built sourced set;
    - periods and currencies kept apart;
    - one-bound figures, all four exclusions, every filter and re-import stability;
    - sign-in and 9 invalid queries.
  - `e2e/tests/salaries.mjs` covers 14 browser steps, including DATA UNAVAILABLE before and after a fixture import, the labelled demo, filters, exclusions, the error state, 390 px and the console.

## 5c. C2 cautious demand forecasting

`GET /api/v1/market/forecast?dataset&skill&country&to&horizon=1..3` (sign-in required). Service: `backend/src/services/market/MarketForecastService.ts`. Shown as "Postings forecast" on `/market`.

**What is forecast.** It forecasts the number of distinct postings SkillBridge would hold per month from its sources. It does not forecast employment, hiring or anyone's chances. `to` must be a completed month (default: the last one), because a month in progress looks like a fall.

**When a forecast is withheld.** Every reason that applies is returned, and no figure is produced:

| Reason | Minimum |
|---|---|
| `no_registered_source` | A licensed source must exist. Without one, the production answer is `forecast_unavailable`, and the screen shows **FORECAST UNAVAILABLE**. |
| `history_too_short` | 24 months from the first month with postings to `to` |
| `too_few_postings_per_month` | A median of 10 postings a month |
| `too_many_empty_months` | At most 2 months with no postings |
| `latest_month_empty` | The last month has postings. An empty month more likely means collection stopped. |
| `stale_data` | Latest retrieval within 60 days |
| `mixed_countries` | One country. Without a country filter, postings from several countries are refused. |
| `duplicate_heavy` | At most 50% of postings merged as cross-posts |
| `too_few_backtest_origins` | At least 8 past origins to measure error |

**Method.** Deterministic and explainable:
- **Baseline:** naive, so next month equals last month.
- **Model:** an ordinary least-squares line through the last 12 months, never below zero.
- **Selection:** both are evaluated by rolling-origin backtesting on the history itself. At each origin, a method sees only earlier months. The one with the lower total mean absolute error over the horizon is used, and a tie keeps the baseline.
- **Range:** the 80% range at each horizon is the point ± the 80th percentile of that method's backtest absolute errors at that horizon. It is empirical, with no distribution assumed.
- **Output:** points and ranges are whole postings. Both methods' backtest errors are reported.

**Held-out evaluation.** Synthetic series of 36 months with 40 seeds per shape. The last 3 months are held out, and the forecast is made from the 33 before them (`backend/src/tests/market_forecast.test.ts`). MAE is in postings per month.

| Shape | Selected method MAE | Naive baseline MAE | Linear trend MAE | 80% range coverage | Trend selected |
|---|---|---|---|---|---|
| Rising trend | **2.1** | 4.0 | 2.1 | 0.93 | 40/40 |
| Flat, noisy | **4.5** | 4.8 | 4.5 | 0.82 | 38/40 |
| Seasonal (12-month cycle) | 2.6 | 2.6 | 11.1 | 1.00 | 0/40 |
| Random walk | 3.6 | **3.4** | 4.3 | 0.81 | 4/40 |
| Step change 3 months before the end | 2.8 | **2.1** | 3.1 | 0.74 | 32/40 |

**Reading the evaluation honestly:**
- The selection clearly beats the baseline on trending data and roughly matches it on noise.
- It is slightly worse than the baseline on a random walk.
- After a sudden level change, both the forecast and its range lag. Coverage falls to 0.74, which is the documented failure condition.
- Seasonality is not modelled. The backtest correctly avoids the trend line there, but the ranges are wider than needed (coverage 1.00).
- These are synthetic results. No evaluation on real postings exists, because there are none.

**No leakage.** A spy method verifies that each backtest origin received exactly the months before it, and that changing later months never changes an earlier prediction or backtest error.

**Tests:**
- `market_forecast.test.ts` covers:
  - methods, no leakage and the held-out table;
  - `forecast_unavailable` without a source;
  - the 12-month fixture (too short) and two countries (refused);
  - 30 dense synthetic months (forecast given and labelled synthetic);
  - sparse, stale, duplicate-heavy and gapped sourced data (each reason named);
  - HTTP sign-in and 7 invalid queries, including an in-progress month.
- `e2e/tests/market.mjs` adds 2 browser steps: FORECAST UNAVAILABLE with no source, and with 12 synthetic months.

## 6. Known limits

- No real market data: no free source licenses storing and aggregating postings (`docs/MARKET_DATA_SOURCES.md`). All non-empty screens show synthetic data, labelled as such.
- OnJob.io's feed is used only to republish live listings in the Career Lab comparison (`services/market/OnJobLiveListings.ts`, off by default). It is deliberately **not** a registered market source: its licence grants republication, not storage after closing, counts, salary statistics, description mining or forecasting.
- Fixture months and the default window: the CLI fixture ends at the last complete month.
- Country is whatever the source states; locations are not geocoded.
- Fingerprints treat a repost on a later day as a new posting. Two different jobs with the same title, employer, location and day would be merged.
- Counts reflect what was collected. A month with zero postings can mean none were collected then.

## 7. Integration notes for the main expansion branch

Shared files touched, each kept to a minimum:

| File | Change |
|---|---|
| `backend/src/app.ts` | Mounts `/api/v1/market` (2 lines). |
| `frontend/src/routes/index.tsx` | Adds the lazy `/market` and `/market/salaries` routes. |
| `frontend/src/layouts/Sidebar/Sidebar.tsx` | Adds the "Market Evidence" and "Salary Insights" items. |
| `backend/src/tests/runAllTests.ts` | Registers the market, salary and cost-policy suites. |

### 7a. Audit: hard-coded market panels (not edited here)

Both panels are rendered by `frontend/src/workspaces/CareerIntelligenceWorkspace/CareerIntelligenceWorkspace.tsx` (lines 412 and 456) and `frontend/src/features/careers/components/CareerIntelligencePage.tsx` (lines 203–204). Both are in Agent A's area, so this branch does not edit them.

| Panel | Invented values | Why it is unsafe |
|---|---|---|
| `SalaryIntelligencePanel.tsx` | `regions` (six US/UK cities with `baseMedian` 152,000–195,000 and cost-of-living factors), `experienceTrajectory`, `certBoosts`, `skillBoosts`, `forecastData`; a "simulator" multiplies these together, and the text claims "live market salary premiums". | Every figure is made up. They are shown in dollars with no source, no sample and no period, and certification "boosts" read like causal pay effects. |
| `MarketTrendsPanel.tsx` | `trendingSkills` (demand scores 91–97, YoY growth), `emergingTech`, `decliningSkills`, `lifecycleData`, `regionalDemands` (demand index, remote %) | Every figure is made up. None comes from postings, and the decline labels could steer users away from real skills. |

**Replacement strategy for integration** (Agent A applies it, or it is done together at merge time):

1. Delete the hard-coded arrays and the salary simulator. No figure on these panels may lack a source.
2. **Salary panel.** Replace it with a compact card that calls `fetchSalaryInsights({ dataset: 'sourced', country })` from `frontend/src/features/market/marketApi.ts`:
   - It shows the median midpoint and sample size of the user's market only when `status === 'available'`.
   - Otherwise it shows "DATA UNAVAILABLE" with the reason.
   - It always links to `/market/salaries`.
3. **Trends panel.** Replace it with `fetchSkillTrends` (C4) for skill shares and change flags, and with `fetchMarketOpportunitySummary` for career-level counts. When there are no figures, use the same unavailable and insufficient wording.
4. Never show synthetic data on these panels. Demonstration mode lives only on the market pages, where it is labelled.
5. Browser check: the Career Intelligence page shows no currency amounts or demand scores while no licensed source is registered.
