#!/usr/bin/env bash
set -euo pipefail

npm run build

PORT="${PORT:-$((4300 + RANDOM % 1000))}"
while lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; do
  PORT="$((PORT + 1))"
done
PORT="$PORT" node scripts/pages-server.mjs &
SERVER_PID="$!"

cleanup() {
  kill "$SERVER_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

sleep 1
PORT="$PORT" node scripts/smoke-playwright.mjs
