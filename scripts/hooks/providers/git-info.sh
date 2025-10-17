#!/bin/bash
# Git Information Provider for Agent Tracker
# Extracts git repository status information
# Returns JSON with git status

set -euo pipefail

# Change to the directory passed as argument (the CWD)
CWD="${1:-.}"
cd "$CWD" 2>/dev/null || cd .

# Timeout wrapper function (200ms max)
# Falls back to empty string if command times out or fails
run_with_timeout() {
  timeout 0.2 "$@" 2>/dev/null || true
}

# Check if in git repo
IS_REPO="false"
if timeout 0.2 git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  IS_REPO="true"
fi

BRANCH="unknown"
IS_WORKTREE="false"
IS_DIRTY="false"
REPO_NAME="unknown"

if [ "$IS_REPO" = "true" ]; then
  # Get branch name
  BRANCH=$(timeout 0.2 git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

  # Check if worktree by examining the git directory
  GIT_DIR=$(timeout 0.2 git rev-parse --git-dir 2>/dev/null || echo "")
  if [ -n "$GIT_DIR" ] && echo "$GIT_DIR" | grep -q ".git/worktrees"; then
    IS_WORKTREE="true"
  fi

  # Check if dirty (has uncommitted changes)
  if ! timeout 0.2 git diff-index --quiet HEAD 2>/dev/null; then
    IS_DIRTY="true"
  fi

  # Get repo name from remote or folder name
  REMOTE_URL=$(timeout 0.2 git remote get-url origin 2>/dev/null || echo "")
  if [ -n "$REMOTE_URL" ]; then
    # Extract repo name from remote URL (handles both HTTPS and SSH)
    REPO_NAME=$(echo "$REMOTE_URL" | sed 's/.*[\/:]\([^\/]*\)\.git$/\1/')
  else
    # Fall back to top-level directory name
    TOP_LEVEL=$(git rev-parse --show-toplevel 2>/dev/null || echo "$CWD")
    REPO_NAME=$(basename "$TOP_LEVEL")
  fi
fi

# Output JSON
jq -nc \
  --arg is_repo "$IS_REPO" \
  --arg branch "$BRANCH" \
  --arg is_worktree "$IS_WORKTREE" \
  --arg is_dirty "$IS_DIRTY" \
  --arg repo_name "$REPO_NAME" \
  '{
    is_repo: ($is_repo == "true"),
    branch: $branch,
    is_worktree: ($is_worktree == "true"),
    is_dirty: ($is_dirty == "true"),
    repo_name: $repo_name
  }'
