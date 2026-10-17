#!/usr/bin/env bash
# CI checks for the local-AI career-match explanations (docs/AI_EXPLANATIONS.md), run against an
# isolated skillbridge-ci-<id> project started by compose-isolated.sh. No model is downloaded, so
# no check here can pass on a real explanation; generation is exercised with stubs only.
#
#   COMPOSE_PROJECT_NAME=skillbridge-ci-<id> bash e2e/ci/explanation-tests.sh <command>
#
#   ai-service  the running AI service: facts with injected instructions are refused before any
#               model runs, and without a local model valid facts get the labelled AI_UNAVAILABLE
#   backend     the backend explanation suite (ownership, identities, caching, staleness, locks,
#               labelled failures, account deletion, unchanged scores) with its in-process stub AI
#               service, in the backend build image, against a dedicated skillbridge_ci_* database
#               in this project's MongoDB (dropped before and after)
#   ai          the AI service's explanation tests (validator, untrusted facts, local-only routing,
#               busy/timeout/rejected) in the built AI image, with a fake Ollama on loopback; only
#               pytest (pinned, about 1 MB) is installed into the throwaway container
#
# Everything created here is named for the project or removed at once: the test image is tagged
# <project>-backend-tests, so compose-isolated.sh down removes it even if a step fails.
set -euo pipefail
die() { echo "explanation-tests: $*" >&2; exit 1; }
PROJECT="${COMPOSE_PROJECT_NAME:-}"
[[ "$PROJECT" =~ ^skillbridge-ci-[a-z0-9][a-z0-9-]*$ ]] || die "COMPOSE_PROJECT_NAME must match skillbridge-ci-<id> (got '${PROJECT}')"
cd "$(dirname "$0")/../.."
PYTEST_VERSION="9.1.1"

ai_service() {
  docker compose exec -T backend node - < e2e/ci/explain-ai-service.mjs
}

backend() {
  local image="${PROJECT}-backend-tests" network="${PROJECT}_skillbridge-network"
  # Named for this run, and reachable only on this run's network (its own MongoDB container): the
  # suite refuses any name but skillbridge_ci_*, and drops only this database before and after
  local database="skillbridge_ci_explanation_$(printf '%s' "${PROJECT#skillbridge-ci-}" | tr -c 'a-z0-9' '_')"
  # The builder stage of the backend image: same lockfile and sources, with the dev dependencies
  # (tsx, the test helpers). Its layers are already cached by the Compose build.
  docker build --quiet --target builder -f backend/Dockerfile -t "$image" . >/dev/null
  docker network inspect "$network" >/dev/null 2>&1 || die "network $network not found; is the project up?"
  local status=0
  docker run --rm --network "$network" -w /app/backend \
    -e EXPLANATION_TEST_MONGODB_URI="mongodb://mongodb:27017/${database}" \
    "$image" node_modules/.bin/tsx src/tests/career_explanations.test.ts || status=$?
  docker rmi "$image" >/dev/null || true
  return "$status"
}

ai() {
  local image="${PROJECT}-ai-service"
  docker image inspect "$image" >/dev/null 2>&1 || die "image $image not found; is the project built?"
  # The image excludes tests (ai/.dockerignore), so they are mounted read-only; the code under test
  # is the image's own. Outbound connections are blocked by the tests once pytest is installed.
  docker run --rm --entrypoint sh -v "$PWD/ai/tests:/app/tests:ro" "$image" -c \
    "pip install --user --no-cache-dir --disable-pip-version-check --quiet pytest==${PYTEST_VERSION} \
     && python -m pytest -q -p no:cacheprovider tests/test_career_explanation.py"
}

case "${1:-}" in
  ai-service) ai_service ;;
  backend) backend ;;
  ai) ai ;;
  *) die "usage: $0 ai-service|backend|ai" ;;
esac
