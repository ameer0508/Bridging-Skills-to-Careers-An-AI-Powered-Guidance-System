# Deployment

> **Status: verified in CI, not on a host.** The Compose stack is built, started and exercised by
> the GitHub Actions workflow `.github/workflows/docker-smoke.yml` on an Ubuntu runner, with
> synthetic secrets and a synthetic user. It passed on commit `f5ca3a8`
> ([run](https://github.com/ameer0508/Bridging-Skills-to-Careers-An-AI-Powered-Guidance-System/actions/runs/38237809763)).
> It has not been run on a developer machine or deployed to a server, and was not load-tested.
> Repeat the checks below on the machine you deploy to.

## Services

`docker-compose.yml` defines four services on one private network:

| Service | Image | Reachable from the host | Notes |
|---|---|---|---|
| `frontend` | built from `frontend/Dockerfile` (nginx) | port 3000 | Serves the built app and proxies `/api/` to the backend. |
| `backend` | built from `backend/Dockerfile` | port 5000 | Stores uploads and logs in the `backend-storage` volume. |
| `ai-service` | built from `ai/Dockerfile` (Python 3.11) | not published | Only the backend can reach it. |
| `mongodb` | `mongo:7` | not published | Data in the `mongo-data` volume. |

## Required settings

Create a `.env` file next to `docker-compose.yml`. Compose refuses to start without the first three.

```env
# Required. Generate each with: openssl rand -base64 48
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
INTERNAL_SERVICE_KEY=

# Optional
FRONTEND_URL=http://localhost:3000   # the origin browsers use to open the app
GEMINI_API_KEY=                      # without it, AI features show their labelled fallbacks
GEMINI_MODEL=
RAPIDAPI_KEY=                        # without it, job search shows labelled demo listings
```

Rules the services enforce in production mode:

- The two JWT secrets must be set, strong, and different from each other.
- `INTERNAL_SERVICE_KEY` must be set and must not be the development default. The backend and the
  AI service receive the same value from this one variable.
- Never commit this file. `.env` files are ignored by git.

## Start

```bash
docker compose up --build -d
docker compose ps
```

Then open http://localhost:3000.

## Verify the deployment

The workflow automates these checks: `gh workflow run docker-smoke.yml --ref <branch>`, or
Actions > "Docker Compose smoke test" > Run workflow. With the stack running locally you can also
run its test script directly: `node e2e/docker-smoke.mjs`, then after a restart
`node e2e/docker-smoke.mjs --verify`.

Run these after the first start and record the results. Each has one expected outcome.

```bash
# 1. All four containers are running; mongodb and ai-service report "healthy"
docker compose ps

# 2. Backend is up and connected to the database
curl -s http://localhost:5000/health

# 3. The app is served and the API is reachable through nginx (expect 401: not signed in)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/v1/users/me

# 4. The AI service is NOT reachable from the host (expect a connection error)
curl -s -m 5 http://localhost:8000/api/v1/health || echo "not reachable from host: correct"

# 5. The backend can reach the AI service inside the network
docker compose exec backend node -e "fetch('http://ai-service:8000/api/v1/health').then(r=>r.text()).then(console.log)"

```

Then, in the browser: register, complete onboarding, upload a resume, and confirm that skills and
career matches appear. Restart the stack (`docker compose restart`) and confirm the account and
the uploaded resume are still there; that checks the two volumes.

If a step fails, `docker compose logs <service>` shows why.

## Data

- **Back up** the `mongo-data` and `backend-storage` volumes together; the database refers to
  files in the uploads volume.
- **Existing local data** from development lives in `backend/data/local_db` and is not used by the
  containers. Moving it, or upgrading records written by early versions, is described in
  [`DATA_COMPATIBILITY.md`](DATA_COMPATIBILITY.md). No migration runs automatically.
- `docker compose down` keeps the volumes. `docker compose down -v` deletes them and all user data.

## Operations notes

- To view diagnostics (`GET /api/v1/realtime`) in a deployment, give one account the role `admin`
  directly in the database, for example
  `db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })`, then call the
  endpoint with that account's access token. `/health` needs no sign-in.

- Resume processing runs inside the backend process. If the backend restarts during a job, the
  job is marked failed at the next start and the user can reprocess it from the resume page.
- Rate limits are per IP address: 1000 API requests and 15 sign-in or registration attempts per
  15 minutes. Behind a reverse proxy, make sure the client address is forwarded, or every user
  shares one limit.
- The backend enforces the 5 MB upload limit and checks that a file is a real PDF or DOCX. nginx
  accepts bodies up to 6 MB so that the backend's own error message reaches the user.
- Run one backend instance. The in-process job queue, the 15-minute job-search cache and the rate
  limiter are per process and are not shared between instances.

## Interview recordings: storage and retention

Recorded interview answers are stored only if a user switches recording on. They are kept in
`voice-recordings/` next to the upload directory. In the Compose stack that is
`/app/storage/voice-recordings`, inside the existing private `backend-storage` volume, so
recordings survive container restarts and no separate volume is needed. Files are written with
owner-only permissions and are served only to their owner through the API; the directory is not
published by nginx. Set `VOICE_RECORDING_DIR` to keep them elsewhere.

Retention needs no setup: the backend runs the retention job itself five seconds after every start
and then daily (see `docs/INTERVIEWS.md`). It costs nothing and uses no external service.

Optional, for deployments that also want it in cron (for example to be alerted by exit code):

```
# every day at 03:15; exit code 2 means a file could not be removed and is still scheduled
15 3 * * *  cd /path/to/skillbridge && docker compose exec -T backend node backend/dist/scripts/purgeVoiceRecordings.js
```

To check it: the backend log has a line starting `Voice retention:` after each run, with the
numbers removed and pending. A `pending` above zero that does not clear means a file cannot be
deleted (permissions or a read-only disk) and needs an operator.

Backups of the `backend-storage` volume contain recordings. Keep such backups no longer than the
longest retention offered (30 days), or exclude `voice-recordings/` from them.

## Before a release

```bash
pnpm install
pnpm typecheck && pnpm lint && pnpm build
pnpm test
cd ai && python -m pytest && cd ..
pnpm test:e2e
```
