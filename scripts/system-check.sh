#!/usr/bin/env bash
set -euo pipefail

# Debug trace
echo "🔎 DEBUG(system-check): arg[1] = ${1:-<empty>}"
echo "🔎 DEBUG(system-check): APEX_URL = ${APEX_URL:-<unset>}"

# Accept URL from arg or environment
BASE="${1:-${APEX_URL:-}}"

if [[ -z "$BASE" ]]; then
  echo "❌ No deployment URL provided (arg or APEX_URL env required)"
  exit 1
fi

fail() { echo "❌ $1"; exit 1; }
ok()   { echo "✅ $1"; }

echo "🔎 Target: $BASE"

# 1) SPA index loads
echo "⛅ Fetching index.html..."
curl -fsSL "$BASE/" -D headers.txt -o smoke_index.html || fail "GET / failed"
ok "Index fetched"

# 2) parse main bundle from index.html
echo "🔗 Parsing main bundle ref..."
BUNDLE="$(grep -oE '/assets/index-[A-Za-z0-9]+\.js' smoke_index.html | head -n1 || true)"
[ -n "${BUNDLE:-}" ] || fail "No JS bundle reference found in index.html"
ok "Found bundle: $BUNDLE"

# 3) bundle is fetchable
echo "📦 Fetching bundle..."
curl -fsSL "$BASE$BUNDLE" -o smoke_bundle.js || fail "Bundle fetch failed: $BUNDLE"
ok "Bundle fetched"

# 4) bundle sanity (Clerk key present, no proxy leak)
grep -qE 'pk_(test|live)_' smoke_bundle.js \
  && ok "Clerk publishable key signature present in bundle" \
  || echo "⚠️  Clerk key pattern not found (verify Vite env injection)."

! grep -q "https://clerk\.adminer\.online" smoke_index.html \
  && ok "No proxy leak in index.html" \
  || fail "Proxy leak: clerk.adminer.online present in index.html"

# 5) cache headers & content-type sanity for bundle
echo "🗂  Inspecting bundle headers..."
curl -fsSI "$BASE$BUNDLE" -o smoke_bundle.headers || fail "HEAD bundle failed"
grep -qi 'content-type:.*javascript' smoke_bundle.headers && ok "Content-Type JS" || echo "⚠️  Content-Type not JS"
grep -qi 'cache-control:.*(max-age|public)' smoke_bundle.headers && ok "Cache-Control present" || echo "⚠️  Cache-Control missing"

# 6) middleware not blocking assets (401/403 would be bad)
STATUS_ASSET=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$BUNDLE")
[ "$STATUS_ASSET" = "200" ] && ok "Assets not blocked by middleware" || fail "Asset HTTP $STATUS_ASSET (blocked?)"

# 7) SPA client-side routes should serve index (not 404/401)
STATUS_DASH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/dashboard")
[ "$STATUS_DASH" = "200" ] && ok "/dashboard serves (SPA fallback ok)" || fail "/dashboard returned $STATUS_DASH"

# 8) health endpoint
STATUS_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/consolidated?action=health")
[ "$STATUS_HEALTH" = "200" ] && ok "Health endpoint 200" || fail "Health endpoint $STATUS_HEALTH"

# 9) quota endpoint (accept 200, 401, or 402 depending on auth/quota)
STATUS_QUOTA=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/consolidated?action=quota/status")
echo "🧮 quota/status -> $STATUS_QUOTA"
case "$STATUS_QUOTA" in
  200|401|402) ok "Quota endpoint behaving as expected ($STATUS_QUOTA)";;
  *) fail "Quota endpoint unexpected status: $STATUS_QUOTA";;
esac

# 10) optional version header (nice-to-have)
if grep -qi '^x-app-version:' headers.txt; then
  VER=$(grep -i '^x-app-version:' headers.txt | awk '{print $2}' | tr -d '\r')
  ok "X-App-Version present ($VER)"
else
  echo "ℹ️  X-App-Version header not found (optional). Add if you want provenance."
fi

echo "🎉 ALL CHECKS PASSED for $BASE" 