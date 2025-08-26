#!/usr/bin/env bash
set -euo pipefail

: "${DOMAIN:?Set DOMAIN, e.g. http://localhost:3000}"

# Development mode headers for testing without real Clerk tokens
DEV_HEADERS_FREE="-H x-dev-user-id:dev-user-123 -H x-dev-org-id:dev-org-free -H x-dev-plan:free"
DEV_HEADERS_PRO="-H x-dev-user-id:dev-user-456 -H x-dev-org-id:dev-org-pro -H x-dev-plan:pro"
DEV_HEADERS_ENT="-H x-dev-user-id:dev-user-789 -H x-dev-org-id:dev-org-ent -H x-dev-plan:enterprise"

# Optional: Route overrides (for different API shapes)
: "${ROUTE_ROOT:=/}"
: "${ROUTE_DASH:=/dashboard}"
: "${ROUTE_HEALTH:=/api/consolidated?action=health}"
: "${ROUTE_DB_PING:=/api/consolidated?action=db/ping}"
: "${ROUTE_QUOTA:=/api/consolidated?action=quota/status}"
: "${ROUTE_JOBS_CREATE:=/api/jobs/create}"
: "${ROUTE_DODO_WEBHOOK:=/api/dodo/webhook}"

# Optional: JSON key overrides (tolerant to shape diffs)
: "${KEY_STATUS:=status}"
: "${KEY_PLAN:=plan}"
: "${KEY_LIMIT:=limit}"
: "${KEY_USED:=used}"
: "${KEY_REMAIN:=remaining}"
: "${KEY_CAP:=perKeywordCap}"
: "${KEY_OK:=ok}"
: "${KEY_REQ:=requested}"
: "${KEY_ALLOWED:=allowed}"
: "${KEY_IMPORTED:=imported}"
: "${KEY_JOBID:=jobId}"
: "${KEY_ERRCODE:=code}"
: "${KEY_Q_ALTERNATES:=quota.allowed,quotaAllowed,maxAllowed}"
: "${KEY_REQ_ALTERNATES:=limit,adsRequested}"
: "${KEY_IMP_ALTERNATES:=adsImported,importedCount}"

# Optional org IDs (just for logs)
: "${ORG_ID_FREE:=dev-org-free}"
: "${ORG_ID_PRO:=dev-org-pro}"
: "${ORG_ID_ENT:=dev-org-ent}"

CURL="curl -sS -D /tmp/headers.txt -o /tmp/body.txt"
JQ="jq -r"

print_h1() { printf "\n\033[1;36m== %s ==\033[0m\n" "$*"; }
print_kv() { printf "• %s: %s\n" "$1" "$2"; }
url() { echo "${DOMAIN}$1"; }

parse_status(){ grep -i '^HTTP/' /tmp/headers.txt | tail -1 | awk '{print $2}'; }
expect_status(){ local want="$1"; local got; got="$(parse_status)"; [[ "${got}" == "${want}" ]] || { echo "Expected ${want}, got ${got}"; cat /tmp/headers.txt; echo; cat /tmp/body.txt; exit 1; }; echo "OK (${want})"; }
jq_get(){ ${JQ} "$1" /tmp/body.txt 2>/dev/null; }
jq_try(){ local primary="$1"; local alts="${2:-}"; local v; v="$(jq_get ".${primary}")"; if [[ -n "$v" ]]; then echo "$v"; return 0; fi; IFS=',' read -ra arr <<< "${alts}"; for p in "${arr[@]}"; do p="$(echo "$p" | xargs)"; [[ -z "$p" ]] && continue; v="$(jq_get ".${p}")"; if [[ -n "$v" ]]; then echo "$v"; return 0; fi; done; echo "null"; return 1; }

# Development mode auth functions using headers instead of JWT tokens
dev_auth_get() { local headers="$1"; local path="$2"; eval "${CURL} ${headers} \"$(url "${path}")\""; }
dev_auth_post_json() { local headers="$1"; local path="$2"; local json="$3"; eval "${CURL} ${headers} -H \"Content-Type: application/json\" -X POST \"$(url "${path}")\" --data '${json}'"; }

print_h1 "Root serves SPA"
${CURL} "$(url "${ROUTE_ROOT}")"
expect_status "200"
if ! (grep -qi "<!doctype html" /tmp/body.txt && (grep -qi "<div id=\"root\"" /tmp/body.txt || grep -qi "<div id=\"app\"" /tmp/body.txt)); then echo "SPA root markers not found"; head -n 60 /tmp/body.txt || true; exit 1; fi
echo "OK SPA root"

print_h1 "Dashboard route present"
${CURL} "$(url "${ROUTE_DASH}")" || true
dash_code="$(parse_status)"
if [[ "${dash_code}" =~ ^(200|301|302|307|308)$ ]]; then echo "OK /dashboard reachable (HTTP ${dash_code})"; else echo "Warn: /dashboard returned ${dash_code}. Continuing."; fi

print_h1 "Health endpoint"
${CURL} "$(url "${ROUTE_HEALTH}")"
expect_status "200"
health="$(jq_try "${KEY_STATUS}" "state,health,statusText")"
[[ "${health}" == "healthy" ]] || { echo "Health not healthy: ${health}"; cat /tmp/body.txt; exit 1; }
echo "OK health=${health}"

print_h1 "Database ping endpoint"
${CURL} "$(url "${ROUTE_DB_PING}")"
expect_status "200"
db_status="$(jq_try "${KEY_STATUS}" "state,statusText")"
db_conn="$(jq_try "db" "connection,connected")"
[[ "${db_status}" == "ok" && "${db_conn}" == "connected" ]] || { echo "DB ping failed: status=${db_status}, db=${db_conn}"; cat /tmp/body.txt; exit 1; }
echo "OK database connected"

