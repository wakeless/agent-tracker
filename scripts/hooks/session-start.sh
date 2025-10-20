#!/bin/bash
# Session Start Hook for Agent Tracker
# Captures Claude session start events and logs them to a JSONL file

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Debug log to verify hook is being called
echo "[$(date)] Hook called" >> "$HOME/.agent-tracker/debug.log" 2>&1 || true

# Read hook data from stdin
HOOK_DATA=$(cat)

# Debug: Log the raw hook data to see all available fields
echo "[$(date)] Raw hook data: $HOOK_DATA" >> "$HOME/.agent-tracker/hook-data-debug.log" 2>&1 || true

# Debug: Log all environment variables to see what's available
echo "[$(date)] Environment variables:" >> "$HOME/.agent-tracker/hook-data-debug.log" 2>&1 || true
env | sort >> "$HOME/.agent-tracker/hook-data-debug.log" 2>&1 || true
echo "---" >> "$HOME/.agent-tracker/hook-data-debug.log" 2>&1 || true

# Extract data from hook input
SESSION_ID=$(echo "$HOOK_DATA" | jq -r '.session_id // "unknown"')
CWD=$(echo "$HOOK_DATA" | jq -r '.cwd // "unknown"')
TRANSCRIPT_PATH=$(echo "$HOOK_DATA" | jq -r '.transcript_path // "unknown"')

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

# Extract provider data for use in final JSON
ITERM_SESSION_ID=$(echo "$TERMINAL_PROVIDER_JSON" | jq -r '.session_id // "unknown"')
ITERM_PROFILE=$(echo "$TERMINAL_PROVIDER_JSON" | jq -r '.profile // "unknown"')
ITERM_TAB_NAME=$(echo "$TERMINAL_PROVIDER_JSON" | jq -r '.tab_name // "unknown"')
ITERM_WINDOW_NAME=$(echo "$TERMINAL_PROVIDER_JSON" | jq -r '.window_name // "unknown"')

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

# Extract git fields
GIT_IS_REPO=$(echo "$GIT_INFO_JSON" | jq -r '.is_repo')
GIT_BRANCH=$(echo "$GIT_INFO_JSON" | jq -r '.branch')
GIT_IS_WORKTREE=$(echo "$GIT_INFO_JSON" | jq -r '.is_worktree')
GIT_IS_DIRTY=$(echo "$GIT_INFO_JSON" | jq -r '.is_dirty')
GIT_REPO_NAME=$(echo "$GIT_INFO_JSON" | jq -r '.repo_name')

# Get timestamp (macOS compatible)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Ensure log directory exists
LOG_DIR="${HOME}/.agent-tracker"
mkdir -p "$LOG_DIR"

# Merge complete hook payload with our enrichments (all at top level)
# Also preserve complete hook payload in hook_data field for forward compatibility
EVENT=$(echo "$HOOK_DATA" | jq -c \
  --argjson hook_payload "$(echo "$HOOK_DATA")" \
  --arg tty "$TTY" \
  --arg term "$TERM_VAR" \
  --arg shell "$SHELL_VAR" \
  --arg ppid "$PPID_VAR" \
  --arg term_program "$TERM_PROGRAM" \
  --arg term_session_id "$TERM_SESSION_ID" \
  --arg lc_terminal "$LC_TERMINAL" \
  --arg lc_terminal_version "$LC_TERMINAL_VERSION" \
  --arg iterm_session_id "$ITERM_SESSION_ID" \
  --arg iterm_profile "$ITERM_PROFILE" \
  --arg iterm_tab_name "$ITERM_TAB_NAME" \
  --arg iterm_window_name "$ITERM_WINDOW_NAME" \
  --arg docker_container "$DOCKER_CONTAINER" \
  --arg docker_container_id "$DOCKER_CONTAINER_ID" \
  --arg docker_container_name "$DOCKER_CONTAINER_NAME" \
  --argjson git_is_repo "$GIT_IS_REPO" \
  --arg git_branch "$GIT_BRANCH" \
  --argjson git_is_worktree "$GIT_IS_WORKTREE" \
  --argjson git_is_dirty "$GIT_IS_DIRTY" \
  --arg git_repo_name "$GIT_REPO_NAME" \
  --arg captured_at "$TIMESTAMP" \
  '. + {
    event_type: "session_start",
    hook_data: $hook_payload,
    terminal: {
      tty: $tty,
      term: $term,
      shell: $shell,
      ppid: $ppid,
      term_program: $term_program,
      term_session_id: $term_session_id,
      lc_terminal: $lc_terminal,
      lc_terminal_version: $lc_terminal_version,
      iterm: {
        session_id: $iterm_session_id,
        profile: $iterm_profile,
        tab_name: $iterm_tab_name,
        window_name: $iterm_window_name
      }
    },
    docker: {
      is_container: ($docker_container == "true"),
      container_id: $docker_container_id,
      container_name: $docker_container_name
    },
    git: {
      is_repo: $git_is_repo,
      branch: $git_branch,
      is_worktree: $git_is_worktree,
      is_dirty: $git_is_dirty,
      repo_name: $git_repo_name
    },
    captured_at: $captured_at
  }')

# Append to JSONL file
echo "$EVENT" >> "$LOG_DIR/sessions.jsonl"

# Optional: Log to a separate debug file for troubleshooting
# echo "[$(date)] Session Start: $SESSION_ID in $CWD" >> "$LOG_DIR/debug.log"

exit 0
