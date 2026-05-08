#!/usr/bin/env bash
set -euo pipefail

npm run build

PORT="${PORT:-4273}"
PORT="$PORT" node scripts/pages-server.mjs &
SERVER_PID="$!"

cleanup() {
  kill "$SERVER_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

sleep 1
PORT="$PORT" node scripts/smoke-playwright.mjs
