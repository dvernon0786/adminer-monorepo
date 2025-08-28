#!/usr/bin/env bash
set -euo pipefail
APEX="https://adminer.online"
WWW="https://www.adminer.online/dashboard"

apex_headers="$(curl -sI "$APEX")"
www_headers="$(curl -sI "$WWW")"

if echo "$apex_headers" | grep -qi '^location:'; then
  echo "FAIL: Apex domain must NOT redirect. Found Location header:"
  echo "$apex_headers" | sed -n '1,10p'
  exit 1
fi

if ! echo "$www_headers" | grep -qi '^location: https://adminer.online/'; then
  echo "FAIL: www should redirect → apex with path preserved."
  echo "$www_headers" | sed -n '1,10p'
  exit 1
fi

echo "OK: Domain routing looks correct." 