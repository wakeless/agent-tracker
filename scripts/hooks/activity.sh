#!/bin/bash
# Activity Hook for Agent Tracker
# Lightweight hook that tracks Claude Code activity events
# Used by: PostToolUse, UserPromptSubmit, Stop, SubagentStop, Notification

set -euo pipefail

# Read hook data from stdin
HOOK_DATA=$(cat)

# Extract core data from hook input
SESSION_ID=$(echo "$HOOK_DATA" | jq -r '.session_id // "unknown"')
HOOK_EVENT_NAME=$(echo "$HOOK_DATA" | jq -r '.hook_event_name // "unknown"')

# Map hook event names to activity types
case "$HOOK_EVENT_NAME" in
  "PostToolUse")
    ACTIVITY_TYPE="tool_use"
    # Extract tool name from hook data
    TOOL_NAME=$(echo "$HOOK_DATA" | jq -r '.tool_name // "unknown"')
    ;;
  "UserPromptSubmit")
    ACTIVITY_TYPE="prompt_submit"
    TOOL_NAME="unknown"
    ;;
  "Stop")
    ACTIVITY_TYPE="stop"
    TOOL_NAME="unknown"
    ;;
  "SubagentStop")
    ACTIVITY_TYPE="subagent_stop"
    TOOL_NAME="unknown"
    ;;
  "Notification")
    ACTIVITY_TYPE="notification"
    TOOL_NAME="unknown"
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

# Create activity event (compact single-line JSON)
EVENT=$(jq -nc \
  --arg event_type "activity" \
  --arg activity_type "$ACTIVITY_TYPE" \
  --arg session_id "$SESSION_ID" \
  --arg timestamp "$TIMESTAMP" \
  --arg tool_name "$TOOL_NAME" \
  --arg hook_event_name "$HOOK_EVENT_NAME" \
  '{
    event_type: $event_type,
    activity_type: $activity_type,
    session_id: $session_id,
    timestamp: $timestamp,
    tool_name: $tool_name,
    hook_event_name: $hook_event_name
  }')

# Append to JSONL file
echo "$EVENT" >> "$LOG_DIR/sessions.jsonl"

exit 0
