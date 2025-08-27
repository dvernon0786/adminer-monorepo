#!/usr/bin/env bash
set -euo pipefail

APEX="https://adminer.online"
WWW="https://www.adminer.online"

echo "🔍 Running Adminer redirect + smoke test suite..."

# Helper: assert contains substring
assert_contains() {
  local haystack="$1"
  local needle="$2"
  local msg="$3"
  if [[ "$haystack" != *"$needle"* ]]; then
    echo "❌ $msg"
    echo "   Got: $haystack"
    exit 1
  else
    echo "✅ $msg ($needle found)"
  fi
}

# --- Redirect Tests ---
echo -n "Apex /dashboard ... "
status=$(curl -sI "$APEX/dashboard" | head -n1)
assert_contains "$status" "200" "Apex /dashboard should return 200"

echo -n "WWW /dashboard redirect ... "
status=$(curl -sI "$WWW/dashboard" | head -n1)
location=$(curl -sI "$WWW/dashboard" | grep -i '^location:' || true)
assert_contains "$status" "301" "WWW /dashboard should return 301"
assert_contains "$location" "$APEX/dashboard" "WWW /dashboard should redirect to apex"

# --- SPA Route Smoke Tests ---
echo -n "Root / ... "
status=$(curl -sI "$APEX/" | head -n1)
assert_contains "$status" "200" "Root should return 200"

echo -n "Sign-in /sign-in ... "
status=$(curl -sI "$APEX/sign-in" | head -n1)
assert_contains "$status" "200" "Sign-in should return 200"

echo -n "Admin webhooks /admin/webhooks ... "
status=$(curl -sI "$APEX/admin/webhooks" | head -n1)
assert_contains "$status" "200" "Admin webhooks should return 200"

# --- API Endpoint Smoke Tests ---
echo -n "API health ... "
status=$(curl -sI "$APEX/api/consolidated?action=health" | head -n1)
assert_contains "$status" "200" "API health should return 200"

echo -n "API webhook GET (should be 405) ... "
status=$(curl -sI "$APEX/api/payments/webhook" | head -n1)
assert_contains "$status" "405" "API webhook GET should return 405"

echo "🎉 All redirect + smoke tests passed!" 