# Aurora Elite release audit (Stage F)

Date: 2026-10-14. Branch `work/skillbridge-unified`. Audited tree: Stage E (`66a0c74`) plus the Stage F fixes in this commit.

This is the final engineering regression and release audit of the Aurora Elite redesign (Stages A to E). It records what was run, what it found, what was fixed and what remains. Every number below comes from a run on this machine or in GitHub Actions on the stated date; nothing is carried over without saying so.

**Scores are unchanged.** The original release checklist stays at **100 / 100** ([`FINALIZATION_CHECKLIST.md`](FINALIZATION_CHECKLIST.md)) and the next-generation expansion at **81 / 100** ([`NEXTGEN_CHECKLIST.md`](NEXTGEN_CHECKLIST.md)). No previously unmet acceptance criterion was verified in this stage (see §6).

## 1. Summary

| Area | Result |
|---|---|
| Backend suites | 58 / 58 suites pass, before and after the dependency upgrades |
| AI service (pytest) | 190 passed |
| Frontend typecheck, lint, production build | Pass (no warnings allowed by lint) |
| Browser suites (real Microsoft Edge 155) | 19 of 20 suites pass in full; `voiceRealCodec` passes all 12 Edge steps, and its 3 Google Chrome steps could not run (§5) |
| Accessibility (axe, WCAG 2.0/2.1 A and AA, every page) | 54 / 54 |
| Responsive layout (52 routes, 5 widths, 328 captures) | 7 findings; both causes fixed (§3) |
| Performance (production build, 4× CPU slowdown) | Initial JS 767 kB on `/` and `/login`; no slow frames while scrolling (§4) |
| Dependency advisories (production) | 42 (2 critical, 20 high) reduced to 2 moderate, neither reachable (§3.3) |
| Docker | Not installed on this machine; verified by the GitHub Actions Compose workflow on the pushed Stage F head (§2.5) |
| Defects found and fixed | 3 product defects, 1 dependency set (§3) |

**Release readiness:** the redesigned product is ready as a release candidate on the evidence below, with the limitations in §5 and the open requirements in §6. Readiness for production use additionally depends on the deployment items in [`DEPLOYMENT.md`](DEPLOYMENT.md) and [`SECURITY.md`](SECURITY.md) (hosting, secrets, backups, monitoring), which this audit does not change.

## 2. Test results

### 2.1 Backend

`pnpm test` (`backend/src/tests/runAllTests.ts`): **58 suites passed, 0 failed**, run twice: on `66a0c74` and again after the dependency upgrades in §3.3. The suites run on an in-memory database with a stub AI service; the final check confirms the developer's backup file, local database and uploads were not touched. They include authentication, user isolation, the security sweep, account deletion (122 documents in 31 collections and every file removed), scoring, the zero-cost API policy and the API reference coverage check (all 167 routes documented).

### 2.2 AI service

`python -m pytest` in `ai/`: **190 passed** (12 deprecation warnings from `logger.warn`, no failures). The interpreter was the main worktree's virtual environment: the one in this worktree has no pytest installed. The code under test is this worktree's `ai/`.

### 2.3 Frontend

| Check | Result |
|---|---|
| `pnpm typecheck` (frontend and backend) | Pass |
| `pnpm lint` (frontend and backend, `--max-warnings 0`) | Pass |
| `pnpm build` (frontend `tsc` + Vite, backend `tsc`) | Pass |

All three were run on `66a0c74`, again after the dependency upgrades, and again after the Stage F fixes.

### 2.4 Browser suites

Each suite starts its own isolated stack (temp database and uploads, stub AI service, no provider keys) and drives the installed **Microsoft Edge 155** through `playwright-core` (`e2e/run.mjs`). Results on the final Stage F tree:

| Suite | Steps |
|---|---|
| `smoke.mjs` (the main journey: registration to interviews, reload persistence, sign-out, nine cross-account requests) | 50 / 50 |
| `accessibility.mjs` (axe on every page) | 54 / 54 |
| `navigation.mjs` | 27 / 27 |
| `landing.mjs` | 10 / 10 |
| `polish.mjs` (claims, pop-ups, dialogs, errors, drawer, reduced motion) | 11 / 11 |
| `group2.mjs` (Roadmap, skill checks, projects, portfolio) | 16 / 16 |
| `group3.mjs` (interviews, voice, technical, exams) | 13 / 13 |
| `group4.mjs` (jobs, applications, outcomes, market, salaries) | 15 / 15 |
| `group5.mjs` (assistant, language/OCR, employer, administration, settings) | 14 / 14 |
| `interviews.mjs` | 23 / 23 |
| `voiceRealCodec.mjs` | 12 / 15: every Edge step passes; the 3 Chrome steps fail at launch because Google Chrome is not installed (§5.1) |
| `applications.mjs` | 15 / 15 |
| `outcomes.mjs` | 10 / 10 |
| `market.mjs` | 15 / 15 |
| `salaries.mjs` | 14 / 14 |
| `exams.mjs` | 12 / 12 |
| `languages.mjs` | 11 / 11 |
| `careerDomains.mjs` | 8 / 8 |
| `employer.mjs` | 8 / 8 |
| `aiObservability.mjs` | 6 / 6 |

