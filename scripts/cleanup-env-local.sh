#!/usr/bin/env bash
# Remove deprecated Agent Vault keys from .env.local (no longer used in code).
# Keeps MongoDB, SMTP, payment, and current game API keys.
#
# Usage: bash scripts/cleanup-env-local.sh

set -euo pipefail

ROOT="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$ROOT"
LOCAL=".env.local"

if [[ ! -f "$LOCAL" ]]; then
  echo "No $LOCAL found. Run: cp .env.example .env.local"
  exit 1
fi

BACKUP="${LOCAL}.bak.cleanup.$(date +%Y%m%d%H%M%S)"
cp -a "$LOCAL" "$BACKUP"
echo "Backup: $BACKUP"

DEPRECATED_PREFIXES=(
  CASHFRENZY_
  CASHMACHINE_
  LUCKYSTARS_
  MAFIA_
  MRALLINONE_
  NOBLE_
  VEGASROLL_
)

TMP="${LOCAL}.tmp.$$"
removed=0
while IFS= read -r line || [[ -n "$line" ]]; do
  skip=0
  if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)= ]]; then
    key="${BASH_REMATCH[1]}"
    for p in "${DEPRECATED_PREFIXES[@]}"; do
      if [[ "$key" == "$p"* ]]; then
        skip=1
        removed=$((removed + 1))
        echo "  - removed $key"
        break
      fi
    done
  fi
  [[ $skip -eq 1 ]] && continue
  printf '%s\n' "$line"
done < "$LOCAL" > "$TMP"

mv "$TMP" "$LOCAL"
echo "Done. Removed $removed deprecated variable(s)."
