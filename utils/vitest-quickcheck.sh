#!/usr/bin/env bash
set -euo pipefail

TARGETS="${1:-}"
LOGFILE="tmp/vitest-quickcheck.log"

npx vitest run --pool=threads --reporter=tap-flat --bail=1 $TARGETS >"$LOGFILE" 2>&1 && {
  echo "ok ✅"
  exit 0
}

grep '^not ok' "$LOGFILE" | head -n 5
