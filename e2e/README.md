# Browser smoke tests

One command starts an isolated copy of SkillBridge, drives it in a real browser, and removes
everything again:

```bash
pnpm install        # once, at the repository root
pnpm test:e2e
```

Exit code 0 means every check passed. Each check prints `PASS` or `FAIL` with what it observed.

## What it starts

| Part | How | Isolation |
|---|---|---|
| Stub AI service | `backend/src/tests/helpers/runFakeAiService.ts` | Deterministic stand-in. No AI provider is ever contacted. |
| Backend | `backend/src/server.ts` | Embedded MongoDB and uploads inside a new temp directory. |
| Frontend | Vite dev server | Pointed at that backend. |

Ports are chosen at run time, so a development stack can stay running. Every setting the backend
needs is passed explicitly and takes precedence over `backend/.env`, so the run does not use your
database, uploads, JWT secrets or provider keys. Job search has no provider key, so it uses the
labelled demo listings. The temp directory and all processes are removed at the end.

## Requirements

- Node.js and the repository's dependencies (`pnpm install`). The suite has been run on Node.js 24
  on Windows; other versions and platforms are untested.
- Microsoft Edge or Google Chrome installed. The tests use the installed browser through
  `playwright-core`; no browser is downloaded.
- Python is **not** required: the AI service is replaced by the stub.

## Options

| Variable | Effect |
|---|---|
| `E2E_BROWSER_CHANNEL` | `msedge`, `chrome` or `chromium`. Default: the first one installed. |
| `E2E_HEADED=1` | Show the browser window. |
| `E2E_TEST_FILE` | Run another test module instead of `./tests/smoke.mjs` (path relative to `e2e/`). |
| `E2E_FRONTEND=preview` | Serve a production build (built into the temp directory) with `vite preview` instead of the dev server. |
| `E2E_API_RATE_LIMIT_MAX` | Raise the backend request limit (default 1000 per 15 minutes) for tools that load hundreds of pages, such as `tools/visualAudit.mjs`. The suites keep the default. |
| `E2E_KEEP=1` | Keep the temp directory (database, uploads, `backend.log`, `frontend.log`, `ai.log`). |

## What is covered

Registration, sign-in and rejected sign-in; onboarding; resume upload, replacement, reprocessing,
failed-extraction recovery and confirmed deletion; extracted skills; career matches and score
breakdown; the Career Lab (comparison, what-if, counterfactuals, skill freshness, transition plan,
recalculation activity); readiness shown consistently; roadmap generation and progress; job search filters,
demo-listing labels, saving, status, notes, reminders and status history; interviews (question
source, scoring source, rubric dimensions, stored report, history, job-specific practice, no
repeated questions); chat fallback and retry; the load-failure notice on twelve pages when the API
fails; Command Center values against stored data; reload
persistence; sign-out and protected routes; nine cross-account requests; the not-found page;
phone-width layout and accessible names on the main pages.

`E2E_TEST_FILE=./tests/sessionRefresh.mjs` covers the session lifecycle: an expired access token
is refreshed without leaving the page, a tampered one ends the session, and after signing out the
old refresh token is refused.

`E2E_TEST_FILE=./tests/sidebarNavigation.mjs` covers navigation without refreshes:
- every sidebar destination on its first click, repeated switching, rapid clicks, back and forward;
- direct URLs, an expired session, a slow API, empty states and the phone drawer;
- pages whose code chunk fails to download: the error card's "Try again" recovers without a reload;
  a page that cannot load stays contained; a failure that also hit shared chunks recovers on the
  next visit with one automatic reload;
- the AI waiting indicator with its elapsed time.

Run it with `E2E_FRONTEND=preview` too, so chunk names match a production build.

## Docker Compose checks, isolated

`e2e/ci/compose-isolated.sh` runs the Compose stack as a throwaway project named
`skillbridge-ci-<id>`, beside a running development stack, and removes only what that project
created. The CI workflow uses it, and it is the safe way to run the Docker checks locally:

```bash
COMPOSE_PROJECT_NAME=skillbridge-ci-local-1 SB_CI_WEB_PORT=13000 SB_CI_API_PORT=15000 \
  bash e2e/ci/compose-isolated.sh all
```

- It refuses any project name that does not match `skillbridge-ci-<id>`, so it can never act on
  a development stack such as `skillbridge-parallel`.
- `docker-compose.ci.yml` removes the base file's fixed container names and moves the published
  ports; volumes, networks and built images are named for the project.
- It generates synthetic secrets for the run; the repository's `.env` is never read.
- `verify` proves every container, volume, network and mount belongs to the project. `down`
  records everything outside the project beforehand and fails if any of it is gone afterwards.
- `node e2e/docker-smoke.mjs` takes `SMOKE_AI_MODE`: `none` (the labelled fallback is required, as
  in CI, where no model is downloaded), `local` (the local Ollama model must answer, labelled with
  it; set `SMOKE_LOCAL_MODEL` to the expected model) or `auto`. An external provider answering
  chat always fails.

## What it does not cover

- The real AI service and real PDF/DOCX parsing (covered by `ai/tests` with pytest).
- Live Gemini and live JSearch. Neither is called by any automated test in this repository.
- Browsers other than Chromium-based ones, real mobile devices, and screen readers.

## Files

- `run.mjs` starts and stops the stack.
- `lib/harness.mjs` has the browser helpers and the step reporter.
- `tests/smoke.mjs` is the journey itself. Add a step with `t.step('name', async () => { ... })`
  and throw (or use `expect`) to fail it.
