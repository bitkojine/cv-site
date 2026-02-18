#!/bin/bash

# Get current branch name
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Don't check main
if [ "$CURRENT_BRANCH" == "main" ]; then
  exit 0
fi

echo "Checking if $CURRENT_BRANCH is already merged to origin/main..."

# Fetch latest origin/main
git fetch origin main > /dev/null 2>&1

# Check if the branch is merged into origin/main
# We check if the commit at the tip of our current branch is reachable from origin/main
IS_MERGED=$(git merge-base --is-ancestor HEAD origin/main && echo "yes" || echo "no")

if [ "$IS_MERGED" == "yes" ]; then
  echo "################################################################################"
  echo "#                                                                              #"
  echo "#                        DEAD BRANCH PROTECTION                                #"
  echo "#                                                                              #"
  echo "################################################################################"
  echo ""
  echo "Whoops! This branch ($CURRENT_BRANCH) has already been merged into origin/main."
  echo "Pushing new commits to a merged branch is prohibited to avoid 'necroing' dead branches."
  echo ""
  echo "ACTION REQUIRED:"
  echo "  1. Fetch latest remote main: git fetch origin main"
  echo "  2. Branch directly from remote: git checkout -b feat/your-feature-name origin/main"
  echo "  3. Cherry-pick or move your work there."
  echo ""
  echo "################################################################################"
  exit 1
fi

echo "Branch is safe to push."
exit 0
