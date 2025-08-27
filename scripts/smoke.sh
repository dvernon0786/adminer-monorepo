#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-${1:-}}"
APEX_URL="${APEX_URL:-${2:-}}"
WWW_URL="${WWW_URL:-${3:-}}"

if [[ -z "${BASE_URL}" ]]; then
  echo "Usage: BASE_URL=https://your-deploy-url.example \\"
  echo "       APEX_URL=https://adminer.online \\"
  echo "       WWW_URL=https://www.adminer.online \\"
  echo "       scripts/smoke.sh"
  exit 2
fi

function head() {
  curl -sS -o /dev/null -D - -I "$1"
}

function get() {
  curl -sS -o /dev/null -w "%{http_code}|%{content_type}" "$1"
}

echo "🔎 BASE_URL=${BASE_URL}"
[[ -n "${APEX_URL:-}" ]] && echo "🔎 APEX_URL=${APEX_URL}"
[[ -n "${WWW_URL:-}"  ]] && echo "🔎 WWW_URL=${WWW_URL}"

echo "== Canonical redirect: WWW → APEX =="
if [[ -n "${WWW_URL:-}" && -n "${APEX_URL:-}" ]]; then
  STATUS_LOC=$(head "${WWW_URL}" | awk '/^HTTP\/|^location:/ {print}')
  echo "${STATUS_LOC}"
  echo "${STATUS_LOC}" | grep -qi "HTTP/.* 301" || { echo "❌ Expected 301 from WWW"; exit 1; }
  echo "${STATUS_LOC}" | grep -qi "location: ${APEX_URL}/\?$" || { echo "❌ Expected Location: ${APEX_URL}"; exit 1; }
else
  echo "⚠️  Skipping WWW→APEX (env not provided)"
fi

echo "== SPA routes return HTML 200 =="
for path in "/" "/dashboard" "/sign-in" ; do
  OUT=$(get "${BASE_URL}${path}")
  CODE="${OUT%%|*}"; CT="${OUT##*|}"
  echo "${path} -> ${CODE} ${CT}"
  [[ "${CODE}" == "200" ]] || { echo "❌ ${path} not 200"; exit 1; }
  echo "${CT}" | grep -qi "text/html" || { echo "❌ ${path} not HTML"; exit 1; }
done

echo "== API health =="
OUT=$(get "${BASE_URL}/api/consolidated?action=health")
CODE="${OUT%%|*}"; CT="${OUT##*|}"
echo "/api/consolidated?action=health -> ${CODE} ${CT}"
[[ "${CODE}" == "200" ]] || { echo "❌ health not 200"; exit 1; }

echo "== Webhook GET is 405 =="
OUT=$(get "${BASE_URL}/api/webhooks/apify")
CODE="${OUT%%|*}"
echo "/api/webhooks/apify (GET) -> ${CODE}"
[[ "${CODE}" == "405" ]] || { echo "❌ webhook GET should be 405"; exit 1; }

echo "✅ Smoke passed" 