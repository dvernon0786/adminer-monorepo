#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://www.adminer.online}"
RETRIES="${RETRIES:-20}"           # total attempts per endpoint
SLEEP_SECS="${SLEEP_SECS:-5}"      # wait time between attempts

# endpoint|expected_status
ENDPOINTS=(
  "/|200"
  "/dashboard|200"
  "/sign-in|200"
  "/admin/webhooks|200"
  "/api/consolidated?action=health|200"
  "/api/payments/webhook|405"    # GET not allowed is OK for webhooks
)

log() { printf "%s\n" "$*" >&2; }

check_endpoint() {
  local path="$1" expect="$2"
  local url="${BASE_URL%/}${path}"
  local attempt=1

  while (( attempt <= RETRIES )); do
    # -L follows redirects; we only care about final status
    status="$(curl -sS -o /dev/null -w "%{http_code}" -L "$url" || true)"
    if [[ "$status" == "$expect" ]]; then
      log "✅  $url → $status (as expected)"
      return 0
    fi
    log "⏳  $url → $status (want $expect) [attempt $attempt/$RETRIES]; retrying in ${SLEEP_SECS}s..."
    sleep "$SLEEP_SECS"
    ((attempt++))
  done

  log "❌  $url did not return $expect after $RETRIES attempts"
  return 1
}

main() {
  log "🔎 Starting smoke tests against: $BASE_URL"
  local failures=0

  for entry in "${ENDPOINTS[@]}"; do
    IFS="|" read -r path expect <<<"$entry"
    if ! check_endpoint "$path" "$expect"; then
      ((failures++))
    fi
  done

  if (( failures > 0 )); then
    log "❌ Smoke tests failed ($failures failures)."
    exit 1
  fi

  log "🎉 All smoke tests passed."
}

main "$@" 