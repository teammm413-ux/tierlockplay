#!/usr/bin/env bash
# Copy GAME API keys from .env.example into .env.local.
# Does NOT touch MongoDB, SMTP, RevSol, Admin, JWT, Twilio, etc.
#
# Default: only fills keys that are missing OR still use placeholders (your_*).
# Force overwrite all game keys: bash scripts/apply-game-env-from-example.sh --force
#
# Usage: bash scripts/apply-game-env-from-example.sh

set -euo pipefail

FORCE=0
if [[ "${1:-}" == "--force" ]]; then
  FORCE=1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

EXAMPLE=".env.example"
LOCAL=".env.local"

GAME_PREFIXES='^(ESTAR_|DRAGONFURY_|ULTRATHUNDER_|FIREKIRIN_|JUWA2_|JUWA_|VEGAS_SWEEP_|GAME_VAULT_|SERVER_PUBLIC_IP)'

if [[ ! -f "$EXAMPLE" ]] || [[ ! -f "$LOCAL" ]]; then
  echo "Need both $EXAMPLE and $LOCAL in $ROOT"
  exit 1
fi

BACKUP="${LOCAL}.bak.gameenv.$(date +%Y%m%d%H%M%S)"
cp -a "$LOCAL" "$BACKUP"
echo "Backup: $BACKUP"

declare -A EXAMPLE_VALS
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// }" ]] && continue
  if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    val="${BASH_REMATCH[2]}"
    if [[ "$key" =~ $GAME_PREFIXES ]]; then
      EXAMPLE_VALS[$key]="$val"
    fi
  fi
done < "$EXAMPLE"

is_placeholder() {
  local v="$1"
  [[ -z "$v" ]] && return 0
  [[ "$v" == your_* ]] && return 0
  [[ "$v" == *your_* ]] && return 0
  return 1
}

TMP="${LOCAL}.tmp.$$"
declare -A SEEN
updated=0
added=0

while IFS= read -r line || [[ -n "$line" ]]; do
  if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    cur="${BASH_REMATCH[2]}"
  if [[ "$key" =~ $GAME_PREFIXES ]] && [[ -n "${EXAMPLE_VALS[$key]+isset}" ]]; then
      SEEN[$key]=1
      newval="${EXAMPLE_VALS[$key]}"
      if [[ $FORCE -eq 1 ]] || is_placeholder "$cur"; then
        if [[ "$cur" != "$newval" ]]; then
          echo "  ~ $key"
          updated=$((updated + 1))
        fi
        printf '%s=%s\n' "$key" "$newval"
        continue
      fi
    fi
  fi
  printf '%s\n' "$line"
done < "$LOCAL" > "$TMP"

for key in "${!EXAMPLE_VALS[@]}"; do
  if [[ -z "${SEEN[$key]+isset}" ]]; then
    echo "  + $key"
    printf '\n%s=%s\n' "$key" "${EXAMPLE_VALS[$key]}" >> "$TMP"
    added=$((added + 1))
  fi
done

mv "$TMP" "$LOCAL"
echo "Done. Updated $updated, added $added game key(s)."
echo "Still set manually: FIREKIRIN_AGENT_PASSWORD (if distributor gave it separately)."
