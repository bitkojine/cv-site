#!/bin/bash

# ZERO COMMENT POLICY
# Purpose: Block commits or lint codebase to ensure no comments in production source files.

# Exit codes:
# 0: No violations.
# 1: Violations found.
# 2: Internal error.

# Error handler for internal errors
handle_internal_error() {
  echo "" >&2
  echo "ERROR: The zero-comment-policy script failed to execute properly." >&2
  echo "This may be due to a Git command failure or missing tooling." >&2
  exit 2
}

# Catch errors
set -e
trap handle_internal_error ERR

CHECK_ALL=false
if [ "$1" == "--all" ]; then
  CHECK_ALL=true
fi

# 1. Identify files to scan
if [ "$CHECK_ALL" = true ]; then
  # Scan all files under src/ (working tree), ignoring md files
  FILES=$(find src -type f | grep -vE 'src/(generated|vendor|dist|build)/|\.md$' || true)
else
  # Scan staged files only (Git index), ignoring md files
  FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '^src/' | grep -vE 'src/(generated|vendor|dist|build)/|\.md$' || true)
fi

if [ -z "$FILES" ]; then
  exit 0
fi

VIOLATIONS=""
HAS_VIOLATIONS=false

for FILE in $FILES; do
  # Skip if file doesn't exist (e.g. deleted in working tree but still in list)
  if [ "$CHECK_ALL" = true ]; then
    if [ ! -f "$FILE" ]; then continue; fi
    # Check if text file
    if ! grep -qI . "$FILE"; then continue; fi
    CONTENT_CMD="cat $FILE"
  else
    # Check if exists in index
    if ! git ls-files --error-unmatch "$FILE" >/dev/null 2>&1; then continue; fi
    # Check if text file in index
    if ! git show ":$FILE" | grep -qI . ; then continue; fi
    CONTENT_CMD="git show :$FILE"
  fi

  # Matching logic
  FILE_VIOLATIONS=$($CONTENT_CMD | awk -v path="$FILE" '
    {
      line = $0
      sanitized = line
      
      # Whitelist: http://, https://, /// <reference
      gsub(/https?:\/\//, "", sanitized)
      gsub(/\/\/\/ <reference/, "", sanitized)

      if (index(sanitized, "//") > 0 || index(sanitized, "/*") > 0) {
        print path ":" NR
      }
    }
  ')

  if [ -n "$FILE_VIOLATIONS" ]; then
    VIOLATIONS="${VIOLATIONS}${FILE_VIOLATIONS}"$'\n'
    HAS_VIOLATIONS=true
  fi
done

if [ "$HAS_VIOLATIONS" = true ]; then
  echo "################################################################################"
  echo "#                                                                              #"
  echo "#                        ZERO COMMENT POLICY VIOLATION                         #"
  echo "#                                                                              #"
  echo "################################################################################"
  echo ""
  echo "Comments are not allowed in src/."
  echo ""
  echo "Violating file paths and line numbers:"
  echo "$VIOLATIONS" | sed '/^$/d' | sed 's/^/  - /'
  echo ""
  echo "INSTRUCTIONS FOR HUMANS AND AI AGENTS:"
  echo "  1. Move all reasoning/documentation to:"
  echo "     docs/ai-reasoning/inline-comment-attempts.md"
  echo "  2. Remove all comments from the source files."
  if [ "$CHECK_ALL" = false ]; then
    echo "  3. Stage changes and retry the commit."
  fi
  echo ""
  echo "################################################################################"
  
  exit 1
fi

exit 0
