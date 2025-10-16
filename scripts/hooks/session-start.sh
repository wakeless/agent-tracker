#!/bin/bash
# Session Start Hook for Agent Tracker
# Captures Claude session start events and logs them to a JSONL file

set -euo pipefail

# Debug log to verify hook is being called
echo "[$(date)] Hook called" >> "$HOME/.agent-tracker/debug.log" 2>&1 || true

# Read hook data from stdin
HOOK_DATA=$(cat)

# Extract data from hook input
SESSION_ID=$(echo "$HOOK_DATA" | jq -r '.session_id // "unknown"')
CWD=$(echo "$HOOK_DATA" | jq -r '.cwd // "unknown"')
TRANSCRIPT_PATH=$(echo "$HOOK_DATA" | jq -r '.transcript_path // "unknown"')

# Capture terminal information
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

# iTerm2-specific information
ITERM_SESSION_ID="${ITERM_SESSION_ID:-unknown}"
ITERM_PROFILE="${ITERM_PROFILE:-unknown}"

# Try to get iTerm2 tab/window names using AppleScript (macOS only)
ITERM_TAB_NAME="unknown"
ITERM_WINDOW_NAME="unknown"
if [[ "$TERM_PROGRAM" == "iTerm.app" ]] && command -v osascript >/dev/null 2>&1; then
  # Get current tab name
  ITERM_TAB_NAME=$(osascript -e 'tell application "iTerm2"
    try
      tell current session of current tab of current window
        get name
      end tell
    end try
  end tell' 2>/dev/null || echo "unknown")

  # Get window name
  ITERM_WINDOW_NAME=$(osascript -e 'tell application "iTerm2"
    try
      tell current window
        get name
      end tell
    end try
  end tell' 2>/dev/null || echo "unknown")
fi

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

# Get timestamp (macOS compatible)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Ensure log directory exists
LOG_DIR="${HOME}/.agent-tracker"
mkdir -p "$LOG_DIR"

# Create event object (compact single-line JSON)
EVENT=$(jq -nc \
  --arg event_type "session_start" \
  --arg session_id "$SESSION_ID" \
  --arg cwd "$CWD" \
  --arg transcript_path "$TRANSCRIPT_PATH" \
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
  --arg timestamp "$TIMESTAMP" \
  '{
    event_type: $event_type,
    session_id: $session_id,
    cwd: $cwd,
    transcript_path: $transcript_path,
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
    timestamp: $timestamp
  }')

# Append to JSONL file
echo "$EVENT" >> "$LOG_DIR/sessions.jsonl"

# Optional: Log to a separate debug file for troubleshooting
# echo "[$(date)] Session Start: $SESSION_ID in $CWD" >> "$LOG_DIR/debug.log"

exit 0