print_h1 "Quota unauthorized (no dev headers)"
${CURL} "$(url "${ROUTE_QUOTA}")" || true
expect_status "401"

print_h1 "Quota status - Free (${ORG_ID_FREE})"
dev_auth_get "${DEV_HEADERS_FREE}" "${ROUTE_QUOTA}"
expect_status "200"
plan="$(jq_try "${KEY_PLAN}" "")"
[[ "${plan}" == "free" ]] || { echo "Expected plan=free, got ${plan}"; exit 1; }
cap="$(jq_try "${KEY_CAP}" "cap,limits.perKeyword,per_keyword_cap")"
[[ -n "${cap}" && "${cap}" != "null" && "${cap}" -ge 10 ]] || { echo "Expected perKeywordCap >= 10"; cat /tmp/body.txt; exit 1; }
lim="$(jq_try "${KEY_LIMIT}" "limits.monthly,quota.limit")"
rem="$(jq_try "${KEY_REMAIN}" "limits.remaining,quota.remaining")"
[[ "${lim}" == "null" && "${rem}" == "null" ]] || { echo "Free should have limit=null, remaining=null"; cat /tmp/body.txt; exit 1; }
echo "OK Free quota shape"

print_h1 "Quota status - Pro (${ORG_ID_PRO})"
dev_auth_get "${DEV_HEADERS_PRO}" "${ROUTE_QUOTA}"
expect_status "200"
plan="$(jq_try "${KEY_PLAN}" "")"
lim="$(jq_try "${KEY_LIMIT}" "limits.monthly,quota.limit")"
used="$(jq_try "${KEY_USED}" "usage.used,quota.used")"
rem="$(jq_try "${KEY_REMAIN}" "limits.remaining,quota.remaining")"
[[ "${plan}" == "pro" && "${lim}" != "null" ]] || { echo "Pro should have numeric limit"; exit 1; }
print_kv "limit" "${lim}"; print_kv "used" "${used}"; print_kv "remaining" "${rem}"

print_h1 "Quota status - Enterprise (${ORG_ID_ENT})"
dev_auth_get "${DEV_HEADERS_ENT}" "${ROUTE_QUOTA}"
expect_status "200"
plan="$(jq_try "${KEY_PLAN}" "")"
lim="$(jq_try "${KEY_LIMIT}" "limits.monthly,quota.limit")"
rem="$(jq_try "${KEY_REMAIN}" "limits.remaining,quota.remaining")"
[[ "${plan}" == "enterprise" && "${lim}" != "null" ]] || { echo "Enterprise should have numeric limit"; exit 1; }
print_kv "limit" "${lim}"; print_kv "remaining" "${rem}"

print_h1 "Job creation - Free plan (limit=200) -> expect allowed<=10"
REQ='{"keyword":"nike shoes","limit":200}'
dev_auth_post_json "${DEV_HEADERS_FREE}" "${ROUTE_JOBS_CREATE}" "${REQ}"
expect_status "200"
req_val="$(jq_try "${KEY_REQ}" "${KEY_REQ_ALTERNATES}")"
[[ "${req_val}" == "200" ]] || { echo "Expected requested=200, got ${req_val}"; exit 1; }
allowed="$(jq_try "${KEY_ALLOWED}" "${KEY_Q_ALTERNATES}")"
[[ -n "${allowed}" && "${allowed}" -le 10 ]] || { echo "Free clamp failed: allowed=${allowed} (want <=10)"; cat /tmp/body.txt; exit 1; }
echo "OK Free clamp allowed=${allowed}"

print_h1 "Job creation - Pro plan (limit=100) -> expect allowed == requested"
REQ='{"keyword":"adidas originals","limit":100}'
dev_auth_post_json "${DEV_HEADERS_PRO}" "${ROUTE_JOBS_CREATE}" "${REQ}"
expect_status "200"
allowed="$(jq_try "${KEY_ALLOWED}" "${KEY_Q_ALTERNATES}")"
[[ "${allowed}" == "100" ]] || { echo "Expected allowed=100, got ${allowed}"; exit 1; }
echo "OK Pro allowed=${allowed}"

print_h1 "Job creation - Enterprise plan (limit=1500)"
REQ='{"keyword":"iphone 16 launch","limit":1500}'
dev_auth_post_json "${DEV_HEADERS_ENT}" "${ROUTE_JOBS_CREATE}" "${REQ}"
expect_status "200"
allowed="$(jq_try "${KEY_ALLOWED}" "${KEY_Q_ALTERNATES}")"
[[ "${allowed}" == "1500" ]] || { echo "Expected allowed=1500, got ${allowed}"; exit 1; }
echo "OK Enterprise allowed=${allowed}"

print_h1 "Dodo webhook endpoint exists"
${CURL} -X POST "$(url "${ROUTE_DODO_WEBHOOK}")" || true
CODE="$(parse_status)"
if [[ "${CODE}" == "404" ]]; then echo "Webhook endpoint missing (404)"; exit 1; fi
echo "OK webhook endpoint present (HTTP ${CODE})"

echo ""
echo "🎉 All smoke checks passed in development mode!"
echo ""
echo "Your API is working perfectly with:"
echo "✅ Health endpoint"
echo "✅ Database connectivity"
echo "✅ Quota endpoints for all plans"
echo "✅ Job creation with proper quota enforcement"
echo "✅ Webhook endpoint accessibility"
echo ""
echo "When ready for production:"
echo "1. Remove DEV_MODE=true from environment"
echo "2. Add real Clerk JWT tokens to scripts/smoke-local.env"
echo "3. Run: npm run smoke:local" 