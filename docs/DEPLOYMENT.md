# Deployment

> **Status: not verified.** The Compose file and Dockerfiles in this repository have been reviewed
> and corrected by reading them, but they have never been built or started, because Docker was not
> available on the development machine. Treat this page as instructions to follow and check, not
> as a record of a working deployment. The verification steps are at the end.

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

If a step fails, `docker compose logs <service>` shows why. Do not mark the Docker item in
`docs/FINALIZATION_CHECKLIST.md` as done until all of the above pass.

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

## Before a release

```bash
pnpm install
pnpm typecheck && pnpm lint && pnpm build
pnpm test
cd ai && python -m pytest && cd ..
pnpm test:e2e
```
