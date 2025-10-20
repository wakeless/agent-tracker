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

# Output iTerm2-specific info as JSON using Node.js CLI
# Find the CLI relative to this script (go up 3 levels from providers/ to repo root)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
CLI_PATH="${REPO_ROOT}/dist/hooks/cli.js"

# Create JSON input for the CLI
JSON_INPUT=$(cat <<EOF
{
  "session_id": "$ITERM_SESSION_ID",
  "profile": "$ITERM_PROFILE",
  "tab_name": "$ITERM_TAB_NAME",
  "window_name": "$ITERM_WINDOW_NAME"
}
EOF
)

# Call Node.js CLI to create JSON output
echo "$JSON_INPUT" | node "$CLI_PATH" --operation=create-generic-provider

exit 0
