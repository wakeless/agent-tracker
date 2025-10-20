#!/bin/bash
# Activity Hook for Agent Tracker
# Lightweight hook that tracks Claude Code activity events
# Used by: PostToolUse, UserPromptSubmit, Stop, SubagentStop, Notification

set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CLI_PATH="${REPO_ROOT}/dist/hooks/cli.js"

# Read hook data from stdin
HOOK_DATA=$(cat)

# Extract core data from hook input using Node.js CLI
SESSION_ID=$(echo "$HOOK_DATA" | node "$CLI_PATH" --operation=extract-field --field=session_id --default=unknown)
HOOK_EVENT_NAME=$(echo "$HOOK_DATA" | node "$CLI_PATH" --operation=extract-field --field=hook_event_name --default=unknown)

# Initialize optional fields
TOOL_NAME="unknown"
NOTIFICATION_MESSAGE="unknown"

# Map hook event names to activity types
case "$HOOK_EVENT_NAME" in
  "PostToolUse")
    ACTIVITY_TYPE="tool_use"
    # Extract tool name from hook data using Node.js CLI
    TOOL_NAME=$(echo "$HOOK_DATA" | node "$CLI_PATH" --operation=extract-field --field=tool_name --default=unknown)
    ;;
  "UserPromptSubmit")
    ACTIVITY_TYPE="prompt_submit"
    ;;
  "Stop")
    ACTIVITY_TYPE="stop"
    ;;
  "SubagentStop")
    ACTIVITY_TYPE="subagent_stop"
    ;;
  "Notification")
    ACTIVITY_TYPE="notification"
    # Extract notification message using Node.js CLI
    NOTIFICATION_MESSAGE=$(echo "$HOOK_DATA" | node "$CLI_PATH" --operation=extract-field --field=message --default=unknown)
    ;;
  *)
    # Unknown hook type, skip
    exit 0
    ;;
esac

# Get timestamp (macOS compatible)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Ensure log directory exists
LOG_DIR="${HOME}/.agent-tracker"
mkdir -p "$LOG_DIR"

# Create activity event using Node.js CLI
JSON_INPUT=$(cat <<EOF
{
  "activity_type": "$ACTIVITY_TYPE",
  "session_id": "$SESSION_ID",
  "timestamp": "$TIMESTAMP",
  "tool_name": "$TOOL_NAME",
  "notification_message": "$NOTIFICATION_MESSAGE",
  "hook_event_name": "$HOOK_EVENT_NAME"
}
EOF
)

EVENT=$(echo "$JSON_INPUT" | node "$CLI_PATH" --operation=create-activity-event)

# Append to JSONL file
echo "$EVENT" >> "$LOG_DIR/sessions.jsonl"

exit 0
