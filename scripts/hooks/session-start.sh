#!/bin/bash
# Session Start Hook for Agent Tracker
# Captures Claude session start events and logs them to a JSONL file

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CLI_PATH="${REPO_ROOT}/dist/hooks/cli.js"

# Debug log to verify hook is being called
echo "[$(date)] Hook called" >> "$HOME/.agent-tracker/debug.log" 2>&1 || true

# Read hook data from stdin
HOOK_DATA=$(cat)

# Extract data from hook input using Node.js CLI
SESSION_ID=$(echo "$HOOK_DATA" | node "$CLI_PATH" --operation=extract-field --field=session_id --default=unknown)
CWD=$(echo "$HOOK_DATA" | node "$CLI_PATH" --operation=extract-field --field=cwd --default=unknown)
TRANSCRIPT_PATH=$(echo "$HOOK_DATA" | node "$CLI_PATH" --operation=extract-field --field=transcript_path --default=unknown)

# Capture basic terminal information
if TTY_OUTPUT=$(tty 2>&1); then
  TTY="$TTY_OUTPUT"
else
  TTY="unknown"
fi
TERM_VAR="${TERM:-unknown}"
SHELL_VAR="${SHELL:-unknown}"
PPID_VAR="${PPID:-unknown}"

# Get terminal window/tab info if available
TERM_PROGRAM="${TERM_PROGRAM:-unknown}"
TERM_SESSION_ID="${TERM_SESSION_ID:-unknown}"
LC_TERMINAL="${LC_TERMINAL:-unknown}"
LC_TERMINAL_VERSION="${LC_TERMINAL_VERSION:-unknown}"

# Use terminal provider to get terminal-specific information
# Try iTerm2 provider first, fall back to generic
TERMINAL_PROVIDER_JSON=""
if [[ "$TERM_PROGRAM" == "iTerm.app" ]]; then
  TERMINAL_PROVIDER_JSON=$("${SCRIPT_DIR}/providers/iterm2.sh" 2>/dev/null || \
                           "${SCRIPT_DIR}/providers/generic.sh")
else
  TERMINAL_PROVIDER_JSON=$("${SCRIPT_DIR}/providers/generic.sh")
fi

# Extract provider data for use in final JSON using Node.js CLI
ITERM_SESSION_ID=$(echo "$TERMINAL_PROVIDER_JSON" | node "$CLI_PATH" --operation=extract-field --field=session_id --default=unknown)
ITERM_PROFILE=$(echo "$TERMINAL_PROVIDER_JSON" | node "$CLI_PATH" --operation=extract-field --field=profile --default=unknown)
ITERM_TAB_NAME=$(echo "$TERMINAL_PROVIDER_JSON" | node "$CLI_PATH" --operation=extract-field --field=tab_name --default=unknown)
ITERM_WINDOW_NAME=$(echo "$TERMINAL_PROVIDER_JSON" | node "$CLI_PATH" --operation=extract-field --field=window_name --default=unknown)

# Docker detection
DOCKER_CONTAINER="false"
DOCKER_CONTAINER_ID="unknown"
DOCKER_CONTAINER_NAME="unknown"

# Check if running in Docker
if [ -f /.dockerenv ]; then
  DOCKER_CONTAINER="true"
  # Try to get container ID from cgroup
  if [ -f /proc/self/cgroup ]; then
    DOCKER_CONTAINER_ID=$(cat /proc/self/cgroup | grep -o -E '[0-9a-f]{64}' | head -n 1 || echo "unknown")
  fi
  # Try to get container hostname (often the short container ID)
  DOCKER_CONTAINER_NAME=$(hostname 2>/dev/null || echo "unknown")
elif grep -qa docker /proc/1/cgroup 2>/dev/null; then
  DOCKER_CONTAINER="true"
  DOCKER_CONTAINER_ID=$(cat /proc/1/cgroup | grep -o -E '[0-9a-f]{64}' | head -n 1 || echo "unknown")
  DOCKER_CONTAINER_NAME=$(hostname 2>/dev/null || echo "unknown")
fi

# Get git information
GIT_INFO_JSON=$("${SCRIPT_DIR}/providers/git-info.sh" "$CWD" 2>/dev/null || echo '{"is_repo":false,"branch":"unknown","is_worktree":false,"is_dirty":false,"repo_name":"unknown"}')

# Extract git fields using Node.js CLI
GIT_IS_REPO=$(echo "$GIT_INFO_JSON" | node "$CLI_PATH" --operation=extract-field --field=is_repo --default=false)
GIT_BRANCH=$(echo "$GIT_INFO_JSON" | node "$CLI_PATH" --operation=extract-field --field=branch --default=unknown)
GIT_IS_WORKTREE=$(echo "$GIT_INFO_JSON" | node "$CLI_PATH" --operation=extract-field --field=is_worktree --default=false)
GIT_IS_DIRTY=$(echo "$GIT_INFO_JSON" | node "$CLI_PATH" --operation=extract-field --field=is_dirty --default=false)
GIT_REPO_NAME=$(echo "$GIT_INFO_JSON" | node "$CLI_PATH" --operation=extract-field --field=repo_name --default=unknown)

# Get timestamp (macOS compatible)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Ensure log directory exists
LOG_DIR="${HOME}/.agent-tracker"
mkdir -p "$LOG_DIR"

# Create event object using Node.js CLI
# Convert string booleans to actual booleans for Docker
if [ "$DOCKER_CONTAINER" = "true" ]; then
  DOCKER_IS_CONTAINER="true"
else
  DOCKER_IS_CONTAINER="false"
fi

JSON_INPUT=$(cat <<EOF
{
  "event_type": "session_start",
  "session_id": "$SESSION_ID",
  "cwd": "$CWD",
  "transcript_path": "$TRANSCRIPT_PATH",
  "terminal": {
    "tty": "$TTY",
    "term": "$TERM_VAR",
    "shell": "$SHELL_VAR",
    "ppid": "$PPID_VAR",
    "term_program": "$TERM_PROGRAM",
    "term_session_id": "$TERM_SESSION_ID",
    "lc_terminal": "$LC_TERMINAL",
    "lc_terminal_version": "$LC_TERMINAL_VERSION",
    "iterm": {
      "session_id": "$ITERM_SESSION_ID",
      "profile": "$ITERM_PROFILE",
      "tab_name": "$ITERM_TAB_NAME",
      "window_name": "$ITERM_WINDOW_NAME"
    }
  },
  "docker": {
    "is_container": $DOCKER_IS_CONTAINER,
    "container_id": "$DOCKER_CONTAINER_ID",
    "container_name": "$DOCKER_CONTAINER_NAME"
  },
  "git": {
    "is_repo": $GIT_IS_REPO,
    "branch": "$GIT_BRANCH",
    "is_worktree": $GIT_IS_WORKTREE,
    "is_dirty": $GIT_IS_DIRTY,
    "repo_name": "$GIT_REPO_NAME"
  },
  "timestamp": "$TIMESTAMP"
}
EOF
)

EVENT=$(echo "$JSON_INPUT" | node "$CLI_PATH" --operation=create-session-event)

# Append to JSONL file
echo "$EVENT" >> "$LOG_DIR/sessions.jsonl"

# Optional: Log to a separate debug file for troubleshooting
# echo "[$(date)] Session Start: $SESSION_ID in $CWD" >> "$LOG_DIR/debug.log"

exit 0
