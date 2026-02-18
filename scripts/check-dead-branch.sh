#!/bin/bash

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Skip main
if [ "$CURRENT_BRANCH" == "main" ]; then
  exit 0
fi

echo "Checking status of $CURRENT_BRANCH..."

# Ensure we have the latest world view
git fetch origin > /dev/null 2>&1

# Check if the tracking branch exists
if git show-ref --verify --quiet "refs/remotes/origin/$CURRENT_BRANCH"; then
    
    ORIGIN_TIP=$(git rev-parse "origin/$CURRENT_BRANCH")
    MAIN_TIP=$(git rev-parse "origin/main")

    # Case 1: The branch points exactly to main (Fresh branch). Safe.
    if [ "$ORIGIN_TIP" == "$MAIN_TIP" ]; then
        echo "Branch is up-to-date with main. Safe to push."
        exit 0
    fi

    # Case 2: The remote branch is strictly behind main (Merged or Abandoned).
    if git merge-base --is-ancestor "$ORIGIN_TIP" "$MAIN_TIP"; then
             echo "################################################################################"
             echo "⛔️  BLOCKING PUSH: DEAD OR STALE BRANCH DETECTED"
             echo "################################################################################"
             echo ""
             echo "The remote branch 'origin/$CURRENT_BRANCH' is fully merged into 'origin/main'."
             echo "This usually means the PULL REQUEST WAS MERGED or the branch was abandoned."
             echo "Adding new commits to this branch is bad practice (necroing)."
             echo ""
             echo "ACTION REQUIRED:"
             echo "  1. Sync main: git checkout main && git pull"
             echo "  2. Create a FRESH branch: git checkout -b feat/new-topic"
             echo "  3. Move your work: git cherry-pick <commits>"
             echo ""
             exit 1
    fi
else
    # New branch (no remote yet). Safe.
    echo "New branch detected. Safe to push."
fi

exit 0
