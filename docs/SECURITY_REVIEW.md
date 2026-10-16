# Security, isolation and input review (V2), 2026-10-13

This review covers every route the backend serves. The routes are read from the Express router itself (`backend/src/tests/helpers/routeInventory.ts`), not from a hand-kept list, so a route added later is checked automatically. Suite: `backend/src/tests/security_sweep.test.ts`, registered in `runAllTests.ts`.

## What is tested

| Area | Check | Result |
|---|---|---|
| Sign-in | All 149 routes without a token. The 141 non-public routes also with four bad tokens: malformed, signed with another secret, expired, and missing "Bearer" | Only 8 reviewed public routes answer without a token: `/`, `/health`, `/api/v1`, the four auth endpoints, and the public portfolio link. Every other route refuses all five cases with 401. A new public route fails the suite until it is reviewed and added |
| Path parameters | 59 parameterised routes × 8 values (`not-an-id`, `../../etc/passwd`, an encoded traversal, 400 characters, an operator object, an unknown id, `0`, `-1`), signed in | 464 probes, no server error |
| Bodies | An 11 MB JSON body, malformed JSON, and an operator object as a field | 413, 400, 400 |
| Isolation | Alice makes 25 successful requests that cover skills, the roadmap, recommendations, the portfolio, projects, exams and study plans, language analyses, interviews, technical assessments, AI chat, applications and transition plans. The 21 that name her own objects (15 reads and writes, 6 deletions or completions) are replayed unchanged by Bob | All 21 answer 403 or 404. Bob's lists contain none of her ids. Alice's data is identical afterwards |
| Races | Answers fired together with two submissions; six simultaneous starts of one skill check; six saves of one job; six identical portfolio entries | Stored answers are exactly the scored ones; one attempt is opened; one job is saved; the project is credited once |
| Administrators | Market imports, the three AI-observability endpoints, and infrastructure diagnostics | A user gets 403. An administrator is admitted. After demotion, 403 at once. A correctly signed token that claims "admin" for a user is refused |
| Exposure | The public portfolio link; error responses; an unexpected server error | No e-mail address or ids on the public link. No stack traces or file paths in errors. An unexpected error's message (for example a database connection string) goes to the log, and the client gets a generic message |

## Defects found and fixed

1. **Administrator role trusted from the token** (market imports). `authorize(['admin'])` read the role from the access token. A promotion therefore needed a new sign-in, and **a demoted administrator kept access until the token expired**. `authorize` now reads the role from the database on every request, like the diagnostics guard. The AI-observability routes use the same middleware, replacing a duplicate.
2. **Internal error messages sent to clients.** An unexpected exception's own message was returned in the response, and it can carry database or file details. It is now logged only.
3. **Client errors labelled as server errors.** A 4xx thrown without a code was reported as `INTERNAL_SERVER_ERROR`. It now gets a code matching its status (`BAD_REQUEST`, `NOT_FOUND`, and so on).
4. **Exam answer racing the submission** (E2/E3).
   - An answer whose read of the attempt was delayed past a submission was then written on a stale copy. Mongoose rejected it as a version conflict, so the user saw a server error and the answer was lost.
   - Everything that reads or changes one attempt (answers, section starts, submission, deadline expiry) now runs one call at a time.
   - `exam_prep.test.ts` reproduces the race deterministically by delaying the read. The test fails with the lock removed and passes with it. The HTTP-level race check in the sweep did not reproduce the race on its own, so it is not counted as evidence for this fix.
5. **Non-English upload file names** stored as mojibake, and client-supplied paths kept in file names. Fixed earlier in this milestone (`dad01dc`).

### Added 2026-10-13 (final 22-point pass)

