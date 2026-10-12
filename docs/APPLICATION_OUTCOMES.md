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

- Dates are what the user recorded: the moment a status was changed in SkillBridge, or a date the user entered or corrected (see X8 below). They are not dates received from employers.
- Rates describe one person's own search. They are not benchmarks and say nothing about other candidates.
- With the default minimum of 5, most individual users will see "too few to compare" for interview → offer.

# Application history (X8)

**Screen:** `/applications` ("Applications" in the sidebar). **Service:** `backend/src/services/applications/ApplicationHistoryService.ts`. Built on the same `SavedOpportunity.statusHistory` that C6 reads, so there is one source of truth.

## API (sign-in required; every operation is scoped to the caller)

| Method and path | Purpose |
|---|---|
| `GET /api/v1/applications` | The caller's tracked jobs, with current stage, `applied`, application date and reminder |
| `GET /api/v1/applications/:id/history` | Chronological timeline and notes |
| `POST /api/v1/applications/:id/events` | Record `applied`, `interviewing`, `offer`, `rejected` or `withdrawn`, with an optional date and note |
| `PATCH /api/v1/applications/:id/events/:eventId` | Correct an event's date or note |
| `DELETE /api/v1/applications/:id/events/:eventId` | Remove a mistaken event (the `saved` event cannot be removed) |
| `PUT /api/v1/applications/:id/reminder` | Set (`{at, note}`) or clear (`{at: null}`) the follow-up reminder |
| `POST /api/v1/applications/manual` | Add an application made outside SkillBridge's job search |

Another user's id, an unknown id and a malformed id all answer **404**. Unknown fields are rejected with 400.

## Rules

- **Only what the user recorded.** SkillBridge receives nothing from employers. No status, event or date is created for the user.
  - An application that C6 infers (an interview, offer or rejection with no recorded application, or an older record with only a stored application date) appears in the timeline as `origin: 'inferred'`, dashed and with an explanation.
  - An inferred event is **not stored** and cannot be edited.
- **Dates and their basis.**
  - `changedAt` is the date of the event, and it is what C6 reads.
  - `dateSource` records where that date came from:
    - `recorded_at_change`: when the status was changed in SkillBridge. Older entries without the field count as this.
    - `user_stated`: a date the user entered or corrected.
  - `recordedAt` is when the event was entered.
  - `editedAt` stamps a correction. For an older entry, the original date is kept as `recordedAt` when it is first corrected.
- **Saving is not applying.** `saved` marks when tracking began and is not a stage. The current stage is the latest dated real stage, and `appliedAt` is the earliest application event. Both are recomputed after every addition, correction or removal, so C6 changes immediately.
- **Duplicates.** The same stage on the same UTC day is refused with **409 `DUPLICATE_EVENT`**, whether it is added or moved there by a correction. A second interview round on another day is kept, and C6 counts each stage once per application.
- **Validation.**
  - Event dates must lie between 2000-01-01 and now; future events cannot be recorded.
  - Notes are limited to 500 characters.
  - Manual links must be `http(s)`.
  - Reminders must fall between now and one year ahead.
- **Inconsistencies are pointed out, not hidden.** An interview, offer or rejection dated before the application produces a note asking the user to correct one of the dates. C6 counts the same case in `milestonesDatedBeforeApplication`.
- **Reminders are opt-in and in-app.** There is no reminder unless the user sets one. Due reminders are listed at the top of the Applications page and flagged in the list. No e-mail or push message is sent.
- **Older records.** Entries saved before events had ids receive stable ids once, on first read. The write applies only if the stored history is still the one read.
- **Demo listings.** A saved demo listing is labelled "Demo listing". C6 still leaves it out by default.

## Tests

- `backend/src/tests/application_history.test.ts`, 8 groups:
  - chronological status, inferred and unstored events, date sources and date validation;
  - the existing save and status endpoints feeding the history;
  - dated events, same-day duplicates (409) and 6 invalid events;
  - corrections and removals recomputing status, `appliedAt` and C6 (cohort month and offer count);
  - older records getting stable ids;
  - manual applications counted by C6, and 4 invalid entries;
  - reminders;
  - 6 cross-user operations answering 404 with no change.
- `e2e/tests/applications.mjs`, 15 browser steps:
  - sign-in required;
  - empty state;
  - save from job search → "Saved — not applied";
  - record applied and interview with dates;
  - duplicate refused;
  - correct a date;
  - remove an offer;
  - add a manual application;
  - inferred event shown and not editable;
  - outcomes follow;
  - reminder set and cleared;
  - another account sees nothing;
  - 390 px;
  - console clean.
