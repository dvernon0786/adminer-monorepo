#!/usr/bin/env bash
set -euo pipefail

: "${DOMAIN:?Set DOMAIN, e.g. https://www.adminer.online}"
: "${CLERK_JWT_FREE:?Set CLERK_JWT_FREE}"
: "${CLERK_JWT_PRO:?Set CLERK_JWT_PRO}"
: "${CLERK_JWT_ENT:?Set CLERK_JWT_ENT}"

: "${ROUTE_ROOT:=/}"
: "${ROUTE_DASH:=/dashboard}"
: "${ROUTE_HEALTH:=/api/consolidated?action=health}"
: "${ROUTE_QUOTA:=/api/consolidated?action=quota/status}"
: "${ROUTE_JOBS_CREATE:=/api/jobs/create}"
: "${ROUTE_DODO_WEBHOOK:=/api/dodo/webhook}"

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

: "${ORG_ID_FREE:=unknown}"
: "${ORG_ID_PRO:=unknown}"
: "${ORG_ID_ENT:=unknown}"

CURL="curl -sS -D /tmp/headers.txt -o /tmp/body.txt"
JQ="jq -r"

print_h1() { printf "\n\033[1;36m== %s ==\033[0m\n" "$*"; }
print_kv() { printf "• %s: %s\n" "$1" "$2"; }
url() { echo "${DOMAIN}$1"; }