6. **Re-recorded answers kept the first take's date** (D1), found by the real-codec browser suite. Timestamps make `createdAt` immutable, so a replacement kept the old date, and a later retention change counted from it. The record is now updated in one atomic operation with the new date (`voice_interviews` checks it; `voiceRealCodec.mjs` checks that the answer is never missing in between).
7. **New outbound source: OnJob.io jobs feed** (A1, `services/market/OnJobLiveListings.ts`). Threat review:
   - Off unless the operator sets both the enable flag and the terms attestation; a refused call never reaches the network (`onjob_live_listings`).
   - The URL is fixed. Pagination is followed only to https links on onjob.io; redirects are refused; 20 s timeout; at most 25 MiB per page and 5 pages; at most 8 fetches a day.
   - No user data is sent: one anonymous GET with no cookies or keys.
   - Feed content is untrusted. Every field is schema-checked, markup, control and bidirectional characters are stripped, lengths are capped, descriptions are never read, and only `https://onjob.io/...` links are rendered (with `rel="noopener noreferrer nofollow"`). No feed text reaches any AI prompt.
   - Failures are logged as a code only (`timeout` or `fetch_failed`). The comparison still answers, showing "unavailable"; this was checked in Docker with onjob.io made unreachable.

8. **New first-party channel: employer postings** (`/api/v1/employer`, 15 routes).
   - Owner-only actions answer 404 to anyone else; administrator review reads the role from the database.
   - Inputs are validated strictly (unknown fields refused; pay bounds and range ratio; 36 states or UTs; https links only).
   - Descriptions are plain text with markup and control characters removed, rendered as text, and never sent to an AI.
   - Limits: 10 new postings a day, 25 open.
   - Abuse controls: reports (3 hide a posting and remove it from market figures); administrators can hide it.
   - Market-wide, the employer-diversity rule: no figure unless postings come from at least 5 employers and none supplies over half.
   - The security sweep covers its sign-in, parameter and exposure checks (165 routes); `employer_postings` covers isolation and abuse.

### Added 2026-10-15

- **Refused browser origins returned HTTP 500.** The CORS callback passed a plain error, which the error handler treats as a server fault. It now answers 403 `ORIGIN_NOT_ALLOWED` before any route runs; the allowlist is unchanged. Suite `cors_origin`.
- **The Vite dev proxy removed the Origin header from every request**, so any website could make a visitor's browser submit simple form posts through the dev server. Only same-origin requests are relabelled now (`frontend/devProxyOrigin.ts`, with unit tests).
- **The AI service's analytics routes took the user from the request body unchecked.** The acting-user check covered path parameters only. `/api/v1/analytics/insights` and `/simulate` now require the body `user_id` to equal `X-Acting-User-Id` (403 otherwise), and the backend client sends it. An OpenAPI-driven test (`test_security.py`) applies the same check to every route whose body names a user, so a new one cannot skip it. The backend's own `/api/v1/analytics` takes the user from the verified token only; suite `analytics_authorization` covers forged, tampered and unsigned tokens and user ids in the query or a header.
- **AI tests could inherit real provider flags** from the repository-root `.env`. Fixed in the AI service's environment loading; `test_env_isolation.py`.
- **The AI analytics routes returned fixed salary tables, a "+38% compensation growth" claim and hard-coded readiness and match figures** as if they were forecasts. The forecasting code is removed; both routes answer "insufficient evidence" with no figures (`test_analytics_integrity.py`).

## Covered by other suites, re-run here

- **Voice recordings** (`voice_interviews`, `voice_retention`):
  - consent is required, playback is owner-only, and uploads are validated;
  - withdrawing consent makes every recording inaccessible at once;
  - failed deletions are tracked and retried;
  - the daily retention job removes expired files.
  - The Docker workflow also checks file permissions, restart persistence and the retention job.
- **Zero-cost policy** (`cost_policy`, `zero_cost_runtime`, AI `test_runtime_cost_enforcement`): paid providers stay blocked with keys present.
- **AI audit log** (`test_observability.py`): no prompts, resume text or keys reach the log.

## Not covered

- Only one backend process was tested. The per-user locks are in process, and the per-user search and AI limits are in memory, so several backend instances would need a shared store for both.
- No penetration test, dependency audit or TLS configuration review was done. The Docker deployment exposes the API through the bundled proxy and has not been reviewed beyond the smoke test.
- Brute-force protection is the existing authentication rate limit: 15 attempts per 15 minutes per address. There is no per-account lockout.
