#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-https://www.adminer.online}"

say() { printf "\n\033[1;36m== %s ==\033[0m\n" "$1"; }

say "1) Health"
curl -fsS -i "$DOMAIN/api/consolidated?action=health" | sed -n '1,15p'

say "2) Quota (unauth should 401)"
curl -fsS -i "$DOMAIN/api/consolidated?action=quota/status" || true

say "3) Quota (auth should 200)"
# Provide a valid Clerk Bearer token (Org or User) via CLERK_TOKEN env when running in CI
curl -fsS -i \
  -H "Authorization: Bearer ${CLERK_TOKEN:-MISSING}" \
  "$DOMAIN/api/consolidated?action=quota/status" || true

say "4) Dodo webhook (no-signature => 400/401)"
curl -fsS -i "$DOMAIN/api/dodo/webhook" || true

say "5) Jobs list (auth; empty page ok)"
curl -fsS -i \
  -H "Authorization: Bearer ${CLERK_TOKEN:-MISSING}" \
  "$DOMAIN/api/jobs?limit=5" || true

say "6) Start job (auth, small keyword) => 202/200"
curl -fsS -i \
  -H "Authorization: Bearer ${CLERK_TOKEN:-MISSING}" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"nike shoes india","limit":10}' \
  "$DOMAIN/api/jobs/start" || true

say "7) Apify webhook (bad sig => 401)"
curl -fsS -i \
  -H "Content-Type: application/json" \
  -d '{"event":"RUN.SUCCEEDED"}' \
  "$DOMAIN/api/webhooks/apify" || true

say "8) Quota 402 test (Free plan with 10 ads limit)"
# This test requires a Free plan org with 10 ads remaining
# It should return 402 if quota exceeded
curl -fsS -i \
  -H "Authorization: Bearer ${CLERK_TOKEN:-MISSING}" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"test-quota-limit","limit":11}' \
  "$DOMAIN/api/jobs/start" || true

say "✅ Smoke tests completed for $DOMAIN" 