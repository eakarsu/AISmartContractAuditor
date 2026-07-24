#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; cd "$project_dir"
test -f .env || { echo '.env is required (copy .env.example)' >&2; exit 1; }
set -a; source .env; set +a
test -d backend/node_modules || { echo 'Backend dependencies are missing; install them explicitly before starting' >&2; exit 1; }

if [[ "${NODE_ENV:-}" == "test" ]]; then
  echo "Starting API-only test runtime on port ${BACKEND_PORT:?BACKEND_PORT is required}."
  cd backend
  exec npm run dev
fi

test -d frontend/node_modules || { echo 'Frontend dependencies are missing; install them explicitly before starting' >&2; exit 1; }
mode="${1:-all}"; pids=(); trap 'for pid in "${pids[@]:-}"; do kill "$pid" 2>/dev/null || true; done' EXIT INT TERM
BACKEND_PORT="${BACKEND_PORT:-4000}"; FRONTEND_PORT="${FRONTEND_PORT:-3000}"
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 && { echo "Port $port is occupied; refusing to terminate another process" >&2; exit 1; }; done
if [[ "${MIGRATE_ON_START:-false}" == true ]]; then
  if ! psql "$DATABASE_URL" -Atqc "SELECT to_regclass('public.\"User\"') IS NOT NULL" | grep -qx t; then
    (cd backend && ./node_modules/.bin/prisma db push --skip-generate)
  fi
  ./scripts/migrate.sh
  node backend/runtimeBootstrap.js
fi
if [[ "$mode" == backend || "$mode" == all ]]; then (cd backend && exec ./node_modules/.bin/ts-node --files src/index.ts) & pids+=("$!"); fi
if [[ "$mode" == frontend || "$mode" == all ]]; then (cd frontend && exec env VITE_API_URL="http://127.0.0.1:$BACKEND_PORT" ./node_modules/.bin/vite --host 127.0.0.1 --port "$FRONTEND_PORT") & pids+=("$!"); fi
[[ ${#pids[@]} -gt 0 ]] || { echo 'Usage: ./start.sh [all|backend|frontend]' >&2; exit 2; }; wait
