#!/usr/bin/env bash
set -euo pipefail

npm run build

is_unsafe_browser_port() {
  case "$1" in
    5060 | 5061 | 6000 | 6566 | 6665 | 6666 | 6667 | 6668 | 6669 | 6697 | 10080)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

PORT="${PORT:-$((4273 + RANDOM % 600))}"
while is_unsafe_browser_port "$PORT" || lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; do
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
