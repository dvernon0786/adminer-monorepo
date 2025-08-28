#!/usr/bin/env bash
set -euo pipefail
mapfile -t FILES < <(find . -name vercel.json -type f | sort)
KEEP="adminer/apps/api/vercel.json"
if [[ "${#FILES[@]}" -eq 1 && "${FILES[0]}" == "./$KEEP" ]]; then
  echo "OK: single vercel.json at $KEEP"
  exit 0
fi
echo "Found vercel.json files:"
printf ' - %s\n' "${FILES[@]}"
echo
echo "Expected exactly one at $KEEP"
exit 1
