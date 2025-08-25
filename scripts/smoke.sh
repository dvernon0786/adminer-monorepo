#!/usr/bin/env bash
set -euo pipefail

# =========================
# Config (env-driven)
# =========================
: "${DOMAIN:?Set DOMAIN, e.g. https://www.adminer.online}"

# Clerk session JWTs for org-scoped users
# - CLERK_JWT_FREE should resolve to an org on Free plan
# - CLERK_JWT_PRO  should resolve to an org on Pro plan
# - CLERK_JWT_ENT  should resolve to an org on Enterprise plan
: "${CLERK_JWT_FREE:?Set CLERK_JWT_FREE}"
: "${CLERK_JWT_PRO:?Set CLERK_JWT_PRO}"
: "${CLERK_JWT_ENT:?Set CLERK_JWT_ENT}"

# Optional explicit org IDs (only used for echo/logging)
: "${ORG_ID_FREE:=unknown}"
: "${ORG_ID_PRO:=unknown}"
: "${ORG_ID_ENT:=unknown}"

CURL="curl -sS -D /tmp/headers.txt -o /tmp/body.txt"
JQ="jq -r"

print_section() { printf "\n\033[1;36m== %s ==\033[0m\n" "$*"; }
expect_status() {
  local want="$1"
  local got
  got="$(awk 'tolower($1$2)=="http/1.1200"{print 200} tolower($1$2)=="http/2" {print $3} tolower($1)=="http/1.1" {print $2}' /tmp/headers.txt | tail -1)"
  # Fallback generic parse:
  if [[ -z "${got}" ]]; then got="$(grep -i '^HTTP/' /tmp/headers.txt | tail -1 | awk '{print $2}')" || true; fi
  if [[ "${got}" != "${want}" ]]; then
    echo "Expected HTTP ${want} but got ${got}"
    echo "--- Headers ---"; cat /tmp/headers.txt || true
    echo "--- Body ---"; cat /tmp/body.txt || true
    exit 1
  fi
  echo "OK (${want})"
}
expect_json() {
  local path="$1"; local matcher="$2"
  local val; val="$(${JQ} "${path}" /tmp/body.txt 2>/dev/null || echo "")"
  if [[ -z "${val}" || "${val}" == "null" ]]; then
    echo "JSON path ${path} not found or null"
    cat /tmp/body.txt || true
    exit 1
  fi
  if [[ "${matcher}" != "_" && "${val}" != "${matcher}" ]]; then
    echo "JSON ${path} expected '${matcher}', got '${val}'"
    cat /tmp/body.txt || true
    exit 1
  fi
  echo "OK ${path}=${val}"
}

auth_get() {
  local token="$1"; shift
  ${CURL} -H "Authorization: Bearer ${token}" "$@"
}
auth_post_json() {
  local token="$1"; local url="$2"; local json="$3"
  ${CURL} -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" -X POST "${url}" --data "${json}"
}

root_url()  { echo "${DOMAIN}/"; }
health_url(){ echo "${DOMAIN}/api/consolidated?action=health"; }
quota_url() { echo "${DOMAIN}/api/consolidated?action=quota/status"; }
jobs_url()  { echo "${DOMAIN}/api/jobs/start"; }

# =========================
# 1) Health & SPA
# =========================
print_section "Health endpoint"
${CURL} "$(health_url)"
expect_status "200"
expect_json '.status' 'healthy'

print_section "Root serves SPA"
${CURL} "$(root_url)"
expect_status "200"
# Presence of basic SPA markers
if ! (grep -qi "<!doctype html" /tmp/body.txt && grep -qi "<div id=\"root\"" /tmp/body.txt || grep -qi "<div id=\"app\"" /tmp/body.txt); then
  echo "SPA markers not found in root HTML"
  head -n 50 /tmp/body.txt || true
  exit 1
fi
echo "OK SPA root rendered"

# =========================
# 2) Auth & Quota status
# =========================
print_section "Quota unauthorized (no token)"
${CURL} "$(quota_url)" || true
expect_status "401"

print_section "Quota status - Free org"
auth_get "${CLERK_JWT_FREE}" "$(quota_url)"
expect_status "200"
expect_json '.plan' 'free'
expect_json '.perKeywordCap' '10'
expect_json '.limit' 'null'       # free has no monthly cap in the new model
expect_json '.remaining' 'null'

print_section "Quota status - Pro org"
auth_get "${CLERK_JWT_PRO}" "$(quota_url)"
expect_status "200"
expect_json '.plan' 'pro'
expect_json '.limit' '_'           # numeric
expect_json '.used' '_'            # numeric

print_section "Quota status - Enterprise org"
auth_get "${CLERK_JWT_ENT}" "$(quota_url)"
expect_status "200"
expect_json '.plan' 'enterprise'
expect_json '.limit' '_'           # numeric

