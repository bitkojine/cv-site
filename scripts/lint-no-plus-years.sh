#!/bin/sh
set -eu

PATTERN='\b[0-9]+\+\s*years?\b'
MATCH_FILE="$(mktemp)"

cleanup() {
  rm -f "$MATCH_FILE"
  return 0
}
trap cleanup EXIT

if rg -n --pcre2 -i "$PATTERN" src public >"$MATCH_FILE"; then
  echo "Error: banned time shorthand found (e.g., '10+ years')." >&2
  echo "Use explicit starting years instead (e.g., 'since 2015')."
  echo
  cat "$MATCH_FILE"
  exit 1
fi

echo "No banned '+ years' shorthand found."