parse_status(){ grep -i '^HTTP/' /tmp/headers.txt | tail -1 | awk '{print $2}'; }
expect_status(){ local want="$1"; local got; got="$(parse_status)"; [[ "${got}" == "${want}" ]] || { echo "Expected ${want}, got ${got}"; cat /tmp/headers.txt; echo; cat /tmp/body.txt; exit 1; }; echo "OK (${want})"; }
jq_get(){ ${JQ} "$1" /tmp/body.txt 2>/dev/null; }
jq_try(){ local primary="$1"; local alts="${2:-}"; local v; v="$(jq_get ".${primary}")"; if [[ -n "$v" && "$v" != "null" ]]; then echo "$v"; return 0; fi; IFS=',' read -ra arr <<< "${alts}"; for p in "${arr[@]}"; do p="$(echo "$p" | xargs)"; [[ -z "$p" ]] && continue; v="$(jq_get ".${p}")"; if [[ -n "$v" && "$v" != "null" ]]; then echo "$v"; return 0; fi; done; echo ""; return 1; }
auth_get(){ local token="$1"; local path="$2"; ${CURL} -H "Authorization: Bearer ${token}" "$(url "${path}")"; }
auth_post_json(){ local token="$1"; local path="$2"; local json="$3"; ${CURL} -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" -X POST "$(url "${path}")" --data "${json}"; }

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

print_h1 "Quota unauthorized"
${CURL} "$(url "${ROUTE_QUOTA}")" || true
expect_status "401"

print_h1 "Quota status - Free (${ORG_ID_FREE})"
auth_get "${CLERK_JWT_FREE}" "${ROUTE_QUOTA}"
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
auth_get "${CLERK_JWT_PRO}" "${ROUTE_QUOTA}"
expect_status "200"
plan="$(jq_try "${KEY_PLAN}" "")"
lim="$(jq_try "${KEY_LIMIT}" "limits.monthly,quota.limit")"
used="$(jq_try "${KEY_USED}" "usage.used,quota.used")"
rem="$(jq_try "${KEY_REMAIN}" "limits.remaining,quota.remaining")"
[[ "${plan}" == "pro" && "${lim}" != "null" ]] || { echo "Pro should have numeric limit"; exit 1; }
print_kv "limit" "${lim}"; print_kv "used" "${used}"; print_kv "remaining" "${rem}"

print_h1 "Quota status - Enterprise (${ORG_ID_ENT})"
auth_get "${CLERK_JWT_ENT}" "${ROUTE_QUOTA}"
expect_status "200"
plan="$(jq_try "${KEY_PLAN}" "")"
lim="$(jq_try "${KEY_LIMIT}" "limits.monthly,quota.limit")"
rem="$(jq_try "${KEY_REMAIN}" "limits.remaining,quota.remaining")"
[[ "${plan}" == "enterprise" && "${lim}" != "null" ]] || { echo "Enterprise should have numeric limit"; exit 1; }
print_kv "limit" "${lim}"; print_kv "remaining" "${rem}"

print_h1 "Create job (Free): clamp to <=10"
REQ_JSON='{"keyword":"nike shoes","limit":200}'
auth_post_json "${CLERK_JWT_FREE}" "${ROUTE_JOBS_CREATE}" "${REQ_JSON}"
expect_status "200"
req_val="$(jq_try "${KEY_REQ}" "${KEY_REQ_ALTERNATES}")"
allowed_val="$(jq_try "${KEY_ALLOWED}" "${KEY_Q_ALTERNATES}")"
imp_val="$(jq_try "${KEY_IMPORTED}" "${KEY_IMP_ALTERNATES}")"
job_id="$(jq_try "${KEY_JOBID}" "id,job.id")"
[[ "${req_val}" == "200" ]] || { echo "requested mismatch: ${req_val}"; exit 1; }
[[ -n "${allowed_val}" && "${allowed_val}" != "null" && "${allowed_val}" -le 10 ]] || { echo "Free clamp failed (allowed=${allowed_val})"; cat /tmp/body.txt; exit 1; }
print_kv "jobId" "${job_id}"

print_h1 "Create job (Pro): respect remaining"
auth_get "${CLERK_JWT_PRO}" "${ROUTE_QUOTA}"; expect_status "200"
pro_rem="$(jq_try "${KEY_REMAIN}" "limits.remaining,quota.remaining")"
REQ_JSON='{"keyword":"adidas originals","limit":9999}'
set +e
auth_post_json "${CLERK_JWT_PRO}" "${ROUTE_JOBS_CREATE}" "${REQ_JSON}"
HTTP_CODE="$(parse_status)"
set -e
if [[ "${HTTP_CODE}" == "200" ]]; then
  allowed_val="$(jq_try "${KEY_ALLOWED}" "${KEY_Q_ALTERNATES}")"
  if [[ -z "${allowed_val}" || "${allowed_val}" == "null" ]]; then echo "No 'allowed' in Pro response"; cat /tmp/body.txt; exit 1; fi
  if [[ "${pro_rem}" =~ ^[0-9]+$ ]] && (( allowed_val > pro_rem )); then echo "allowed > remaining"; cat /tmp/body.txt; exit 1; fi
  echo "OK Pro allowed=${allowed_val} (remaining=${pro_rem})"
elif [[ "${HTTP_CODE}" == "402" ]]; then
  errcode="$(jq_try "${KEY_ERRCODE}" "error.code,code")"
  [[ "${errcode}" == "QUOTA_EXCEEDED" ]] || { echo "Expected QUOTA_EXCEEDED"; cat /tmp/body.txt; exit 1; }
  echo "OK Pro exhausted -> 402"
else
  echo "Unexpected HTTP ${HTTP_CODE} (Pro)"; cat /tmp/headers.txt; echo; cat /tmp/body.txt; exit 1
fi

print_h1 "Create job (Enterprise): big ask"
auth_get "${CLERK_JWT_ENT}" "${ROUTE_QUOTA}"; expect_status "200"
ent_rem="$(jq_try "${KEY_REMAIN}" "limits.remaining,quota.remaining")"
REQ_JSON='{"keyword":"iphone 16 launch","limit":1500}'
set +e
auth_post_json "${CLERK_JWT_ENT}" "${ROUTE_JOBS_CREATE}" "${REQ_JSON}"
HTTP_CODE="$(parse_status)"
set -e
if [[ "${HTTP_CODE}" == "200" ]]; then
  allowed_val="$(jq_try "${KEY_ALLOWED}" "${KEY_Q_ALTERNATES}")"
  echo "OK Enterprise allowed=${allowed_val} (remaining=${ent_rem})"
elif [[ "${HTTP_CODE}" == "402" ]]; then
  errcode="$(jq_try "${KEY_ERRCODE}" "error.code,code")"
  [[ "${errcode}" == "QUOTA_EXCEEDED" ]] || { echo "Enterprise 402 must be QUOTA_EXCEEDED"; cat /tmp/body.txt; exit 1; }
  echo "OK Enterprise exhausted -> 402"
else
  echo "Unexpected HTTP ${HTTP_CODE} (Enterprise)"; cat /tmp/headers.txt; echo; cat /tmp/body.txt; exit 1
fi

print_h1 "Dodo webhook endpoint presence"
${CURL} -X POST "$(url "${ROUTE_DODO_WEBHOOK}")" || true
code="$(parse_status)"
[[ "${code}" != "404" ]] || { echo "Webhook 404 (missing)"; exit 1; }
echo "OK webhook present (HTTP ${code})"

echo ""
echo "✅ All smoke checks passed." 