# =========================
# 3) Job creation: Free plan clamp to 10 ads
# =========================
print_section "Create job on Free (limit=200) -> expect allowed<=10"
REQ='{"keyword":"nike shoes","limit":200}'
auth_post_json "${CLERK_JWT_FREE}" "$(jobs_url)" "${REQ}"
expect_status "200"
expect_json '.requested' '200'
# allowed should be <= 10 and imported <= allowed; we accept 10 or lower
ALLOWED="$(jq -r '.allowed // .quota?.allowed // empty' /tmp/body.txt)"
if [[ -z "${ALLOWED}" ]]; then
  echo "No 'allowed' in response"
  cat /tmp/body.txt || true
  exit 1
fi
if (( ALLOWED > 10 )); then
  echo "Free clamp failed: allowed=${ALLOWED} (want <=10)"
  cat /tmp/body.txt || true
  exit 1
fi
echo "OK Free clamp allowed=${ALLOWED}"

# =========================
# 4) Job creation: Pro plan respects monthly remaining
# =========================
print_section "Create job on Pro (limit=9999) -> expect allowed == remaining or 402 if none"
# First check remaining
auth_get "${CLERK_JWT_PRO}" "$(quota_url)"
expect_status "200"
REMAINING="$(jq -r '.remaining' /tmp/body.txt)"
if [[ "${REMAINING}" == "null" ]]; then
  echo "Remaining null for Pro; expected a number"
  cat /tmp/body.txt || true
  exit 1
fi
echo "Pro remaining=${REMAINING}"

REQ='{"keyword":"adidas originals","limit":9999}'
set +e
auth_post_json "${CLERK_JWT_PRO}" "$(jobs_url)" "${REQ}"
HTTP_CODE="$(grep -i '^HTTP/' /tmp/headers.txt | tail -1 | awk '{print $2}')"
set -e

if [[ "${HTTP_CODE}" == "200" ]]; then
  echo "200 OK (expected when remaining>0)"
  ALLOWED="$(jq -r '.allowed' /tmp/body.txt)"
  if [[ -z "${ALLOWED}" || "${ALLOWED}" == "null" ]]; then
    echo "No 'allowed' in response"
    cat /tmp/body.txt || true
    exit 1
  fi
  if (( ALLOWED > REMAINING )); then
    echo "Allowed ${ALLOWED} exceeds remaining ${REMAINING}"
    cat /tmp/body.txt || true
    exit 1
  fi
  echo "OK Pro allowed=${ALLOWED} within remaining=${REMAINING}"
elif [[ "${HTTP_CODE}" == "402" ]]; then
  echo "402 Payment Required (expected when remaining==0)"
  expect_json '.code' 'QUOTA_EXCEEDED'
else
  echo "Unexpected HTTP ${HTTP_CODE} on Pro job create"
  cat /tmp/headers.txt; echo "---"; cat /tmp/body.txt
  exit 1
fi

# =========================
# 5) Enterprise big ask should never 402 if remaining >0
# =========================
print_section "Create job on Enterprise (limit=1500)"
auth_get "${CLERK_JWT_ENT}" "$(quota_url)"; expect_status "200"
ENT_REMAIN="$(jq -r '.remaining' /tmp/body.txt)"
REQ='{"keyword":"iphone 16 launch","limit":1500}'
set +e
auth_post_json "${CLERK_JWT_ENT}" "$(jobs_url)" "${REQ}"
HTTP_CODE="$(grep -i '^HTTP/' /tmp/headers.txt | tail -1 | awk '{print $2}')"
set -e
if [[ "${HTTP_CODE}" == "402" ]]; then
  echo "Enterprise 402 — likely remaining==0; acceptable if exhausted. Check upgradeUrl."
  expect_json '.code' 'QUOTA_EXCEEDED'
else
  expect_status "200"
  ALLOWED="$(jq -r '.allowed' /tmp/body.txt)"
  if [[ -z "${ALLOWED}" || "${ALLOWED}" == "null" ]]; then
    echo "No 'allowed' in response"
    cat /tmp/body.txt || true
    exit 1
  fi
  echo "OK Enterprise allowed=${ALLOWED} (remaining=${ENT_REMAIN})"
fi

# =========================
# 6) Webhook endpoint presence (don't validate signature here)
# =========================
print_section "Dodo webhook endpoint exists"
${CURL} -X POST "${DOMAIN}/api/dodo/webhook" || true
# Accept 200/202/400/401 depending on signature checks; reject 404
CODE="$(grep -i '^HTTP/' /tmp/headers.txt | tail -1 | awk '{print $2}')"
if [[ "${CODE}" == "404" ]]; then
  echo "Webhook endpoint missing (404)"
  exit 1
fi
echo "OK webhook endpoint present (HTTP ${CODE})"

echo ""
echo "✅ All smoke checks passed." 