Every suite above was run twice with the same results: on `66a0c74`, and on the final tree after the dependency upgrades and fixes.

Integrated journeys covered: registration, onboarding, resume upload and replacement, extracted skills, career matches and score breakdown, the Career Lab, readiness, roadmap, skill checks, projects, portfolio and its public page, job search and saved jobs, applications and outcomes, interviews with recording and dictation, exams, market and salaries, the assistant, language and OCR, employer postings and administration, settings and account deletion. Persistence is checked by reloading and by signing in again; isolation by requests from a second account.

### 2.5 Docker

Docker is not installed on this machine, so no local container was started and no local Docker volume was touched. The Compose stack is verified by the GitHub Actions workflow `docker-smoke.yml` (manual dispatch, synthetic secrets, no provider keys): Compose validation, refusal without secrets, image builds, unprivileged users, AI service not published, connectivity, authentication and the resume-to-career workflow, OCR in the container, the private AI audit log, **data surviving a restart of every container**, recording retention, startup logs, and teardown of the runner's own volumes.

The last run before this stage tested `472acf1`, which predates the redesign. The run on the Stage F head is recorded in §7.

## 3. Defects found and fixed

### 3.1 Administrator page refused with a misleading "try again" notice

A signed-in non-administrator who opened `/ai-observability` by its address (it is not in their sidebar) got three refused requests (403) and the page-wide notice "Some of your data could not be loaded … Try again". Trying again can never help with a refusal.

Fix: the page reads the signed-in role and, for a non-administrator, sends nothing and states "Administrator access is required" (`AiObservabilityPage.tsx`). The server is still the authority: the API refuses the same requests, which `aiObservability.mjs` checks directly. Both `aiObservability.mjs` and `group5.mjs` now also assert that no refused request is sent and that the notice does not appear; before, they accepted the 403s as expected.

### 3.2 Recommendations: unclipped decoration and two claims

- On phones (390 and 360 px) a decorative blurred glow on the top-ranked cards reached 17 px past the page, which hides sideways overflow. No content was cut, but the page was wider than the screen. The glow is now clipped to its card; the audit measures 0 px.
- Each action's reason was labelled **"AI Rationale"**. The reasons are fixed sentences written by `RecommendationEngine.ts` from the user's gaps; no AI model writes them. The label is now "Why".
- The list was headed "Strategic Intelligence Stream — Chronologically ordered by impact leverage and career readiness delta". It is not chronological; it follows the chosen sort, by default the largest gap impact first. It is now "Your actions — In the order chosen above; by default the action that closes the largest gap comes first". "Pivot seamlessly into roadmap execution and neural guidance" became "Continue in your roadmap or ask the assistant".
- `polish.mjs` now forbids "AI Rationale", "neural guidance" and "Chronologically ordered" on all 46 signed-in routes.

### 3.3 Dependency advisories

`pnpm audit --prod` reported **42 advisories (2 critical, 20 high, 20 moderate)** in production dependencies:

| Package (path) | Advisories | Action |
|---|---|---|
| `axios` (backend, frontend) | 7 high, 5 moderate | 1.18.1 → **1.20.0** |
| `proxy-addr` (express) | 1 critical | 2.0.7 → **2.0.8**. The backend sets `trust proxy` to a hop count, not a subnet list, so the advisory's subnet path was not used, but the fixed version is installed |
| `qs` (express, body-parser) | 2 moderate | express 4.22.2 → **4.22.3**, body-parser → **1.20.8**, qs → **6.16.0** |
| `tar`, `brace-expansion` (bcrypt 5 → `@mapbox/node-pre-gyp`, used at install time) | 1 critical, 12 high, 4 moderate | bcrypt 5.1.1 → **6.0.0**, which ships prebuilt binaries (including Alpine/musl for the Docker image) and needs no `node-pre-gyp` |
| `ip-address` (mongoose → mongodb) | 1 high, 6 moderate | 10.2.0 → **10.7.x** within the existing range |
| `react-router-dom` | 1 moderate | 6.30.4 → **6.30.6** |

bcrypt 6 keeps the hash format: a hash made by bcrypt 5 verifies under bcrypt 6, a wrong password is refused, and a bcrypt 6 hash verifies under bcrypt 5 (all `$2b$`). Existing accounts sign in unchanged.

**Remaining: 2 moderate**, both in `react-router` 6.x, fixed only in React Router 7 (a major upgrade, not made at release time):

