#!/bin/sh
set -eu

matches="$(
  git ls-files '*.js' '*.mjs' | while IFS= read -r file; do
    if [ -f "$file" ]; then
      printf '%s\n' "$file"
    fi
  done
)"

if [ -n "$matches" ]; then
  echo "Error: JavaScript files are not allowed in this repo. Use .mts." >&2
  echo "$matches" >&2
  exit 1
fi

echo "No tracked .js/.mjs files found."
