#!/usr/bin/env bash
set -euo pipefail

echo "=== MINIMAL TEST ==="
code=$(curl -s -o /dev/null -I -w "%{http_code}" "https://www.adminer.online/")
echo "code=$code"

loc=$(curl -sI "https://www.adminer.online/" | grep -i "^location:" | sed 's/^location: //i' | tr -d '\r')
echo "loc='$loc'"

if [[ "$code" = "308" ]]; then
    echo "✅ Status code OK"
else
    echo "❌ Status code wrong: $code"
    exit 1
fi

if [[ "$loc" =~ ^https://adminer\.online ]]; then
    echo "✅ Location OK"
else
    echo "❌ Location wrong: $loc"
    exit 1
fi

echo "✅ All tests passed!" 