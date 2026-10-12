# Application outcome analytics (C6)

**Branch:** `work/skillbridge-parallel-features` (Agent B). **Screen:** `/application-outcomes`. **API:** `GET /api/v1/applications/outcomes?from=YYYY-MM&to=YYYY-MM&includeDemoListings=true|false` (sign-in required).

Built entirely from the signed-in user's own tracked jobs (`SavedOpportunity` and its `statusHistory`). No external data is used, and nothing is estimated.

## Counting rules

1. **Saved is not applied.** An application exists from its first `applied` event (or `appliedAt`). Saved jobs never marked as applied are reported as "not counted". So are jobs withdrawn straight from saved.
2. **Inferred applications.** A job that reached an interview, an offer or a rejection without `applied` ever being recorded was applied to. Its application date is the earliest of those events, and the page reports how many dates were inferred this way.
3. **Once per stage.** Each application counts at most once for *reached interview* and once for *reached offer*, however often its status moved back and forth. The ignored repeats are reported.
4. **Cohort by application month.** The period selects the applications *made* in it. Their outcomes are followed up to today, even when they happened after the period. Applications still open (`applied`, `interviewing`) are reported, because recent rates can still rise.
5. **Rates with counts.**

   | Rate | Numerator / denominator |
   |---|---|
   | applied → interview | applications that reached an interview / applications |
   | interview → offer | applications that reached both an interview and an offer / applications that reached an interview |
   | applied → offer | applications that reached an offer / applications |

   Each rate has one of three statuses:
   - `no_observations`: the denominator is 0, so there is no rate.
   - `insufficient_sample`: the denominator is between 1 and 4. The rate and its counts are shown, labelled "too few to compare".
   - `measured`: the denominator is 5 or more. A measured zero is a real "0 of N".
6. **Order and consistency.** Events are read in date order, even when stored out of order. Interviews, offers or rejections dated before the application are reported, as are offers with no recorded interview. Those offers count in applied → offer, but not in interview → offer.
7. **Demo listings.** Applications to built-in demo listings (`isSample`) are left out by default and the number left out is shown. `includeDemoListings=true` adds them back, and the page then shows a dashed "Includes demo listings" banner.
8. **Isolation.** The query is always scoped to the caller's user id. No parameter selects another user, and unknown parameters are rejected.

## Validation

`from` and `to` must be `YYYY-MM`. `from` may not be later than `to` (or than the current month when `to` is omitted). A period may span at most 60 months. When no period is given, it runs from the month of the first application to the current month, limited to 60 months.

## Tests

- `backend/src/tests/application_outcomes.test.ts`:
  - **Pure function:** rates; saved vs applied; repeats; inferred dates; offers without an interview; out-of-order and early milestones; zero conversions; cohort filtering; demo listings.
  - **HTTP:** sign-in required; counts; demo listings opt-in; cross-user isolation; filtering on stored event dates; 6 invalid queries.
- `e2e/tests/outcomes.mjs`, 10 browser steps:
  - sign-in required;
  - empty state;
  - rate cards showing their counts and the small-sample label;
  - scope notes;
  - funnel table;
  - demo-listing toggle and banner;
  - monthly table;
  - an empty period;
  - fits a 390 px screen;
  - another account sees nothing;
  - no console errors.

## Limits

- Dates are when the user changed a status in SkillBridge, not when the employer acted.
- Rates describe one person's own search. They are not benchmarks and say nothing about other candidates.
- With the default minimum of 5, most individual users will see "too few to compare" for interview → offer.
