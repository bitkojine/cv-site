#!/usr/bin/env bash
set -euo pipefail

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

# Nothing to enforce for detached HEAD.
if [[ "${CURRENT_BRANCH}" == "HEAD" ]]; then
  exit 0
fi

echo "Checking branch sync against origin/main..."
git fetch origin main > /dev/null 2>&1

MAIN_TIP="$(git rev-parse origin/main)"
HEAD_TIP="$(git rev-parse HEAD)"

# Require local branch head to contain the latest main tip.
if git merge-base --is-ancestor "${MAIN_TIP}" "${HEAD_TIP}"; then
  echo "Branch includes latest origin/main. Safe to push."
  exit 0
fi

echo "################################################################################"
echo "⛔️  BLOCKING PUSH: BRANCH IS OUT OF DATE WITH origin/main"
echo "################################################################################"
echo ""
echo "Current branch '${CURRENT_BRANCH}' does not include latest origin/main."
echo "Rebase or merge main before pushing to avoid branch drift and CI mismatches."
echo ""
echo "Suggested fix:"
echo "  git fetch origin"
echo "  git rebase origin/main"
echo ""
exit 1
