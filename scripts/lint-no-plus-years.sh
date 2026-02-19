#!/bin/sh
set -eu

PATTERN='\b[0-9]+\+\s*years?\b'
TARGETS='src public'
MATCH_FILE="$(mktemp)"

cleanup() {
  rm -f "$MATCH_FILE"
}
trap cleanup EXIT

if rg -n --pcre2 -i "$PATTERN" $TARGETS >"$MATCH_FILE"; then
  echo "Error: banned time shorthand found (e.g., '10+ years')."
  echo "Use explicit starting years instead (e.g., 'since 2015')."
  echo
  cat "$MATCH_FILE"
  exit 1
fi

echo "No banned '+ years' shorthand found."
