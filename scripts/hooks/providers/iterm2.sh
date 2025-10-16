#!/bin/bash
# iTerm2 Terminal Provider for Agent Tracker
# Extracts iTerm2-specific information using AppleScript (macOS only)

set -euo pipefail

# Verify we're running in iTerm2
if [[ "${TERM_PROGRAM:-}" != "iTerm.app" ]]; then
  exit 1
fi

# Verify AppleScript is available (macOS only)
if ! command -v osascript >/dev/null 2>&1; then
  exit 1
fi

# Extract iTerm2 environment variables
ITERM_SESSION_ID="${ITERM_SESSION_ID:-unknown}"
ITERM_PROFILE="${ITERM_PROFILE:-unknown}"

# Try to get iTerm2 tab name using AppleScript
ITERM_TAB_NAME="unknown"
ITERM_TAB_NAME=$(osascript -e 'tell application "iTerm2"
  try
    tell current session of current tab of current window
      get name
    end tell
  end try
end tell' 2>/dev/null || echo "unknown")

# Try to get iTerm2 window name using AppleScript
ITERM_WINDOW_NAME="unknown"
ITERM_WINDOW_NAME=$(osascript -e 'tell application "iTerm2"
  try
    tell current window
      get name
    end tell
  end try
end tell' 2>/dev/null || echo "unknown")

# Output iTerm2-specific info as JSON
jq -nc \
  --arg session_id "$ITERM_SESSION_ID" \
  --arg profile "$ITERM_PROFILE" \
  --arg tab_name "$ITERM_TAB_NAME" \
  --arg window_name "$ITERM_WINDOW_NAME" \
  '{
    session_id: $session_id,
    profile: $profile,
    tab_name: $tab_name,
    window_name: $window_name
  }'

exit 0
