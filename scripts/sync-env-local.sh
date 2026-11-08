#!/usr/bin/env bash
# Merge new keys from .env.example into .env.local (keeps existing values).
# Usage: bash scripts/sync-env-local.sh
#        bash scripts/sync-env-local.sh /var/www/tierlockplay

set -euo pipefail

ROOT="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$ROOT"

EXAMPLE=".env.example"
LOCAL=".env.local"

if [[ ! -f "$EXAMPLE" ]]; then
  echo "ERROR: $ROOT/$EXAMPLE not found. Run 'git pull' first."
  exit 1
fi

if [[ ! -f "$LOCAL" ]]; then
  cp "$EXAMPLE" "$LOCAL"
  echo "Created $LOCAL from template."
  echo "Edit credentials: nano $LOCAL"
  exit 0
fi

BACKUP="${LOCAL}.bak.$(date +%Y%m%d%H%M%S)"
cp -a "$LOCAL" "$BACKUP"
echo "Backup saved: $BACKUP"

added=0
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// }" ]] && continue
  if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)= ]]; then
    key="${BASH_REMATCH[1]}"
    if ! grep -q "^${key}=" "$LOCAL" 2>/dev/null; then
      printf '\n%s\n' "$line" >> "$LOCAL"
      echo "  + $key"
      added=$((added + 1))
    fi
  fi
done < "$EXAMPLE"

echo "Done. Added $added new variable(s). Existing values unchanged."
echo "Fill any new placeholders: nano $LOCAL"
