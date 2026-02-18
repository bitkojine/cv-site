#!/bin/bash

# ZERO COMMENT POLICY – PRE-COMMIT HOOK
# Purpose: Block commits that introduce code comments into production source files.

# Exit codes:
# 0: No violations.
# 1: Violations found.
# 2: Internal error.

# Error handler for internal errors
handle_internal_error() {
  echo "" >&2
  echo "ERROR: The zero-comment-policy hook failed to execute properly." >&2
  echo "This may be due to a Git command failure or missing tooling." >&2
  echo "The commit has been blocked to ensure policy compliance." >&2
  exit 2
}

# Catch errors
set -e
trap handle_internal_error ERR

# 1. Identify staged files (Added, Copied, Modified)
# Only scan files under src/
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '^src/' || true)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

VIOLATIONS=""
HAS_VIOLATIONS=false

for FILE in $STAGED_FILES; do
  # Ignore generated, vendor, dist, and build directories under src/
  case "$FILE" in
    src/generated/*|src/vendor/*|src/dist/*|src/build/*)
      continue
      ;;
  esac

  # Check if file exists in the index (it should, but just in case)
  if ! git ls-files --error-unmatch "$FILE" >/dev/null 2>&1; then
    continue
  fi

  # Check if it's a text file
  # git show :FILE outputs the content from the index
  # grep -I returns 1 if binary content is detected
  if ! git show ":$FILE" | grep -qI . ; then
    continue
  fi

  # Matching logic
  # We use a temporary file to collect violations for this file
  FILE_VIOLATIONS=$(git show ":$FILE" | awk -v path="$FILE" '
    {
      line = $0
      sanitized = line
      
      # Whitelist: http://, https://, /// <reference
      # We remove them to see if any other // or /* remain
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
  echo "  3. Stage changes and retry the commit."
  echo ""
  echo "################################################################################"
  
  exit 1
fi

exit 0
