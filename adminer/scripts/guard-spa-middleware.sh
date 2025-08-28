#!/usr/bin/env bash
set -euo pipefail
FILE="adminer/apps/api/middleware.ts"
grep -q "NextResponse.rewrite(new URL('/index.html'" "$FILE" || {
  echo "ERROR: SPA middleware rewrite to /index.html missing from $FILE"
  exit 1
}
echo "OK: SPA middleware rewrite present." 