- GHSA-337j-9hxr-rhxg, constructor injection in `deserializeErrors()` during **server-side rendering hydration**. SkillBridge is a client-rendered single-page app; it does not apply.
- GHSA-wrjc-x8rr-h8h6, open redirect via a backslash path given to `<Link>` or `useNavigate`. The only navigation to a stored path is the return to the page that required sign-in (`LoginForm`, `RegisterForm`), and that path is set by `ProtectedRoute` from a matched protected route. An address such as `/\example.com` matches no protected route and is answered by the not-found page, so it never becomes the return path. Not reachable as built; it should be removed with the move to React Router 7.

Development-only dependencies (test and build tools) were not changed in this stage.

## 4. Performance

`e2e/tools/perfProfile.mjs` against the production build (`vite preview`), cold cache, 4× CPU slowdown, median of three loads. These are measurements of this machine and this local stack, not Lighthouse scores or field data.

| Route | FCP | LCP | JS transferred | Long tasks |
|---|---|---|---|---|
| `/` | 664 ms | 1496 ms | 767 kB (5 files) | 4 / 667 ms |
| `/login` | 576 ms | 640 ms | 767 kB | 3 / 386 ms |
| `/home` | 608 ms | 1732 ms | 808 kB | 5 / 715 ms |
| `/resume` | 620 ms | 980 ms | 796 kB | 4 / 591 ms |
| `/careers` | 600 ms | 964 ms | 827 kB | 4 / 566 ms |
| `/career-lab` | 632 ms | 912 ms | 821 kB | 3 / 526 ms |
| `/applications` | 408 ms | 652 ms | 784 kB | 2 / 262 ms |
| `/market` | 440 ms | 680 ms | 1191 kB | 3 / 344 ms |
| `/ai` | 408 ms | 888 ms | 843 kB | 3 / 362 ms |
| `/settings` | 408 ms | 976 ms | 836 kB | 5 / 559 ms |

Final tree. On `66a0c74` (before the dependency upgrades) initial JS was 762 kB; the 5 kB difference is axios 1.20. Timings vary by a few hundred milliseconds between runs on this machine.

Scrolling `/` and `/home` produced no slow frames. `/market` is the heaviest page because it is the one that loads the chart library. `/settings` asks for `/users/me` twice on load: harmless, noted for later.

## 5. Known limitations

### 5.1 Google Chrome voice coverage

- **Not run in this stage.** Google Chrome is not installed on this machine, and the portable Chrome 155 used on 2026-10-13 is no longer present. `voiceRealCodec.mjs` therefore reports its three Chrome steps as failed at launch ("Chromium distribution 'chrome' is not found"). The failures are about the environment, not the product. The suite was not changed to hide them.
- **Last Chrome evidence:** automated runs in real Google Chrome Stable 155 on 2026-10-13, on an earlier commit before the redesign: `voiceRealCodec.mjs` 12/12, `interviews.mjs` 23/23, `accessibility.mjs` 53/53 ([`MANUAL_VOICE_EVIDENCE.md`](MANUAL_VOICE_EVIDENCE.md) §2a). The Aurora Elite voice screens have been exercised in Edge only.
- **Never covered in Chrome:** steps that need a person, namely a physical microphone and a listener (A4, A5), a human voice (B2 to B4) and a screen reader (C2 to C4). The owner tested these in Edge (with Narrator), not in Chrome, and chose not to test Chrome by hand. **D1 (3 points) and D2 (2 points) therefore stay pending**, and no further manual testing is requested.

### 5.2 Other limits

- Browser coverage is Chromium-based only (Edge here; Chrome on 2026-10-13). Firefox has only the owner's B6 check; Safari and real mobile devices are untested.
- The browser suites use a stub AI service; the real AI service is covered by pytest. Live Gemini and live JSearch are never called by any test (zero-cost policy).
- Screen-reader behaviour of the redesigned pages was not re-checked by a person; axe covers WCAG A and AA rules that can be tested automatically.
- The responsive audit captures screenshots for review. Its automatic checks (sideways overflow, clipped content, controls off screen, oversized dialogs, error screens, console errors) found the issues in §3; other visual judgements still depend on a person looking.
- Performance figures are local measurements (see §4).
- The two moderate `react-router` advisories remain until React Router 7 (§3.3).

## 6. Outstanding requirements

| Item | Points | What would close it |
|---|---|---|
| C1–C5 market intelligence | 12 | A licensed source of dated job-demand, salary and description data; the features are built and tested on synthetic and test-source data |
| R4 market-aware adaptation | 2 | The same licensed data |
| D1 voice interviews | 3 | A1–A12 and C1–C4 by a person in Google Chrome |
| D2 speech-to-text | 2 | B1–B6 and B8 by a person in Google Chrome |

None of these was met in Stage F, so the expansion stays at 81 / 100.

## 7. Commits and branches

Filled in at commit time; see the Stage F commit message and the final report for SHAs and the Docker workflow run.
