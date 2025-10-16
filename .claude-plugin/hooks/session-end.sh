#!/bin/bash
# Session End Hook for Agent Tracker
# Captures Claude session end events and logs them to a JSONL file

set -euo pipefail

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

# Get timestamp (macOS compatible)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Ensure log directory exists
LOG_DIR="${HOME}/.agent-tracker"
mkdir -p "$LOG_DIR"

# Create event object (compact single-line JSON)
EVENT=$(jq -nc \
  --arg event_type "session_end" \
  --arg session_id "$SESSION_ID" \
  --arg cwd "$CWD" \
  --arg transcript_path "$TRANSCRIPT_PATH" \
  --arg tty "$TTY" \
  --arg term "$TERM_VAR" \
  --arg shell "$SHELL_VAR" \
  --arg ppid "$PPID_VAR" \
  --arg term_program "$TERM_PROGRAM" \
  --arg term_session_id "$TERM_SESSION_ID" \
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
      term_session_id: $term_session_id
    },
    timestamp: $timestamp
  }')

# Append to JSONL file
echo "$EVENT" >> "$LOG_DIR/sessions.jsonl"

# Optional: Log to a separate debug file for troubleshooting
# echo "[$(date)] Session End: $SESSION_ID" >> "$LOG_DIR/debug.log"

exit 0
