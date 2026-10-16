#!/usr/bin/env bash
# Runs the Docker Compose stack as an isolated, throwaway project and removes only what that
# project created. Used by .github/workflows/docker-smoke.yml and for local CI validation beside
# a developer's running stack.
#
#   COMPOSE_PROJECT_NAME=skillbridge-ci-<id> bash e2e/ci/compose-isolated.sh <command>
#
#   preflight  refuse a reused project; record every container, volume and network outside it
#   up         build and start the project (waits for health)
#   verify     prove that every container, volume and network belongs to this project only
#   smoke      node e2e/docker-smoke.mjs against this project's published ports
#   down       remove this project's containers, volumes, networks and built images, then prove
#              that nothing recorded by preflight was touched
#   all        preflight, up, verify, smoke and (always) down
#
# Settings: SB_CI_ENV_FILE (synthetic settings; generated when unset), SB_CI_WEB_PORT and
# SB_CI_API_PORT (published ports, default 3000 and 5000), SB_CI_STATE_DIR (where the inventory is kept).
set -euo pipefail

die() { echo "compose-isolated: $*" >&2; exit 1; }

PROJECT="${COMPOSE_PROJECT_NAME:-}"
# The only names this script will ever act on. A developer's stack (skillbridge-parallel,
# skillbridge, ...) can never match, so `down -v` cannot reach its volumes.
[[ "$PROJECT" =~ ^skillbridge-ci-[a-z0-9][a-z0-9-]*$ ]] || die "COMPOSE_PROJECT_NAME must match skillbridge-ci-<id> (got '${PROJECT}')"

cd "$(dirname "$0")/../.."
case "$(uname -s)" in MINGW*|MSYS*|CYGWIN*) SEP=';' ;; *) SEP=':' ;; esac
export COMPOSE_FILE="docker-compose.yml${SEP}docker-compose.ci.yml"
export COMPOSE_PROJECT_NAME="$PROJECT"
export SB_CI_WEB_PORT="${SB_CI_WEB_PORT:-3000}" SB_CI_API_PORT="${SB_CI_API_PORT:-5000}"
STATE_DIR="${SB_CI_STATE_DIR:-${RUNNER_TEMP:-${TMPDIR:-/tmp}}/${PROJECT}}"
mkdir -p "$STATE_DIR"

