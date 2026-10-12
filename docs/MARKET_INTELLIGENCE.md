# Market intelligence

**Branch:** `work/skillbridge-parallel-features` (Agent B). **Scope:** C1–C6, R4, X7, X8 from
[`NEXTGEN_EXPANSION_PLAN.md`](NEXTGEN_EXPANSION_PLAN.md). **Cost policy:** [`ZERO_COST_API_POLICY.md`](ZERO_COST_API_POLICY.md).

| ID | Status on this branch |
|---|---|
| **C1** sourced, dated job-demand records and history | **Implemented and tested** (see §5). Real-market history stays *unavailable*: no licensed source is registered yet. |
| **C4** job-description skill trend mining | **Implemented and tested** on synthetic data (see §5a). On real data it stays *unavailable* until a licensed source is registered. |
| C5 market signals contract | `MarketOpportunitySummary` contract and its unavailable form are defined and tested. The producer is not built yet. |
| C6 application outcomes | Implemented and tested; see [`APPLICATION_OUTCOMES.md`](APPLICATION_OUTCOMES.md) |
| C2, C3, R4, X7, X8 | Not started |

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

## 4. `MarketOpportunitySummary` (contract for Agent A)

Defined in `backend/src/services/market/MarketOpportunitySummary.ts`:

```ts
interface MarketOpportunitySummary {
  contractVersion: 1;
  careerId: string; careerTitle: string;
  location: { country: string | null; label: string };
  period: { from: string; to: string };            // YYYY-MM, inclusive
  dataset: 'sourced';                               // never built from fixtures
  matchingRule: string | null;                      // how postings were attributed to the career
  sourcedObservations: number; distinctPostings: number;
  sources: { id; name; licence; postings }[];
  freshness: { latestPostedAt; latestRetrievedAt; ageDays };
  demand: null | { monthly: { month; postings }[]; minimums };   // null unless sufficient
  available: boolean;
  insufficientDataReasons: ('no_registered_source' | 'no_records' | 'too_few_postings'
    | 'too_few_months_with_postings' | 'career_not_mapped_to_postings' | 'stale_data')[];
}
```

The contract has **no opportunity score**. Readiness describes the person; these figures describe postings, so consumers keep the two apart.

**Backend consumer example** (Career Lab comparison, once the producer exists):

```ts
const market = await MarketOpportunityService.summaryForCareer(careerId, { country: 'IN', from, to });
row.market = market.available
  ? { distinctPostings: market.distinctPostings, demand: market.demand, sources: market.sources }
  : { unavailable: market.insufficientDataReasons };   // show the reasons, never a zero as if measured
```

**Frontend consumer example:**

```tsx
{summary.available
  ? <span>{summary.distinctPostings} postings · {summary.sources.map(s => s.name).join(', ')}</span>
  : <span>Market evidence unavailable: {summary.insufficientDataReasons.join(', ')}</span>}
```

Until the producer is built, `unavailableSummary(career, period, ['no_registered_source', 'no_records'])` returns the honest answer.

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

## 6. Known limits

- No real market data: no free, licensed job-posting source has been verified (see the zero-cost policy). All non-empty screens show synthetic data, labelled as such.
- Fixture months and the default window: the CLI fixture ends at the last complete month.
- Country is whatever the source states; locations are not geocoded.
- Fingerprints treat a repost on a later day as a new posting. Two different jobs with the same title, employer, location and day would be merged.
- Counts reflect what was collected. A month with zero postings can mean none were collected then.

## 7. Integration notes for the main expansion branch

Shared files touched, each kept to a minimum:

| File | Change |
|---|---|
| `backend/src/app.ts` | Mounts `/api/v1/market` (2 lines). |
| `frontend/src/routes/index.tsx` | Adds the lazy `/market` route. |
| `frontend/src/layouts/Sidebar/Sidebar.tsx` | Adds the "Market Evidence" item. |
| `backend/src/tests/runAllTests.ts` | Registers the market and cost-policy suites. |

Existing screens that show **invented market data**: `frontend/src/features/careers/components/MarketTrendsPanel.tsx` and `SalaryIntelligencePanel.tsx` hard-code US skill demand and salaries. They are shown in `CareerIntelligenceWorkspace`, which Agent A owns. They should be removed or replaced with `MarketOpportunitySummary` and C3 data once those exist.