# Synthetic settings only: the repository's .env (real secrets) is never read by this project.
ENV_FILE="${SB_CI_ENV_FILE:-$STATE_DIR/ci.env}"
if [ ! -f "$ENV_FILE" ]; then
  rand() { node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"; }
  {
    echo "JWT_ACCESS_SECRET=$(rand)"
    echo "JWT_REFRESH_SECRET=$(rand)"
    echo "INTERNAL_SERVICE_KEY=$(rand)"
    echo "FRONTEND_URL=http://localhost:${SB_CI_WEB_PORT}"
    echo "GEMINI_API_KEY="
    echo "RAPIDAPI_KEY="
    echo "ENABLE_LOCAL_MODEL=false"
  } > "$ENV_FILE"
fi
dc() { docker compose --env-file "$ENV_FILE" "$@"; }
LABEL="label=com.docker.compose.project=${PROJECT}"

outside_inventory() {
  {
    docker ps -a --format '{{.ID}} {{.Label "com.docker.compose.project"}}' | awk -v p="$PROJECT" '$2 != p { print "container " $1 }'
    docker volume ls --format '{{.Name}} {{.Label "com.docker.compose.project"}}' | awk -v p="$PROJECT" '$2 != p { print "volume " $1 }'
    docker network ls --format '{{.ID}} {{.Label "com.docker.compose.project"}}' | awk -v p="$PROJECT" '$2 != p { print "network " $1 }'
  } | sort
}

preflight() {
  [ -z "$(docker ps -aq --filter "$LABEL")$(docker volume ls -q --filter "$LABEL")" ] || die "project ${PROJECT} already has containers or volumes; use a new id"
  outside_inventory > "$STATE_DIR/outside.before"
  echo "preflight: ${PROJECT}; $(wc -l < "$STATE_DIR/outside.before") outside resources recorded"
}

up() {
  dc build
  dc up -d --wait --wait-timeout 300
}

verify() {
  local fail=0 config
  config="$(dc config --format json)"
  # Nothing in the resolved configuration may point outside the project
  printf '%s' "$config" | node -e '
    const c = JSON.parse(require("fs").readFileSync(0, "utf8")); const p = process.argv[1]; const bad = [];
    for (const [s, v] of Object.entries(c.services)) {
      if (v.container_name) bad.push(`${s}: fixed container_name ${v.container_name}`);
      for (const m of v.volumes || []) if (m.type !== "volume") bad.push(`${s}: ${m.type} mount ${m.source}`);
    }
    for (const [k, v] of Object.entries(c.volumes || {})) if (v.external || !String(v.name).startsWith(`${p}_`)) bad.push(`volume ${k} is ${v.name}${v.external ? " (external)" : ""}`);
    for (const [k, v] of Object.entries(c.networks || {})) if (v.external || !String(v.name).startsWith(`${p}_`)) bad.push(`network ${k} is ${v.name}${v.external ? " (external)" : ""}`);
    if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
  ' "$PROJECT" || fail=1
  # What is actually running is named for, labelled with and mounted from this project only
  local n
  for n in $(docker ps -a --filter "$LABEL" --format '{{.Names}}'); do
    [[ "$n" == "${PROJECT}-"* ]] || { echo "container $n is not named for ${PROJECT}"; fail=1; }
    for m in $(docker inspect -f '{{range .Mounts}}{{.Type}}:{{.Name}} {{end}}' "$n"); do
      [[ "$m" == "volume:${PROJECT}_"* ]] && continue
      # An image's own anonymous volume (e.g. mongo's /data/configdb): allowed only when no
      # container outside this project uses it; down removes it and checks that it is gone
      if [[ "$m" =~ ^volume:[0-9a-f]{64}$ ]]; then
        local users
        users="$(docker ps -a --filter "volume=${m#volume:}" --format '{{.Label "com.docker.compose.project"}}' | sort -u)"
        [ "$users" = "$PROJECT" ] && { echo "${m#volume:}" >> "$STATE_DIR/anonymous.volumes"; continue; }
      fi
      echo "container $n mounts $m"; fail=1
    done
  done
  for n in $(docker volume ls -q --filter "$LABEL"); do [[ "$n" == "${PROJECT}_"* ]] || { echo "volume $n not prefixed"; fail=1; }; done
  for n in $(docker network ls --filter "$LABEL" --format '{{.Name}}'); do [[ "$n" == "${PROJECT}_"* ]] || { echo "network $n not prefixed"; fail=1; }; done
  [ "$fail" -eq 0 ] || die "isolation check failed"
  echo "verify: $(docker ps -q --filter "$LABEL" | wc -l | tr -d ' ') containers, $(docker volume ls -q --filter "$LABEL" | wc -l | tr -d ' ') volumes, $(docker network ls -q --filter "$LABEL" | wc -l | tr -d ' ') networks, all ${PROJECT}-only"
}

smoke() {
  WEB_URL="http://localhost:${SB_CI_WEB_PORT}" API_URL="http://localhost:${SB_CI_API_PORT}" \
    SMOKE_STATE="$STATE_DIR/smoke-state.json" node e2e/docker-smoke.mjs
}

down() {
  # Re-checked here: down is the only destructive step
  [[ "$COMPOSE_PROJECT_NAME" =~ ^skillbridge-ci-[a-z0-9][a-z0-9-]*$ ]] || die "refusing down for '${COMPOSE_PROJECT_NAME}'"
  local v
  for v in $(docker volume ls -q --filter "$LABEL"); do [[ "$v" == "${PROJECT}_"* ]] || die "refusing down: volume $v is not ${PROJECT}'s"; done
  dc down -v --remove-orphans
  # Only the images built for this project (tagged <project>-<service>); pulled base images and
  # every other image, dangling or not, are left alone
  local img
  for img in $(docker images --format '{{.Repository}}:{{.Tag}}' | grep -E "^${PROJECT}-[a-z0-9-]+:" || true); do docker rmi "$img" >/dev/null; done
  [ -z "$(docker ps -aq --filter "$LABEL")$(docker volume ls -q --filter "$LABEL")$(docker network ls -q --filter "$LABEL")" ] || die "project resources remain after down"
  [ -z "$(docker images --format '{{.Repository}}' | grep -E "^${PROJECT}-" || true)" ] || die "project images remain after down"
  if [ -f "$STATE_DIR/anonymous.volumes" ]; then
    for v in $(sort -u "$STATE_DIR/anonymous.volumes"); do docker volume inspect "$v" >/dev/null 2>&1 && die "anonymous volume $v remains after down"; done
  fi
  if [ -f "$STATE_DIR/outside.before" ]; then
    local missing
    missing="$(comm -23 "$STATE_DIR/outside.before" <(outside_inventory))"
    [ -z "$missing" ] || die "resources outside ${PROJECT} disappeared: ${missing}"
    echo "down: ${PROJECT} removed; all $(wc -l < "$STATE_DIR/outside.before") outside resources still present"
  else
    echo "down: ${PROJECT} removed (no preflight inventory to compare)"
  fi
}

case "${1:-}" in
  preflight) preflight ;;
  up) up ;;
  verify) verify ;;
  smoke) smoke ;;
  down) down ;;
  all)
    preflight
    trap 'down' EXIT
    up
    verify
    smoke
    ;;
  *) die "usage: compose-isolated.sh preflight|up|verify|smoke|down|all" ;;
esac
